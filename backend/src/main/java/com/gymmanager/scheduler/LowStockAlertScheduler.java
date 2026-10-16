package com.gymmanager.scheduler;

import com.gymmanager.entity.InventoryItem;
import com.gymmanager.entity.Notification;
import com.gymmanager.entity.User;
import com.gymmanager.enums.NotificationChannel;
import com.gymmanager.enums.NotificationType;
import com.gymmanager.enums.RoleType;
import com.gymmanager.repository.InventoryItemRepository;
import com.gymmanager.repository.NotificationRepository;
import com.gymmanager.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class LowStockAlertScheduler {

    private static final Logger log = LoggerFactory.getLogger(LowStockAlertScheduler.class);

    private final InventoryItemRepository inventoryItemRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public LowStockAlertScheduler(InventoryItemRepository inventoryItemRepository,
                                  UserRepository userRepository,
                                  NotificationRepository notificationRepository) {
        this.inventoryItemRepository = inventoryItemRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    // Runs every 4 hours
    @Scheduled(cron = "0 0 */4 * * *")
    public void scanLowStockItems() {
        log.info("Running low stock inventory scan...");
        List<InventoryItem> lowItems = inventoryItemRepository.findLowStockItems(null);

        if (!lowItems.isEmpty()) {
            List<User> managers = userRepository.findByRole(RoleType.ROLE_INVENTORY_MANAGER);
            if (managers.isEmpty()) {
                managers = userRepository.findByRole(RoleType.ROLE_ADMINISTRATOR);
            }

            for (InventoryItem item : lowItems) {
                for (User manager : managers) {
                    Notification alert = Notification.builder()
                            .recipient(manager)
                            .title("Low Stock Alert: " + item.getName())
                            .message("Item '" + item.getName() + "' (SKU: " + item.getSku() + ") stock is "
                                    + item.getQuantityInStock() + ", which is at or below reorder threshold of "
                                    + item.getReorderThreshold())
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
