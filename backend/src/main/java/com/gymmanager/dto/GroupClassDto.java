package com.gymmanager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupClassDto {
    private Long id;
    private Long branchId;
    private String branchName;

    @NotNull(message = "Trainer ID is required")
    private Long trainerId;
    private String trainerName;

    @NotBlank(message = "Class name is required")
    private String name;

    private String description;
    private String roomName;

    @NotNull(message = "Capacity is required")
    private Integer capacity;

    private Long bookedCount;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    @NotNull(message = "Day of week is required")
    private Integer dayOfWeek;

    private Boolean recurring;
    private Boolean active;
}
