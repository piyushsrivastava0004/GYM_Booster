package com.gymmanager.dto;

import com.gymmanager.enums.RoleType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffDto {
    private Long id;
    private Long userId;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private RoleType role;
    private Long branchId;
    private String branchName;
    private String designation;
    private String department;
    private String qualification;
    private String specialties;
    private BigDecimal baseSalary;
    private BigDecimal commissionPercent;
    private LocalDate dateOfJoining;
    private String status;
}
