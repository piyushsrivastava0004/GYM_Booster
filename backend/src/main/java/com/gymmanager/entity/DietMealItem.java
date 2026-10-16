package com.gymmanager.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.gymmanager.enums.MealTime;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "diet_meal_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DietMealItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diet_plan_id", nullable = false)
    @JsonIgnore
    private DietPlan dietPlan;

    @Enumerated(EnumType.STRING)
    @Column(name = "meal_time", nullable = false, length = 30)
    private MealTime mealTime;

    @Column(name = "food_name", nullable = false, length = 100)
    private String foodName;

    @Column(nullable = false, length = 50)
    private String quantity; // e.g. "4 egg whites, 2 slices whole wheat toast", "1 cup oats with milk"

    private Integer calories;

    @Column(name = "protein_grams")
    private Integer proteinGrams;

    @Column(name = "carbs_grams")
    private Integer carbsGrams;

    @Column(name = "fat_grams")
    private Integer fatGrams;

    @Column(length = 255)
    private String notes;
}
