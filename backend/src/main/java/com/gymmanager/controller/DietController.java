package com.gymmanager.controller;

import com.gymmanager.dto.DietLogDto;
import com.gymmanager.dto.DietPlanDto;
import com.gymmanager.service.DietService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/diet")
@Tag(name = "Diet & Nutrition", description = "Endpoints for diet plans, meal recipes, macro targets, and water tracking")
public class DietController {

    private final DietService dietService;

    public DietController(DietService dietService) {
        this.dietService = dietService;
    }

    @PostMapping("/plans")
    @Operation(summary = "Create a diet plan or template")
    public ResponseEntity<DietPlanDto> createDietPlan(@Valid @RequestBody DietPlanDto dto) {
        return ResponseEntity.ok(dietService.createDietPlan(dto));
    }

    @GetMapping("/templates")
    @Operation(summary = "Get reusable diet plan templates")
    public ResponseEntity<List<DietPlanDto>> getTemplates() {
        return ResponseEntity.ok(dietService.getTemplates());
    }

    @GetMapping("/plans/member/{memberId}")
    @Operation(summary = "Get diet plans assigned to a member")
    public ResponseEntity<List<DietPlanDto>> getMemberDietPlans(@PathVariable Long memberId) {
        return ResponseEntity.ok(dietService.getMemberDietPlans(memberId));
    }

    @GetMapping("/plans/{id}")
    @Operation(summary = "Get diet plan details with meal items and macros")
    public ResponseEntity<DietPlanDto> getDietPlanById(@PathVariable Long id) {
        return ResponseEntity.ok(dietService.getDietPlanById(id));
    }

    @PostMapping("/logs")
    @Operation(summary = "Log daily meals followed and water intake (in Liters)")
    public ResponseEntity<DietLogDto> logDailyDietAndWater(@Valid @RequestBody DietLogDto dto) {
        return ResponseEntity.ok(dietService.logDailyDietAndWater(dto));
    }

    @GetMapping("/logs/member/{memberId}")
    @Operation(summary = "Get daily diet & water logs for a member")
    public ResponseEntity<List<DietLogDto>> getMemberDietLogs(@PathVariable Long memberId) {
        return ResponseEntity.ok(dietService.getMemberDietLogs(memberId));
    }
}
