package com.gymmanager.service;

import com.gymmanager.dto.FitnessGoalDto;
import com.gymmanager.dto.FitnessMeasurementDto;
import com.gymmanager.entity.FitnessGoal;
import com.gymmanager.entity.FitnessMeasurement;
import com.gymmanager.entity.User;
import com.gymmanager.enums.GoalStatus;
import com.gymmanager.exception.ResourceNotFoundException;
import com.gymmanager.repository.FitnessGoalRepository;
import com.gymmanager.repository.FitnessMeasurementRepository;
import com.gymmanager.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FitnessProgressService {

    private final FitnessMeasurementRepository measurementRepository;
    private final FitnessGoalRepository goalRepository;
    private final UserRepository userRepository;

    public FitnessProgressService(FitnessMeasurementRepository measurementRepository,
                                  FitnessGoalRepository goalRepository,
                                  UserRepository userRepository) {
        this.measurementRepository = measurementRepository;
        this.goalRepository = goalRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public FitnessMeasurementDto recordMeasurement(FitnessMeasurementDto dto) {
        User member = userRepository.findById(dto.getMemberId())
                .orElseThrow(() -> new ResourceNotFoundException("Member not found with ID: " + dto.getMemberId()));

        // BMI Calculation = weightKg / (heightMeters * heightMeters)
        BigDecimal bmi = null;
        if (dto.getWeightKg() != null && dto.getHeightCm() != null && dto.getHeightCm().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal heightMeters = dto.getHeightCm().divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
            BigDecimal heightSquared = heightMeters.multiply(heightMeters);
            bmi = dto.getWeightKg().divide(heightSquared, 2, RoundingMode.HALF_UP);
        }

        FitnessMeasurement measurement = FitnessMeasurement.builder()
                .member(member)
                .recordedDate(dto.getRecordedDate() != null ? dto.getRecordedDate() : LocalDate.now())
                .weightKg(dto.getWeightKg())
                .heightCm(dto.getHeightCm())
                .bmi(bmi)
                .bodyFatPercent(dto.getBodyFatPercent())
                .chestCm(dto.getChestCm())
                .waistCm(dto.getWaistCm())
                .hipsCm(dto.getHipsCm())
                .bicepCm(dto.getBicepCm())
                .thighsCm(dto.getThighsCm())
                .photoUrl(dto.getPhotoUrl())
                .notes(dto.getNotes())
                .build();
        measurement = measurementRepository.save(measurement);

        // Update goals if current weight matches
        List<FitnessGoal> goals = goalRepository.findByMemberId(member.getId());
        for (FitnessGoal goal : goals) {
            if (goal.getGoalType().name().contains("WEIGHT") && goal.getStatus() == GoalStatus.IN_PROGRESS) {
                goal.setCurrentValue(dto.getWeightKg());
                goalRepository.save(goal);
            }
        }

        return mapMeasurementToDto(measurement);
    }

    @Transactional(readOnly = true)
    public List<FitnessMeasurementDto> getMemberMeasurements(Long memberId) {
        return measurementRepository.findByMemberIdOrderByRecordedDateAsc(memberId).stream()
                .map(this::mapMeasurementToDto)
                .collect(Collectors.toList());
    }

    // --- GOALS ---
    @Transactional
    public FitnessGoalDto createGoal(FitnessGoalDto dto) {
        User member = userRepository.findById(dto.getMemberId())
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        FitnessGoal goal = FitnessGoal.builder()
                .member(member)
                .goalType(dto.getGoalType())
                .targetValue(dto.getTargetValue())
                .currentValue(dto.getCurrentValue())
                .unit(dto.getUnit() != null ? dto.getUnit() : "kg")
                .targetDate(dto.getTargetDate())
                .status(GoalStatus.IN_PROGRESS)
                .description(dto.getDescription())
                .build();
        goal = goalRepository.save(goal);

        return mapGoalToDto(goal);
    }

    @Transactional
    public FitnessGoalDto updateGoalStatus(Long goalId, GoalStatus status, BigDecimal currentValue) {
        FitnessGoal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found"));
        goal.setStatus(status);
        if (currentValue != null) {
            goal.setCurrentValue(currentValue);
        }
        goal = goalRepository.save(goal);
        return mapGoalToDto(goal);
    }

    @Transactional(readOnly = true)
    public List<FitnessGoalDto> getMemberGoals(Long memberId) {
        return goalRepository.findByMemberId(memberId).stream()
                .map(this::mapGoalToDto)
                .collect(Collectors.toList());
    }

    private FitnessMeasurementDto mapMeasurementToDto(FitnessMeasurement m) {
        return FitnessMeasurementDto.builder()
                .id(m.getId())
                .memberId(m.getMember().getId())
                .memberName(m.getMember().getFullName())
                .recordedDate(m.getRecordedDate())
                .weightKg(m.getWeightKg())
                .heightCm(m.getHeightCm())
                .bmi(m.getBmi())
                .bodyFatPercent(m.getBodyFatPercent())
                .chestCm(m.getChestCm())
                .waistCm(m.getWaistCm())
                .hipsCm(m.getHipsCm())
                .bicepCm(m.getBicepCm())
                .thighsCm(m.getThighsCm())
                .photoUrl(m.getPhotoUrl())
                .notes(m.getNotes())
                .build();
    }

    private FitnessGoalDto mapGoalToDto(FitnessGoal g) {
        return FitnessGoalDto.builder()
                .id(g.getId())
                .memberId(g.getMember().getId())
                .memberName(g.getMember().getFullName())
                .goalType(g.getGoalType())
                .targetValue(g.getTargetValue())
                .currentValue(g.getCurrentValue())
                .unit(g.getUnit())
                .targetDate(g.getTargetDate())
                .status(g.getStatus())
                .description(g.getDescription())
                .build();
    }
}
