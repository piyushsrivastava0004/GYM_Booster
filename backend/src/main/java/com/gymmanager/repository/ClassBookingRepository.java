package com.gymmanager.repository;

import com.gymmanager.entity.ClassBooking;
import com.gymmanager.enums.ClassBookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClassBookingRepository extends JpaRepository<ClassBooking, Long> {

    List<ClassBooking> findByGroupClassIdAndClassDate(Long groupClassId, LocalDate classDate);
    List<ClassBooking> findByMemberIdOrderByClassDateDesc(Long memberId);
    Optional<ClassBooking> findByGroupClassIdAndMemberIdAndClassDate(Long groupClassId, Long memberId, LocalDate classDate);

    @Query("SELECT COUNT(b) FROM ClassBooking b WHERE b.groupClass.id = :classId AND b.classDate = :classDate AND b.status = 'CONFIRMED'")
    long countConfirmedBookings(@Param("classId") Long classId, @Param("classDate") LocalDate classDate);

    @Query("SELECT COALESCE(MAX(b.waitlistPosition), 0) FROM ClassBooking b WHERE b.groupClass.id = :classId AND b.classDate = :classDate AND b.status = 'WAITLISTED'")
    int getMaxWaitlistPosition(@Param("classId") Long classId, @Param("classDate") LocalDate classDate);
}
