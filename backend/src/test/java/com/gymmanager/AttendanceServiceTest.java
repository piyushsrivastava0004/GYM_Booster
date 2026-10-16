package com.gymmanager;

import com.gymmanager.dto.AttendanceCheckInRequest;
import com.gymmanager.dto.AttendanceDto;
import com.gymmanager.dto.AttendanceOverrideRequest;
import com.gymmanager.entity.Branch;
import com.gymmanager.entity.MemberProfile;
import com.gymmanager.entity.MembershipPlan;
import com.gymmanager.entity.Subscription;
import com.gymmanager.entity.User;
import com.gymmanager.enums.*;
import com.gymmanager.exception.BadRequestException;
import com.gymmanager.repository.*;
import com.gymmanager.service.AttendanceService;
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
public class AttendanceServiceTest {

    @Autowired
    private AttendanceService attendanceService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private MemberProfileRepository memberProfileRepository;

    @Autowired
    private MembershipPlanRepository planRepository;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    private User testUser;
    private MemberProfile testProfile;
    private Branch testBranch;
    private MembershipPlan testPlan;

    @BeforeEach
    void setUp() {
        testBranch = branchRepository.save(Branch.builder().name("Test Branch").code("TB-" + System.currentTimeMillis()).build());
        testUser = userRepository.save(User.builder()
                .username("member_att_" + System.currentTimeMillis())
                .email("att" + System.currentTimeMillis() + "@fitpulse.in")
                .password("pass")
                .fullName("Attendance Tester")
                .role(RoleType.ROLE_MEMBER)
                .branch(testBranch)
                .enabled(true)
                .build());

        testProfile = memberProfileRepository.save(MemberProfile.builder()
                .user(testUser)
                .memberCode("MEM-ATT-" + System.currentTimeMillis())
                .joinDate(LocalDate.now())
                .status(MemberStatus.ACTIVE)
                .qrCodeData("FITPULSE:QR:ATT-" + System.currentTimeMillis())
                .build());

        testPlan = planRepository.save(MembershipPlan.builder()
                .name("Plan 30")
                .code("P30-" + System.currentTimeMillis())
                .durationType(PlanDurationType.MONTHLY)
                .durationDays(30)
                .category(PlanCategory.GENERAL)
                .basePrice(new BigDecimal("1000.00"))
                .taxPercent(new BigDecimal("18.00"))
                .totalAmount(new BigDecimal("1180.00"))
                .active(true)
                .build());
    }

    @Test
    void testCheckIn_WithActiveSubscription_Success() {
        // Create active subscription
        subscriptionRepository.save(Subscription.builder()
                .member(testUser)
                .plan(testPlan)
                .branch(testBranch)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(30))
                .originalEndDate(LocalDate.now().plusDays(30))
                .status(SubscriptionStatus.ACTIVE)
                .totalAmount(new BigDecimal("1180.00"))
                .paidAmount(new BigDecimal("1180.00"))
                .build());

        AttendanceCheckInRequest req = AttendanceCheckInRequest.builder()
                .memberId(testUser.getId())
                .branchId(testBranch.getId())
                .build();

        AttendanceDto att = attendanceService.checkIn(req);
        assertNotNull(att);
        assertEquals(AttendanceStatus.CHECKED_IN, att.getStatus());

        // Attempt duplicate active check-in -> should throw BadRequestException
        assertThrows(BadRequestException.class, () -> attendanceService.checkIn(req));

        // Now Check-out
        AttendanceDto out = attendanceService.checkOut(testUser.getId());
        assertEquals(AttendanceStatus.CHECKED_OUT, out.getStatus());
        assertNotNull(out.getCheckOutTime());
    }

    @Test
    void testCheckIn_WithoutSubscription_Fails() {
        AttendanceCheckInRequest req = AttendanceCheckInRequest.builder()
                .memberId(testUser.getId())
                .branchId(testBranch.getId())
                .build();

        assertThrows(BadRequestException.class, () -> attendanceService.checkIn(req));
    }

    @Test
    void testCheckIn_FrozenMembership_Fails() {
        testProfile.setStatus(MemberStatus.FROZEN);
        memberProfileRepository.save(testProfile);

        AttendanceCheckInRequest req = AttendanceCheckInRequest.builder()
                .memberId(testUser.getId())
                .branchId(testBranch.getId())
                .build();

        assertThrows(BadRequestException.class, () -> attendanceService.checkIn(req));
    }

    @Test
    void testManualOverride() {
        AttendanceOverrideRequest req = AttendanceOverrideRequest.builder()
                .memberId(testUser.getId())
                .branchId(testBranch.getId())
                .reason("Member forgot card/phone, receptionist verified identity in person")
                .build();

        AttendanceDto att = attendanceService.recordManualOverride(req);
        assertNotNull(att);
        assertEquals(AttendanceStatus.MANUAL_OVERRIDE, att.getStatus());
    }
}
