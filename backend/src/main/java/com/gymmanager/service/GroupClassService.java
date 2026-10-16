package com.gymmanager.service;

import com.gymmanager.dto.ClassBookingDto;
import com.gymmanager.dto.GroupClassDto;
import com.gymmanager.dto.TrainerAppointmentDto;
import com.gymmanager.entity.*;
import com.gymmanager.enums.AppointmentStatus;
import com.gymmanager.enums.ClassBookingStatus;
import com.gymmanager.exception.BadRequestException;
import com.gymmanager.exception.ResourceNotFoundException;
import com.gymmanager.repository.*;
import com.gymmanager.util.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class GroupClassService {

    private final GroupClassRepository groupClassRepository;
    private final ClassBookingRepository classBookingRepository;
    private final TrainerAppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final SecurityUtils securityUtils;

    public GroupClassService(GroupClassRepository groupClassRepository,
                             ClassBookingRepository classBookingRepository,
                             TrainerAppointmentRepository appointmentRepository,
                             UserRepository userRepository,
                             BranchRepository branchRepository,
                             SecurityUtils securityUtils) {
        this.groupClassRepository = groupClassRepository;
        this.classBookingRepository = classBookingRepository;
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
        this.securityUtils = securityUtils;
    }

    // --- GROUP CLASSES ---
    @Transactional
    public GroupClassDto createClass(GroupClassDto dto) {
        User trainer = userRepository.findById(dto.getTrainerId())
                .orElseThrow(() -> new ResourceNotFoundException("Trainer not found with ID: " + dto.getTrainerId()));

        Branch branch = trainer.getBranch();
        if (dto.getBranchId() != null) {
            branch = branchRepository.findById(dto.getBranchId()).orElse(branch);
        }

        GroupClass groupClass = GroupClass.builder()
                .trainer(trainer)
                .branch(branch)
                .name(dto.getName())
                .description(dto.getDescription())
                .roomName(dto.getRoomName() != null ? dto.getRoomName() : "Studio A")
                .capacity(dto.getCapacity())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .dayOfWeek(dto.getDayOfWeek())
                .recurring(dto.getRecurring() != null ? dto.getRecurring() : true)
                .active(true)
                .build();
        groupClass = groupClassRepository.save(groupClass);

        return mapClassToDto(groupClass, LocalDate.now());
    }

    @Transactional(readOnly = true)
    public List<GroupClassDto> getClasses(Long branchId, LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        Long effectiveBranchId = securityUtils.isGymOwnerOrAdmin() ? branchId : securityUtils.getCurrentBranchId();

        List<GroupClass> classes = effectiveBranchId != null
                ? groupClassRepository.findByBranchIdAndActiveTrue(effectiveBranchId)
                : groupClassRepository.findByActiveTrue();

        return classes.stream()
                .map(c -> mapClassToDto(c, targetDate))
                .collect(Collectors.toList());
    }

    // --- CLASS BOOKING WITH CONCURRENCY-SAFE CAPACITY CHECKING ---
    @Transactional
    public ClassBookingDto bookClass(Long classId, Long memberId, LocalDate classDate) {
        GroupClass groupClass = groupClassRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found with ID: " + classId));

        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found with ID: " + memberId));

        LocalDate date = classDate != null ? classDate : LocalDate.now();

        // Check for existing booking
        Optional<ClassBooking> existing = classBookingRepository.findByGroupClassIdAndMemberIdAndClassDate(classId, memberId, date);
        if (existing.isPresent() && existing.get().getStatus() == ClassBookingStatus.CONFIRMED) {
            throw new BadRequestException("Member is already booked for this class on " + date);
        }

        long confirmedCount = classBookingRepository.countConfirmedBookings(classId, date);

        ClassBooking booking;
        if (confirmedCount < groupClass.getCapacity()) {
            booking = ClassBooking.builder()
                    .groupClass(groupClass)
                    .member(member)
                    .bookingDate(LocalDate.now())
                    .classDate(date)
                    .status(ClassBookingStatus.CONFIRMED)
                    .waitlistPosition(null)
                    .build();
        } else {
            // Capacity reached: add to waitlist
            int nextWaitlist = classBookingRepository.getMaxWaitlistPosition(classId, date) + 1;
            booking = ClassBooking.builder()
                    .groupClass(groupClass)
                    .member(member)
                    .bookingDate(LocalDate.now())
                    .classDate(date)
                    .status(ClassBookingStatus.WAITLISTED)
                    .waitlistPosition(nextWaitlist)
                    .build();
        }

        booking = classBookingRepository.save(booking);
        return mapBookingToDto(booking);
    }

    @Transactional
    public ClassBookingDto cancelBooking(Long bookingId) {
        ClassBooking booking = classBookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + bookingId));

        booking.setStatus(ClassBookingStatus.CANCELLED);
        booking = classBookingRepository.save(booking);

        // Promote first waitlisted member if available
        List<ClassBooking> waitlisted = classBookingRepository.findByGroupClassIdAndClassDate(booking.getGroupClass().getId(), booking.getClassDate()).stream()
                .filter(b -> b.getStatus() == ClassBookingStatus.WAITLISTED)
                .sorted((b1, b2) -> Integer.compare(b1.getWaitlistPosition(), b2.getWaitlistPosition()))
                .collect(Collectors.toList());

        if (!waitlisted.isEmpty()) {
            ClassBooking firstWaitlist = waitlisted.get(0);
            firstWaitlist.setStatus(ClassBookingStatus.CONFIRMED);
            firstWaitlist.setWaitlistPosition(null);
            classBookingRepository.save(firstWaitlist);
        }

        return mapBookingToDto(booking);
    }

    @Transactional(readOnly = true)
    public List<ClassBookingDto> getMemberBookings(Long memberId) {
        return classBookingRepository.findByMemberIdOrderByClassDateDesc(memberId).stream()
                .map(this::mapBookingToDto)
                .collect(Collectors.toList());
    }

    // --- TRAINER 1-ON-1 APPOINTMENTS WITH DOUBLE-BOOKING PREVENTION ---
    @Transactional
    public TrainerAppointmentDto scheduleAppointment(TrainerAppointmentDto dto) {
        User trainer = userRepository.findById(dto.getTrainerId())
                .orElseThrow(() -> new ResourceNotFoundException("Trainer not found with ID: " + dto.getTrainerId()));
        User member = userRepository.findById(dto.getMemberId())
                .orElseThrow(() -> new ResourceNotFoundException("Member not found with ID: " + dto.getMemberId()));

        Branch branch = trainer.getBranch();
        if (dto.getBranchId() != null) {
            branch = branchRepository.findById(dto.getBranchId()).orElse(branch);
        }

        // Prevent double booking / conflicting appointments
        List<TrainerAppointment> conflicts = appointmentRepository.findConflictingAppointments(
                trainer.getId(),
                dto.getAppointmentDate(),
                dto.getStartTime(),
                dto.getEndTime(),
                dto.getId()
        );

        if (!conflicts.isEmpty()) {
            throw new BadRequestException("Trainer is already booked during this time window (" + dto.getStartTime() + " - " + dto.getEndTime() + ")");
        }

        TrainerAppointment appointment = TrainerAppointment.builder()
                .trainer(trainer)
                .member(member)
                .branch(branch)
                .appointmentDate(dto.getAppointmentDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .status(AppointmentStatus.SCHEDULED)
                .sessionNotes(dto.getSessionNotes())
                .build();
        appointment = appointmentRepository.save(appointment);

        return mapAppointmentToDto(appointment);
    }

    @Transactional(readOnly = true)
    public List<TrainerAppointmentDto> getTrainerAppointments(Long trainerId, LocalDate date) {
        LocalDate d = date != null ? date : LocalDate.now();
        return appointmentRepository.findByTrainerIdAndAppointmentDate(trainerId, d).stream()
                .map(this::mapAppointmentToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TrainerAppointmentDto> getMemberAppointments(Long memberId) {
        return appointmentRepository.findByMemberIdOrderByAppointmentDateDesc(memberId).stream()
                .map(this::mapAppointmentToDto)
                .collect(Collectors.toList());
    }

    private GroupClassDto mapClassToDto(GroupClass c, LocalDate date) {
        long booked = classBookingRepository.countConfirmedBookings(c.getId(), date);
        return GroupClassDto.builder()
                .id(c.getId())
                .branchId(c.getBranch() != null ? c.getBranch().getId() : null)
                .branchName(c.getBranch() != null ? c.getBranch().getName() : "N/A")
                .trainerId(c.getTrainer().getId())
                .trainerName(c.getTrainer().getFullName())
                .name(c.getName())
                .description(c.getDescription())
                .roomName(c.getRoomName())
                .capacity(c.getCapacity())
                .bookedCount(booked)
                .startTime(c.getStartTime())
                .endTime(c.getEndTime())
                .dayOfWeek(c.getDayOfWeek())
                .recurring(c.getRecurring())
                .active(c.getActive())
                .build();
    }

    private ClassBookingDto mapBookingToDto(ClassBooking b) {
        return ClassBookingDto.builder()
                .id(b.getId())
                .groupClassId(b.getGroupClass().getId())
                .className(b.getGroupClass().getName())
                .trainerName(b.getGroupClass().getTrainer().getFullName())
                .roomName(b.getGroupClass().getRoomName())
                .startTime(b.getGroupClass().getStartTime())
                .endTime(b.getGroupClass().getEndTime())
                .memberId(b.getMember().getId())
                .memberName(b.getMember().getFullName())
                .bookingDate(b.getBookingDate())
                .classDate(b.getClassDate())
                .status(b.getStatus())
                .waitlistPosition(b.getWaitlistPosition())
                .build();
    }

    private TrainerAppointmentDto mapAppointmentToDto(TrainerAppointment a) {
        return TrainerAppointmentDto.builder()
                .id(a.getId())
                .trainerId(a.getTrainer().getId())
                .trainerName(a.getTrainer().getFullName())
                .memberId(a.getMember().getId())
                .memberName(a.getMember().getFullName())
                .branchId(a.getBranch() != null ? a.getBranch().getId() : null)
                .branchName(a.getBranch() != null ? a.getBranch().getName() : "N/A")
                .appointmentDate(a.getAppointmentDate())
                .startTime(a.getStartTime())
                .endTime(a.getEndTime())
                .status(a.getStatus())
                .sessionNotes(a.getSessionNotes())
                .build();
    }
}
