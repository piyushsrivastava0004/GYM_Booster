package com.gymmanager.repository;

import com.gymmanager.entity.GroupClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupClassRepository extends JpaRepository<GroupClass, Long> {
    List<GroupClass> findByBranchIdAndActiveTrue(Long branchId);
    List<GroupClass> findByActiveTrue();
    List<GroupClass> findByTrainerIdAndActiveTrue(Long trainerId);
}
