package com.gymmanager.controller;

import com.gymmanager.dto.EquipmentDto;
import com.gymmanager.dto.InventoryItemDto;
import com.gymmanager.dto.InventoryMovementDto;
import com.gymmanager.dto.MaintenanceDto;
import com.gymmanager.service.InventoryEquipmentService;
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
@RequestMapping
@Tag(name = "Equipment & Inventory", description = "Endpoints for equipment registry, maintenance records, inventory items, and stock movements")
public class InventoryEquipmentController {

    private final InventoryEquipmentService service;

    public InventoryEquipmentController(InventoryEquipmentService service) {
        this.service = service;
    }

    // --- EQUIPMENT ---
    @PostMapping("/equipment")
    @Operation(summary = "Add gym equipment to registry")
    public ResponseEntity<EquipmentDto> addEquipment(@Valid @RequestBody EquipmentDto dto) {
        return ResponseEntity.ok(service.addEquipment(dto));
    }

    @GetMapping("/equipment")
    @Operation(summary = "Get paginated equipment list with branch filter")
    public ResponseEntity<Page<EquipmentDto>> getEquipment(
            @RequestParam(required = false) Long branchId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        return ResponseEntity.ok(service.getEquipment(branchId, PageRequest.of(page, size, Sort.by("id").descending())));
    }

    @PostMapping("/equipment/maintenance")
    @Operation(summary = "Record equipment maintenance and log maintenance expense")
    public ResponseEntity<MaintenanceDto> recordMaintenance(@Valid @RequestBody MaintenanceDto dto) {
        return ResponseEntity.ok(service.recordMaintenance(dto));
    }

    @GetMapping("/equipment/{id}/maintenance")
    @Operation(summary = "Get maintenance history for equipment")
    public ResponseEntity<List<MaintenanceDto>> getMaintenanceHistory(@PathVariable Long id) {
        return ResponseEntity.ok(service.getEquipmentMaintenanceHistory(id));
    }

    // --- INVENTORY ---
    @PostMapping("/inventory")
    @Operation(summary = "Add an inventory item (supplements, merchandise, etc.)")
    public ResponseEntity<InventoryItemDto> addInventoryItem(@Valid @RequestBody InventoryItemDto dto) {
        return ResponseEntity.ok(service.addInventoryItem(dto));
    }

    @GetMapping("/inventory")
    @Operation(summary = "Search inventory with pagination")
    public ResponseEntity<Page<InventoryItemDto>> getInventory(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        return ResponseEntity.ok(service.getInventory(branchId, search, PageRequest.of(page, size, Sort.by("id").descending())));
    }

    @GetMapping("/inventory/alerts")
    @Operation(summary = "Get low stock inventory items requiring reorder")
    public ResponseEntity<List<InventoryItemDto>> getLowStockAlerts(@RequestParam(required = false) Long branchId) {
        return ResponseEntity.ok(service.getLowStockAlerts(branchId));
    }

    @PostMapping("/inventory/movements")
    @Operation(summary = "Record stock movement (Sale, Purchase, Return, Adjustment)")
    public ResponseEntity<InventoryMovementDto> recordStockMovement(@Valid @RequestBody InventoryMovementDto dto) {
        return ResponseEntity.ok(service.recordStockMovement(dto));
    }
}
