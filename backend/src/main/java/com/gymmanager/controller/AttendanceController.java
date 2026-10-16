package com.gymmanager.controller;

import com.gymmanager.dto.AttendanceCheckInRequest;
import com.gymmanager.dto.AttendanceDto;
import com.gymmanager.dto.AttendanceOverrideRequest;
import com.gymmanager.service.AttendanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/attendance")
@Tag(name = "Attendance & Access Control", description = "Endpoints for QR badge check-in, check-out, eligibility checks, and manual overrides")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping("/check-in")
    @Operation(summary = "Check in member using ID, member code, or QR badge data")
    public ResponseEntity<AttendanceDto> checkIn(@RequestBody AttendanceCheckInRequest request) {
        return ResponseEntity.ok(attendanceService.checkIn(request));
    }

    @PostMapping("/check-out/{memberId}")
    @Operation(summary = "Check out an active member session")
    public ResponseEntity<AttendanceDto> checkOut(@PathVariable Long memberId) {
        return ResponseEntity.ok(attendanceService.checkOut(memberId));
    }

    @PostMapping("/override")
    @Operation(summary = "Staff manual override check-in with reason")
    public ResponseEntity<AttendanceDto> recordOverride(@Valid @RequestBody AttendanceOverrideRequest request) {
        return ResponseEntity.ok(attendanceService.recordManualOverride(request));
    }

    @GetMapping("/logs")
    @Operation(summary = "Get paginated attendance history")
    public ResponseEntity<Page<AttendanceDto>> getAttendanceLogs(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(attendanceService.getAttendanceLogs(branchId, start, end, PageRequest.of(page, size, Sort.by("checkInTime").descending())));
    }

    @GetMapping("/member/{memberId}")
    @Operation(summary = "Get attendance history for a specific member")
    public ResponseEntity<List<AttendanceDto>> getMemberAttendance(@PathVariable Long memberId) {
        return ResponseEntity.ok(attendanceService.getMemberAttendance(memberId));
    }
}
