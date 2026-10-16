package com.gymmanager.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RazorpayOrderRequest {
    @NotNull(message = "Amount is required")
    private BigDecimal amount;

    private Long subscriptionId;
    private Long memberId;
    private String receipt;
    private String notes;
}
