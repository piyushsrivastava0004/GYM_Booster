package com.gymmanager.repository;

import com.gymmanager.entity.DietPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DietPlanRepository extends JpaRepository<DietPlan, Long> {
    List<DietPlan> findByIsTemplateTrueAndActiveTrue();
    List<DietPlan> findByMemberIdAndActiveTrue(Long memberId);
    Optional<DietPlan> findFirstByMemberIdAndActiveTrueOrderByCreatedAtDesc(Long memberId);
}
