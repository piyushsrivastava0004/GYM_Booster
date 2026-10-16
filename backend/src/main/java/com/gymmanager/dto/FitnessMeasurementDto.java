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
public class FitnessMeasurementDto {
    private Long id;
    private Long memberId;
    private String memberName;

    @NotNull(message = "Recorded date is required")
    private LocalDate recordedDate;

    @NotNull(message = "Weight in kg is required")
    private BigDecimal weightKg;

    private BigDecimal heightCm;
    private BigDecimal bmi;
    private BigDecimal bodyFatPercent;
    private BigDecimal chestCm;
    private BigDecimal waistCm;
    private BigDecimal hipsCm;
    private BigDecimal bicepCm;
    private BigDecimal thighsCm;
    private String photoUrl;
    private String notes;
}
