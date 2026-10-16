package com.gymmanager.dto;

import com.gymmanager.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRecordRequest {
    private Long subscriptionId;

    @NotNull(message = "Member ID is required")
    private Long memberId;

    private Long branchId;

    @NotNull(message = "Amount is required")
    private BigDecimal amount;

    private BigDecimal discountAmount;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    private String idempotencyKey;
    private String notes;
}
