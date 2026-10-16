package com.gymmanager.controller;

import com.gymmanager.dto.ClassBookingDto;
import com.gymmanager.dto.GroupClassDto;
import com.gymmanager.dto.TrainerAppointmentDto;
import com.gymmanager.service.GroupClassService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping
@Tag(name = "Group Classes & Appointments", description = "Endpoints for class scheduling, capacity limits, bookings, waitlists, and personal training appointments")
public class GroupClassController {

    private final GroupClassService groupClassService;

    public GroupClassController(GroupClassService groupClassService) {
        this.groupClassService = groupClassService;
    }

    // --- GROUP CLASSES ---
    @PostMapping("/classes")
    @Operation(summary = "Create a recurring group class")
    public ResponseEntity<GroupClassDto> createClass(@Valid @RequestBody GroupClassDto dto) {
        return ResponseEntity.ok(groupClassService.createClass(dto));
    }

    @GetMapping("/classes")
    @Operation(summary = "Get group classes for a branch and date")
    public ResponseEntity<List<GroupClassDto>> getClasses(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ResponseEntity.ok(groupClassService.getClasses(branchId, date));
    }

    @PostMapping("/classes/{classId}/book")
    @Operation(summary = "Book a group class slot (enforces capacity limits & waitlists)")
    public ResponseEntity<ClassBookingDto> bookClass(
            @PathVariable Long classId,
            @RequestParam Long memberId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate classDate
    ) {
        return ResponseEntity.ok(groupClassService.bookClass(classId, memberId, classDate));
    }

    @PostMapping("/classes/bookings/{bookingId}/cancel")
    @Operation(summary = "Cancel a class reservation and promote waitlisted member")
    public ResponseEntity<ClassBookingDto> cancelBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(groupClassService.cancelBooking(bookingId));
    }

    @GetMapping("/classes/bookings/member/{memberId}")
    @Operation(summary = "Get bookings for a specific member")
    public ResponseEntity<List<ClassBookingDto>> getMemberBookings(@PathVariable Long memberId) {
        return ResponseEntity.ok(groupClassService.getMemberBookings(memberId));
    }

    // --- TRAINER APPOINTMENTS ---
    @PostMapping("/appointments")
    @Operation(summary = "Schedule 1-on-1 personal training appointment (checks for double booking)")
    public ResponseEntity<TrainerAppointmentDto> scheduleAppointment(@Valid @RequestBody TrainerAppointmentDto dto) {
        return ResponseEntity.ok(groupClassService.scheduleAppointment(dto));
    }

    @GetMapping("/appointments/trainer/{trainerId}")
    @Operation(summary = "Get scheduled appointments for a trainer")
    public ResponseEntity<List<TrainerAppointmentDto>> getTrainerAppointments(
            @PathVariable Long trainerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ResponseEntity.ok(groupClassService.getTrainerAppointments(trainerId, date));
    }

    @GetMapping("/appointments/member/{memberId}")
    @Operation(summary = "Get appointments for a member")
    public ResponseEntity<List<TrainerAppointmentDto>> getMemberAppointments(@PathVariable Long memberId) {
        return ResponseEntity.ok(groupClassService.getMemberAppointments(memberId));
    }
}
