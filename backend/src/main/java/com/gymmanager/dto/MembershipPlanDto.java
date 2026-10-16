package com.gymmanager.dto;

import com.gymmanager.enums.PlanCategory;
import com.gymmanager.enums.PlanDurationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MembershipPlanDto {
    private Long id;
    private Long branchId;
    private String branchName;

    @NotBlank(message = "Plan name is required")
    private String name;

    @NotBlank(message = "Plan code is required")
    private String code;

    private String description;

    @NotNull(message = "Duration type is required")
    private PlanDurationType durationType;

    @NotNull(message = "Duration in days is required")
    private Integer durationDays;

    private PlanCategory category;

    @NotNull(message = "Base price is required")
    private BigDecimal basePrice;

    private BigDecimal taxPercent;
    private BigDecimal totalAmount;
    private BigDecimal discountPercent;
    private Integer guestPasses;
    private Integer maxFreezes;
    private Integer maxFreezeDays;
    private Boolean active;
}
