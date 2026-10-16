package com.gymmanager.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/health")
@Tag(name = "Health Check", description = "Liveness probe and uptime ping endpoint")
public class HealthController {

    @GetMapping
    @Operation(summary = "Check API health and status")
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("system", "FitPulse Gym Management System");
        status.put("version", "1.0.0");
        status.put("timestamp", Instant.now().toString());
        return ResponseEntity.ok(status);
    }
}
