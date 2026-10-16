package com.gymmanager;

import com.gymmanager.dto.FreezeSubscriptionRequest;
import com.gymmanager.dto.PurchasePlanRequest;
import com.gymmanager.dto.SubscriptionDto;
import com.gymmanager.entity.Branch;
import com.gymmanager.entity.MembershipPlan;
import com.gymmanager.entity.User;
import com.gymmanager.enums.PlanCategory;
import com.gymmanager.enums.PlanDurationType;
import com.gymmanager.enums.RoleType;
import com.gymmanager.enums.SubscriptionStatus;
import com.gymmanager.repository.*;
import com.gymmanager.service.MembershipService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class MembershipServiceTest {

    @Autowired
    private MembershipService membershipService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private MembershipPlanRepository planRepository;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    private User testMember;
    private MembershipPlan testPlan;
    private Branch testBranch;

    @BeforeEach
    void setUp() {
        testBranch = branchRepository.save(Branch.builder()
                .name("Test Branch")
                .code("TB-01")
                .build());

        testMember = userRepository.save(User.builder()
                .username("test_member_" + System.currentTimeMillis())
                .email("test" + System.currentTimeMillis() + "@gmail.com")
                .password("password123")
                .fullName("Test Member")
                .role(RoleType.ROLE_MEMBER)
                .branch(testBranch)
                .enabled(true)
                .build());

        testPlan = planRepository.save(MembershipPlan.builder()
                .name("Test Plan 30 Days")
                .code("TP-30-" + System.currentTimeMillis())
                .durationType(PlanDurationType.MONTHLY)
                .durationDays(30)
                .category(PlanCategory.GENERAL)
                .basePrice(new BigDecimal("2000.00"))
                .taxPercent(new BigDecimal("18.00"))
                .totalAmount(new BigDecimal("2360.00"))
                .maxFreezes(1)
                .maxFreezeDays(15)
                .active(true)
                .build());
    }

    @Test
    void testPurchaseSubscription_Success() {
        PurchasePlanRequest req = PurchasePlanRequest.builder()
                .memberId(testMember.getId())
                .planId(testPlan.getId())
                .branchId(testBranch.getId())
                .startDate(LocalDate.now())
                .paidAmount(new BigDecimal("2360.00"))
                .build();

        SubscriptionDto sub = membershipService.purchaseOrRenewSubscription(req);

        assertNotNull(sub);
        assertEquals(SubscriptionStatus.ACTIVE, sub.getStatus());
        assertEquals(0, sub.getOutstandingAmount().compareTo(BigDecimal.ZERO));
        assertEquals(LocalDate.now().plusDays(29), sub.getEndDate());
    }

    @Test
    void testFreezeAndUnfreezeSubscription() {
        PurchasePlanRequest req = PurchasePlanRequest.builder()
                .memberId(testMember.getId())
                .planId(testPlan.getId())
                .branchId(testBranch.getId())
                .startDate(LocalDate.now())
                .paidAmount(new BigDecimal("2360.00"))
                .build();

        SubscriptionDto sub = membershipService.purchaseOrRenewSubscription(req);

        // Freeze for 7 days
        FreezeSubscriptionRequest freezeReq = FreezeSubscriptionRequest.builder()
                .freezeStart(LocalDate.now().plusDays(1))
                .freezeEnd(LocalDate.now().plusDays(7))
                .reason("Medical rest")
                .build();

        SubscriptionDto frozen = membershipService.freezeSubscription(sub.getId(), freezeReq);
        assertEquals(SubscriptionStatus.FROZEN, frozen.getStatus());
        assertEquals(1, frozen.getFreezesUsed());

        // Unfreeze
        SubscriptionDto unfrozen = membershipService.unfreezeSubscription(sub.getId());
        assertEquals(SubscriptionStatus.ACTIVE, unfrozen.getStatus());
    }

    @Test
    void testCancelSubscription() {
        PurchasePlanRequest req = PurchasePlanRequest.builder()
                .memberId(testMember.getId())
                .planId(testPlan.getId())
                .branchId(testBranch.getId())
                .startDate(LocalDate.now())
                .paidAmount(new BigDecimal("2360.00"))
                .build();

        SubscriptionDto sub = membershipService.purchaseOrRenewSubscription(req);
        SubscriptionDto cancelled = membershipService.cancelSubscription(sub.getId(), "Relocating to another city");

        assertEquals(SubscriptionStatus.CANCELLED, cancelled.getStatus());
    }
}
