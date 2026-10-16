package com.gymmanager.dto;

import com.gymmanager.enums.AppointmentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainerAppointmentDto {
    private Long id;

    @NotNull(message = "Trainer ID is required")
    private Long trainerId;
    private String trainerName;

    @NotNull(message = "Member ID is required")
    private Long memberId;
    private String memberName;

    private Long branchId;
    private String branchName;

    @NotNull(message = "Appointment date is required")
    private LocalDate appointmentDate;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    private AppointmentStatus status;
    private String sessionNotes;
}
