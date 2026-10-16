package com.gymmanager.repository;

import com.gymmanager.entity.TrainerAppointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface TrainerAppointmentRepository extends JpaRepository<TrainerAppointment, Long> {

    List<TrainerAppointment> findByTrainerIdAndAppointmentDate(Long trainerId, LocalDate appointmentDate);
    List<TrainerAppointment> findByMemberIdOrderByAppointmentDateDesc(Long memberId);

    @Query("SELECT a FROM TrainerAppointment a WHERE a.trainer.id = :trainerId " +
           "AND a.appointmentDate = :appointmentDate AND a.status = 'SCHEDULED' " +
           "AND (a.startTime < :endTime AND a.endTime > :startTime) " +
           "AND (:excludeId IS NULL OR a.id != :excludeId)")
    List<TrainerAppointment> findConflictingAppointments(@Param("trainerId") Long trainerId,
                                                         @Param("appointmentDate") LocalDate appointmentDate,
                                                         @Param("startTime") LocalTime startTime,
                                                         @Param("endTime") LocalTime endTime,
                                                         @Param("excludeId") Long excludeId);
}
