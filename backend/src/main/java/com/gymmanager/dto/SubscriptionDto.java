package com.gymmanager.dto;

import com.gymmanager.enums.SubscriptionStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionDto {
    private Long id;
    private Long memberId;
    private String memberName;
    private String memberCode;
    private Long planId;
    private String planName;
    private Long branchId;
    private String branchName;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate originalEndDate;
    private SubscriptionStatus status;
    private LocalDate frozenAt;
    private LocalDate freezeEnd;
    private Integer freezesUsed;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal outstandingAmount;
    private String notes;
}
