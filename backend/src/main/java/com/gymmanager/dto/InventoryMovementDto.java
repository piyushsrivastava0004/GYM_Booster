package com.gymmanager.dto;

import com.gymmanager.enums.InventoryMovementType;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryMovementDto {
    private Long id;

    @NotNull(message = "Item ID is required")
    private Long itemId;
    private String itemName;
    private String sku;

    @NotNull(message = "Movement type is required")
    private InventoryMovementType movementType;

    @NotNull(message = "Quantity is required")
    private Integer quantity;

    private BigDecimal unitPrice;
    private BigDecimal totalAmount;
    private String reason;
    private Long recordedById;
    private String recordedByName;
    private LocalDateTime createdAt;
}
