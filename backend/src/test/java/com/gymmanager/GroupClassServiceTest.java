package com.gymmanager;

import com.gymmanager.dto.ClassBookingDto;
import com.gymmanager.dto.GroupClassDto;
import com.gymmanager.dto.TrainerAppointmentDto;
import com.gymmanager.entity.Branch;
import com.gymmanager.entity.GroupClass;
import com.gymmanager.entity.User;
import com.gymmanager.enums.ClassBookingStatus;
import com.gymmanager.enums.RoleType;
import com.gymmanager.exception.BadRequestException;
import com.gymmanager.repository.BranchRepository;
import com.gymmanager.repository.GroupClassRepository;
import com.gymmanager.repository.UserRepository;
import com.gymmanager.service.GroupClassService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class GroupClassServiceTest {

    @Autowired
    private GroupClassService groupClassService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private GroupClassRepository groupClassRepository;

    private User trainer;
    private User m1;
    private User m2;
    private User m3;
    private GroupClass testClass;

    @BeforeEach
    void setUp() {
        Branch branch = branchRepository.save(Branch.builder().name("B").code("B-" + System.currentTimeMillis()).build());
        trainer = userRepository.save(User.builder().username("tr_" + System.currentTimeMillis()).email("tr" + System.currentTimeMillis() + "@fitpulse.in").password("p").fullName("Trainer").role(RoleType.ROLE_TRAINER).branch(branch).enabled(true).build());
        m1 = userRepository.save(User.builder().username("m1_" + System.currentTimeMillis()).email("m1" + System.currentTimeMillis() + "@fitpulse.in").password("p").fullName("Member 1").role(RoleType.ROLE_MEMBER).branch(branch).enabled(true).build());
        m2 = userRepository.save(User.builder().username("m2_" + System.currentTimeMillis()).email("m2" + System.currentTimeMillis() + "@fitpulse.in").password("p").fullName("Member 2").role(RoleType.ROLE_MEMBER).branch(branch).enabled(true).build());
        m3 = userRepository.save(User.builder().username("m3_" + System.currentTimeMillis()).email("m3" + System.currentTimeMillis() + "@fitpulse.in").password("p").fullName("Member 3").role(RoleType.ROLE_MEMBER).branch(branch).enabled(true).build());

        // Class with small capacity of 2
        testClass = groupClassRepository.save(GroupClass.builder()
                .branch(branch)
                .trainer(trainer)
                .name("Small Capacity Yoga")
                .roomName("Studio A")
                .capacity(2)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(11, 0))
                .dayOfWeek(1)
                .active(true)
                .build());
    }

    @Test
    void testClassCapacityAndWaitlist() {
        LocalDate date = LocalDate.now();

        // 1st member books -> CONFIRMED
        ClassBookingDto b1 = groupClassService.bookClass(testClass.getId(), m1.getId(), date);
        assertEquals(ClassBookingStatus.CONFIRMED, b1.getStatus());

        // 2nd member books -> CONFIRMED (capacity reached: 2/2)
        ClassBookingDto b2 = groupClassService.bookClass(testClass.getId(), m2.getId(), date);
        assertEquals(ClassBookingStatus.CONFIRMED, b2.getStatus());

        // 3rd member books -> WAITLISTED (position 1)
        ClassBookingDto b3 = groupClassService.bookClass(testClass.getId(), m3.getId(), date);
        assertEquals(ClassBookingStatus.WAITLISTED, b3.getStatus());
        assertEquals(1, b3.getWaitlistPosition());

        // 1st member cancels -> 3rd member automatically promoted to CONFIRMED
        groupClassService.cancelBooking(b1.getId());
        List<ClassBookingDto> m3Bookings = groupClassService.getMemberBookings(m3.getId());
        assertEquals(ClassBookingStatus.CONFIRMED, m3Bookings.get(0).getStatus());
    }

    @Test
    void testDoubleBookingPrevention() {
        LocalDate date = LocalDate.now().plusDays(2);

        TrainerAppointmentDto appt1 = TrainerAppointmentDto.builder()
                .trainerId(trainer.getId())
                .memberId(m1.getId())
                .appointmentDate(date)
                .startTime(LocalTime.of(14, 0))
                .endTime(LocalTime.of(15, 0))
                .build();
        groupClassService.scheduleAppointment(appt1);

        // Overlapping appointment: 14:30 - 15:30 with same trainer -> should fail
        TrainerAppointmentDto conflicting = TrainerAppointmentDto.builder()
                .trainerId(trainer.getId())
                .memberId(m2.getId())
                .appointmentDate(date)
                .startTime(LocalTime.of(14, 30))
                .endTime(LocalTime.of(15, 30))
                .build();

        assertThrows(BadRequestException.class, () -> groupClassService.scheduleAppointment(conflicting));
    }
}
