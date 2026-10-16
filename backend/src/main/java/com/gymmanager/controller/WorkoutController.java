package com.gymmanager.controller;

import com.gymmanager.dto.ExerciseDto;
import com.gymmanager.dto.WorkoutLogDto;
import com.gymmanager.dto.WorkoutPlanDto;
import com.gymmanager.service.WorkoutService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@Tag(name = "Workouts & Exercises", description = "Endpoints for exercises library, workout plans, templates, and exercise logs")
public class WorkoutController {

    private final WorkoutService workoutService;

    public WorkoutController(WorkoutService workoutService) {
        this.workoutService = workoutService;
    }

    // --- EXERCISES ---
    @GetMapping("/exercises")
    @Operation(summary = "Get exercise library")
    public ResponseEntity<List<ExerciseDto>> getAllExercises() {
        return ResponseEntity.ok(workoutService.getAllExercises());
    }

    @PostMapping("/exercises")
    @Operation(summary = "Add an exercise to library")
    public ResponseEntity<ExerciseDto> createExercise(@Valid @RequestBody ExerciseDto dto) {
        return ResponseEntity.ok(workoutService.createExercise(dto));
    }

    // --- WORKOUT PLANS ---
    @PostMapping("/workouts/plans")
    @Operation(summary = "Create a workout plan or template")
    public ResponseEntity<WorkoutPlanDto> createWorkoutPlan(@Valid @RequestBody WorkoutPlanDto dto) {
        return ResponseEntity.ok(workoutService.createWorkoutPlan(dto));
    }

    @GetMapping("/workouts/templates")
    @Operation(summary = "Get reusable workout templates")
    public ResponseEntity<List<WorkoutPlanDto>> getTemplates() {
        return ResponseEntity.ok(workoutService.getTemplates());
    }

    @GetMapping("/workouts/plans/member/{memberId}")
    @Operation(summary = "Get workout plans assigned to a member")
    public ResponseEntity<List<WorkoutPlanDto>> getMemberPlans(@PathVariable Long memberId) {
        return ResponseEntity.ok(workoutService.getMemberWorkoutPlans(memberId));
    }

    @GetMapping("/workouts/plans/{id}")
    @Operation(summary = "Get workout plan details with days and exercises")
    public ResponseEntity<WorkoutPlanDto> getWorkoutPlanById(@PathVariable Long id) {
        return ResponseEntity.ok(workoutService.getWorkoutPlanById(id));
    }

    // --- WORKOUT LOGS ---
    @PostMapping("/workouts/logs")
    @Operation(summary = "Log a completed exercise session")
    public ResponseEntity<WorkoutLogDto> logWorkout(@Valid @RequestBody WorkoutLogDto dto) {
        return ResponseEntity.ok(workoutService.logWorkout(dto));
    }

    @GetMapping("/workouts/logs/member/{memberId}")
    @Operation(summary = "Get exercise logs for a member")
    public ResponseEntity<List<WorkoutLogDto>> getMemberWorkoutLogs(@PathVariable Long memberId) {
        return ResponseEntity.ok(workoutService.getMemberWorkoutLogs(memberId));
    }
}
