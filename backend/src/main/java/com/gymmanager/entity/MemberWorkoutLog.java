package com.gymmanager.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "member_workout_logs", indexes = {
    @Index(name = "idx_workout_log_member_date", columnList = "member_id, workout_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberWorkoutLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private User member;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "exercise_id", nullable = false)
    private Exercise exercise;

    @Column(name = "workout_date", nullable = false)
    private LocalDate workoutDate;

    @Column(name = "sets_completed", nullable = false)
    private Integer setsCompleted;

    @Column(name = "reps_completed", nullable = false)
    private Integer repsCompleted;

    @Column(name = "weight_used_kg", precision = 6, scale = 2)
    private BigDecimal weightUsedKg;

    @Column(length = 500)
    private String notes;

    @Column(name = "verified_by_trainer")
    @Builder.Default
    private Boolean verifiedByTrainer = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
