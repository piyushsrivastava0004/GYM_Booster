package com.gymmanager.repository;

import com.gymmanager.entity.WorkoutPlanDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkoutPlanDayRepository extends JpaRepository<WorkoutPlanDay, Long> {
    List<WorkoutPlanDay> findByWorkoutPlanIdOrderByDayOfWeekAsc(Long workoutPlanId);
}
