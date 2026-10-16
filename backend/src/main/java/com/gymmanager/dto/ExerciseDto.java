package com.gymmanager.dto;

import com.gymmanager.enums.ExerciseDifficulty;
import com.gymmanager.enums.MuscleGroup;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExerciseDto {
    private Long id;

    @NotBlank(message = "Exercise name is required")
    private String name;

    @NotNull(message = "Muscle group is required")
    private MuscleGroup muscleGroup;

    private String equipmentNeeded;
    private ExerciseDifficulty difficulty;
    private String instructions;
    private String mediaUrl;
}
