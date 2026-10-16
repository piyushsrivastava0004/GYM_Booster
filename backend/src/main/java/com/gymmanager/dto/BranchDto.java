package com.gymmanager.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BranchDto {
    private Long id;

    @NotBlank(message = "Branch name is required")
    private String name;

    @NotBlank(message = "Branch code is required")
    private String code;

    private String address;
    private String city;
    private String state;
    private String pincode;
    private String phone;
    private String email;
    private String taxNumber;
    private String currency;
    private String timezone;
    private Boolean active;
    private LocalDateTime createdAt;
}
