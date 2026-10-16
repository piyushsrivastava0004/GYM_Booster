package com.gymmanager.dto;

import com.gymmanager.enums.EquipmentStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EquipmentDto {
    private Long id;
    private Long branchId;
    private String branchName;

    @NotBlank(message = "Equipment name is required")
    private String name;

    private String serialNumber;
    private String category;
    private LocalDate purchaseDate;
    private BigDecimal purchaseCost;
    private LocalDate warrantyExpiryDate;
    private EquipmentStatus status;
    private LocalDate lastMaintenanceDate;
    private LocalDate nextMaintenanceDate;
    private String notes;
}
