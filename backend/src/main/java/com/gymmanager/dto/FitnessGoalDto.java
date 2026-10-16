package com.gymmanager.dto;

import com.gymmanager.enums.GoalStatus;
import com.gymmanager.enums.GoalType;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FitnessGoalDto {
    private Long id;
    private Long memberId;
    private String memberName;

    @NotNull(message = "Goal type is required")
    private GoalType goalType;

    @NotNull(message = "Target value is required")
    private BigDecimal targetValue;

    private BigDecimal currentValue;
    private String unit;
    private LocalDate targetDate;
    private GoalStatus status;
    private String description;
}
