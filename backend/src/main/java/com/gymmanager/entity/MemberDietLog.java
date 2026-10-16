package com.gymmanager.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "member_diet_logs", indexes = {
    @Index(name = "idx_diet_log_member_date", columnList = "member_id, log_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberDietLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private User member;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Column(name = "water_intake_liters", precision = 4, scale = 2)
    @Builder.Default
    private BigDecimal waterIntakeLiters = BigDecimal.ZERO;

    @Column(name = "meals_followed")
    @Builder.Default
    private Integer mealsFollowed = 0; // count of target meals followed today

    @Column(name = "calories_consumed")
    private Integer caloriesConsumed;

    @Column(length = 500)
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
