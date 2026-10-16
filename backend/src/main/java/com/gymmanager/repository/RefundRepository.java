package com.gymmanager.repository;

import com.gymmanager.entity.Refund;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Repository
public interface RefundRepository extends JpaRepository<Refund, Long> {

    @Query("SELECT r FROM Refund r WHERE (:branchId IS NULL OR r.payment.branch.id = :branchId) " +
           "AND r.refundDate BETWEEN :startDate AND :endDate")
    Page<Refund> findRefundsWithFilter(@Param("branchId") Long branchId,
                                       @Param("startDate") LocalDateTime startDate,
                                       @Param("endDate") LocalDateTime endDate,
                                       Pageable pageable);

    @Query("SELECT COALESCE(SUM(r.amount), 0) FROM Refund r " +
           "WHERE (:branchId IS NULL OR r.payment.branch.id = :branchId) " +
           "AND r.status = 'COMPLETED' " +
           "AND r.refundDate BETWEEN :startDate AND :endDate")
    BigDecimal calculateTotalRefunds(@Param("branchId") Long branchId,
                                     @Param("startDate") LocalDateTime startDate,
                                     @Param("endDate") LocalDateTime endDate);
}
