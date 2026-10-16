package com.gymmanager.controller;

import com.gymmanager.dto.AuditLogDto;
import com.gymmanager.service.SettingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping
@Tag(name = "Settings & Audit Logs", description = "Endpoints for gym branding, operational policies, GST rates, and security audit logs")
public class SettingController {

    private final SettingService settingService;

    public SettingController(SettingService settingService) {
        this.settingService = settingService;
    }

    @GetMapping("/settings/public")
    @Operation(summary = "Get gym branding and operational settings (public endpoint)")
    public ResponseEntity<Map<String, String>> getPublicSettings(@RequestParam(required = false) Long branchId) {
        return ResponseEntity.ok(settingService.getSettingsMap(branchId));
    }

    @PostMapping("/settings")
    @Operation(summary = "Save or update a gym configuration setting")
    public ResponseEntity<Void> saveSetting(
            @RequestParam String key,
            @RequestParam String value,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String description
    ) {
        settingService.saveSetting(key, value, branchId, description);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/admin/audit-logs")
    @Operation(summary = "Get system audit logs with filters")
    public ResponseEntity<Page<AuditLogDto>> getAuditLogs(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(settingService.getAuditLogs(branchId, userId, start, end, PageRequest.of(page, size)));
    }
}
