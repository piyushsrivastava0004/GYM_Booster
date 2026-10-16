package com.gymmanager.config;

import com.gymmanager.entity.*;
import com.gymmanager.enums.*;
import com.gymmanager.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Component
@Profile("!test")
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final MemberProfileRepository memberProfileRepository;
    private final StaffProfileRepository staffProfileRepository;
    private final MembershipPlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final AttendanceRepository attendanceRepository;
    private final ExerciseRepository exerciseRepository;
    private final WorkoutPlanRepository workoutPlanRepository;
    private final WorkoutPlanDayRepository workoutPlanDayRepository;
    private final WorkoutPlanExerciseRepository workoutPlanExerciseRepository;
    private final DietPlanRepository dietPlanRepository;
    private final DietMealItemRepository dietMealItemRepository;
    private final FitnessMeasurementRepository measurementRepository;
    private final FitnessGoalRepository goalRepository;
    private final GroupClassRepository classRepository;
    private final ClassBookingRepository bookingRepository;
    private final TrainerAppointmentRepository appointmentRepository;
    private final EquipmentRepository equipmentRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final ExpenseRepository expenseRepository;
    private final NotificationRepository notificationRepository;
    private final GymSettingRepository settingRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(BranchRepository branchRepository,
                           UserRepository userRepository,
                           MemberProfileRepository memberProfileRepository,
                           StaffProfileRepository staffProfileRepository,
                           MembershipPlanRepository planRepository,
                           SubscriptionRepository subscriptionRepository,
                           PaymentRepository paymentRepository,
                           InvoiceRepository invoiceRepository,
                           AttendanceRepository attendanceRepository,
                           ExerciseRepository exerciseRepository,
                           WorkoutPlanRepository workoutPlanRepository,
                           WorkoutPlanDayRepository workoutPlanDayRepository,
                           WorkoutPlanExerciseRepository workoutPlanExerciseRepository,
                           DietPlanRepository dietPlanRepository,
                           DietMealItemRepository dietMealItemRepository,
                           FitnessMeasurementRepository measurementRepository,
                           FitnessGoalRepository goalRepository,
                           GroupClassRepository classRepository,
                           ClassBookingRepository bookingRepository,
                           TrainerAppointmentRepository appointmentRepository,
                           EquipmentRepository equipmentRepository,
                           InventoryItemRepository inventoryItemRepository,
                           ExpenseRepository expenseRepository,
                           NotificationRepository notificationRepository,
                           GymSettingRepository settingRepository,
                           PasswordEncoder passwordEncoder) {
        this.branchRepository = branchRepository;
        this.userRepository = userRepository;
        this.memberProfileRepository = memberProfileRepository;
        this.staffProfileRepository = staffProfileRepository;
        this.planRepository = planRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
        this.attendanceRepository = attendanceRepository;
        this.exerciseRepository = exerciseRepository;
        this.workoutPlanRepository = workoutPlanRepository;
        this.workoutPlanDayRepository = workoutPlanDayRepository;
        this.workoutPlanExerciseRepository = workoutPlanExerciseRepository;
        this.dietPlanRepository = dietPlanRepository;
        this.dietMealItemRepository = dietMealItemRepository;
        this.measurementRepository = measurementRepository;
        this.goalRepository = goalRepository;
        this.classRepository = classRepository;
        this.bookingRepository = bookingRepository;
        this.appointmentRepository = appointmentRepository;
        this.equipmentRepository = equipmentRepository;
        this.inventoryItemRepository = inventoryItemRepository;
        this.expenseRepository = expenseRepository;
        this.notificationRepository = notificationRepository;
        this.settingRepository = settingRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already initialized with data. Skipping seed.");
            return;
        }

        log.info("Initializing Seed Data for FitPulse Gym Management System (India Context)...");

        // 1. Branches
        Branch b1 = branchRepository.save(Branch.builder()
                .name("FitPulse Central - Indiranagar")
                .code("BLR-IND-01")
                .address("100 Feet Road, HAL 2nd Stage, Indiranagar")
                .city("Bengaluru")
                .state("Karnataka")
                .pincode("560038")
                .phone("+91 80 4123 4567")
                .email("indiranagar@fitpulse.in")
                .taxNumber("29AABCU9603R1ZM")
                .currency("INR")
                .timezone("Asia/Kolkata")
                .active(true)
                .build());

        Branch b2 = branchRepository.save(Branch.builder()
                .name("FitPulse Elite - Koramangala")
                .code("BLR-KOR-02")
                .address("80 Feet Road, 4th Block, Koramangala")
                .city("Bengaluru")
                .state("Karnataka")
                .pincode("560034")
                .phone("+91 80 4987 6543")
                .email("koramangala@fitpulse.in")
                .taxNumber("29AABCU9603R1ZM")
                .currency("INR")
                .timezone("Asia/Kolkata")
                .active(true)
                .build());

        // 2. Settings
        settingRepository.save(GymSetting.builder().settingKey("gym_name").settingValue("FitPulse Gym & Fitness Studio").description("Gym Brand Name").build());
        settingRepository.save(GymSetting.builder().settingKey("tagline").settingValue("Transform Your Life, Elevate Your Fitness").description("Tagline").build());
        settingRepository.save(GymSetting.builder().settingKey("currency").settingValue("INR").description("Currency").build());
        settingRepository.save(GymSetting.builder().settingKey("currency_symbol").settingValue("₹").description("Currency Symbol").build());
        settingRepository.save(GymSetting.builder().settingKey("gst_rate").settingValue("18.00").description("Indian GST Rate").build());

        // 3. Users for all 8 roles
        User owner = userRepository.save(User.builder()
                .username("owner")
                .email("owner@fitpulse.in")
                .password(passwordEncoder.encode("Owner@123"))
                .fullName("Vikramaditya Singhania")
                .phone("+91 98450 11111")
                .role(RoleType.ROLE_GYM_OWNER)
                .branch(b1)
                .enabled(true)
                .build());

        User admin = userRepository.save(User.builder()
                .username("admin")
                .email("admin@fitpulse.in")
                .password(passwordEncoder.encode("Admin@123"))
                .fullName("Pooja Sharma")
                .phone("+91 98450 22222")
                .role(RoleType.ROLE_ADMINISTRATOR)
                .branch(b1)
                .enabled(true)
                .build());

        User receptionist = userRepository.save(User.builder()
                .username("receptionist")
                .email("receptionist@fitpulse.in")
                .password(passwordEncoder.encode("Recept@123"))
                .fullName("Neha Kulkarni")
                .phone("+91 98450 33333")
                .role(RoleType.ROLE_RECEPTIONIST)
                .branch(b1)
                .enabled(true)
                .build());

        User trainer = userRepository.save(User.builder()
                .username("trainer_rahul")
                .email("rahul.trainer@fitpulse.in")
                .password(passwordEncoder.encode("Trainer@123"))
                .fullName("Rahul 'The Titan' Nair")
                .phone("+91 98450 44444")
                .role(RoleType.ROLE_TRAINER)
                .branch(b1)
                .enabled(true)
                .build());

        staffProfileRepository.save(StaffProfile.builder()
                .user(trainer)
                .designation("Senior Strength & Conditioning Coach")
                .department("Fitness")
                .qualification("ACSM Certified, ISSA Master Trainer")
                .specialties("Hypertrophy, Powerlifting, Injury Rehab, Posture Correction")
                .baseSalary(new BigDecimal("45000.00"))
                .commissionPercent(new BigDecimal("15.00"))
                .dateOfJoining(LocalDate.of(2024, 1, 10))
                .status("ACTIVE")
                .build());

        User nutritionist = userRepository.save(User.builder()
                .username("nutritionist_priya")
                .email("priya.diet@fitpulse.in")
                .password(passwordEncoder.encode("Nutri@123"))
                .fullName("Dr. Priya Venkatesh")
                .phone("+91 98450 55555")
                .role(RoleType.ROLE_NUTRITIONIST)
                .branch(b1)
                .enabled(true)
                .build());

        staffProfileRepository.save(StaffProfile.builder()
                .user(nutritionist)
                .designation("Head Clinical Sports Nutritionist")
                .department("Diet & Wellness")
                .qualification("M.Sc Sports Nutrition, RD (Registered Dietitian)")
                .specialties("Macro Counting, Ketogenic & Vegan Diets, Diabetes Management")
                .baseSalary(new BigDecimal("40000.00"))
                .commissionPercent(new BigDecimal("10.00"))
                .dateOfJoining(LocalDate.of(2024, 3, 1))
                .status("ACTIVE")
                .build());

        User accountant = userRepository.save(User.builder()
                .username("accountant_amit")
                .email("amit.finance@fitpulse.in")
                .password(passwordEncoder.encode("Account@123"))
                .fullName("Amitabh Sengupta")
                .phone("+91 98450 66666")
                .role(RoleType.ROLE_ACCOUNTANT)
                .branch(b1)
                .enabled(true)
                .build());

        User inventoryMgr = userRepository.save(User.builder()
                .username("inventory_vikram")
                .email("vikram.store@fitpulse.in")
                .password(passwordEncoder.encode("Invent@123"))
                .fullName("Vikram Rathore")
                .phone("+91 98450 77777")
                .role(RoleType.ROLE_INVENTORY_MANAGER)
                .branch(b1)
                .enabled(true)
                .build());

        User member1 = userRepository.save(User.builder()
                .username("member_arjun")
                .email("arjun.mehta@gmail.com")
                .password(passwordEncoder.encode("Member@123"))
                .fullName("Arjun Mehta")
                .phone("+91 98765 01234")
                .role(RoleType.ROLE_MEMBER)
                .branch(b1)
                .enabled(true)
                .build());

        MemberProfile mp1 = memberProfileRepository.save(MemberProfile.builder()
                .user(member1)
                .memberCode("MEM-2026-0001")
                .dateOfBirth(LocalDate.of(1996, 5, 14))
                .gender("MALE")
                .emergencyContactName("Sunita Mehta (Mother)")
                .emergencyContactPhone("+91 98765 00001")
                .bloodGroup("O+")
                .address("Flat 402, Prestige Palms, Indiranagar")
                .fitnessGoals("Build 5kg lean muscle, improve cardiovascular endurance")
                .medicalHistory("Mild asthma in childhood, currently asymptomatic")
                .assignedTrainer(trainer)
                .joinDate(LocalDate.of(2026, 1, 15))
                .status(MemberStatus.ACTIVE)
                .qrCodeData("FITPULSE:MEM-2026-0001:AUTH_SECURE_TOKEN_9981")
                .notes("Very consistent, attends 5 days a week.")
                .build());

        User member2 = userRepository.save(User.builder()
                .username("member_ananya")
                .email("ananya.iyer@gmail.com")
                .password(passwordEncoder.encode("Member@123"))
                .fullName("Ananya Iyer")
                .phone("+91 98765 56789")
                .role(RoleType.ROLE_MEMBER)
                .branch(b2)
                .enabled(true)
                .build());

        MemberProfile mp2 = memberProfileRepository.save(MemberProfile.builder()
                .user(member2)
                .memberCode("MEM-2026-0002")
                .dateOfBirth(LocalDate.of(1999, 11, 23))
                .gender("FEMALE")
                .emergencyContactName("Karthik Iyer (Brother)")
                .emergencyContactPhone("+91 98765 00002")
                .bloodGroup("B+")
                .address("Villa 12, Koramangala 3rd Block")
                .fitnessGoals("Fat loss, core conditioning, flexibility")
                .medicalHistory("None")
                .assignedTrainer(trainer)
                .joinDate(LocalDate.of(2026, 2, 1))
                .status(MemberStatus.ACTIVE)
                .qrCodeData("FITPULSE:MEM-2026-0002:AUTH_SECURE_TOKEN_9982")
                .notes("Enjoys Zumba and HIIT classes.")
                .build());

        // 4. Membership Plans
        MembershipPlan planMonthly = planRepository.save(MembershipPlan.builder()
                .name("Monthly Standard Fitness")
                .code("PLAN-MON-STD")
                .description("Access to gym floor, cardio zone, and locker facilities for 30 days.")
                .durationType(PlanDurationType.MONTHLY)
                .durationDays(30)
                .category(PlanCategory.GENERAL)
                .basePrice(new BigDecimal("2500.00"))
                .taxPercent(new BigDecimal("18.00"))
                .totalAmount(new BigDecimal("2950.00"))
                .maxFreezes(0)
                .maxFreezeDays(0)
                .active(true)
                .build());

        MembershipPlan planQuarterly = planRepository.save(MembershipPlan.builder()
                .name("Quarterly Pro Fitness")
                .code("PLAN-QTR-PRO")
                .description("90 days unlimited gym floor access + 1 complimentary diet consultation.")
                .durationType(PlanDurationType.QUARTERLY)
                .durationDays(90)
                .category(PlanCategory.GENERAL)
                .basePrice(new BigDecimal("6500.00"))
                .taxPercent(new BigDecimal("18.00"))
                .totalAmount(new BigDecimal("7670.00"))
                .maxFreezes(1)
                .maxFreezeDays(15)
                .active(true)
                .build());

        MembershipPlan planAnnual = planRepository.save(MembershipPlan.builder()
                .name("Annual Diamond Elite")
                .code("PLAN-ANN-ELITE")
                .description("365 days multi-branch access, group classes, sauna, and 5 guest passes.")
                .durationType(PlanDurationType.ANNUAL)
                .durationDays(365)
                .category(PlanCategory.GENERAL)
                .basePrice(new BigDecimal("18000.00"))
                .taxPercent(new BigDecimal("18.00"))
                .totalAmount(new BigDecimal("21240.00"))
                .guestPasses(5)
                .maxFreezes(2)
                .maxFreezeDays(30)
                .active(true)
                .build());

        MembershipPlan planPT = planRepository.save(MembershipPlan.builder()
                .name("Personal Training Package (12 Sessions)")
                .code("PLAN-PT-12")
                .description("12 dedicated 1-on-1 sessions with a certified senior fitness coach.")
                .durationType(PlanDurationType.CUSTOM)
                .durationDays(60)
                .category(PlanCategory.PERSONAL_TRAINING)
                .basePrice(new BigDecimal("12000.00"))
                .taxPercent(new BigDecimal("18.00"))
                .totalAmount(new BigDecimal("14160.00"))
                .maxFreezes(1)
                .maxFreezeDays(15)
                .active(true)
                .build());

        // 5. Active Subscriptions, Payments & Invoices
        Subscription sub1 = subscriptionRepository.save(Subscription.builder()
                .member(member1)
                .plan(planAnnual)
                .branch(b1)
                .startDate(LocalDate.of(2026, 1, 15))
                .endDate(LocalDate.of(2027, 1, 14))
                .originalEndDate(LocalDate.of(2027, 1, 14))
                .status(SubscriptionStatus.ACTIVE)
                .freezesUsed(0)
                .totalAmount(new BigDecimal("21240.00"))
                .paidAmount(new BigDecimal("21240.00"))
                .outstandingAmount(BigDecimal.ZERO)
                .notes("Annual paid in full via UPI")
                .build());

        Payment pay1 = paymentRepository.save(Payment.builder()
                .transactionId("TXN-20260115-0012")
                .subscription(sub1)
                .member(member1)
                .branch(b1)
                .amount(new BigDecimal("18000.00"))
                .taxAmount(new BigDecimal("3240.00"))
                .discountAmount(BigDecimal.ZERO)
                .netAmount(new BigDecimal("21240.00"))
                .paymentMethod(PaymentMethod.UPI)
                .paymentStatus(PaymentStatus.PAID)
                .paymentDate(LocalDateTime.of(2026, 1, 15, 11, 30))
                .notes("UPI Ref: 401588291039@okhdfcbank")
                .build());

        invoiceRepository.save(Invoice.builder()
                .invoiceNumber("INV-2026-00001")
                .payment(pay1)
                .member(member1)
                .branch(b1)
                .subtotal(new BigDecimal("18000.00"))
                .taxAmount(new BigDecimal("3240.00"))
                .grandTotal(new BigDecimal("21240.00"))
                .invoiceDate(LocalDate.of(2026, 1, 15))
                .status("PAID")
                .build());

        // Sub 2 for Member 2 (Quarterly with partial payment for demonstration)
        Subscription sub2 = subscriptionRepository.save(Subscription.builder()
                .member(member2)
                .plan(planQuarterly)
                .branch(b2)
                .startDate(LocalDate.of(2026, 2, 1))
                .endDate(LocalDate.of(2026, 5, 1))
                .originalEndDate(LocalDate.of(2026, 5, 1))
                .status(SubscriptionStatus.ACTIVE)
                .freezesUsed(0)
                .totalAmount(new BigDecimal("7670.00"))
                .paidAmount(new BigDecimal("5000.00"))
                .outstandingAmount(new BigDecimal("2670.00")) // Demonstrates outstanding balance tracking!
                .notes("Partially paid. Installment balance due by end of month.")
                .build());

        Payment pay2 = paymentRepository.save(Payment.builder()
                .transactionId("TXN-20260201-0089")
                .subscription(sub2)
                .member(member2)
                .branch(b2)
                .amount(new BigDecimal("4237.29"))
                .taxAmount(new BigDecimal("762.71"))
                .discountAmount(BigDecimal.ZERO)
                .netAmount(new BigDecimal("5000.00"))
                .paymentMethod(PaymentMethod.CARD)
                .paymentStatus(PaymentStatus.PAID)
                .paymentDate(LocalDateTime.of(2026, 2, 1, 16, 45))
                .notes("HDFC Bank Visa ending in 4112")
                .build());

        invoiceRepository.save(Invoice.builder()
                .invoiceNumber("INV-2026-00002")
                .payment(pay2)
                .member(member2)
                .branch(b2)
                .subtotal(new BigDecimal("4237.29"))
                .taxAmount(new BigDecimal("762.71"))
                .grandTotal(new BigDecimal("5000.00"))
                .invoiceDate(LocalDate.of(2026, 2, 1))
                .status("PARTIALLY_PAID")
                .build());

        // 6. Attendance seed
        attendanceRepository.save(Attendance.builder()
                .member(member1)
                .branch(b1)
                .checkInTime(LocalDateTime.now().minusHours(2))
                .checkOutTime(LocalDateTime.now().minusMinutes(45))
                .status(AttendanceStatus.CHECKED_OUT)
                .verificationMethod("QR")
                .notes("Scanned mobile QR badge")
                .build());

        attendanceRepository.save(Attendance.builder()
                .member(member2)
                .branch(b2)
                .checkInTime(LocalDateTime.now().minusMinutes(50))
                .status(AttendanceStatus.CHECKED_IN)
                .verificationMethod("QR")
                .notes("Currently active in gym floor")
                .build());

        // 7. Exercises
        Exercise exBench = exerciseRepository.save(Exercise.builder()
                .name("Barbell Bench Press")
                .muscleGroup(MuscleGroup.CHEST)
                .equipmentNeeded("Flat Bench, Olympic Barbell, Weight Plates")
                .difficulty(ExerciseDifficulty.INTERMEDIATE)
                .instructions("Lie flat on the bench. Grip bar with thumbs around. Lower bar to mid-chest with control, press back up explosively.")
                .mediaUrl("https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600")
                .build());

        Exercise exSquat = exerciseRepository.save(Exercise.builder()
                .name("Barbell Back Squat")
                .muscleGroup(MuscleGroup.LEGS)
                .equipmentNeeded("Squat Rack, Barbell")
                .difficulty(ExerciseDifficulty.INTERMEDIATE)
                .instructions("Place bar across upper traps. Break at hips and knees, descent below parallel, drive through whole foot.")
                .mediaUrl("https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600")
                .build());

        Exercise exDeadlift = exerciseRepository.save(Exercise.builder()
                .name("Conventional Deadlift")
                .muscleGroup(MuscleGroup.BACK)
                .equipmentNeeded("Barbell, Bumper Plates")
                .difficulty(ExerciseDifficulty.ADVANCED)
                .instructions("Stand with shins 1 inch from bar. Hinge hips back, grasp bar outside knees. Pull chest high, drive floor away.")
                .mediaUrl("https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600")
                .build());

        Exercise exOverhead = exerciseRepository.save(Exercise.builder()
                .name("Overhead Military Press")
                .muscleGroup(MuscleGroup.SHOULDERS)
                .equipmentNeeded("Barbell")
                .difficulty(ExerciseDifficulty.INTERMEDIATE)
                .instructions("Hold bar at clavicle level. Brace core and glutes. Press bar vertically overhead until elbows lock out.")
                .mediaUrl("https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600")
                .build());

        Exercise exPullup = exerciseRepository.save(Exercise.builder()
                .name("Pull-ups")
                .muscleGroup(MuscleGroup.BACK)
                .equipmentNeeded("Pull-up Bar")
                .difficulty(ExerciseDifficulty.INTERMEDIATE)
                .instructions("Grip bar overhand slightly wider than shoulders. Pull chin above bar, squeezing lats. Lower under full control.")
                .mediaUrl("https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600")
                .build());

        // 8. Reusable Workout Plan Template
        WorkoutPlan wp = workoutPlanRepository.save(WorkoutPlan.builder()
                .name("5-Day Push/Pull/Legs Hypertrophy Split")
                .description("Optimized 5-day split focusing on progressive overload and muscle hypertrophy.")
                .createdBy(trainer)
                .member(null)
                .isTemplate(true)
                .targetGoal("Muscle Hypertrophy")
                .startDate(LocalDate.now())
                .active(true)
                .build());

        WorkoutPlanDay d1 = workoutPlanDayRepository.save(WorkoutPlanDay.builder().workoutPlan(wp).dayOfWeek(1).dayName("Push Day (Chest, Shoulders, Triceps)").isRestDay(false).build());
        WorkoutPlanDay d2 = workoutPlanDayRepository.save(WorkoutPlanDay.builder().workoutPlan(wp).dayOfWeek(2).dayName("Pull Day (Back & Biceps)").isRestDay(false).build());
        WorkoutPlanDay d3 = workoutPlanDayRepository.save(WorkoutPlanDay.builder().workoutPlan(wp).dayOfWeek(3).dayName("Legs & Core Day").isRestDay(false).build());
        WorkoutPlanDay d4 = workoutPlanDayRepository.save(WorkoutPlanDay.builder().workoutPlan(wp).dayOfWeek(4).dayName("Rest & Active Recovery").isRestDay(true).build());
        WorkoutPlanDay d5 = workoutPlanDayRepository.save(WorkoutPlanDay.builder().workoutPlan(wp).dayOfWeek(5).dayName("Full Body Power").isRestDay(false).build());

        workoutPlanExerciseRepository.save(WorkoutPlanExercise.builder().workoutPlanDay(d1).exercise(exBench).sets(4).reps(10).weightKg(new BigDecimal("70.0")).restTimeSeconds(90).orderIndex(1).build());
        workoutPlanExerciseRepository.save(WorkoutPlanExercise.builder().workoutPlanDay(d1).exercise(exOverhead).sets(3).reps(12).weightKg(new BigDecimal("40.0")).restTimeSeconds(60).orderIndex(2).build());
        workoutPlanExerciseRepository.save(WorkoutPlanExercise.builder().workoutPlanDay(d2).exercise(exPullup).sets(4).reps(8).weightKg(BigDecimal.ZERO).restTimeSeconds(90).orderIndex(1).build());
        workoutPlanExerciseRepository.save(WorkoutPlanExercise.builder().workoutPlanDay(d3).exercise(exSquat).sets(4).reps(8).weightKg(new BigDecimal("90.0")).restTimeSeconds(120).orderIndex(1).build());
        workoutPlanExerciseRepository.save(WorkoutPlanExercise.builder().workoutPlanDay(d5).exercise(exDeadlift).sets(3).reps(5).weightKg(new BigDecimal("120.0")).restTimeSeconds(150).orderIndex(1).build());

        // Assign plan to member1
        WorkoutPlan memberPlan = workoutPlanRepository.save(WorkoutPlan.builder()
                .name("Arjun's Personalized Hypertrophy Plan")
                .description("Customized based on 5-Day PPL split with emphasis on upper chest and hamstring strength.")
                .createdBy(trainer)
                .member(member1)
                .isTemplate(false)
                .targetGoal("Hypertrophy")
                .startDate(LocalDate.now())
                .active(true)
                .build());

        // 9. Diet Plan Template
        DietPlan dp = dietPlanRepository.save(DietPlan.builder()
                .name("Indian High-Protein Eggetarian Clean Bulk (2400 kcal)")
                .description("Balanced Indian diet plan designed to deliver 150g protein per day using whole foods.")
                .createdBy(nutritionist)
                .member(null)
                .isTemplate(true)
                .dailyCalories(2400)
                .proteinGrams(150)
                .carbsGrams(280)
                .fatGrams(65)
                .dietaryPreference(DietaryPreference.EGGETARIAN)
                .allergyAlerts("Contains Dairy, Eggs, Nuts")
                .startDate(LocalDate.now())
                .active(true)
                .build());

        dietMealItemRepository.save(DietMealItem.builder().dietPlan(dp).mealTime(MealTime.BREAKFAST).foodName("Oatmeal with Almond Milk & Chia Seeds").quantity("80g Oats, 250ml milk, 15g Chia").calories(420).proteinGrams(18).carbsGrams(65).fatGrams(10).build());
        dietMealItemRepository.save(DietMealItem.builder().dietPlan(dp).mealTime(MealTime.MID_MORNING).foodName("Boiled Whole Eggs & Fruit").quantity("3 Whole Eggs + 1 Apple").calories(290).proteinGrams(19).carbsGrams(25).fatGrams(15).build());
        dietMealItemRepository.save(DietMealItem.builder().dietPlan(dp).mealTime(MealTime.LUNCH).foodName("Brown Rice, Dal Tadka, Paneer Bhurji & Salad").quantity("1.5 cup rice, 1 cup dal, 150g paneer").calories(750).proteinGrams(42).carbsGrams(85).fatGrams(24).build());
        dietMealItemRepository.save(DietMealItem.builder().dietPlan(dp).mealTime(MealTime.POST_WORKOUT).foodName("Whey Protein Shake with Banana").quantity("1 Scoop Whey (25g) + 1 Banana").calories(240).proteinGrams(26).carbsGrams(30).fatGrams(2).build());
        dietMealItemRepository.save(DietMealItem.builder().dietPlan(dp).mealTime(MealTime.DINNER).foodName("Whole Wheat Roti, Mixed Vegetable & Tofu/Soya").quantity("3 Rotis, 150g Soya chunks curry").calories(700).proteinGrams(45).carbsGrams(75).fatGrams(14).build());

        // 10. Fitness Measurements & Goals
        measurementRepository.save(FitnessMeasurement.builder()
                .member(member1)
                .recordedDate(LocalDate.now().minusMonths(2))
                .weightKg(new BigDecimal("78.50"))
                .heightCm(new BigDecimal("178.00"))
                .bmi(new BigDecimal("24.78"))
                .bodyFatPercent(new BigDecimal("18.50"))
                .chestCm(new BigDecimal("98.00"))
                .waistCm(new BigDecimal("86.00"))
                .bicepCm(new BigDecimal("34.50"))
                .thighsCm(new BigDecimal("57.00"))
                .notes("Baseline body composition scan.")
                .build());

        measurementRepository.save(FitnessMeasurement.builder()
                .member(member1)
                .recordedDate(LocalDate.now())
                .weightKg(new BigDecimal("76.20"))
                .heightCm(new BigDecimal("178.00"))
                .bmi(new BigDecimal("24.05"))
                .bodyFatPercent(new BigDecimal("16.00"))
                .chestCm(new BigDecimal("100.50"))
                .waistCm(new BigDecimal("82.00"))
                .bicepCm(new BigDecimal("36.00"))
                .thighsCm(new BigDecimal("58.50"))
                .notes("Significant waist reduction, increased chest and bicep size.")
                .build());

        goalRepository.save(FitnessGoal.builder()
                .member(member1)
                .goalType(GoalType.WEIGHT_LOSS)
                .targetValue(new BigDecimal("74.00"))
                .currentValue(new BigDecimal("76.20"))
                .unit("kg")
                .targetDate(LocalDate.now().plusMonths(2))
                .status(GoalStatus.IN_PROGRESS)
                .description("Reach 74kg with visible abdominal definition")
                .build());

        // 11. Group Classes & Bookings
        GroupClass c1 = classRepository.save(GroupClass.builder()
                .branch(b1)
                .trainer(trainer)
                .name("Zumba Energy Blast")
                .description("High-octane Latin dance cardio fitness workout.")
                .roomName("Studio 1 - Aerobics")
                .capacity(20)
                .startTime(LocalTime.of(18, 0))
                .endTime(LocalTime.of(19, 0))
                .dayOfWeek(1)
                .recurring(true)
                .active(true)
                .build());

        GroupClass c2 = classRepository.save(GroupClass.builder()
                .branch(b1)
                .trainer(trainer)
                .name("HIIT & Functional Conditioning")
                .description("Interval training with kettlebells, battle ropes, and plyo boxes.")
                .roomName("Studio 2 - Turf Zone")
                .capacity(15)
                .startTime(LocalTime.of(7, 0))
                .endTime(LocalTime.of(8, 0))
                .dayOfWeek(3)
                .recurring(true)
                .active(true)
                .build());

        bookingRepository.save(ClassBooking.builder()
                .groupClass(c1)
                .member(member2)
                .bookingDate(LocalDate.now())
                .classDate(LocalDate.now())
                .status(ClassBookingStatus.CONFIRMED)
                .build());

        // 12. Equipment & Inventory
        Equipment eq1 = equipmentRepository.save(Equipment.builder()
                .branch(b1)
                .name("Technogym Excite Live Run Treadmill")
                .serialNumber("TG-EX-2024-0981")
                .category("Cardio")
                .purchaseDate(LocalDate.of(2024, 2, 10))
                .purchaseCost(new BigDecimal("385000.00"))
                .warrantyExpiryDate(LocalDate.of(2027, 2, 10))
                .status(EquipmentStatus.OPERATIONAL)
                .lastMaintenanceDate(LocalDate.of(2026, 8, 1))
                .nextMaintenanceDate(LocalDate.of(2026, 12, 1))
                .notes("Motor belt lubricated in August 2026.")
                .build());

        Equipment eq2 = equipmentRepository.save(Equipment.builder()
                .branch(b1)
                .name("Hammer Strength Plate-Loaded Leg Press")
                .serialNumber("HS-LP-2024-0412")
                .category("Strength")
                .purchaseDate(LocalDate.of(2024, 2, 10))
                .purchaseCost(new BigDecimal("240000.00"))
                .warrantyExpiryDate(LocalDate.of(2029, 2, 10))
                .status(EquipmentStatus.OPERATIONAL)
                .lastMaintenanceDate(LocalDate.of(2026, 6, 15))
                .nextMaintenanceDate(LocalDate.of(2026, 12, 15))
                .notes("Smooth roller glide, safety catches calibrated.")
                .build());

        inventoryItemRepository.save(InventoryItem.builder()
                .branch(b1)
                .name("Optimum Nutrition Gold Standard 100% Whey 2 lbs (Double Rich Chocolate)")
                .sku("SUP-ON-WHEY-2LB")
                .category("SUPPLEMENTS")
                .unitPrice(new BigDecimal("2800.00"))
                .sellingPrice(new BigDecimal("3499.00"))
                .quantityInStock(14)
                .reorderThreshold(5)
                .active(true)
                .build());

        inventoryItemRepository.save(InventoryItem.builder()
                .branch(b1)
                .name("MuscleBlaze Creatine Monohydrate 250g")
                .sku("SUP-MB-CREA-250G")
                .category("SUPPLEMENTS")
                .unitPrice(new BigDecimal("650.00"))
                .sellingPrice(new BigDecimal("999.00"))
                .quantityInStock(3) // Low stock! <= reorderThreshold
                .reorderThreshold(5)
                .active(true)
                .build());

        inventoryItemRepository.save(InventoryItem.builder()
                .branch(b1)
                .name("FitPulse Premium Stainless Steel Shaker (750ml)")
                .sku("MERCH-SHK-750ML")
                .category("ACCESSORIES")
                .unitPrice(new BigDecimal("320.00"))
                .sellingPrice(new BigDecimal("649.00"))
                .quantityInStock(38)
                .reorderThreshold(10)
                .active(true)
                .build());

        // 13. Operational Expenses
        expenseRepository.save(Expense.builder()
                .branch(b1)
                .category(ExpenseCategory.RENT)
                .title("Commercial Facility Monthly Lease - Indiranagar")
                .description("Lease rental for 6,500 sq ft ground floor gym premises")
                .amount(new BigDecimal("120000.00"))
                .expenseDate(LocalDate.of(2026, 10, 1))
                .vendorName("Prestige Estates Commercial Leasing Ltd")
                .isRecurring(true)
                .recurringFrequency("MONTHLY")
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .recordedBy(accountant)
                .build());

        expenseRepository.save(Expense.builder()
                .branch(b1)
                .category(ExpenseCategory.UTILITIES)
                .title("BESCOM Commercial Electricity Bill - Sept 2026")
                .description("HV Commercial 3-Phase power consumption for AC, lights, cardio")
                .amount(new BigDecimal("28450.00"))
                .expenseDate(LocalDate.of(2026, 10, 5))
                .vendorName("Bangalore Electricity Supply Company (BESCOM)")
                .isRecurring(true)
                .recurringFrequency("MONTHLY")
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .recordedBy(accountant)
                .build());

        // 14. Notifications
        notificationRepository.save(Notification.builder()
                .recipient(member1)
                .title("Welcome to FitPulse Central!")
                .message("Your Annual Diamond Elite membership is active. Enjoy workouts, group classes, and your personal mobile QR pass!")
                .type(NotificationType.ANNOUNCEMENT)
                .channel(NotificationChannel.IN_APP)
                .isRead(false)
                .isSent(true)
                .sentTime(LocalDateTime.now().minusDays(1))
                .build());

        log.info("Seed data initialization completed successfully!");
    }
}
