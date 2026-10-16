package com.gymmanager.entity;

import com.gymmanager.enums.ExerciseDifficulty;
import com.gymmanager.enums.MuscleGroup;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "exercises", indexes = {
    @Index(name = "idx_exercise_muscle", columnList = "muscle_group")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Exercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "muscle_group", nullable = false, length = 30)
    private MuscleGroup muscleGroup;

    @Column(name = "equipment_needed", length = 100)
    private String equipmentNeeded; // e.g. "Barbell, Bench", "Dumbbells", "Cable Machine", "Bodyweight"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private ExerciseDifficulty difficulty = ExerciseDifficulty.INTERMEDIATE;

    @Column(length = 2000)
    private String instructions;

    @Column(name = "media_url", length = 500)
    private String mediaUrl; // video or animation gif

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
