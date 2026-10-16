package com.gymmanager.dto;

import com.gymmanager.enums.MemberStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberRegistrationDto {
    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Phone is required")
    private String phone;

    private String username;
    private String password;
    private Long branchId;
    private LocalDate dateOfBirth;
    private String gender;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String bloodGroup;
    private String address;
    private String fitnessGoals;
    private String medicalHistory;
    private Long assignedTrainerId;
    private LocalDate joinDate;
    private Long initialPlanId;
    private String notes;
}
