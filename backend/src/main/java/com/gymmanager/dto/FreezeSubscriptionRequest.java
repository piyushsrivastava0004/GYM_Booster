package com.gymmanager.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FreezeSubscriptionRequest {
    @NotNull(message = "Freeze start date is required")
    private LocalDate freezeStart;

    @NotNull(message = "Freeze end date is required")
    private LocalDate freezeEnd;

    private String reason;
}
