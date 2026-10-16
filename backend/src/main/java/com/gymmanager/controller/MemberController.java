package com.gymmanager.controller;

import com.gymmanager.dto.MemberDto;
import com.gymmanager.dto.MemberRegistrationDto;
import com.gymmanager.enums.MemberStatus;
import com.gymmanager.service.MemberService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/members")
@Tag(name = "Member Management", description = "Endpoints for member registration, profiles, search, and status updates")
public class MemberController {

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new gym member")
    public ResponseEntity<MemberDto> registerMember(@Valid @RequestBody MemberRegistrationDto dto) {
        return ResponseEntity.ok(memberService.registerMember(dto));
    }

    @GetMapping
    @Operation(summary = "Search and list members with pagination and filters")
    public ResponseEntity<Page<MemberDto>> searchMembers(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) MemberStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        return ResponseEntity.ok(memberService.searchMembers(branchId, status, search, PageRequest.of(page, size, sort)));
    }

    @GetMapping("/all")
    @Operation(summary = "Get list of all members (for dropdowns)")
    public ResponseEntity<List<MemberDto>> getAllMembers(@RequestParam(required = false) Long branchId) {
        return ResponseEntity.ok(memberService.getAllMembersList(branchId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get member profile by ID")
    public ResponseEntity<MemberDto> getMemberById(@PathVariable Long id) {
        return ResponseEntity.ok(memberService.getMemberById(id));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get member profile by User ID")
    public ResponseEntity<MemberDto> getMemberByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(memberService.getMemberByUserId(userId));
    }

    @GetMapping("/lookup")
    @Operation(summary = "Lookup member by code or QR payload")
    public ResponseEntity<MemberDto> lookupMember(@RequestParam String credential) {
        return ResponseEntity.ok(memberService.getMemberByCodeOrQr(credential));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update member profile")
    public ResponseEntity<MemberDto> updateMember(@PathVariable Long id, @Valid @RequestBody MemberRegistrationDto dto) {
        return ResponseEntity.ok(memberService.updateMember(id, dto));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update member status")
    public ResponseEntity<MemberDto> updateStatus(@PathVariable Long id, @RequestParam MemberStatus status) {
        return ResponseEntity.ok(memberService.updateStatus(id, status));
    }
}
