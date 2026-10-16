package com.gymmanager.repository;

import com.gymmanager.entity.DietMealItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DietMealItemRepository extends JpaRepository<DietMealItem, Long> {
    List<DietMealItem> findByDietPlanId(Long dietPlanId);
}
