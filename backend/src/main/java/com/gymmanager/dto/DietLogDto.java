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
public class DietLogDto {
    private Long id;
    private Long memberId;
    private String memberName;

    @NotNull(message = "Log date is required")
    private LocalDate logDate;

    private BigDecimal waterIntakeLiters;
    private Integer mealsFollowed;
    private Integer caloriesConsumed;
    private String notes;
}
