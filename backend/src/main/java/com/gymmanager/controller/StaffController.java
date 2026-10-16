package com.gymmanager.controller;

import com.gymmanager.dto.StaffDto;
import com.gymmanager.dto.StaffLeaveDto;
import com.gymmanager.dto.StaffShiftDto;
import com.gymmanager.service.StaffService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/staff")
@Tag(name = "Staff & Trainer Management", description = "Endpoints for staff profiles, trainers, shifts, and leaves")
public class StaffController {

    private final StaffService staffService;

    public StaffController(StaffService staffService) {
        this.staffService = staffService;
    }

    @PostMapping
    @Operation(summary = "Create staff profile")
    public ResponseEntity<StaffDto> createStaff(@Valid @RequestBody StaffDto dto) {
        return ResponseEntity.ok(staffService.createStaff(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update staff profile")
    public ResponseEntity<StaffDto> updateStaff(@PathVariable Long id, @RequestBody StaffDto dto) {
        return ResponseEntity.ok(staffService.updateStaff(id, dto));
    }

    @GetMapping
    @Operation(summary = "Get all staff members")
    public ResponseEntity<List<StaffDto>> getAllStaff(@RequestParam(required = false) Long branchId) {
        return ResponseEntity.ok(staffService.getAllStaff(branchId));
    }

    @GetMapping("/trainers")
    @Operation(summary = "Get all personal trainers")
    public ResponseEntity<List<StaffDto>> getTrainers(@RequestParam(required = false) Long branchId) {
        return ResponseEntity.ok(staffService.getTrainers(branchId));
    }

    @PostMapping("/shifts")
    @Operation(summary = "Assign a shift to staff member")
    public ResponseEntity<StaffShiftDto> createShift(@Valid @RequestBody StaffShiftDto dto) {
        return ResponseEntity.ok(staffService.createShift(dto));
    }

    @GetMapping("/{staffId}/shifts")
    @Operation(summary = "Get shifts for a staff member")
    public ResponseEntity<List<StaffShiftDto>> getStaffShifts(@PathVariable Long staffId) {
        return ResponseEntity.ok(staffService.getStaffShifts(staffId));
    }

    @PostMapping("/leaves")
    @Operation(summary = "Apply for staff leave")
    public ResponseEntity<StaffLeaveDto> applyLeave(@Valid @RequestBody StaffLeaveDto dto) {
        return ResponseEntity.ok(staffService.applyLeave(dto));
    }

    @PatchMapping("/leaves/{leaveId}/status")
    @Operation(summary = "Update leave approval status")
    public ResponseEntity<StaffLeaveDto> updateLeaveStatus(@PathVariable Long leaveId, @RequestParam String status) {
        return ResponseEntity.ok(staffService.updateLeaveStatus(leaveId, status));
    }
}
