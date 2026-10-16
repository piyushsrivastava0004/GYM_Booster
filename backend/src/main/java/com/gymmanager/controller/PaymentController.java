package com.gymmanager.controller;

import com.gymmanager.dto.InvoiceDto;
import com.gymmanager.dto.PaymentDto;
import com.gymmanager.dto.PaymentRecordRequest;
import com.gymmanager.dto.RazorpayOrderRequest;
import com.gymmanager.dto.RefundRequest;
import com.gymmanager.entity.Invoice;
import com.gymmanager.enums.PaymentStatus;
import com.gymmanager.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping
@Tag(name = "Payments & Invoices", description = "Endpoints for point-of-sale payments, Razorpay online gateway, refunds, and PDF invoices")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/payments/record")
    @Operation(summary = "Record a payment (Cash, UPI, Card, Bank Transfer)")
    public ResponseEntity<PaymentDto> recordPayment(@Valid @RequestBody PaymentRecordRequest request) {
        return ResponseEntity.ok(paymentService.recordPayment(request));
    }

    @PostMapping("/payments/razorpay/create-order")
    @Operation(summary = "Create a Razorpay order for online payment")
    public ResponseEntity<Map<String, Object>> createRazorpayOrder(@Valid @RequestBody RazorpayOrderRequest request) {
        return ResponseEntity.ok(paymentService.createRazorpayOrder(request));
    }

    @PostMapping("/payments/razorpay/verify")
    @Operation(summary = "Verify Razorpay payment signature and complete transaction")
    public ResponseEntity<PaymentDto> verifyRazorpayPayment(
            @RequestParam String orderId,
            @RequestParam String paymentId,
            @RequestParam String signature,
            @RequestParam Long memberId,
            @RequestParam(required = false) Long subscriptionId
    ) {
        return ResponseEntity.ok(paymentService.verifyAndCompleteRazorpayPayment(orderId, paymentId, signature, memberId, subscriptionId));
    }

    @PostMapping("/payments/refund")
    @Operation(summary = "Process a refund for a transaction")
    public ResponseEntity<PaymentDto> processRefund(@Valid @RequestBody RefundRequest request) {
        return ResponseEntity.ok(paymentService.processRefund(request));
    }

    @GetMapping("/payments")
    @Operation(summary = "Get payment transaction history with filters")
    public ResponseEntity<Page<PaymentDto>> getPayments(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        return ResponseEntity.ok(paymentService.getPayments(branchId, status, start, end, PageRequest.of(page, size, Sort.by("paymentDate").descending())));
    }

    @GetMapping("/payments/member/{memberId}")
    @Operation(summary = "Get payments for a specific member")
    public ResponseEntity<List<PaymentDto>> getMemberPayments(@PathVariable Long memberId) {
        return ResponseEntity.ok(paymentService.getMemberPayments(memberId));
    }

    @GetMapping("/invoices/member/{memberId}")
    @Operation(summary = "Get invoices for a specific member")
    public ResponseEntity<List<InvoiceDto>> getMemberInvoices(@PathVariable Long memberId) {
        return ResponseEntity.ok(paymentService.getMemberInvoices(memberId));
    }

    @GetMapping("/invoices/{invoiceId}/pdf")
    @Operation(summary = "Download server-side generated Tax Invoice PDF")
    public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long invoiceId) {
        byte[] pdfBytes = paymentService.getInvoicePdf(invoiceId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "invoice-" + invoiceId + ".pdf");
        return ResponseEntity.ok().headers(headers).body(pdfBytes);
    }
}
