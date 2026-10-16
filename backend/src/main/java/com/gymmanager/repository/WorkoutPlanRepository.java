package com.gymmanager.repository;

import com.gymmanager.entity.WorkoutPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkoutPlanRepository extends JpaRepository<WorkoutPlan, Long> {
    List<WorkoutPlan> findByIsTemplateTrueAndActiveTrue();
    List<WorkoutPlan> findByMemberIdAndActiveTrue(Long memberId);
    Optional<WorkoutPlan> findFirstByMemberIdAndActiveTrueOrderByCreatedAtDesc(Long memberId);
}
