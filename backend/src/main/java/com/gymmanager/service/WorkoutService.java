package com.gymmanager.service;

import com.gymmanager.dto.ExerciseDto;
import com.gymmanager.dto.WorkoutLogDto;
import com.gymmanager.dto.WorkoutPlanDto;
import com.gymmanager.entity.*;
import com.gymmanager.exception.ResourceNotFoundException;
import com.gymmanager.repository.*;
import com.gymmanager.util.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WorkoutService {

    private final ExerciseRepository exerciseRepository;
    private final WorkoutPlanRepository workoutPlanRepository;
    private final WorkoutPlanDayRepository workoutPlanDayRepository;
    private final WorkoutPlanExerciseRepository workoutPlanExerciseRepository;
    private final MemberWorkoutLogRepository memberWorkoutLogRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;

    public WorkoutService(ExerciseRepository exerciseRepository,
                          WorkoutPlanRepository workoutPlanRepository,
                          WorkoutPlanDayRepository workoutPlanDayRepository,
                          WorkoutPlanExerciseRepository workoutPlanExerciseRepository,
                          MemberWorkoutLogRepository memberWorkoutLogRepository,
                          UserRepository userRepository,
                          SecurityUtils securityUtils) {
        this.exerciseRepository = exerciseRepository;
        this.workoutPlanRepository = workoutPlanRepository;
        this.workoutPlanDayRepository = workoutPlanDayRepository;
        this.workoutPlanExerciseRepository = workoutPlanExerciseRepository;
        this.memberWorkoutLogRepository = memberWorkoutLogRepository;
        this.userRepository = userRepository;
        this.securityUtils = securityUtils;
    }

    // --- EXERCISES ---
    @Transactional(readOnly = true)
    public List<ExerciseDto> getAllExercises() {
        return exerciseRepository.findAll().stream()
                .map(this::mapExerciseToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ExerciseDto createExercise(ExerciseDto dto) {
        Exercise exercise = Exercise.builder()
                .name(dto.getName())
                .muscleGroup(dto.getMuscleGroup())
                .equipmentNeeded(dto.getEquipmentNeeded())
                .difficulty(dto.getDifficulty())
                .instructions(dto.getInstructions())
                .mediaUrl(dto.getMediaUrl())
                .build();
        exercise = exerciseRepository.save(exercise);
        return mapExerciseToDto(exercise);
    }

    // --- WORKOUT PLANS ---
    @Transactional
    public WorkoutPlanDto createWorkoutPlan(WorkoutPlanDto dto) {
        User creator = securityUtils.getCurrentUser();
        User member = null;
        if (dto.getMemberId() != null) {
            member = userRepository.findById(dto.getMemberId()).orElse(null);
        }

        WorkoutPlan plan = WorkoutPlan.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .createdBy(creator)
                .member(member)
                .isTemplate(dto.getIsTemplate() != null ? dto.getIsTemplate() : (member == null))
                .targetGoal(dto.getTargetGoal())
                .startDate(dto.getStartDate() != null ? dto.getStartDate() : LocalDate.now())
                .endDate(dto.getEndDate())
                .active(true)
                .build();
        plan = workoutPlanRepository.save(plan);

        if (dto.getDays() != null) {
            for (WorkoutPlanDto.WorkoutPlanDayDto dayDto : dto.getDays()) {
                WorkoutPlanDay day = WorkoutPlanDay.builder()
                        .workoutPlan(plan)
                        .dayOfWeek(dayDto.getDayOfWeek())
                        .dayName(dayDto.getDayName())
                        .isRestDay(dayDto.getIsRestDay() != null ? dayDto.getIsRestDay() : false)
                        .build();
                day = workoutPlanDayRepository.save(day);

                if (dayDto.getExercises() != null) {
                    int order = 0;
                    for (WorkoutPlanDto.WorkoutPlanExerciseDto exDto : dayDto.getExercises()) {
                        Exercise exercise = exerciseRepository.findById(exDto.getExerciseId())
                                .orElseThrow(() -> new ResourceNotFoundException("Exercise not found: " + exDto.getExerciseId()));

                        WorkoutPlanExercise ex = WorkoutPlanExercise.builder()
                                .workoutPlanDay(day)
                                .exercise(exercise)
                                .sets(exDto.getSets())
                                .reps(exDto.getReps())
                                .weightKg(exDto.getWeightKg())
                                .restTimeSeconds(exDto.getRestTimeSeconds() != null ? exDto.getRestTimeSeconds() : 60)
                                .orderIndex(order++)
                                .notes(exDto.getNotes())
                                .build();
                        workoutPlanExerciseRepository.save(ex);
                    }
                }
            }
        }

        return getWorkoutPlanById(plan.getId());
    }

    @Transactional(readOnly = true)
    public List<WorkoutPlanDto> getTemplates() {
        return workoutPlanRepository.findByIsTemplateTrueAndActiveTrue().stream()
                .map(this::mapPlanToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WorkoutPlanDto> getMemberWorkoutPlans(Long memberId) {
        return workoutPlanRepository.findByMemberIdAndActiveTrue(memberId).stream()
                .map(this::mapPlanToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WorkoutPlanDto getWorkoutPlanById(Long id) {
        WorkoutPlan plan = workoutPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workout plan not found with ID: " + id));
        return mapPlanToDto(plan);
    }

    // --- WORKOUT LOGS ---
    @Transactional
    public WorkoutLogDto logWorkout(WorkoutLogDto dto) {
        User member = userRepository.findById(dto.getMemberId())
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));
        Exercise exercise = exerciseRepository.findById(dto.getExerciseId())
                .orElseThrow(() -> new ResourceNotFoundException("Exercise not found"));

        MemberWorkoutLog log = MemberWorkoutLog.builder()
                .member(member)
                .exercise(exercise)
                .workoutDate(dto.getWorkoutDate() != null ? dto.getWorkoutDate() : LocalDate.now())
                .setsCompleted(dto.getSetsCompleted())
                .repsCompleted(dto.getRepsCompleted())
                .weightUsedKg(dto.getWeightUsedKg())
                .notes(dto.getNotes())
                .verifiedByTrainer(false)
                .build();
        log = memberWorkoutLogRepository.save(log);

        return mapLogToDto(log);
    }

    @Transactional(readOnly = true)
    public List<WorkoutLogDto> getMemberWorkoutLogs(Long memberId) {
        return memberWorkoutLogRepository.findByMemberIdOrderByWorkoutDateDesc(memberId).stream()
                .map(this::mapLogToDto)
                .collect(Collectors.toList());
    }

    private ExerciseDto mapExerciseToDto(Exercise e) {
        return ExerciseDto.builder()
                .id(e.getId())
                .name(e.getName())
                .muscleGroup(e.getMuscleGroup())
                .equipmentNeeded(e.getEquipmentNeeded())
                .difficulty(e.getDifficulty())
                .instructions(e.getInstructions())
                .mediaUrl(e.getMediaUrl())
                .build();
    }

    private WorkoutPlanDto mapPlanToDto(WorkoutPlan p) {
        List<WorkoutPlanDto.WorkoutPlanDayDto> dayDtos = new ArrayList<>();
        List<WorkoutPlanDay> days = workoutPlanDayRepository.findByWorkoutPlanIdOrderByDayOfWeekAsc(p.getId());

        for (WorkoutPlanDay day : days) {
            List<WorkoutPlanExercise> exercises = workoutPlanExerciseRepository.findByWorkoutPlanDayIdOrderByOrderIndexAsc(day.getId());
            List<WorkoutPlanDto.WorkoutPlanExerciseDto> exDtos = exercises.stream().map(ex ->
                    WorkoutPlanDto.WorkoutPlanExerciseDto.builder()
                            .id(ex.getId())
                            .exerciseId(ex.getExercise().getId())
                            .exerciseName(ex.getExercise().getName())
                            .muscleGroup(ex.getExercise().getMuscleGroup().name())
                            .sets(ex.getSets())
                            .reps(ex.getReps())
                            .weightKg(ex.getWeightKg())
                            .restTimeSeconds(ex.getRestTimeSeconds())
                            .orderIndex(ex.getOrderIndex())
                            .notes(ex.getNotes())
                            .build()
            ).collect(Collectors.toList());

            dayDtos.add(WorkoutPlanDto.WorkoutPlanDayDto.builder()
                    .id(day.getId())
                    .dayOfWeek(day.getDayOfWeek())
                    .dayName(day.getDayName())
                    .isRestDay(day.getIsRestDay())
                    .exercises(exDtos)
                    .build());
        }

        return WorkoutPlanDto.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .createdById(p.getCreatedBy().getId())
                .createdByName(p.getCreatedBy().getFullName())
                .memberId(p.getMember() != null ? p.getMember().getId() : null)
                .memberName(p.getMember() != null ? p.getMember().getFullName() : null)
                .isTemplate(p.getIsTemplate())
                .targetGoal(p.getTargetGoal())
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .active(p.getActive())
                .days(dayDtos)
                .build();
    }

    private WorkoutLogDto mapLogToDto(MemberWorkoutLog log) {
        return WorkoutLogDto.builder()
                .id(log.getId())
                .memberId(log.getMember().getId())
                .memberName(log.getMember().getFullName())
                .exerciseId(log.getExercise().getId())
                .exerciseName(log.getExercise().getName())
                .muscleGroup(log.getExercise().getMuscleGroup().name())
                .workoutDate(log.getWorkoutDate())
                .setsCompleted(log.getSetsCompleted())
                .repsCompleted(log.getRepsCompleted())
                .weightUsedKg(log.getWeightUsedKg())
                .notes(log.getNotes())
                .verifiedByTrainer(log.getVerifiedByTrainer())
                .build();
    }
}
