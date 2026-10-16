package com.gymmanager.repository;

import com.gymmanager.entity.Expense;
import com.gymmanager.enums.ExpenseCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    @Query("SELECT e FROM Expense e WHERE (:branchId IS NULL OR e.branch.id = :branchId) " +
           "AND (:category IS NULL OR e.category = :category) " +
           "AND e.expenseDate BETWEEN :startDate AND :endDate")
    Page<Expense> findExpensesWithFilter(@Param("branchId") Long branchId,
                                         @Param("category") ExpenseCategory category,
                                         @Param("startDate") LocalDate startDate,
                                         @Param("endDate") LocalDate endDate,
                                         Pageable pageable);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e " +
           "WHERE (:branchId IS NULL OR e.branch.id = :branchId) " +
           "AND e.expenseDate BETWEEN :startDate AND :endDate")
    BigDecimal calculateTotalExpenses(@Param("branchId") Long branchId,
                                      @Param("startDate") LocalDate startDate,
                                      @Param("endDate") LocalDate endDate);

    @Query("SELECT e.category, COALESCE(SUM(e.amount), 0) FROM Expense e " +
           "WHERE (:branchId IS NULL OR e.branch.id = :branchId) " +
           "AND e.expenseDate BETWEEN :startDate AND :endDate " +
           "GROUP BY e.category")
    List<Object[]> getExpenseBreakdownByCategory(@Param("branchId") Long branchId,
                                                @Param("startDate") LocalDate startDate,
                                                @Param("endDate") LocalDate endDate);
}
