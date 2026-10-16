package com.gymmanager.service;

import com.gymmanager.dto.MemberDto;
import com.gymmanager.dto.MemberRegistrationDto;
import com.gymmanager.entity.*;
import com.gymmanager.enums.MemberStatus;
import com.gymmanager.enums.RoleType;
import com.gymmanager.enums.SubscriptionStatus;
import com.gymmanager.exception.BadRequestException;
import com.gymmanager.exception.ResourceNotFoundException;
import com.gymmanager.repository.*;
import com.gymmanager.util.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MemberService {

    private final MemberProfileRepository memberProfileRepository;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecurityUtils securityUtils;
    private final AuditLogRepository auditLogRepository;

    public MemberService(MemberProfileRepository memberProfileRepository,
                         UserRepository userRepository,
                         BranchRepository branchRepository,
                         SubscriptionRepository subscriptionRepository,
                         PasswordEncoder passwordEncoder,
                         SecurityUtils securityUtils,
                         AuditLogRepository auditLogRepository) {
        this.memberProfileRepository = memberProfileRepository;
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.passwordEncoder = passwordEncoder;
        this.securityUtils = securityUtils;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public MemberDto registerMember(MemberRegistrationDto dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new BadRequestException("A member with this email already exists: " + dto.getEmail());
        }

        String username = dto.getUsername();
        if (username == null || username.isBlank()) {
            username = dto.getEmail().split("@")[0].replaceAll("[^a-zA-Z0-9]", "") + "_" + (int)(Math.random() * 900 + 100);
        }
        if (userRepository.existsByUsername(username)) {
            username = username + "_" + UUID.randomUUID().toString().substring(0, 4);
        }

        String rawPassword = dto.getPassword() != null && !dto.getPassword().isBlank() ? dto.getPassword() : "FitPulse@2026";

        Branch branch = null;
        if (dto.getBranchId() != null) {
            branch = branchRepository.findById(dto.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch not found with ID: " + dto.getBranchId()));
        } else {
            branch = securityUtils.getCurrentUser() != null ? securityUtils.getCurrentUser().getBranch() : null;
        }

        User user = User.builder()
                .username(username)
                .email(dto.getEmail())
                .password(passwordEncoder.encode(rawPassword))
                .fullName(dto.getFullName())
                .phone(dto.getPhone())
                .role(RoleType.ROLE_MEMBER)
                .branch(branch)
                .enabled(true)
                .build();
        user = userRepository.save(user);

        // Generate unique member code (e.g. MEM-2026-0042)
        String memberCode = "MEM-" + LocalDate.now().getYear() + "-" + String.format("%04d", user.getId());
        String qrData = "FITPULSE:" + memberCode + ":" + UUID.randomUUID().toString().substring(0, 8);

        User assignedTrainer = null;
        if (dto.getAssignedTrainerId() != null) {
            assignedTrainer = userRepository.findById(dto.getAssignedTrainerId()).orElse(null);
        }

        MemberProfile profile = MemberProfile.builder()
                .user(user)
                .memberCode(memberCode)
                .dateOfBirth(dto.getDateOfBirth())
                .gender(dto.getGender())
                .emergencyContactName(dto.getEmergencyContactName())
                .emergencyContactPhone(dto.getEmergencyContactPhone())
                .bloodGroup(dto.getBloodGroup())
                .address(dto.getAddress())
                .fitnessGoals(dto.getFitnessGoals())
                .medicalHistory(dto.getMedicalHistory())
                .assignedTrainer(assignedTrainer)
                .joinDate(dto.getJoinDate() != null ? dto.getJoinDate() : LocalDate.now())
                .status(MemberStatus.ACTIVE)
                .qrCodeData(qrData)
                .notes(dto.getNotes())
                .build();
        profile = memberProfileRepository.save(profile);

        // Audit Log
        auditLogRepository.save(AuditLog.builder()
                .user(securityUtils.getCurrentUser())
                .action("MEMBER_REGISTER")
                .entityName("MemberProfile")
                .entityId(profile.getId())
                .branch(branch)
                .details("Registered member: " + user.getFullName() + " (" + memberCode + ")")
                .build());

        return mapToDto(profile);
    }

    @Transactional(readOnly = true)
    public Page<MemberDto> searchMembers(Long branchId, MemberStatus status, String search, Pageable pageable) {
        Long effectiveBranchId = securityUtils.isGymOwnerOrAdmin() ? branchId : securityUtils.getCurrentBranchId();
        return memberProfileRepository.searchMembers(effectiveBranchId, status, search, pageable)
                .map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public MemberDto getMemberById(Long id) {
        MemberProfile profile = memberProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member profile not found with ID: " + id));
        return mapToDto(profile);
    }

    @Transactional(readOnly = true)
    public MemberDto getMemberByUserId(Long userId) {
        MemberProfile profile = memberProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Member profile not found for user ID: " + userId));
        return mapToDto(profile);
    }

    @Transactional(readOnly = true)
    public MemberDto getMemberByCodeOrQr(String codeOrQr) {
        MemberProfile profile = memberProfileRepository.findByMemberCode(codeOrQr)
                .or(() -> memberProfileRepository.findByQrCodeData(codeOrQr))
                .orElseThrow(() -> new ResourceNotFoundException("Member not found for credential: " + codeOrQr));
        return mapToDto(profile);
    }

    @Transactional
    public MemberDto updateMember(Long id, MemberRegistrationDto dto) {
        MemberProfile profile = memberProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member profile not found with ID: " + id));

        User user = profile.getUser();
        user.setFullName(dto.getFullName());
        user.setPhone(dto.getPhone());
        userRepository.save(user);

        profile.setDateOfBirth(dto.getDateOfBirth());
        profile.setGender(dto.getGender());
        profile.setEmergencyContactName(dto.getEmergencyContactName());
        profile.setEmergencyContactPhone(dto.getEmergencyContactPhone());
        profile.setBloodGroup(dto.getBloodGroup());
        profile.setAddress(dto.getAddress());
        profile.setFitnessGoals(dto.getFitnessGoals());
        profile.setMedicalHistory(dto.getMedicalHistory());
        profile.setNotes(dto.getNotes());

        if (dto.getAssignedTrainerId() != null) {
            userRepository.findById(dto.getAssignedTrainerId()).ifPresent(profile::setAssignedTrainer);
        }

        profile = memberProfileRepository.save(profile);
        return mapToDto(profile);
    }

    @Transactional
    public MemberDto updateStatus(Long id, MemberStatus newStatus) {
        MemberProfile profile = memberProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member profile not found with ID: " + id));
        profile.setStatus(newStatus);
        profile = memberProfileRepository.save(profile);
        return mapToDto(profile);
    }

    @Transactional(readOnly = true)
    public List<MemberDto> getAllMembersList(Long branchId) {
        Long effectiveBranchId = securityUtils.isGymOwnerOrAdmin() ? branchId : securityUtils.getCurrentBranchId();
        return memberProfileRepository.findAll().stream()
                .filter(m -> effectiveBranchId == null || (m.getUser().getBranch() != null && m.getUser().getBranch().getId().equals(effectiveBranchId)))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public MemberDto mapToDto(MemberProfile profile) {
        Subscription activeSub = subscriptionRepository
                .findActiveSubscriptionForMember(profile.getUser().getId(), LocalDate.now())
                .orElse(null);

        return MemberDto.builder()
                .id(profile.getId())
                .userId(profile.getUser().getId())
                .memberCode(profile.getMemberCode())
                .fullName(profile.getUser().getFullName())
                .email(profile.getUser().getEmail())
                .phone(profile.getUser().getPhone())
                .branchId(profile.getUser().getBranch() != null ? profile.getUser().getBranch().getId() : null)
                .branchName(profile.getUser().getBranch() != null ? profile.getUser().getBranch().getName() : "N/A")
                .dateOfBirth(profile.getDateOfBirth())
                .gender(profile.getGender())
                .emergencyContactName(profile.getEmergencyContactName())
                .emergencyContactPhone(profile.getEmergencyContactPhone())
                .bloodGroup(profile.getBloodGroup())
                .address(profile.getAddress())
                .fitnessGoals(profile.getFitnessGoals())
                .medicalHistory(profile.getMedicalHistory())
                .assignedTrainerId(profile.getAssignedTrainer() != null ? profile.getAssignedTrainer().getId() : null)
                .assignedTrainerName(profile.getAssignedTrainer() != null ? profile.getAssignedTrainer().getFullName() : null)
                .joinDate(profile.getJoinDate())
                .status(profile.getStatus())
                .qrCodeData(profile.getQrCodeData())
                .notes(profile.getNotes())
                .activePlanName(activeSub != null ? activeSub.getPlan().getName() : "No Active Plan")
                .membershipExpiryDate(activeSub != null ? activeSub.getEndDate() : null)
                .createdAt(profile.getCreatedAt())
                .build();
    }
}
