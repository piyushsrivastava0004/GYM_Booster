package com.gymmanager.controller;

import com.gymmanager.dto.FreezeSubscriptionRequest;
import com.gymmanager.dto.MembershipPlanDto;
import com.gymmanager.dto.PurchasePlanRequest;
import com.gymmanager.dto.SubscriptionDto;
import com.gymmanager.enums.SubscriptionStatus;
import com.gymmanager.service.MembershipService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@Tag(name = "Membership & Plans", description = "Endpoints for membership plans, purchases, renewals, freezes, and cancellations")
public class MembershipController {

    private final MembershipService membershipService;

    public MembershipController(MembershipService membershipService) {
        this.membershipService = membershipService;
    }

    // --- PLANS ---
    @PostMapping("/plans")
    @Operation(summary = "Create a new membership plan")
    public ResponseEntity<MembershipPlanDto> createPlan(@Valid @RequestBody MembershipPlanDto dto) {
        return ResponseEntity.ok(membershipService.createPlan(dto));
    }

    @GetMapping("/plans/public")
    @Operation(summary = "Get active membership plans (public endpoint)")
    public ResponseEntity<List<MembershipPlanDto>> getActivePlans(@RequestParam(required = false) Long branchId) {
        return ResponseEntity.ok(membershipService.getActivePlans(branchId));
    }

    @GetMapping("/plans")
    @Operation(summary = "Get all membership plans")
    public ResponseEntity<List<MembershipPlanDto>> getAllPlans() {
        return ResponseEntity.ok(membershipService.getAllPlans());
    }

    // --- SUBSCRIPTIONS ---
    @PostMapping("/subscriptions/purchase")
    @Operation(summary = "Purchase or renew a membership subscription")
    public ResponseEntity<SubscriptionDto> purchasePlan(@Valid @RequestBody PurchasePlanRequest request) {
        return ResponseEntity.ok(membershipService.purchaseOrRenewSubscription(request));
    }

    @GetMapping("/subscriptions")
    @Operation(summary = "Get subscriptions list with status and branch filter")
    public ResponseEntity<Page<SubscriptionDto>> getSubscriptions(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) SubscriptionStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        return ResponseEntity.ok(membershipService.getSubscriptions(branchId, status, PageRequest.of(page, size, Sort.by("id").descending())));
    }

    @GetMapping("/subscriptions/member/{memberId}")
    @Operation(summary = "Get all subscriptions for a specific member")
    public ResponseEntity<List<SubscriptionDto>> getMemberSubscriptions(@PathVariable Long memberId) {
        return ResponseEntity.ok(membershipService.getMemberSubscriptions(memberId));
    }

    @PostMapping("/subscriptions/{id}/freeze")
    @Operation(summary = "Freeze an active subscription")
    public ResponseEntity<SubscriptionDto> freezeSubscription(@PathVariable Long id, @Valid @RequestBody FreezeSubscriptionRequest request) {
        return ResponseEntity.ok(membershipService.freezeSubscription(id, request));
    }

    @PostMapping("/subscriptions/{id}/unfreeze")
    @Operation(summary = "Unfreeze a frozen subscription")
    public ResponseEntity<SubscriptionDto> unfreezeSubscription(@PathVariable Long id) {
        return ResponseEntity.ok(membershipService.unfreezeSubscription(id));
    }

    @PostMapping("/subscriptions/{id}/cancel")
    @Operation(summary = "Cancel a subscription")
    public ResponseEntity<SubscriptionDto> cancelSubscription(@PathVariable Long id, @RequestParam(defaultValue = "User requested cancellation") String reason) {
        return ResponseEntity.ok(membershipService.cancelSubscription(id, reason));
    }
}
