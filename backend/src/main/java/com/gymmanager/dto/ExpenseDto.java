package com.gymmanager.dto;

import com.gymmanager.enums.ExpenseCategory;
import com.gymmanager.enums.PaymentMethod;
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
public class ExpenseDto {
    private Long id;
    private Long branchId;
    private String branchName;

    @NotNull(message = "Expense category is required")
    private ExpenseCategory category;

    @NotBlank(message = "Expense title is required")
    private String title;

    private String description;

    @NotNull(message = "Amount is required")
    private BigDecimal amount;

    @NotNull(message = "Expense date is required")
    private LocalDate expenseDate;

    private String vendorName;
    private String receiptUrl;
    private Boolean isRecurring;
    private String recurringFrequency;
    private PaymentMethod paymentMethod;
    private Long recordedById;
    private String recordedByName;
}
