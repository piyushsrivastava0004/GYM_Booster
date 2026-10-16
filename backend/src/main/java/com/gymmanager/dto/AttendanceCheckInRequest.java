package com.gymmanager.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceCheckInRequest {
    private Long memberId;
    private String memberCode;
    private String qrCodeData;
    private Long branchId;
    private String verificationMethod; // "QR", "MANUAL", "CARD", "BIOMETRIC"
}
