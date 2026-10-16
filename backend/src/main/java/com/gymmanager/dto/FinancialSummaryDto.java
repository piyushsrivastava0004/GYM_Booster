package com.gymmanager.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialSummaryDto {
    private BigDecimal totalInvoicedRevenue;
    private BigDecimal totalCashCollections;
    private BigDecimal totalOutstandingReceivables;
    private BigDecimal totalRefunds;
    private BigDecimal totalOperatingExpenses;
    private BigDecimal netProfitOrLoss;
    private Map<String, BigDecimal> expensesByCategory;
}
