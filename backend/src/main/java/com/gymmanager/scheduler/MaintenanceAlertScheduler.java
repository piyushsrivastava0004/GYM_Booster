package com.gymmanager.scheduler;

import com.gymmanager.entity.Equipment;
import com.gymmanager.entity.Notification;
import com.gymmanager.entity.User;
import com.gymmanager.enums.NotificationChannel;
import com.gymmanager.enums.NotificationType;
import com.gymmanager.enums.RoleType;
import com.gymmanager.repository.EquipmentRepository;
import com.gymmanager.repository.NotificationRepository;
import com.gymmanager.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class MaintenanceAlertScheduler {

    private static final Logger log = LoggerFactory.getLogger(MaintenanceAlertScheduler.class);

    private final EquipmentRepository equipmentRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public MaintenanceAlertScheduler(EquipmentRepository equipmentRepository,
                                     UserRepository userRepository,
                                     NotificationRepository notificationRepository) {
        this.equipmentRepository = equipmentRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    // Runs every day at 07:00 AM
    @Scheduled(cron = "0 0 7 * * *")
    public void checkEquipmentMaintenance() {
        log.info("Checking equipment maintenance schedules...");
        LocalDate warningDate = LocalDate.now().plusDays(7);
        List<Equipment> dueList = equipmentRepository.findEquipmentDueForMaintenance(null, warningDate);

        if (!dueList.isEmpty()) {
            List<User> managers = userRepository.findByRole(RoleType.ROLE_INVENTORY_MANAGER);
            if (managers.isEmpty()) {
                managers = userRepository.findByRole(RoleType.ROLE_ADMINISTRATOR);
            }

            for (Equipment eq : dueList) {
                for (User manager : managers) {
                    Notification alert = Notification.builder()
                            .recipient(manager)
                            .title("Equipment Maintenance Due")
                            .message("Equipment '" + eq.getName() + "' (S/N: " + eq.getSerialNumber() + ") is scheduled for maintenance on " + eq.getNextMaintenanceDate())
                            .type(NotificationType.LOW_STOCK_ALERT)
                            .channel(NotificationChannel.IN_APP)
                            .isRead(false)
                            .isSent(true)
                            .sentTime(LocalDateTime.now())
                            .build();
                    notificationRepository.save(alert);
                }
            }
        }
    }
}
