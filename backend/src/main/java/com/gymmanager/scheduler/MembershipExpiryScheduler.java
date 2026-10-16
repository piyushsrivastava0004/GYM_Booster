package com.gymmanager.scheduler;

import com.gymmanager.entity.MemberProfile;
import com.gymmanager.entity.Notification;
import com.gymmanager.entity.Subscription;
import com.gymmanager.enums.MemberStatus;
import com.gymmanager.enums.NotificationChannel;
import com.gymmanager.enums.NotificationType;
import com.gymmanager.enums.SubscriptionStatus;
import com.gymmanager.repository.MemberProfileRepository;
import com.gymmanager.repository.NotificationRepository;
import com.gymmanager.repository.SubscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class MembershipExpiryScheduler {

    private static final Logger log = LoggerFactory.getLogger(MembershipExpiryScheduler.class);

    private final SubscriptionRepository subscriptionRepository;
    private final MemberProfileRepository memberProfileRepository;
    private final NotificationRepository notificationRepository;

    public MembershipExpiryScheduler(SubscriptionRepository subscriptionRepository,
                                      MemberProfileRepository memberProfileRepository,
                                      NotificationRepository notificationRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.memberProfileRepository = memberProfileRepository;
        this.notificationRepository = notificationRepository;
    }

    // Runs every day at 00:01 AM
    @Scheduled(cron = "0 1 0 * * *")
    @Transactional
    public void processMembershipExpirations() {
        log.info("Starting automated membership expiry processing...");
        LocalDate today = LocalDate.now();

        // 1. Mark expired subscriptions
        List<Subscription> overdueSubscriptions = subscriptionRepository.findOverdueSubscriptionsForExpiry(today);
        for (Subscription sub : overdueSubscriptions) {
            sub.setStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(sub);

            // Update member profile status if no other active subscription exists
            memberProfileRepository.findByUserId(sub.getMember().getId()).ifPresent(profile -> {
                profile.setStatus(MemberStatus.EXPIRED);
                memberProfileRepository.save(profile);
            });

            // Send expiry notification
            Notification notification = Notification.builder()
                    .recipient(sub.getMember())
                    .title("Membership Expired")
                    .message("Your " + sub.getPlan().getName() + " subscription has expired. Please renew to continue your fitness journey.")
                    .type(NotificationType.EXPIRY_ALERT)
                    .channel(NotificationChannel.IN_APP)
                    .isRead(false)
                    .isSent(true)
                    .sentTime(LocalDateTime.now())
                    .build();
            notificationRepository.save(notification);
        }

        // 2. Alert memberships expiring within 3 days
        List<Subscription> expiringSoon = subscriptionRepository.findExpiringSubscriptions(null, today, today.plusDays(3));
        for (Subscription sub : expiringSoon) {
            Notification alert = Notification.builder()
                    .recipient(sub.getMember())
                    .title("Membership Expiring Soon")
                    .message("Your " + sub.getPlan().getName() + " membership expires on " + sub.getEndDate() + ". Renew today to avoid interruption!")
                    .type(NotificationType.EXPIRY_ALERT)
                    .channel(NotificationChannel.IN_APP)
                    .isRead(false)
                    .isSent(true)
                    .sentTime(LocalDateTime.now())
                    .build();
            notificationRepository.save(alert);
        }

        log.info("Completed automated membership expiry processing. Expired count: {}, Upcoming alert count: {}",
                overdueSubscriptions.size(), expiringSoon.size());
    }
}
