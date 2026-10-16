package com.gymmanager.dto;

import com.gymmanager.enums.MemberStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberDto {
    private Long id;
    private Long userId;
    private String memberCode;
    private String fullName;
    private String email;
    private String phone;
    private Long branchId;
    private String branchName;
    private LocalDate dateOfBirth;
    private String gender;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String bloodGroup;
    private String address;
    private String fitnessGoals;
    private String medicalHistory;
    private Long assignedTrainerId;
    private String assignedTrainerName;
    private LocalDate joinDate;
    private MemberStatus status;
    private String qrCodeData;
    private String notes;
    private String activePlanName;
    private LocalDate membershipExpiryDate;
    private LocalDateTime createdAt;
}
