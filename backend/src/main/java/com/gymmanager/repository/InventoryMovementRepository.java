package com.gymmanager.repository;

import com.gymmanager.entity.InventoryMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {
    List<InventoryMovement> findByItemIdOrderByCreatedAtDesc(Long itemId);
    Page<InventoryMovement> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
