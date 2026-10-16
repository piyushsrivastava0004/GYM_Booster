package com.gymmanager.dto;

import com.gymmanager.enums.ClassBookingStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassBookingDto {
    private Long id;

    @NotNull(message = "Group class ID is required")
    private Long groupClassId;
    private String className;
    private String trainerName;
    private String roomName;
    private LocalTime startTime;
    private LocalTime endTime;

    @NotNull(message = "Member ID is required")
    private Long memberId;
    private String memberName;

    private LocalDate bookingDate;

    @NotNull(message = "Class date is required")
    private LocalDate classDate;

    private ClassBookingStatus status;
    private Integer waitlistPosition;
}
