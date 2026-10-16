package com.gymmanager.repository;

import com.gymmanager.entity.GymSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GymSettingRepository extends JpaRepository<GymSetting, Long> {
    Optional<GymSetting> findByBranchIdAndSettingKey(Long branchId, String settingKey);
    Optional<GymSetting> findByBranchIsNullAndSettingKey(String settingKey);
    List<GymSetting> findByBranchIdOrBranchIsNull(Long branchId);
}
