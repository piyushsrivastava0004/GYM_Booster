package com.gymmanager.repository;

import com.gymmanager.entity.FitnessMeasurement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FitnessMeasurementRepository extends JpaRepository<FitnessMeasurement, Long> {
    List<FitnessMeasurement> findByMemberIdOrderByRecordedDateAsc(Long memberId);
}
