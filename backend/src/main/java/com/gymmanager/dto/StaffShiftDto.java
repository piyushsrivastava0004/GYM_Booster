package com.gymmanager.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffShiftDto {
    private Long id;

    @NotNull(message = "Staff ID is required")
    private Long staffId;
    private String staffName;

    private Long branchId;
    private String branchName;

    @NotNull(message = "Day of week is required")
    private Integer dayOfWeek;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    private Boolean active;
}
