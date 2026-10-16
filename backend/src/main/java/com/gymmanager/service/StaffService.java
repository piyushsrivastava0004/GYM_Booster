package com.gymmanager.service;

import com.gymmanager.dto.StaffDto;
import com.gymmanager.dto.StaffLeaveDto;
import com.gymmanager.dto.StaffShiftDto;
import com.gymmanager.entity.*;
import com.gymmanager.enums.RoleType;
import com.gymmanager.exception.BadRequestException;
import com.gymmanager.exception.ResourceNotFoundException;
import com.gymmanager.repository.*;
import com.gymmanager.util.SecurityUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StaffService {

    private final StaffProfileRepository staffProfileRepository;
    private final StaffShiftRepository staffShiftRepository;
    private final StaffLeaveRepository staffLeaveRepository;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecurityUtils securityUtils;

    public StaffService(StaffProfileRepository staffProfileRepository,
                        StaffShiftRepository staffShiftRepository,
                        StaffLeaveRepository staffLeaveRepository,
                        UserRepository userRepository,
                        BranchRepository branchRepository,
                        PasswordEncoder passwordEncoder,
                        SecurityUtils securityUtils) {
        this.staffProfileRepository = staffProfileRepository;
        this.staffShiftRepository = staffShiftRepository;
        this.staffLeaveRepository = staffLeaveRepository;
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
        this.passwordEncoder = passwordEncoder;
        this.securityUtils = securityUtils;
    }

    @Transactional
    public StaffDto createStaff(StaffDto dto) {
        if (userRepository.existsByUsername(dto.getUsername())) {
            throw new BadRequestException("Username already exists");
        }
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new BadRequestException("Email already exists");
        }

        Branch branch = null;
        if (dto.getBranchId() != null) {
            branch = branchRepository.findById(dto.getBranchId()).orElse(null);
        }

        RoleType role = dto.getRole() != null ? dto.getRole() : RoleType.ROLE_TRAINER;

        String rawPassword = dto.getPassword() != null && !dto.getPassword().isBlank()
                ? dto.getPassword()
                : "Staff@FitPulse2026";

        User user = User.builder()
                .username(dto.getUsername())
                .email(dto.getEmail())
                .password(passwordEncoder.encode(rawPassword))
                .fullName(dto.getFullName())
                .phone(dto.getPhone())
                .role(role)
                .branch(branch)
                .enabled(true)
                .build();
        user = userRepository.save(user);

        StaffProfile profile = StaffProfile.builder()
                .user(user)
                .designation(dto.getDesignation() != null ? dto.getDesignation() : role.name().replace("ROLE_", ""))
                .department(dto.getDepartment() != null ? dto.getDepartment() : "Fitness")
                .qualification(dto.getQualification())
                .specialties(dto.getSpecialties())
                .baseSalary(dto.getBaseSalary() != null ? dto.getBaseSalary() : BigDecimal.ZERO)
                .commissionPercent(dto.getCommissionPercent() != null ? dto.getCommissionPercent() : BigDecimal.ZERO)
                .dateOfJoining(dto.getDateOfJoining() != null ? dto.getDateOfJoining() : LocalDate.now())
                .status("ACTIVE")
                .build();
        profile = staffProfileRepository.save(profile);

        return mapStaffToDto(profile);
    }

    @Transactional(readOnly = true)
    public List<StaffDto> getAllStaff(Long branchId) {
        Long effectiveBranchId = securityUtils.isGymOwnerOrAdmin() ? branchId : securityUtils.getCurrentBranchId();
        return staffProfileRepository.findAll().stream()
                .filter(s -> effectiveBranchId == null || (s.getUser().getBranch() != null && s.getUser().getBranch().getId().equals(effectiveBranchId)))
                .map(this::mapStaffToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<StaffDto> getTrainers(Long branchId) {
        return getAllStaff(branchId).stream()
                .filter(s -> s.getRole() == RoleType.ROLE_TRAINER)
                .collect(Collectors.toList());
    }

    @Transactional
    public StaffShiftDto createShift(StaffShiftDto dto) {
        User staff = userRepository.findById(dto.getStaffId())
                .orElseThrow(() -> new ResourceNotFoundException("Staff user not found"));

        Branch branch = staff.getBranch();
        if (dto.getBranchId() != null) {
            branch = branchRepository.findById(dto.getBranchId()).orElse(branch);
        }

        StaffShift shift = StaffShift.builder()
                .staff(staff)
                .branch(branch)
                .dayOfWeek(dto.getDayOfWeek())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .active(dto.getActive() != null ? dto.getActive() : true)
                .build();
        shift = staffShiftRepository.save(shift);

        return StaffShiftDto.builder()
                .id(shift.getId())
                .staffId(staff.getId())
                .staffName(staff.getFullName())
                .branchId(branch != null ? branch.getId() : null)
                .branchName(branch != null ? branch.getName() : null)
                .dayOfWeek(shift.getDayOfWeek())
                .startTime(shift.getStartTime())
                .endTime(shift.getEndTime())
                .active(shift.getActive())
                .build();
    }

    @Transactional(readOnly = true)
    public List<StaffShiftDto> getStaffShifts(Long staffId) {
        return staffShiftRepository.findByStaffId(staffId).stream()
                .map(s -> StaffShiftDto.builder()
                        .id(s.getId())
                        .staffId(s.getStaff().getId())
                        .staffName(s.getStaff().getFullName())
                        .branchId(s.getBranch() != null ? s.getBranch().getId() : null)
                        .branchName(s.getBranch() != null ? s.getBranch().getName() : null)
                        .dayOfWeek(s.getDayOfWeek())
                        .startTime(s.getStartTime())
                        .endTime(s.getEndTime())
                        .active(s.getActive())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public StaffLeaveDto applyLeave(StaffLeaveDto dto) {
        User staff = userRepository.findById(dto.getStaffId())
                .orElseThrow(() -> new ResourceNotFoundException("Staff user not found"));

        StaffLeave leave = StaffLeave.builder()
                .staff(staff)
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .reason(dto.getReason())
                .status("PENDING")
                .build();
        leave = staffLeaveRepository.save(leave);

        return StaffLeaveDto.builder()
                .id(leave.getId())
                .staffId(staff.getId())
                .staffName(staff.getFullName())
                .startDate(leave.getStartDate())
                .endDate(leave.getEndDate())
                .reason(leave.getReason())
                .status(leave.getStatus())
                .build();
    }

    @Transactional
    public StaffLeaveDto updateLeaveStatus(Long leaveId, String status) {
        StaffLeave leave = staffLeaveRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found"));
        leave.setStatus(status);
        leave = staffLeaveRepository.save(leave);

        return StaffLeaveDto.builder()
                .id(leave.getId())
                .staffId(leave.getStaff().getId())
                .staffName(leave.getStaff().getFullName())
                .startDate(leave.getStartDate())
                .endDate(leave.getEndDate())
                .reason(leave.getReason())
                .status(leave.getStatus())
                .build();
    }

    @Transactional
    public StaffDto updateStaff(Long id, StaffDto dto) {
        StaffProfile profile = staffProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff profile not found with ID: " + id));

        User user = profile.getUser();
        if (dto.getFullName() != null && !dto.getFullName().isBlank()) user.setFullName(dto.getFullName());
        if (dto.getPhone() != null && !dto.getPhone().isBlank()) user.setPhone(dto.getPhone());
        if (dto.getEmail() != null && !dto.getEmail().isBlank()) user.setEmail(dto.getEmail());
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        if (dto.getRole() != null) user.setRole(dto.getRole());
        userRepository.save(user);

        if (dto.getDesignation() != null) profile.setDesignation(dto.getDesignation());
        if (dto.getDepartment() != null) profile.setDepartment(dto.getDepartment());
        if (dto.getQualification() != null) profile.setQualification(dto.getQualification());
        if (dto.getSpecialties() != null) profile.setSpecialties(dto.getSpecialties());
        if (dto.getBaseSalary() != null) profile.setBaseSalary(dto.getBaseSalary());
        if (dto.getCommissionPercent() != null) profile.setCommissionPercent(dto.getCommissionPercent());
        if (dto.getStatus() != null) profile.setStatus(dto.getStatus());

        profile = staffProfileRepository.save(profile);
        return mapStaffToDto(profile);
    }

    private StaffDto mapStaffToDto(StaffProfile p) {
        String staffCode = "STF-" + String.format("%04d", p.getId());
        return StaffDto.builder()
                .id(p.getId())
                .userId(p.getUser().getId())
                .username(p.getUser().getUsername())
                .fullName(p.getUser().getFullName())
                .email(p.getUser().getEmail())
                .phone(p.getUser().getPhone())
                .role(p.getUser().getRole())
                .staffCode(staffCode)
                .branchId(p.getUser().getBranch() != null ? p.getUser().getBranch().getId() : null)
                .branchName(p.getUser().getBranch() != null ? p.getUser().getBranch().getName() : "N/A")
                .designation(p.getDesignation())
                .department(p.getDepartment())
                .qualification(p.getQualification())
                .specialties(p.getSpecialties())
                .baseSalary(p.getBaseSalary())
                .commissionPercent(p.getCommissionPercent())
                .dateOfJoining(p.getDateOfJoining())
                .status(p.getStatus())
                .build();
    }
}
