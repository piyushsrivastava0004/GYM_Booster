package com.gymmanager.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkoutLogDto {
    private Long id;
    private Long memberId;
    private String memberName;

    @NotNull(message = "Exercise ID is required")
    private Long exerciseId;
    private String exerciseName;
    private String muscleGroup;

    @NotNull(message = "Workout date is required")
    private LocalDate workoutDate;

    @NotNull(message = "Sets completed is required")
    private Integer setsCompleted;

    @NotNull(message = "Reps completed is required")
    private Integer repsCompleted;

    private BigDecimal weightUsedKg;
    private String notes;
    private Boolean verifiedByTrainer;
}
