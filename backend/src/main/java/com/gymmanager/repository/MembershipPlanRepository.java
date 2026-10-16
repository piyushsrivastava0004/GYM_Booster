package com.gymmanager.repository;

import com.gymmanager.entity.MembershipPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MembershipPlanRepository extends JpaRepository<MembershipPlan, Long> {
    Optional<MembershipPlan> findByCode(String code);

    @Query("SELECT p FROM MembershipPlan p WHERE p.active = true AND (p.branch IS NULL OR :branchId IS NULL OR p.branch.id = :branchId)")
    List<MembershipPlan> findActivePlansForBranch(@Param("branchId") Long branchId);
}
