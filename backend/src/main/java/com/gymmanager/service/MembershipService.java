package com.gymmanager.service;

import com.gymmanager.dto.FreezeSubscriptionRequest;
import com.gymmanager.dto.MembershipPlanDto;
import com.gymmanager.dto.PurchasePlanRequest;
import com.gymmanager.dto.SubscriptionDto;
import com.gymmanager.entity.*;
import com.gymmanager.enums.*;
import com.gymmanager.exception.BadRequestException;
import com.gymmanager.exception.ResourceNotFoundException;
import com.gymmanager.repository.*;
import com.gymmanager.util.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MembershipService {

    private final MembershipPlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final MemberProfileRepository memberProfileRepository;
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final AuditLogRepository auditLogRepository;
    private final SecurityUtils securityUtils;

    public MembershipService(MembershipPlanRepository planRepository,
                             SubscriptionRepository subscriptionRepository,
                             UserRepository userRepository,
                             BranchRepository branchRepository,
                             MemberProfileRepository memberProfileRepository,
                             PaymentRepository paymentRepository,
                             InvoiceRepository invoiceRepository,
                             AuditLogRepository auditLogRepository,
                             SecurityUtils securityUtils) {
        this.planRepository = planRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
        this.memberProfileRepository = memberProfileRepository;
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
        this.auditLogRepository = auditLogRepository;
        this.securityUtils = securityUtils;
    }

    // --- PLANS ---
    @Transactional
    public MembershipPlanDto createPlan(MembershipPlanDto dto) {
        Branch branch = null;
        if (dto.getBranchId() != null) {
            branch = branchRepository.findById(dto.getBranchId()).orElse(null);
        }

        BigDecimal taxRate = dto.getTaxPercent() != null ? dto.getTaxPercent() : new BigDecimal("18.00");
        BigDecimal taxAmount = dto.getBasePrice().multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal total = dto.getBasePrice().add(taxAmount);

        MembershipPlan plan = MembershipPlan.builder()
                .name(dto.getName())
                .code(dto.getCode().toUpperCase())
                .description(dto.getDescription())
                .branch(branch)
                .durationType(dto.getDurationType())
                .durationDays(dto.getDurationDays() != null && dto.getDurationDays() > 0 ? dto.getDurationDays() : dto.getDurationType().getDefaultDays())
                .category(dto.getCategory() != null ? dto.getCategory() : PlanCategory.GENERAL)
                .basePrice(dto.getBasePrice())
                .taxPercent(taxRate)
                .totalAmount(total)
                .discountPercent(dto.getDiscountPercent() != null ? dto.getDiscountPercent() : BigDecimal.ZERO)
                .guestPasses(dto.getGuestPasses() != null ? dto.getGuestPasses() : 0)
                .maxFreezes(dto.getMaxFreezes() != null ? dto.getMaxFreezes() : 1)
                .maxFreezeDays(dto.getMaxFreezeDays() != null ? dto.getMaxFreezeDays() : 30)
                .active(dto.getActive() != null ? dto.getActive() : true)
                .build();

        plan = planRepository.save(plan);
        return mapPlanToDto(plan);
    }

    @Transactional(readOnly = true)
    public List<MembershipPlanDto> getActivePlans(Long branchId) {
        return planRepository.findActivePlansForBranch(branchId).stream()
                .map(this::mapPlanToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MembershipPlanDto> getAllPlans() {
        return planRepository.findAll().stream()
                .map(this::mapPlanToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public SubscriptionDto purchaseOrRenewSubscription(PurchasePlanRequest request) {
        User member = memberProfileRepository.findById(request.getMemberId())
                .map(MemberProfile::getUser)
                .or(() -> userRepository.findById(request.getMemberId()))
                .orElseThrow(() -> new ResourceNotFoundException("Member not found with ID: " + request.getMemberId()));

        MembershipPlan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found with ID: " + request.getPlanId()));

        Branch branch = member.getBranch();
        if (request.getBranchId() != null) {
            branch = branchRepository.findById(request.getBranchId()).orElse(branch);
        }
        if (branch == null) {
            branch = branchRepository.findAll().stream().findFirst().orElse(null);
        }

        LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.now();

        // Check if there is already an active subscription to calculate renewal start date
        Subscription existingActive = subscriptionRepository.findActiveSubscriptionForMember(member.getId(), LocalDate.now()).orElse(null);
        if (existingActive != null && existingActive.getEndDate().isAfter(startDate)) {
            // Renewal starts right after existing subscription expires
            startDate = existingActive.getEndDate().plusDays(1);
        }

        LocalDate endDate = startDate.plusDays(plan.getDurationDays() - 1);

        BigDecimal discount = request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal totalAmount = plan.getTotalAmount().subtract(discount).max(BigDecimal.ZERO);

        BigDecimal paidAmount = request.getPaidAmount() != null ? request.getPaidAmount() : totalAmount;
        BigDecimal outstandingAmount = totalAmount.subtract(paidAmount).max(BigDecimal.ZERO);

        Subscription subscription = Subscription.builder()
                .member(member)
                .plan(plan)
                .branch(branch)
                .startDate(startDate)
                .endDate(endDate)
                .originalEndDate(endDate)
                .status(SubscriptionStatus.ACTIVE)
                .freezesUsed(0)
                .totalAmount(totalAmount)
                .paidAmount(paidAmount)
                .outstandingAmount(outstandingAmount)
                .notes(request.getNotes())
                .build();
        subscription = subscriptionRepository.save(subscription);

        // Update Member status to ACTIVE
        memberProfileRepository.findByUserId(member.getId()).ifPresent(profile -> {
            profile.setStatus(MemberStatus.ACTIVE);
            memberProfileRepository.save(profile);
        });

        // Record payment if paidAmount > 0
        if (paidAmount.compareTo(BigDecimal.ZERO) > 0) {
            String txId = "TXN-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 900 + 100);
            PaymentMethod method = request.getPaymentMethod() != null ? request.getPaymentMethod() : PaymentMethod.CASH;

            BigDecimal base = paidAmount.divide(new BigDecimal("1.18"), 2, RoundingMode.HALF_UP);
            BigDecimal tax = paidAmount.subtract(base);

            Payment payment = Payment.builder()
                    .transactionId(txId)
                    .subscription(subscription)
                    .member(member)
                    .branch(branch)
                    .amount(base)
                    .taxAmount(tax)
                    .discountAmount(discount)
                    .netAmount(paidAmount)
                    .paymentMethod(method)
                    .paymentStatus(PaymentStatus.PAID)
                    .idempotencyKey(request.getIdempotencyKey() != null ? request.getIdempotencyKey() : UUID.randomUUID().toString())
                    .paymentDate(LocalDateTime.now())
                    .notes("Payment for " + plan.getName())
                    .build();
            payment = paymentRepository.save(payment);

            // Generate Tax Invoice
            String invNum = "INV-" + LocalDate.now().getYear() + "-" + String.format("%05d", payment.getId());
            Invoice invoice = Invoice.builder()
                    .invoiceNumber(invNum)
                    .payment(payment)
                    .member(member)
                    .branch(branch)
                    .subtotal(base)
                    .taxAmount(tax)
                    .discountAmount(discount)
                    .grandTotal(paidAmount)
                    .invoiceDate(LocalDate.now())
                    .dueDate(LocalDate.now())
                    .status("PAID")
                    .build();
            invoiceRepository.save(invoice);
        }

        // Audit Log
        auditLogRepository.save(AuditLog.builder()
                .user(securityUtils.getCurrentUser())
                .action("MEMBERSHIP_PURCHASE")
                .entityName("Subscription")
                .entityId(subscription.getId())
                .branch(branch)
                .details("Purchased plan: " + plan.getName() + " for member " + member.getFullName() + ", Paid: " + paidAmount)
                .build());

        return mapSubscriptionToDto(subscription);
    }

    @Transactional
    public SubscriptionDto freezeSubscription(Long subscriptionId, FreezeSubscriptionRequest request) {
        Subscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with ID: " + subscriptionId));

        if (sub.getStatus() != SubscriptionStatus.ACTIVE) {
            throw new BadRequestException("Only ACTIVE subscriptions can be frozen");
        }

        if (sub.getFreezesUsed() >= sub.getPlan().getMaxFreezes()) {
            throw new BadRequestException("Maximum freeze limit reached (" + sub.getPlan().getMaxFreezes() + " freezes allowed)");
        }

        long freezeDays = ChronoUnit.DAYS.between(request.getFreezeStart(), request.getFreezeEnd()) + 1;
        if (freezeDays > sub.getPlan().getMaxFreezeDays()) {
            throw new BadRequestException("Requested freeze duration (" + freezeDays + " days) exceeds maximum allowed (" + sub.getPlan().getMaxFreezeDays() + " days)");
        }

        sub.setStatus(SubscriptionStatus.FROZEN);
        sub.setFrozenAt(request.getFreezeStart());
        sub.setFreezeEnd(request.getFreezeEnd());
        sub.setFreezesUsed(sub.getFreezesUsed() + 1);
        // Extend end date by freeze duration
        sub.setEndDate(sub.getEndDate().plusDays(freezeDays));
        sub = subscriptionRepository.save(sub);

        // Update member profile status
        memberProfileRepository.findByUserId(sub.getMember().getId()).ifPresent(p -> {
            p.setStatus(MemberStatus.FROZEN);
            memberProfileRepository.save(p);
        });

        // Audit Log
        auditLogRepository.save(AuditLog.builder()
                .user(securityUtils.getCurrentUser())
                .action("MEMBERSHIP_FREEZE")
                .entityName("Subscription")
                .entityId(sub.getId())
                .branch(sub.getBranch())
                .details("Frozen subscription for " + freezeDays + " days. New expiry: " + sub.getEndDate())
                .build());

        return mapSubscriptionToDto(sub);
    }

    @Transactional
    public SubscriptionDto unfreezeSubscription(Long subscriptionId) {
        Subscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with ID: " + subscriptionId));

        if (sub.getStatus() != SubscriptionStatus.FROZEN) {
            throw new BadRequestException("Subscription is not currently frozen");
        }

        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub = subscriptionRepository.save(sub);

        memberProfileRepository.findByUserId(sub.getMember().getId()).ifPresent(p -> {
            p.setStatus(MemberStatus.ACTIVE);
            memberProfileRepository.save(p);
        });

        auditLogRepository.save(AuditLog.builder()
                .user(securityUtils.getCurrentUser())
                .action("MEMBERSHIP_UNFREEZE")
                .entityName("Subscription")
                .entityId(sub.getId())
                .branch(sub.getBranch())
                .details("Unfrozen subscription ID: " + sub.getId())
                .build());

        return mapSubscriptionToDto(sub);
    }

    @Transactional
    public SubscriptionDto cancelSubscription(Long subscriptionId, String reason) {
        Subscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with ID: " + subscriptionId));

        sub.setStatus(SubscriptionStatus.CANCELLED);
        sub.setNotes((sub.getNotes() != null ? sub.getNotes() + "; " : "") + "Cancelled: " + reason);
        sub = subscriptionRepository.save(sub);

        memberProfileRepository.findByUserId(sub.getMember().getId()).ifPresent(p -> {
            p.setStatus(MemberStatus.CANCELLED);
            memberProfileRepository.save(p);
        });

        auditLogRepository.save(AuditLog.builder()
                .user(securityUtils.getCurrentUser())
                .action("MEMBERSHIP_CANCEL")
                .entityName("Subscription")
                .entityId(sub.getId())
                .branch(sub.getBranch())
                .details("Cancelled subscription ID: " + sub.getId() + " Reason: " + reason)
                .build());

        return mapSubscriptionToDto(sub);
    }

    @Transactional(readOnly = true)
    public Page<SubscriptionDto> getSubscriptions(Long branchId, SubscriptionStatus status, Pageable pageable) {
        Long effectiveBranchId = securityUtils.isGymOwnerOrAdmin() ? branchId : securityUtils.getCurrentBranchId();
        return subscriptionRepository.findSubscriptionsWithFilter(effectiveBranchId, status, pageable)
                .map(this::mapSubscriptionToDto);
    }

    @Transactional(readOnly = true)
    public List<SubscriptionDto> getMemberSubscriptions(Long memberId) {
        return subscriptionRepository.findByMemberIdOrderByCreatedAtDesc(memberId).stream()
                .map(this::mapSubscriptionToDto)
                .collect(Collectors.toList());
    }

    private MembershipPlanDto mapPlanToDto(MembershipPlan plan) {
        return MembershipPlanDto.builder()
                .id(plan.getId())
                .branchId(plan.getBranch() != null ? plan.getBranch().getId() : null)
                .branchName(plan.getBranch() != null ? plan.getBranch().getName() : "All Branches")
                .name(plan.getName())
                .code(plan.getCode())
                .description(plan.getDescription())
                .durationType(plan.getDurationType())
                .durationDays(plan.getDurationDays())
                .category(plan.getCategory())
                .basePrice(plan.getBasePrice())
                .taxPercent(plan.getTaxPercent())
                .totalAmount(plan.getTotalAmount())
                .discountPercent(plan.getDiscountPercent())
                .guestPasses(plan.getGuestPasses())
                .maxFreezes(plan.getMaxFreezes())
                .maxFreezeDays(plan.getMaxFreezeDays())
                .active(plan.getActive())
                .build();
    }

    public SubscriptionDto mapSubscriptionToDto(Subscription sub) {
        return SubscriptionDto.builder()
                .id(sub.getId())
                .memberId(sub.getMember().getId())
                .memberName(sub.getMember().getFullName())
                .memberCode(sub.getMember().getUsername())
                .planId(sub.getPlan().getId())
                .planName(sub.getPlan().getName())
                .branchId(sub.getBranch() != null ? sub.getBranch().getId() : null)
                .branchName(sub.getBranch() != null ? sub.getBranch().getName() : "N/A")
                .startDate(sub.getStartDate())
                .endDate(sub.getEndDate())
                .originalEndDate(sub.getOriginalEndDate())
                .status(sub.getStatus())
                .frozenAt(sub.getFrozenAt())
                .freezeEnd(sub.getFreezeEnd())
                .freezesUsed(sub.getFreezesUsed())
                .totalAmount(sub.getTotalAmount())
                .paidAmount(sub.getPaidAmount())
                .outstandingAmount(sub.getOutstandingAmount())
                .notes(sub.getNotes())
                .build();
    }
}
