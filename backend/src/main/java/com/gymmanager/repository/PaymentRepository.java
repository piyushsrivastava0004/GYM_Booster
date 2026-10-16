package com.gymmanager.repository;

import com.gymmanager.entity.Payment;
import com.gymmanager.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByTransactionId(String transactionId);
    Optional<Payment> findByIdempotencyKey(String idempotencyKey);
    Optional<Payment> findByRazorpayOrderId(String orderId);
    Optional<Payment> findByRazorpayPaymentId(String paymentId);

    List<Payment> findByMemberIdOrderByPaymentDateDesc(Long memberId);

    @Query("SELECT p FROM Payment p WHERE (:branchId IS NULL OR p.branch.id = :branchId) " +
           "AND (:status IS NULL OR p.paymentStatus = :status) " +
           "AND p.paymentDate BETWEEN :startDate AND :endDate")
    Page<Payment> findPaymentsWithFilter(@Param("branchId") Long branchId,
                                         @Param("status") PaymentStatus status,
                                         @Param("startDate") LocalDateTime startDate,
                                         @Param("endDate") LocalDateTime endDate,
                                         Pageable pageable);

    @Query("SELECT COALESCE(SUM(p.netAmount), 0) FROM Payment p " +
           "WHERE (:branchId IS NULL OR p.branch.id = :branchId) " +
           "AND p.paymentStatus = 'PAID' " +
           "AND p.paymentDate BETWEEN :startDate AND :endDate")
    BigDecimal calculateTotalCollections(@Param("branchId") Long branchId,
                                         @Param("startDate") LocalDateTime startDate,
                                         @Param("endDate") LocalDateTime endDate);
}
