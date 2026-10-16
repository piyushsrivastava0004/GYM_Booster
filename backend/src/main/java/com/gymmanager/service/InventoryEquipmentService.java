package com.gymmanager.service;

import com.gymmanager.dto.EquipmentDto;
import com.gymmanager.dto.InventoryItemDto;
import com.gymmanager.dto.InventoryMovementDto;
import com.gymmanager.dto.MaintenanceDto;
import com.gymmanager.entity.*;
import com.gymmanager.enums.EquipmentStatus;
import com.gymmanager.enums.ExpenseCategory;
import com.gymmanager.enums.InventoryMovementType;
import com.gymmanager.exception.BadRequestException;
import com.gymmanager.exception.ResourceNotFoundException;
import com.gymmanager.repository.*;
import com.gymmanager.util.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class InventoryEquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final EquipmentMaintenanceRepository maintenanceRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final InventoryMovementRepository movementRepository;
    private final ExpenseRepository expenseRepository;
    private final BranchRepository branchRepository;
    private final SecurityUtils securityUtils;

    public InventoryEquipmentService(EquipmentRepository equipmentRepository,
                                     EquipmentMaintenanceRepository maintenanceRepository,
                                     InventoryItemRepository inventoryItemRepository,
                                     InventoryMovementRepository movementRepository,
                                     ExpenseRepository expenseRepository,
                                     BranchRepository branchRepository,
                                     SecurityUtils securityUtils) {
        this.equipmentRepository = equipmentRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.inventoryItemRepository = inventoryItemRepository;
        this.movementRepository = movementRepository;
        this.expenseRepository = expenseRepository;
        this.branchRepository = branchRepository;
        this.securityUtils = securityUtils;
    }

    // --- EQUIPMENT ---
    @Transactional
    public EquipmentDto addEquipment(EquipmentDto dto) {
        Branch branch = null;
        if (dto.getBranchId() != null) {
            branch = branchRepository.findById(dto.getBranchId()).orElse(null);
        }

        Equipment eq = Equipment.builder()
                .branch(branch)
                .name(dto.getName())
                .serialNumber(dto.getSerialNumber())
                .category(dto.getCategory() != null ? dto.getCategory() : "General")
                .purchaseDate(dto.getPurchaseDate() != null ? dto.getPurchaseDate() : LocalDate.now())
                .purchaseCost(dto.getPurchaseCost() != null ? dto.getPurchaseCost() : BigDecimal.ZERO)
                .warrantyExpiryDate(dto.getWarrantyExpiryDate())
                .status(dto.getStatus() != null ? dto.getStatus() : EquipmentStatus.OPERATIONAL)
                .lastMaintenanceDate(dto.getLastMaintenanceDate())
                .nextMaintenanceDate(dto.getNextMaintenanceDate() != null ? dto.getNextMaintenanceDate() : LocalDate.now().plusMonths(6))
                .notes(dto.getNotes())
                .build();
        eq = equipmentRepository.save(eq);

        return mapEquipmentToDto(eq);
    }

    @Transactional(readOnly = true)
    public Page<EquipmentDto> getEquipment(Long branchId, Pageable pageable) {
        Long effectiveBranchId = securityUtils.isGymOwnerOrAdmin() ? branchId : securityUtils.getCurrentBranchId();
        return equipmentRepository.findByBranchWithFilter(effectiveBranchId, pageable)
                .map(this::mapEquipmentToDto);
    }

    @Transactional
    public MaintenanceDto recordMaintenance(MaintenanceDto dto) {
        Equipment eq = equipmentRepository.findById(dto.getEquipmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found with ID: " + dto.getEquipmentId()));

        EquipmentMaintenance maintenance = EquipmentMaintenance.builder()
                .equipment(eq)
                .maintenanceDate(dto.getMaintenanceDate() != null ? dto.getMaintenanceDate() : LocalDate.now())
                .cost(dto.getCost())
                .description(dto.getDescription())
                .vendorName(dto.getVendorName())
                .performedBy(dto.getPerformedBy())
                .status("COMPLETED")
                .build();
        maintenance = maintenanceRepository.save(maintenance);

        // Update equipment dates
        eq.setLastMaintenanceDate(maintenance.getMaintenanceDate());
        eq.setNextMaintenanceDate(maintenance.getMaintenanceDate().plusMonths(6));
        equipmentRepository.save(eq);

        // Record as expense in financial management
        Expense expense = Expense.builder()
                .branch(eq.getBranch())
                .category(ExpenseCategory.MAINTENANCE)
                .title("Maintenance for " + eq.getName())
                .description(dto.getDescription())
                .amount(dto.getCost())
                .expenseDate(maintenance.getMaintenanceDate())
                .vendorName(dto.getVendorName())
                .recordedBy(securityUtils.getCurrentUser())
                .build();
        expenseRepository.save(expense);

        return MaintenanceDto.builder()
                .id(maintenance.getId())
                .equipmentId(eq.getId())
                .equipmentName(eq.getName())
                .maintenanceDate(maintenance.getMaintenanceDate())
                .cost(maintenance.getCost())
                .description(maintenance.getDescription())
                .vendorName(maintenance.getVendorName())
                .performedBy(maintenance.getPerformedBy())
                .status(maintenance.getStatus())
                .build();
    }

    @Transactional(readOnly = true)
    public List<MaintenanceDto> getEquipmentMaintenanceHistory(Long equipmentId) {
        return maintenanceRepository.findByEquipmentIdOrderByMaintenanceDateDesc(equipmentId).stream()
                .map(m -> MaintenanceDto.builder()
                        .id(m.getId())
                        .equipmentId(m.getEquipment().getId())
                        .equipmentName(m.getEquipment().getName())
                        .maintenanceDate(m.getMaintenanceDate())
                        .cost(m.getCost())
                        .description(m.getDescription())
                        .vendorName(m.getVendorName())
                        .performedBy(m.getPerformedBy())
                        .status(m.getStatus())
                        .build())
                .collect(Collectors.toList());
    }

    // --- INVENTORY ---
    @Transactional
    public InventoryItemDto addInventoryItem(InventoryItemDto dto) {
        if (inventoryItemRepository.findBySku(dto.getSku()).isPresent()) {
            throw new BadRequestException("Item with SKU " + dto.getSku() + " already exists!");
        }

        Branch branch = null;
        if (dto.getBranchId() != null) {
            branch = branchRepository.findById(dto.getBranchId()).orElse(null);
        }

        InventoryItem item = InventoryItem.builder()
                .branch(branch)
                .name(dto.getName())
                .sku(dto.getSku())
                .category(dto.getCategory() != null ? dto.getCategory() : "SUPPLEMENTS")
                .unitPrice(dto.getUnitPrice())
                .sellingPrice(dto.getSellingPrice())
                .quantityInStock(dto.getQuantityInStock() != null ? dto.getQuantityInStock() : 0)
                .reorderThreshold(dto.getReorderThreshold() != null ? dto.getReorderThreshold() : 5)
                .active(true)
                .build();
        item = inventoryItemRepository.save(item);

        return mapItemToDto(item);
    }

    @Transactional(readOnly = true)
    public Page<InventoryItemDto> getInventory(Long branchId, String search, Pageable pageable) {
        Long effectiveBranchId = securityUtils.isGymOwnerOrAdmin() ? branchId : securityUtils.getCurrentBranchId();
        return inventoryItemRepository.searchInventory(effectiveBranchId, search, pageable)
                .map(this::mapItemToDto);
    }

    @Transactional(readOnly = true)
    public List<InventoryItemDto> getLowStockAlerts(Long branchId) {
        Long effectiveBranchId = securityUtils.isGymOwnerOrAdmin() ? branchId : securityUtils.getCurrentBranchId();
        return inventoryItemRepository.findLowStockItems(effectiveBranchId).stream()
                .map(this::mapItemToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public InventoryMovementDto recordStockMovement(InventoryMovementDto dto) {
        InventoryItem item = inventoryItemRepository.findById(dto.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with ID: " + dto.getItemId()));

        int newQty = item.getQuantityInStock();
        BigDecimal unitPrice = dto.getUnitPrice() != null ? dto.getUnitPrice() : item.getUnitPrice();
        BigDecimal total = unitPrice.multiply(BigDecimal.valueOf(dto.getQuantity()));

        if (dto.getMovementType() == InventoryMovementType.PURCHASE || dto.getMovementType() == InventoryMovementType.RETURN) {
            newQty += dto.getQuantity();
        } else if (dto.getMovementType() == InventoryMovementType.SALE || dto.getMovementType() == InventoryMovementType.WRITE_OFF) {
            if (newQty < dto.getQuantity()) {
                throw new BadRequestException("Insufficient stock! Available: " + newQty + ", Requested: " + dto.getQuantity());
            }
            newQty -= dto.getQuantity();
        } else if (dto.getMovementType() == InventoryMovementType.ADJUSTMENT) {
            newQty = dto.getQuantity(); // Direct override
        }

        item.setQuantityInStock(newQty);
        inventoryItemRepository.save(item);

        InventoryMovement movement = InventoryMovement.builder()
                .item(item)
                .movementType(dto.getMovementType())
                .quantity(dto.getQuantity())
                .unitPrice(unitPrice)
                .totalAmount(total)
                .reason(dto.getReason())
                .recordedBy(securityUtils.getCurrentUser())
                .build();
        movement = movementRepository.save(movement);

        return InventoryMovementDto.builder()
                .id(movement.getId())
                .itemId(item.getId())
                .itemName(item.getName())
                .sku(item.getSku())
                .movementType(movement.getMovementType())
                .quantity(movement.getQuantity())
                .unitPrice(movement.getUnitPrice())
                .totalAmount(movement.getTotalAmount())
                .reason(movement.getReason())
                .recordedById(movement.getRecordedBy().getId())
                .recordedByName(movement.getRecordedBy().getFullName())
                .createdAt(movement.getCreatedAt())
                .build();
    }

    private EquipmentDto mapEquipmentToDto(Equipment eq) {
        return EquipmentDto.builder()
                .id(eq.getId())
                .branchId(eq.getBranch() != null ? eq.getBranch().getId() : null)
                .branchName(eq.getBranch() != null ? eq.getBranch().getName() : "N/A")
                .name(eq.getName())
                .serialNumber(eq.getSerialNumber())
                .category(eq.getCategory())
                .purchaseDate(eq.getPurchaseDate())
                .purchaseCost(eq.getPurchaseCost())
                .warrantyExpiryDate(eq.getWarrantyExpiryDate())
                .status(eq.getStatus())
                .lastMaintenanceDate(eq.getLastMaintenanceDate())
                .nextMaintenanceDate(eq.getNextMaintenanceDate())
                .notes(eq.getNotes())
                .build();
    }

    private InventoryItemDto mapItemToDto(InventoryItem item) {
        return InventoryItemDto.builder()
                .id(item.getId())
                .branchId(item.getBranch() != null ? item.getBranch().getId() : null)
                .branchName(item.getBranch() != null ? item.getBranch().getName() : "N/A")
                .name(item.getName())
                .sku(item.getSku())
                .category(item.getCategory())
                .unitPrice(item.getUnitPrice())
                .sellingPrice(item.getSellingPrice())
                .quantityInStock(item.getQuantityInStock())
                .reorderThreshold(item.getReorderThreshold())
                .isLowStock(item.getQuantityInStock() <= item.getReorderThreshold())
                .active(item.getActive())
                .build();
    }
}
