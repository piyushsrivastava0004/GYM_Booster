package com.gymmanager.service;

import com.gymmanager.config.RazorpayConfig;
import com.gymmanager.dto.InvoiceDto;
import com.gymmanager.dto.PaymentDto;
import com.gymmanager.dto.PaymentRecordRequest;
import com.gymmanager.dto.RazorpayOrderRequest;
import com.gymmanager.dto.RefundRequest;
import com.gymmanager.entity.*;
import com.gymmanager.enums.PaymentMethod;
import com.gymmanager.enums.PaymentStatus;
import com.gymmanager.exception.BadRequestException;
import com.gymmanager.exception.ResourceNotFoundException;
import com.gymmanager.repository.*;
import com.gymmanager.util.PdfReportGenerator;
import com.gymmanager.util.SecurityUtils;
import com.razorpay.Order;
import org.json.JSONObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final InvoiceRepository invoiceRepository;
    private final RefundRepository refundRepository;
    private final MemberProfileRepository memberProfileRepository;
    private final AuditLogRepository auditLogRepository;
    private final RazorpayConfig razorpayConfig;
    private final PdfReportGenerator pdfReportGenerator;
    private final SecurityUtils securityUtils;

    public PaymentService(PaymentRepository paymentRepository,
                          SubscriptionRepository subscriptionRepository,
                          UserRepository userRepository,
                          BranchRepository branchRepository,
                          InvoiceRepository invoiceRepository,
                          RefundRepository refundRepository,
                          MemberProfileRepository memberProfileRepository,
                          AuditLogRepository auditLogRepository,
                          RazorpayConfig razorpayConfig,
                          PdfReportGenerator pdfReportGenerator,
                          SecurityUtils securityUtils) {
        this.paymentRepository = paymentRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
        this.invoiceRepository = invoiceRepository;
        this.refundRepository = refundRepository;
        this.memberProfileRepository = memberProfileRepository;
        this.auditLogRepository = auditLogRepository;
        this.razorpayConfig = razorpayConfig;
        this.pdfReportGenerator = pdfReportGenerator;
        this.securityUtils = securityUtils;
    }

    @Transactional
    public PaymentDto recordPayment(PaymentRecordRequest request) {
        // Idempotency check
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()) {
            var existing = paymentRepository.findByIdempotencyKey(request.getIdempotencyKey());
            if (existing.isPresent()) {
                return mapPaymentToDto(existing.get());
            }
        }

        User member = memberProfileRepository.findById(request.getMemberId())
                .map(MemberProfile::getUser)
                .or(() -> userRepository.findById(request.getMemberId()))
                .orElseThrow(() -> new ResourceNotFoundException("Member not found with ID: " + request.getMemberId()));

        Subscription subscription = null;
        if (request.getSubscriptionId() != null) {
            subscription = subscriptionRepository.findById(request.getSubscriptionId()).orElse(null);
        }

        Branch branch = member.getBranch();
        if (request.getBranchId() != null) {
            branch = branchRepository.findById(request.getBranchId()).orElse(branch);
        }

        BigDecimal discount = request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal paidAmount = request.getAmount();

        // Standard 18% GST calculation
        BigDecimal baseAmount = paidAmount.divide(new BigDecimal("1.18"), 2, RoundingMode.HALF_UP);
        BigDecimal taxAmount = paidAmount.subtract(baseAmount);

        String txId = "TXN-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 900 + 100);

        Payment payment = Payment.builder()
                .transactionId(txId)
                .subscription(subscription)
                .member(member)
                .branch(branch)
                .amount(baseAmount)
                .taxAmount(taxAmount)
                .discountAmount(discount)
                .netAmount(paidAmount)
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus(PaymentStatus.PAID)
                .idempotencyKey(request.getIdempotencyKey() != null ? request.getIdempotencyKey() : UUID.randomUUID().toString())
                .paymentDate(LocalDateTime.now())
                .notes(request.getNotes())
                .build();
        payment = paymentRepository.save(payment);

        // Update subscription balances if attached
        if (subscription != null) {
            subscription.setPaidAmount(subscription.getPaidAmount().add(paidAmount));
            subscription.setOutstandingAmount(subscription.getOutstandingAmount().subtract(paidAmount).max(BigDecimal.ZERO));
            subscriptionRepository.save(subscription);
        }

        // Generate Tax Invoice
        String invNum = "INV-" + LocalDate.now().getYear() + "-" + String.format("%05d", payment.getId());
        Invoice invoice = Invoice.builder()
                .invoiceNumber(invNum)
                .payment(payment)
                .member(member)
                .branch(branch)
                .subtotal(baseAmount)
                .taxAmount(taxAmount)
                .discountAmount(discount)
                .grandTotal(paidAmount)
                .invoiceDate(LocalDate.now())
                .dueDate(LocalDate.now())
                .status("PAID")
                .build();
        invoiceRepository.save(invoice);

        // Audit Trail
        auditLogRepository.save(AuditLog.builder()
                .user(securityUtils.getCurrentUser())
                .action("PAYMENT_RECORDED")
                .entityName("Payment")
                .entityId(payment.getId())
                .branch(branch)
                .details("Recorded " + request.getPaymentMethod() + " payment of Rs. " + paidAmount + " for member " + member.getFullName())
                .build());

        return mapPaymentToDto(payment);
    }

    // --- RAZORPAY INTEGRATION ---
    public Map<String, Object> createRazorpayOrder(RazorpayOrderRequest request) {
        Map<String, Object> response = new HashMap<>();

        if (!razorpayConfig.isConfigured()) {
            // Development / Test fallback order
            String mockOrderId = "order_test_" + UUID.randomUUID().toString().substring(0, 14);
            response.put("orderId", mockOrderId);
            response.put("amount", request.getAmount().multiply(new BigDecimal("100")).intValue());
            response.put("currency", "INR");
            response.put("keyId", razorpayConfig.getKeyId());
            response.put("status", "created");
            response.put("isTestMode", true);
            return response;
        }

        try {
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", request.getAmount().multiply(new BigDecimal("100")).intValue()); // in paise
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", request.getReceipt() != null ? request.getReceipt() : "rcpt_" + System.currentTimeMillis());

            JSONObject notes = new JSONObject();
            if (request.getMemberId() != null) notes.put("memberId", request.getMemberId().toString());
            if (request.getSubscriptionId() != null) notes.put("subscriptionId", request.getSubscriptionId().toString());
            orderRequest.put("notes", notes);

            Order order = razorpayConfig.getClient().orders.create(orderRequest);
            response.put("orderId", order.get("id"));
            response.put("amount", order.get("amount"));
            response.put("currency", order.get("currency"));
            response.put("keyId", razorpayConfig.getKeyId());
            response.put("status", order.get("status"));
            response.put("isTestMode", false);
            return response;
        } catch (Exception e) {
            throw new BadRequestException("Razorpay order creation failed: " + e.getMessage());
        }
    }

    @Transactional
    public PaymentDto verifyAndCompleteRazorpayPayment(String orderId, String paymentId, String signature, Long memberId, Long subscriptionId) {
        boolean valid = razorpayConfig.verifyPaymentSignature(orderId, paymentId, signature);
        if (!valid) {
            throw new BadRequestException("Razorpay payment signature verification failed!");
        }

        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        Subscription sub = subscriptionId != null ? subscriptionRepository.findById(subscriptionId).orElse(null) : null;
        BigDecimal paidAmount = sub != null ? sub.getTotalAmount() : new BigDecimal("2000.00");

        BigDecimal base = paidAmount.divide(new BigDecimal("1.18"), 2, RoundingMode.HALF_UP);
        BigDecimal tax = paidAmount.subtract(base);

        Payment payment = Payment.builder()
                .transactionId("RZP-" + paymentId)
                .subscription(sub)
                .member(member)
                .branch(member.getBranch())
                .amount(base)
                .taxAmount(tax)
                .discountAmount(BigDecimal.ZERO)
                .netAmount(paidAmount)
                .paymentMethod(PaymentMethod.RAZORPAY)
                .paymentStatus(PaymentStatus.PAID)
                .razorpayOrderId(orderId)
                .razorpayPaymentId(paymentId)
                .razorpaySignature(signature)
                .paymentDate(LocalDateTime.now())
                .notes("Online payment via Razorpay Gateway")
                .build();
        payment = paymentRepository.save(payment);

        if (sub != null) {
            sub.setPaidAmount(sub.getPaidAmount().add(paidAmount));
            sub.setOutstandingAmount(sub.getOutstandingAmount().subtract(paidAmount).max(BigDecimal.ZERO));
            subscriptionRepository.save(sub);
        }

        String invNum = "INV-" + LocalDate.now().getYear() + "-" + String.format("%05d", payment.getId());
        Invoice invoice = Invoice.builder()
                .invoiceNumber(invNum)
                .payment(payment)
                .member(member)
                .branch(member.getBranch())
                .subtotal(base)
                .taxAmount(tax)
                .grandTotal(paidAmount)
                .invoiceDate(LocalDate.now())
                .status("PAID")
                .build();
        invoiceRepository.save(invoice);

        return mapPaymentToDto(payment);
    }

    // --- REFUNDS ---
    @Transactional
    public PaymentDto processRefund(RefundRequest request) {
        Payment payment = paymentRepository.findById(request.getPaymentId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with ID: " + request.getPaymentId()));

        if (payment.getPaymentStatus() == PaymentStatus.REFUNDED) {
            throw new BadRequestException("This transaction has already been refunded");
        }

        if (request.getAmount().compareTo(payment.getNetAmount()) > 0) {
            throw new BadRequestException("Refund amount cannot exceed original payment net amount of Rs. " + payment.getNetAmount());
        }

        Refund refund = Refund.builder()
                .payment(payment)
                .amount(request.getAmount())
                .reason(request.getReason())
                .processedBy(securityUtils.getCurrentUser())
                .refundDate(LocalDateTime.now())
                .transactionReference("REF-" + System.currentTimeMillis())
                .status("COMPLETED")
                .build();
        refundRepository.save(refund);

        payment.setPaymentStatus(PaymentStatus.REFUNDED);
        payment = paymentRepository.save(payment);

        // Adjust subscription outstanding balance
        if (payment.getSubscription() != null) {
            Subscription sub = payment.getSubscription();
            sub.setPaidAmount(sub.getPaidAmount().subtract(request.getAmount()).max(BigDecimal.ZERO));
            sub.setOutstandingAmount(sub.getOutstandingAmount().add(request.getAmount()));
            subscriptionRepository.save(sub);
        }

        // Audit Log
        auditLogRepository.save(AuditLog.builder()
                .user(securityUtils.getCurrentUser())
                .action("PAYMENT_REFUND")
                .entityName("Payment")
                .entityId(payment.getId())
                .branch(payment.getBranch())
                .details("Processed refund of Rs. " + request.getAmount() + " for Txn: " + payment.getTransactionId() + ". Reason: " + request.getReason())
                .build());

        return mapPaymentToDto(payment);
    }

    @Transactional(readOnly = true)
    public Page<PaymentDto> getPayments(Long branchId, PaymentStatus status, LocalDateTime start, LocalDateTime end, Pageable pageable) {
        Long effectiveBranchId = securityUtils.isGymOwnerOrAdmin() ? branchId : securityUtils.getCurrentBranchId();
        LocalDateTime s = start != null ? start : LocalDateTime.now().minusMonths(1);
        LocalDateTime e = end != null ? end : LocalDateTime.now();
        return paymentRepository.findPaymentsWithFilter(effectiveBranchId, status, s, e, pageable)
                .map(this::mapPaymentToDto);
    }

    @Transactional(readOnly = true)
    public List<PaymentDto> getMemberPayments(Long memberId) {
        return paymentRepository.findByMemberIdOrderByPaymentDateDesc(memberId).stream()
                .map(this::mapPaymentToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public byte[] getInvoicePdf(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with ID: " + invoiceId));
        return pdfReportGenerator.generateInvoicePdf(invoice);
    }

    @Transactional(readOnly = true)
    public List<InvoiceDto> getMemberInvoices(Long memberId) {
        Long userId = memberProfileRepository.findById(memberId)
                .map(p -> p.getUser().getId())
                .orElse(memberId);

        return invoiceRepository.findByMemberIdOrderByInvoiceDateDesc(userId).stream()
                .map(this::mapInvoiceToDto)
                .collect(Collectors.toList());
    }

    private InvoiceDto mapInvoiceToDto(Invoice i) {
        return InvoiceDto.builder()
                .id(i.getId())
                .invoiceNumber(i.getInvoiceNumber())
                .memberId(i.getMember().getId())
                .memberName(i.getMember().getFullName())
                .memberEmail(i.getMember().getEmail())
                .branchId(i.getBranch() != null ? i.getBranch().getId() : null)
                .branchName(i.getBranch() != null ? i.getBranch().getName() : "Main Branch")
                .subtotal(i.getSubtotal())
                .taxAmount(i.getTaxAmount())
                .discountAmount(i.getDiscountAmount())
                .grandTotal(i.getGrandTotal())
                .totalAmount(i.getGrandTotal())
                .invoiceDate(i.getInvoiceDate())
                .dueDate(i.getDueDate())
                .status(i.getStatus())
                .paymentMethod(i.getPayment() != null && i.getPayment().getPaymentMethod() != null ? i.getPayment().getPaymentMethod().name() : "UPI")
                .build();
    }

    private PaymentDto mapPaymentToDto(Payment p) {
        String invNum = invoiceRepository.findByPaymentId(p.getId())
                .map(Invoice::getInvoiceNumber)
                .orElse(null);

        return PaymentDto.builder()
                .id(p.getId())
                .transactionId(p.getTransactionId())
                .subscriptionId(p.getSubscription() != null ? p.getSubscription().getId() : null)
                .memberId(p.getMember().getId())
                .memberName(p.getMember().getFullName())
                .memberCode(p.getMember().getUsername())
                .branchId(p.getBranch() != null ? p.getBranch().getId() : null)
                .branchName(p.getBranch() != null ? p.getBranch().getName() : "N/A")
                .amount(p.getAmount())
                .taxAmount(p.getTaxAmount())
                .discountAmount(p.getDiscountAmount())
                .netAmount(p.getNetAmount())
                .paymentMethod(p.getPaymentMethod())
                .paymentStatus(p.getPaymentStatus())
                .razorpayOrderId(p.getRazorpayOrderId())
                .razorpayPaymentId(p.getRazorpayPaymentId())
                .idempotencyKey(p.getIdempotencyKey())
                .paymentDate(p.getPaymentDate())
                .invoiceNumber(invNum)
                .notes(p.getNotes())
                .build();
    }
}
