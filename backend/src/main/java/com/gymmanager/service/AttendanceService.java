package com.gymmanager.service;

import com.gymmanager.dto.AttendanceCheckInRequest;
import com.gymmanager.dto.AttendanceDto;
import com.gymmanager.dto.AttendanceOverrideRequest;
import com.gymmanager.entity.*;
import com.gymmanager.enums.AttendanceStatus;
import com.gymmanager.enums.MemberStatus;
import com.gymmanager.exception.BadRequestException;
import com.gymmanager.exception.ResourceNotFoundException;
import com.gymmanager.integration.BiometricDeviceAdapter;
import com.gymmanager.repository.*;
import com.gymmanager.util.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final MemberProfileRepository memberProfileRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final BranchRepository branchRepository;
    private final AuditLogRepository auditLogRepository;
    private final BiometricDeviceAdapter biometricAdapter;
    private final SecurityUtils securityUtils;

    public AttendanceService(AttendanceRepository attendanceRepository,
                             MemberProfileRepository memberProfileRepository,
                             SubscriptionRepository subscriptionRepository,
                             BranchRepository branchRepository,
                             AuditLogRepository auditLogRepository,
                             BiometricDeviceAdapter biometricAdapter,
                             SecurityUtils securityUtils) {
        this.attendanceRepository = attendanceRepository;
        this.memberProfileRepository = memberProfileRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.branchRepository = branchRepository;
        this.auditLogRepository = auditLogRepository;
        this.biometricAdapter = biometricAdapter;
        this.securityUtils = securityUtils;
    }

    @Transactional
    public AttendanceDto checkIn(AttendanceCheckInRequest request) {
        MemberProfile profile = null;

        if (request.getQrCodeData() != null && !request.getQrCodeData().isBlank()) {
            profile = memberProfileRepository.findByQrCodeData(request.getQrCodeData())
                    .orElse(null);
        }

        if (profile == null && request.getMemberCode() != null && !request.getMemberCode().isBlank()) {
            profile = memberProfileRepository.findByMemberCode(request.getMemberCode())
                    .orElse(null);
        }

        if (profile == null && request.getMemberId() != null) {
            profile = memberProfileRepository.findByUserId(request.getMemberId())
                    .or(() -> memberProfileRepository.findById(request.getMemberId()))
                    .orElse(null);
        }

        if (profile == null) {
            throw new ResourceNotFoundException("Member credential or QR code not recognized.");
        }

        User member = profile.getUser();

        // 1. Prevent duplicate active check-ins
        Optional<Attendance> activeCheckIn = attendanceRepository.findActiveCheckInForMember(member.getId());
        if (activeCheckIn.isPresent()) {
            throw new BadRequestException("Member is already checked in since " + activeCheckIn.get().getCheckInTime());
        }

        // 2. Validate membership eligibility on server
        if (profile.getStatus() == MemberStatus.FROZEN) {
            throw new BadRequestException("Access Denied: Membership is currently FROZEN.");
        }
        if (profile.getStatus() == MemberStatus.CANCELLED) {
            throw new BadRequestException("Access Denied: Membership has been CANCELLED.");
        }

        Subscription activeSub = subscriptionRepository.findActiveSubscriptionForMember(member.getId(), LocalDate.now())
                .orElse(null);

        if (activeSub == null) {
            // Record denied attempt
            Branch branch = profile.getUser().getBranch();
            if (request.getBranchId() != null) {
                branch = branchRepository.findById(request.getBranchId()).orElse(branch);
            }
            if (branch == null) {
                branch = branchRepository.findAll().stream().findFirst().orElse(null);
            }

            Attendance denied = Attendance.builder()
                    .member(member)
                    .branch(branch)
                    .checkInTime(LocalDateTime.now())
                    .status(AttendanceStatus.DENIED)
                    .verificationMethod(request.getVerificationMethod() != null ? request.getVerificationMethod() : "QR")
                    .notes("Denied: No active membership subscription found")
                    .build();
            attendanceRepository.save(denied);
            throw new BadRequestException("Access Denied: No active subscription found or membership has expired.");
        }

        // 3. Resolve branch access
        Branch branch = activeSub.getBranch();
        if (request.getBranchId() != null) {
            branch = branchRepository.findById(request.getBranchId()).orElse(branch);
        }

        Attendance attendance = Attendance.builder()
                .member(member)
                .branch(branch)
                .checkInTime(LocalDateTime.now())
                .status(AttendanceStatus.CHECKED_IN)
                .verificationMethod(request.getVerificationMethod() != null ? request.getVerificationMethod() : "QR")
                .notes("Access granted - Plan: " + activeSub.getPlan().getName())
                .build();
        attendance = attendanceRepository.save(attendance);

        // Signal physical turnstile gate unlock
        biometricAdapter.triggerGateUnlock(branch.getId(), profile.getMemberCode());

        return mapAttendanceToDto(attendance);
    }

    @Transactional
    public AttendanceDto checkOut(Long memberId) {
        Long userId = memberProfileRepository.findById(memberId)
                .map(p -> p.getUser().getId())
                .orElse(memberId);

        Attendance active = attendanceRepository.findActiveCheckInForMember(userId)
                .or(() -> attendanceRepository.findActiveCheckInForMember(memberId))
                .orElseThrow(() -> new BadRequestException("No active check-in session found for member"));

        active.setCheckOutTime(LocalDateTime.now());
        active.setStatus(AttendanceStatus.CHECKED_OUT);
        active = attendanceRepository.save(active);

        return mapAttendanceToDto(active);
    }

    @Transactional
    public AttendanceDto recordManualOverride(AttendanceOverrideRequest request) {
        User member = memberProfileRepository.findByUserId(request.getMemberId())
                .map(MemberProfile::getUser)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        User staffUser = securityUtils.getCurrentUser();
        Branch branch = member.getBranch();
        if (request.getBranchId() != null) {
            branch = branchRepository.findById(request.getBranchId()).orElse(branch);
        }
        if (branch == null) {
            branch = branchRepository.findAll().stream().findFirst().orElse(null);
        }

        Attendance attendance = Attendance.builder()
                .member(member)
                .branch(branch)
                .checkInTime(LocalDateTime.now())
                .status(AttendanceStatus.MANUAL_OVERRIDE)
                .verificationMethod("MANUAL_OVERRIDE")
                .overrideBy(staffUser)
                .notes("Staff Override Reason: " + request.getReason())
                .build();
        attendance = attendanceRepository.save(attendance);

        // Record in audit log
        auditLogRepository.save(AuditLog.builder()
                .user(staffUser)
                .action("ATTENDANCE_OVERRIDE")
                .entityName("Attendance")
                .entityId(attendance.getId())
                .branch(branch)
                .details("Manual attendance override authorized for " + member.getFullName() + ". Reason: " + request.getReason())
                .build());

        return mapAttendanceToDto(attendance);
    }

    @Transactional(readOnly = true)
    public Page<AttendanceDto> getAttendanceLogs(Long branchId, LocalDateTime start, LocalDateTime end, Pageable pageable) {
        Long effectiveBranchId = securityUtils.isGymOwnerOrAdmin() ? branchId : securityUtils.getCurrentBranchId();
        LocalDateTime s = start != null ? start : LocalDateTime.now().minusDays(30);
        LocalDateTime e = end != null ? end : LocalDateTime.now();
        return attendanceRepository.findAttendanceWithFilter(effectiveBranchId, s, e, pageable)
                .map(this::mapAttendanceToDto);
    }

    @Transactional(readOnly = true)
    public List<AttendanceDto> getMemberAttendance(Long memberId) {
        return attendanceRepository.findByMemberIdOrderByCheckInTimeDesc(memberId).stream()
                .map(this::mapAttendanceToDto)
                .collect(Collectors.toList());
    }

    private AttendanceDto mapAttendanceToDto(Attendance a) {
        return AttendanceDto.builder()
                .id(a.getId())
                .memberId(a.getMember().getId())
                .memberName(a.getMember().getFullName())
                .memberCode(a.getMember().getUsername())
                .branchId(a.getBranch() != null ? a.getBranch().getId() : null)
                .branchName(a.getBranch() != null ? a.getBranch().getName() : "N/A")
                .checkInTime(a.getCheckInTime())
                .checkOutTime(a.getCheckOutTime())
                .status(a.getStatus())
                .verificationMethod(a.getVerificationMethod())
                .notes(a.getNotes())
                .overrideByName(a.getOverrideBy() != null ? a.getOverrideBy().getFullName() : null)
                .build();
    }
}
