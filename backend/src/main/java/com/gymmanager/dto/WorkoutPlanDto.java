package com.gymmanager.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkoutPlanDto {
    private Long id;

    @NotBlank(message = "Plan name is required")
    private String name;

    private String description;
    private Long createdById;
    private String createdByName;
    private Long memberId;
    private String memberName;
    private Boolean isTemplate;
    private String targetGoal;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean active;
    private List<WorkoutPlanDayDto> days;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WorkoutPlanDayDto {
        private Long id;
        private Integer dayOfWeek;
        private String dayName;
        private Boolean isRestDay;
        private List<WorkoutPlanExerciseDto> exercises;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WorkoutPlanExerciseDto {
        private Long id;
        private Long exerciseId;
        private String exerciseName;
        private String muscleGroup;
        private Integer sets;
        private Integer reps;
        private BigDecimal weightKg;
        private Integer restTimeSeconds;
        private Integer orderIndex;
        private String notes;
    }
}
