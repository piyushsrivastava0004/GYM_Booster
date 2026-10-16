package com.gymmanager.repository;

import com.gymmanager.entity.Subscription;
import com.gymmanager.enums.SubscriptionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    List<Subscription> findByMemberIdOrderByCreatedAtDesc(Long memberId);
    Optional<Subscription> findFirstByMemberIdAndStatusOrderByEndDateDesc(Long memberId, SubscriptionStatus status);

    @Query("SELECT s FROM Subscription s WHERE s.member.id = :memberId AND s.status = 'ACTIVE' AND s.startDate <= :today AND s.endDate >= :today")
    Optional<Subscription> findActiveSubscriptionForMember(@Param("memberId") Long memberId, @Param("today") LocalDate today);

    @Query("SELECT s FROM Subscription s WHERE (:branchId IS NULL OR s.branch.id = :branchId) " +
           "AND s.status = 'ACTIVE' AND s.endDate BETWEEN :startDate AND :endDate")
    List<Subscription> findExpiringSubscriptions(@Param("branchId") Long branchId,
                                                @Param("startDate") LocalDate startDate,
                                                @Param("endDate") LocalDate endDate);

    @Query("SELECT s FROM Subscription s WHERE s.status = 'ACTIVE' AND s.endDate < :today")
    List<Subscription> findOverdueSubscriptionsForExpiry(@Param("today") LocalDate today);

    @Query("SELECT s FROM Subscription s WHERE (:branchId IS NULL OR s.branch.id = :branchId) " +
           "AND s.outstandingAmount > 0")
    List<Subscription> findSubscriptionsWithOutstandingBalance(@Param("branchId") Long branchId);

    @Query("SELECT COALESCE(SUM(s.outstandingAmount), 0) FROM Subscription s WHERE (:branchId IS NULL OR s.branch.id = :branchId)")
    BigDecimal calculateTotalOutstanding(@Param("branchId") Long branchId);

    @Query("SELECT s FROM Subscription s WHERE (:branchId IS NULL OR s.branch.id = :branchId) " +
           "AND (:status IS NULL OR s.status = :status)")
    Page<Subscription> findSubscriptionsWithFilter(@Param("branchId") Long branchId,
                                                   @Param("status") SubscriptionStatus status,
                                                   Pageable pageable);
}
