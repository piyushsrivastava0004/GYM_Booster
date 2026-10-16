package com.gymmanager.dto;

import com.gymmanager.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchasePlanRequest {
    @NotNull(message = "Member ID is required")
    private Long memberId;

    @NotNull(message = "Plan ID is required")
    private Long planId;

    private Long branchId;
    private LocalDate startDate;
    private BigDecimal discountAmount;
    private BigDecimal paidAmount; // For partial payments
    private PaymentMethod paymentMethod;
    private String idempotencyKey;
    private String notes;
}
