package com.gymmanager.service;

import com.gymmanager.dto.NotificationDto;
import com.gymmanager.entity.Notification;
import com.gymmanager.entity.User;
import com.gymmanager.enums.NotificationChannel;
import com.gymmanager.enums.NotificationType;
import com.gymmanager.exception.ResourceNotFoundException;
import com.gymmanager.integration.EmailService;
import com.gymmanager.integration.SmsService;
import com.gymmanager.integration.WhatsAppService;
import com.gymmanager.repository.NotificationRepository;
import com.gymmanager.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final SmsService smsService;
    private final WhatsAppService whatsAppService;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository,
                               EmailService emailService,
                               SmsService smsService,
                               WhatsAppService whatsAppService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.smsService = smsService;
        this.whatsAppService = whatsAppService;
    }

    @Transactional
    public NotificationDto createAndDispatchNotification(Long recipientId,
                                                         String title,
                                                         String message,
                                                         NotificationType type,
                                                         NotificationChannel channel) {
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + recipientId));

        NotificationChannel effectiveChannel = channel != null ? channel : NotificationChannel.IN_APP;

        Notification notification = Notification.builder()
                .recipient(recipient)
                .title(title)
                .message(message)
                .type(type != null ? type : NotificationType.GENERAL)
                .channel(effectiveChannel)
                .isRead(false)
                .isSent(true)
                .sentTime(LocalDateTime.now())
                .build();

        // Dispatch via external channel adapters
        if (effectiveChannel == NotificationChannel.EMAIL && recipient.getEmail() != null) {
            emailService.sendEmail(recipient.getEmail(), title, message);
        } else if (effectiveChannel == NotificationChannel.SMS && recipient.getPhone() != null) {
            smsService.sendSms(recipient.getPhone(), message);
        } else if (effectiveChannel == NotificationChannel.WHATSAPP && recipient.getPhone() != null) {
            whatsAppService.sendWhatsAppMessage(recipient.getPhone(), "gym_notification", message);
        }

        notification = notificationRepository.save(notification);
        return mapToDto(notification);
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getUserNotifications(Long userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        n.setIsRead(true);
        notificationRepository.save(n);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(userId);
    }

    private NotificationDto mapToDto(Notification n) {
        return NotificationDto.builder()
                .id(n.getId())
                .recipientId(n.getRecipient().getId())
                .recipientName(n.getRecipient().getFullName())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .channel(n.getChannel())
                .isRead(n.getIsRead())
                .isSent(n.getIsSent())
                .scheduledTime(n.getScheduledTime())
                .sentTime(n.getSentTime())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
