package com.gymmanager.dto;

import com.gymmanager.enums.DietaryPreference;
import com.gymmanager.enums.MealTime;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DietPlanDto {
    private Long id;

    @NotBlank(message = "Plan name is required")
    private String name;

    private String description;
    private Long createdById;
    private String createdByName;
    private Long memberId;
    private String memberName;
    private Boolean isTemplate;
    private Integer dailyCalories;
    private Integer proteinGrams;
    private Integer carbsGrams;
    private Integer fatGrams;
    private DietaryPreference dietaryPreference;
    private String allergyAlerts;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean active;
    private List<DietMealItemDto> mealItems;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DietMealItemDto {
        private Long id;
        private MealTime mealTime;
        private String foodName;
        private String quantity;
        private Integer calories;
        private Integer proteinGrams;
        private Integer carbsGrams;
        private Integer fatGrams;
        private String notes;
    }
}
