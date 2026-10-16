package com.gymmanager.service;

import com.gymmanager.dto.AuditLogDto;
import com.gymmanager.dto.GymSettingDto;
import com.gymmanager.entity.AuditLog;
import com.gymmanager.entity.Branch;
import com.gymmanager.entity.GymSetting;
import com.gymmanager.repository.AuditLogRepository;
import com.gymmanager.repository.BranchRepository;
import com.gymmanager.repository.GymSettingRepository;
import com.gymmanager.util.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SettingService {

    private final GymSettingRepository settingRepository;
    private final AuditLogRepository auditLogRepository;
    private final BranchRepository branchRepository;
    private final SecurityUtils securityUtils;

    public SettingService(GymSettingRepository settingRepository,
                          AuditLogRepository auditLogRepository,
                          BranchRepository branchRepository,
                          SecurityUtils securityUtils) {
        this.settingRepository = settingRepository;
        this.auditLogRepository = auditLogRepository;
        this.branchRepository = branchRepository;
        this.securityUtils = securityUtils;
    }

    @Transactional(readOnly = true)
    public Map<String, String> getSettingsMap(Long branchId) {
        List<GymSetting> list = settingRepository.findByBranchIdOrBranchIsNull(branchId);
        Map<String, String> map = new HashMap<>();

        // Defaults for India
        map.put("gym_name", "FitPulse Gym & Fitness Studio");
        map.put("tagline", "Transform Your Life, Elevate Your Fitness");
        map.put("currency", "INR");
        map.put("currency_symbol", "₹");
        map.put("gst_rate", "18.00");
        map.put("invoice_prefix", "INV-2026-");
        map.put("business_hours", "06:00 AM - 10:00 PM");
        map.put("support_email", "support@fitpulse.in");
        map.put("support_phone", "+91 98765 43210");
        map.put("grace_period_days", "3");

        for (GymSetting s : list) {
            map.put(s.getSettingKey(), s.getSettingValue());
        }

        return map;
    }

    @Transactional
    public void saveSetting(String key, String value, Long branchId, String description) {
        Branch branch = null;
        if (branchId != null) {
            branch = branchRepository.findById(branchId).orElse(null);
        }

        GymSetting setting = branchId != null
                ? settingRepository.findByBranchIdAndSettingKey(branchId, key).orElse(null)
                : settingRepository.findByBranchIsNullAndSettingKey(key).orElse(null);

        if (setting == null) {
            setting = GymSetting.builder()
                    .branch(branch)
                    .settingKey(key)
                    .settingValue(value)
                    .description(description)
                    .build();
        } else {
            setting.setSettingValue(value);
            if (description != null) setting.setDescription(description);
        }

        settingRepository.save(setting);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogDto> getAuditLogs(Long branchId, Long userId, LocalDateTime start, LocalDateTime end, Pageable pageable) {
        LocalDateTime s = start != null ? start : LocalDateTime.now().minusDays(30);
        LocalDateTime e = end != null ? end : LocalDateTime.now();
        return auditLogRepository.findAuditLogsWithFilter(branchId, userId, s, e, pageable)
                .map(a -> AuditLogDto.builder()
                        .id(a.getId())
                        .userId(a.getUser() != null ? a.getUser().getId() : null)
                        .username(a.getUser() != null ? a.getUser().getUsername() : "SYSTEM")
                        .action(a.getAction())
                        .entityName(a.getEntityName())
                        .entityId(a.getEntityId())
                        .branchId(a.getBranch() != null ? a.getBranch().getId() : null)
                        .branchName(a.getBranch() != null ? a.getBranch().getName() : "All")
                        .details(a.getDetails())
                        .ipAddress(a.getIpAddress())
                        .timestamp(a.getTimestamp())
                        .build());
    }
}
