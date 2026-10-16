package com.gymmanager.dto;

import com.gymmanager.enums.AttendanceStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceDto {
    private Long id;
    private Long memberId;
    private String memberName;
    private String memberCode;
    private Long branchId;
    private String branchName;
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;
    private AttendanceStatus status;
    private String verificationMethod;
    private String notes;
    private String overrideByName;
}
