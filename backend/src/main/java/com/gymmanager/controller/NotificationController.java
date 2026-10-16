package com.gymmanager.controller;

import com.gymmanager.dto.NotificationDto;
import com.gymmanager.enums.NotificationChannel;
import com.gymmanager.enums.NotificationType;
import com.gymmanager.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@Tag(name = "Notifications", description = "Endpoints for notification center, alerts, and dispatching announcements")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get user notifications")
    public ResponseEntity<List<NotificationDto>> getUserNotifications(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getUserNotifications(userId));
    }

    @GetMapping("/user/{userId}/unread-count")
    @Operation(summary = "Get unread notification count")
    public ResponseEntity<Long> getUnreadCount(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getUnreadCount(userId));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark a notification as read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/dispatch")
    @Operation(summary = "Create and dispatch an alert or announcement")
    public ResponseEntity<NotificationDto> dispatchNotification(
            @RequestParam Long recipientId,
            @RequestParam String title,
            @RequestParam String message,
            @RequestParam(required = false) NotificationType type,
            @RequestParam(required = false) NotificationChannel channel
    ) {
        return ResponseEntity.ok(notificationService.createAndDispatchNotification(recipientId, title, message, type, channel));
    }
}
