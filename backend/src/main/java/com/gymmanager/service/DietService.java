package com.gymmanager.service;

import com.gymmanager.dto.DietLogDto;
import com.gymmanager.dto.DietPlanDto;
import com.gymmanager.entity.DietMealItem;
import com.gymmanager.entity.DietPlan;
import com.gymmanager.entity.MemberDietLog;
import com.gymmanager.entity.User;
import com.gymmanager.enums.DietaryPreference;
import com.gymmanager.exception.ResourceNotFoundException;
import com.gymmanager.repository.DietMealItemRepository;
import com.gymmanager.repository.DietPlanRepository;
import com.gymmanager.repository.MemberDietLogRepository;
import com.gymmanager.repository.UserRepository;
import com.gymmanager.util.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DietService {

    private final DietPlanRepository dietPlanRepository;
    private final DietMealItemRepository dietMealItemRepository;
    private final MemberDietLogRepository memberDietLogRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;

    public DietService(DietPlanRepository dietPlanRepository,
                       DietMealItemRepository dietMealItemRepository,
                       MemberDietLogRepository memberDietLogRepository,
                       UserRepository userRepository,
                       SecurityUtils securityUtils) {
        this.dietPlanRepository = dietPlanRepository;
        this.dietMealItemRepository = dietMealItemRepository;
        this.memberDietLogRepository = memberDietLogRepository;
        this.userRepository = userRepository;
        this.securityUtils = securityUtils;
    }

    @Transactional
    public DietPlanDto createDietPlan(DietPlanDto dto) {
        User creator = securityUtils.getCurrentUser();
        User member = null;
        if (dto.getMemberId() != null) {
            member = userRepository.findById(dto.getMemberId()).orElse(null);
        }

        DietPlan plan = DietPlan.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .createdBy(creator)
                .member(member)
                .isTemplate(dto.getIsTemplate() != null ? dto.getIsTemplate() : (member == null))
                .dailyCalories(dto.getDailyCalories())
                .proteinGrams(dto.getProteinGrams())
                .carbsGrams(dto.getCarbsGrams())
                .fatGrams(dto.getFatGrams())
                .dietaryPreference(dto.getDietaryPreference() != null ? dto.getDietaryPreference() : DietaryPreference.VEGETARIAN)
                .allergyAlerts(dto.getAllergyAlerts())
                .startDate(dto.getStartDate() != null ? dto.getStartDate() : LocalDate.now())
                .endDate(dto.getEndDate())
                .active(true)
                .build();
        plan = dietPlanRepository.save(plan);

        if (dto.getMealItems() != null) {
            for (DietPlanDto.DietMealItemDto itemDto : dto.getMealItems()) {
                DietMealItem item = DietMealItem.builder()
                        .dietPlan(plan)
                        .mealTime(itemDto.getMealTime())
                        .foodName(itemDto.getFoodName())
                        .quantity(itemDto.getQuantity())
                        .calories(itemDto.getCalories())
                        .proteinGrams(itemDto.getProteinGrams())
                        .carbsGrams(itemDto.getCarbsGrams())
                        .fatGrams(itemDto.getFatGrams())
                        .notes(itemDto.getNotes())
                        .build();
                dietMealItemRepository.save(item);
            }
        }

        return getDietPlanById(plan.getId());
    }

    @Transactional(readOnly = true)
    public List<DietPlanDto> getTemplates() {
        return dietPlanRepository.findByIsTemplateTrueAndActiveTrue().stream()
                .map(this::mapDietPlanToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DietPlanDto> getMemberDietPlans(Long memberId) {
        return dietPlanRepository.findByMemberIdAndActiveTrue(memberId).stream()
                .map(this::mapDietPlanToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DietPlanDto getDietPlanById(Long id) {
        DietPlan plan = dietPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Diet plan not found with ID: " + id));
        return mapDietPlanToDto(plan);
    }

    // --- DIET & WATER LOGS ---
    @Transactional
    public DietLogDto logDailyDietAndWater(DietLogDto dto) {
        User member = userRepository.findById(dto.getMemberId())
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        LocalDate date = dto.getLogDate() != null ? dto.getLogDate() : LocalDate.now();

        MemberDietLog log = memberDietLogRepository.findByMemberIdAndLogDate(member.getId(), date)
                .orElse(MemberDietLog.builder()
                        .member(member)
                        .logDate(date)
                        .waterIntakeLiters(BigDecimal.ZERO)
                        .mealsFollowed(0)
                        .build());

        if (dto.getWaterIntakeLiters() != null) {
            log.setWaterIntakeLiters(dto.getWaterIntakeLiters());
        }
        if (dto.getMealsFollowed() != null) {
            log.setMealsFollowed(dto.getMealsFollowed());
        }
        if (dto.getCaloriesConsumed() != null) {
            log.setCaloriesConsumed(dto.getCaloriesConsumed());
        }
        if (dto.getNotes() != null) {
            log.setNotes(dto.getNotes());
        }

        log = memberDietLogRepository.save(log);

        return DietLogDto.builder()
                .id(log.getId())
                .memberId(log.getMember().getId())
                .memberName(log.getMember().getFullName())
                .logDate(log.getLogDate())
                .waterIntakeLiters(log.getWaterIntakeLiters())
                .mealsFollowed(log.getMealsFollowed())
                .caloriesConsumed(log.getCaloriesConsumed())
                .notes(log.getNotes())
                .build();
    }

    @Transactional(readOnly = true)
    public List<DietLogDto> getMemberDietLogs(Long memberId) {
        return memberDietLogRepository.findByMemberIdOrderByLogDateDesc(memberId).stream()
                .map(log -> DietLogDto.builder()
                        .id(log.getId())
                        .memberId(log.getMember().getId())
                        .memberName(log.getMember().getFullName())
                        .logDate(log.getLogDate())
                        .waterIntakeLiters(log.getWaterIntakeLiters())
                        .mealsFollowed(log.getMealsFollowed())
                        .caloriesConsumed(log.getCaloriesConsumed())
                        .notes(log.getNotes())
                        .build())
                .collect(Collectors.toList());
    }

    private DietPlanDto mapDietPlanToDto(DietPlan p) {
        List<DietMealItem> items = dietMealItemRepository.findByDietPlanId(p.getId());
        List<DietPlanDto.DietMealItemDto> itemDtos = items.stream().map(i ->
                DietPlanDto.DietMealItemDto.builder()
                        .id(i.getId())
                        .mealTime(i.getMealTime())
                        .foodName(i.getFoodName())
                        .quantity(i.getQuantity())
                        .calories(i.getCalories())
                        .proteinGrams(i.getProteinGrams())
                        .carbsGrams(i.getCarbsGrams())
                        .fatGrams(i.getFatGrams())
                        .notes(i.getNotes())
                        .build()
        ).collect(Collectors.toList());

        return DietPlanDto.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .createdById(p.getCreatedBy().getId())
                .createdByName(p.getCreatedBy().getFullName())
                .memberId(p.getMember() != null ? p.getMember().getId() : null)
                .memberName(p.getMember() != null ? p.getMember().getFullName() : null)
                .isTemplate(p.getIsTemplate())
                .dailyCalories(p.getDailyCalories())
                .proteinGrams(p.getProteinGrams())
                .carbsGrams(p.getCarbsGrams())
                .fatGrams(p.getFatGrams())
                .dietaryPreference(p.getDietaryPreference())
                .allergyAlerts(p.getAllergyAlerts())
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .active(p.getActive())
                .mealItems(itemDtos)
                .build();
    }
}
