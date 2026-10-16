package com.gymmanager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceDto {
    private Long id;

    @NotNull(message = "Equipment ID is required")
    private Long equipmentId;
    private String equipmentName;

    @NotNull(message = "Maintenance date is required")
    private LocalDate maintenanceDate;

    @NotNull(message = "Cost is required")
    private BigDecimal cost;

    @NotBlank(message = "Description is required")
    private String description;

    private String vendorName;
    private String performedBy;
    private String status;
}
