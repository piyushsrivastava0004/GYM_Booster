package com.gymmanager.repository;

import com.gymmanager.entity.StaffShift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StaffShiftRepository extends JpaRepository<StaffShift, Long> {
    List<StaffShift> findByStaffId(Long staffId);
    List<StaffShift> findByBranchId(Long branchId);
}
