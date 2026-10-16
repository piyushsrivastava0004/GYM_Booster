package com.gymmanager.repository;

import com.gymmanager.entity.MemberWorkoutLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MemberWorkoutLogRepository extends JpaRepository<MemberWorkoutLog, Long> {
    List<MemberWorkoutLog> findByMemberIdAndWorkoutDateOrderByCreatedAtAsc(Long memberId, LocalDate workoutDate);
    List<MemberWorkoutLog> findByMemberIdOrderByWorkoutDateDesc(Long memberId);
}
