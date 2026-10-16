package com.gymmanager.dto;

import com.gymmanager.enums.PaymentMethod;
import com.gymmanager.enums.PaymentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentDto {
    private Long id;
    private String transactionId;
    private Long subscriptionId;
    private Long memberId;
    private String memberName;
    private String memberCode;
    private Long branchId;
    private String branchName;
    private BigDecimal amount;
    private BigDecimal taxAmount;
    private BigDecimal discountAmount;
    private BigDecimal netAmount;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String idempotencyKey;
    private LocalDateTime paymentDate;
    private String invoiceNumber;
    private String notes;
}
