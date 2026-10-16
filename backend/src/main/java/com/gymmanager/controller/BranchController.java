package com.gymmanager.controller;

import com.gymmanager.dto.BranchDto;
import com.gymmanager.service.BranchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/branches")
@Tag(name = "Multi-Branch Management", description = "Endpoints for gym locations, branches, and multi-location administration")
public class BranchController {

    private final BranchService branchService;

    public BranchController(BranchService branchService) {
        this.branchService = branchService;
    }

    @GetMapping
    @Operation(summary = "Get list of all gym branches")
    public ResponseEntity<List<BranchDto>> getAllBranches() {
        return ResponseEntity.ok(branchService.getAllBranches());
    }

    @PostMapping
    @Operation(summary = "Create a new gym branch")
    public ResponseEntity<BranchDto> createBranch(@Valid @RequestBody BranchDto dto) {
        return ResponseEntity.ok(branchService.createBranch(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update branch details")
    public ResponseEntity<BranchDto> updateBranch(@PathVariable Long id, @Valid @RequestBody BranchDto dto) {
        return ResponseEntity.ok(branchService.updateBranch(id, dto));
    }
}
