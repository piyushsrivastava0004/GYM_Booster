package com.gymmanager.service;

import com.gymmanager.dto.ExpenseDto;
import com.gymmanager.dto.FinancialSummaryDto;
import com.gymmanager.entity.Branch;
import com.gymmanager.entity.Expense;
import com.gymmanager.enums.ExpenseCategory;
import com.gymmanager.enums.PaymentMethod;
import com.gymmanager.exception.ResourceNotFoundException;
import com.gymmanager.repository.*;
import com.gymmanager.util.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final PaymentRepository paymentRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final RefundRepository refundRepository;
    private final BranchRepository branchRepository;
    private final SecurityUtils securityUtils;

    public ExpenseService(ExpenseRepository expenseRepository,
                          PaymentRepository paymentRepository,
                          SubscriptionRepository subscriptionRepository,
                          RefundRepository refundRepository,
                          BranchRepository branchRepository,
                          SecurityUtils securityUtils) {
        this.expenseRepository = expenseRepository;
        this.paymentRepository = paymentRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.refundRepository = refundRepository;
        this.branchRepository = branchRepository;
        this.securityUtils = securityUtils;
    }

    @Transactional
    public ExpenseDto recordExpense(ExpenseDto dto) {
        Branch branch = null;
        if (dto.getBranchId() != null) {
            branch = branchRepository.findById(dto.getBranchId()).orElse(null);
        } else {
            branch = securityUtils.getCurrentUser() != null ? securityUtils.getCurrentUser().getBranch() : null;
        }

        Expense expense = Expense.builder()
                .branch(branch)
                .category(dto.getCategory())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .amount(dto.getAmount())
                .expenseDate(dto.getExpenseDate() != null ? dto.getExpenseDate() : LocalDate.now())
                .vendorName(dto.getVendorName())
                .receiptUrl(dto.getReceiptUrl())
                .isRecurring(dto.getIsRecurring() != null ? dto.getIsRecurring() : false)
                .recurringFrequency(dto.getRecurringFrequency())
                .paymentMethod(dto.getPaymentMethod() != null ? dto.getPaymentMethod() : PaymentMethod.BANK_TRANSFER)
                .recordedBy(securityUtils.getCurrentUser())
                .build();
        expense = expenseRepository.save(expense);

        return mapExpenseToDto(expense);
    }

    @Transactional(readOnly = true)
    public Page<ExpenseDto> getExpenses(Long branchId, ExpenseCategory category, LocalDate start, LocalDate end, Pageable pageable) {
        Long effectiveBranchId = securityUtils.isGymOwnerOrAdmin() ? branchId : securityUtils.getCurrentBranchId();
        LocalDate s = start != null ? start : LocalDate.now().minusMonths(1);
        LocalDate e = end != null ? end : LocalDate.now();
        return expenseRepository.findExpensesWithFilter(effectiveBranchId, category, s, e, pageable)
                .map(this::mapExpenseToDto);
    }

    // --- FINANCIAL SUMMARY (P&L) ---
    @Transactional(readOnly = true)
    public FinancialSummaryDto getFinancialSummary(Long branchId, LocalDate start, LocalDate end) {
        Long effectiveBranchId = securityUtils.isGymOwnerOrAdmin() ? branchId : securityUtils.getCurrentBranchId();
        LocalDate s = start != null ? start : LocalDate.now().withDayOfMonth(1);
        LocalDate e = end != null ? end : LocalDate.now();

        LocalDateTime startDt = s.atStartOfDay();
        LocalDateTime endDt = e.atTime(23, 59, 59);

        BigDecimal cashCollections = paymentRepository.calculateTotalCollections(effectiveBranchId, startDt, endDt);
        BigDecimal operatingExpenses = expenseRepository.calculateTotalExpenses(effectiveBranchId, s, e);
        BigDecimal refunds = refundRepository.calculateTotalRefunds(effectiveBranchId, startDt, endDt);
        BigDecimal outstandingReceivables = subscriptionRepository.calculateTotalOutstanding(effectiveBranchId);

        BigDecimal netProfit = cashCollections.subtract(refunds).subtract(operatingExpenses);

        // Expense category breakdown
        List<Object[]> categoryBreakdown = expenseRepository.getExpenseBreakdownByCategory(effectiveBranchId, s, e);
        Map<String, BigDecimal> expenseMap = new HashMap<>();
        for (Object[] row : categoryBreakdown) {
            expenseMap.put(row[0].toString(), (BigDecimal) row[1]);
        }

        return FinancialSummaryDto.builder()
                .totalInvoicedRevenue(cashCollections.add(outstandingReceivables))
                .totalCashCollections(cashCollections)
                .totalOutstandingReceivables(outstandingReceivables)
                .totalRefunds(refunds)
                .totalOperatingExpenses(operatingExpenses)
                .netProfitOrLoss(netProfit)
                .expensesByCategory(expenseMap)
                .build();
    }

    private ExpenseDto mapExpenseToDto(Expense e) {
        return ExpenseDto.builder()
                .id(e.getId())
                .branchId(e.getBranch() != null ? e.getBranch().getId() : null)
                .branchName(e.getBranch() != null ? e.getBranch().getName() : "N/A")
                .category(e.getCategory())
                .title(e.getTitle())
                .description(e.getDescription())
                .amount(e.getAmount())
                .expenseDate(e.getExpenseDate())
                .vendorName(e.getVendorName())
                .receiptUrl(e.getReceiptUrl())
                .isRecurring(e.getIsRecurring())
                .recurringFrequency(e.getRecurringFrequency())
                .paymentMethod(e.getPaymentMethod())
                .recordedById(e.getRecordedBy() != null ? e.getRecordedBy().getId() : null)
                .recordedByName(e.getRecordedBy() != null ? e.getRecordedBy().getFullName() : null)
                .build();
    }
}
