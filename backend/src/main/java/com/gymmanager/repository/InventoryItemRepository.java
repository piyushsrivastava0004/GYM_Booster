package com.gymmanager.repository;

import com.gymmanager.entity.InventoryItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    Optional<InventoryItem> findBySku(String sku);

    @Query("SELECT i FROM InventoryItem i WHERE (:branchId IS NULL OR i.branch.id = :branchId) " +
           "AND (:search IS NULL OR LOWER(i.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(i.sku) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<InventoryItem> searchInventory(@Param("branchId") Long branchId, @Param("search") String search, Pageable pageable);

    @Query("SELECT i FROM InventoryItem i WHERE (:branchId IS NULL OR i.branch.id = :branchId) " +
           "AND i.quantityInStock <= i.reorderThreshold AND i.active = true")
    List<InventoryItem> findLowStockItems(@Param("branchId") Long branchId);
}
