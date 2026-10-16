package com.gymmanager.repository;

import com.gymmanager.entity.Attendance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    @Query("SELECT a FROM Attendance a WHERE a.member.id = :memberId AND a.checkOutTime IS NULL")
    Optional<Attendance> findActiveCheckInForMember(@Param("memberId") Long memberId);

    List<Attendance> findByMemberIdOrderByCheckInTimeDesc(Long memberId);

    @Query("SELECT a FROM Attendance a WHERE (:branchId IS NULL OR a.branch.id = :branchId) " +
           "AND a.checkInTime BETWEEN :startDate AND :endDate")
    Page<Attendance> findAttendanceWithFilter(@Param("branchId") Long branchId,
                                             @Param("startDate") LocalDateTime startDate,
                                             @Param("endDate") LocalDateTime endDate,
                                             Pageable pageable);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE (:branchId IS NULL OR a.branch.id = :branchId) " +
           "AND a.checkInTime BETWEEN :startDate AND :endDate AND a.status = 'CHECKED_IN'")
    long countCheckInsBetween(@Param("branchId") Long branchId,
                              @Param("startDate") LocalDateTime startDate,
                              @Param("endDate") LocalDateTime endDate);

    @Query("SELECT hour(a.checkInTime) as hr, COUNT(a) as cnt FROM Attendance a " +
           "WHERE (:branchId IS NULL OR a.branch.id = :branchId) " +
           "AND a.checkInTime BETWEEN :startDate AND :endDate " +
           "GROUP BY hour(a.checkInTime) ORDER BY hr ASC")
    List<Object[]> getPeakHours(@Param("branchId") Long branchId,
                                @Param("startDate") LocalDateTime startDate,
                                @Param("endDate") LocalDateTime endDate);
}
