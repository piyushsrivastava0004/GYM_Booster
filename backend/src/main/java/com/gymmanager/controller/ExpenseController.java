package com.gymmanager.controller;

import com.gymmanager.dto.ExpenseDto;
import com.gymmanager.dto.FinancialSummaryDto;
import com.gymmanager.enums.ExpenseCategory;
import com.gymmanager.service.ExpenseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/expenses")
@Tag(name = "Expenses & Financials", description = "Endpoints for operational expenses, rent, utilities, salaries, and profit/loss summary")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @PostMapping
    @Operation(summary = "Record an operational expense")
    public ResponseEntity<ExpenseDto> recordExpense(@Valid @RequestBody ExpenseDto dto) {
        return ResponseEntity.ok(expenseService.recordExpense(dto));
    }

    @GetMapping
    @Operation(summary = "Get expenses with category and date filters")
    public ResponseEntity<Page<ExpenseDto>> getExpenses(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) ExpenseCategory category,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        return ResponseEntity.ok(expenseService.getExpenses(branchId, category, start, end, PageRequest.of(page, size, Sort.by("expenseDate").descending())));
    }

    @GetMapping("/summary")
    @Operation(summary = "Get financial P&L summary: cash collections, operating expenses, receivables, refunds, net profit")
    public ResponseEntity<FinancialSummaryDto> getFinancialSummary(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end
    ) {
        return ResponseEntity.ok(expenseService.getFinancialSummary(branchId, start, end));
    }
}
