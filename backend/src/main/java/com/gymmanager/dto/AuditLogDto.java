package com.gymmanager.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogDto {
    private Long id;
    private Long userId;
    private String username;
    private String action;
    private String entityName;
    private Long entityId;
    private Long branchId;
    private String branchName;
    private String details;
    private String ipAddress;
    private LocalDateTime timestamp;
}
