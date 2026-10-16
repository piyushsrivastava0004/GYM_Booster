package com.gymmanager.repository;

import com.gymmanager.entity.Equipment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, Long> {

    @Query("SELECT e FROM Equipment e WHERE (:branchId IS NULL OR e.branch.id = :branchId)")
    Page<Equipment> findByBranchWithFilter(@Param("branchId") Long branchId, Pageable pageable);

    @Query("SELECT e FROM Equipment e WHERE (:branchId IS NULL OR e.branch.id = :branchId) " +
           "AND e.nextMaintenanceDate <= :date")
    List<Equipment> findEquipmentDueForMaintenance(@Param("branchId") Long branchId, @Param("date") LocalDate date);
}
