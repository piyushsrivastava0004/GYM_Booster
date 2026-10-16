package com.gymmanager.controller;

import com.gymmanager.dto.FitnessGoalDto;
import com.gymmanager.dto.FitnessMeasurementDto;
import com.gymmanager.enums.GoalStatus;
import com.gymmanager.service.FitnessProgressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/fitness")
@Tag(name = "Fitness Progress & Goals", description = "Endpoints for measurements (weight, BMI, fat %, circumference) and goals")
public class FitnessProgressController {

    private final FitnessProgressService fitnessService;

    public FitnessProgressController(FitnessProgressService fitnessService) {
        this.fitnessService = fitnessService;
    }

    @PostMapping("/measurements")
    @Operation(summary = "Record fitness measurements (weight, height, BMI auto-calc, body circumferences)")
    public ResponseEntity<FitnessMeasurementDto> recordMeasurement(@Valid @RequestBody FitnessMeasurementDto dto) {
        return ResponseEntity.ok(fitnessService.recordMeasurement(dto));
    }

    @GetMapping("/measurements/member/{memberId}")
    @Operation(summary = "Get historical measurements for charts and trend comparisons")
    public ResponseEntity<List<FitnessMeasurementDto>> getMemberMeasurements(@PathVariable Long memberId) {
        return ResponseEntity.ok(fitnessService.getMemberMeasurements(memberId));
    }

    @PostMapping("/goals")
    @Operation(summary = "Create a fitness milestone/goal")
    public ResponseEntity<FitnessGoalDto> createGoal(@Valid @RequestBody FitnessGoalDto dto) {
        return ResponseEntity.ok(fitnessService.createGoal(dto));
    }

    @PatchMapping("/goals/{id}/status")
    @Operation(summary = "Update goal status (ACHIEVED, IN_PROGRESS, MISSED)")
    public ResponseEntity<FitnessGoalDto> updateGoalStatus(
            @PathVariable Long id,
            @RequestParam GoalStatus status,
            @RequestParam(required = false) BigDecimal currentValue
    ) {
        return ResponseEntity.ok(fitnessService.updateGoalStatus(id, status, currentValue));
    }

    @GetMapping("/goals/member/{memberId}")
    @Operation(summary = "Get all goals for a member")
    public ResponseEntity<List<FitnessGoalDto>> getMemberGoals(@PathVariable Long memberId) {
        return ResponseEntity.ok(fitnessService.getMemberGoals(memberId));
    }
}
