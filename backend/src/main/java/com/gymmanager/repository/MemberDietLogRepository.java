package com.gymmanager.repository;

import com.gymmanager.entity.MemberDietLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MemberDietLogRepository extends JpaRepository<MemberDietLog, Long> {
    Optional<MemberDietLog> findByMemberIdAndLogDate(Long memberId, LocalDate logDate);
    List<MemberDietLog> findByMemberIdOrderByLogDateDesc(Long memberId);
}
