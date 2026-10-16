package com.gymmanager.dto;

import com.gymmanager.enums.NotificationChannel;
import com.gymmanager.enums.NotificationType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDto {
    private Long id;
    private Long recipientId;
    private String recipientName;
    private String title;
    private String message;
    private NotificationType type;
    private NotificationChannel channel;
    private Boolean isRead;
    private Boolean isSent;
    private LocalDateTime scheduledTime;
    private LocalDateTime sentTime;
    private LocalDateTime createdAt;
}
