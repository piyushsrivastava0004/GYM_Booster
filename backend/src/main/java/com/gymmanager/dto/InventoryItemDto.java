package com.gymmanager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryItemDto {
    private Long id;
    private Long branchId;
    private String branchName;

    @NotBlank(message = "Item name is required")
    private String name;

    @NotBlank(message = "SKU is required")
    private String sku;

    private String category;

    @NotNull(message = "Unit price is required")
    private BigDecimal unitPrice;

    @NotNull(message = "Selling price is required")
    private BigDecimal sellingPrice;

    private Integer quantityInStock;
    private Integer reorderThreshold;
    private Boolean isLowStock;
    private Boolean active;
}
