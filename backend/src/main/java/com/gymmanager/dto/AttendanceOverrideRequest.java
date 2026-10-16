package com.gymmanager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceOverrideRequest {
    @NotNull(message = "Member ID is required")
    private Long memberId;

    private Long branchId;

    @NotBlank(message = "Override reason is required")
    private String reason;
}
