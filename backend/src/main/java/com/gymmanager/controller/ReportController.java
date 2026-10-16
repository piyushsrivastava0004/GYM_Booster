package com.gymmanager.controller;

import com.gymmanager.dto.DashboardMetricsDto;
import com.gymmanager.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping
@Tag(name = "Reports & Analytics", description = "Endpoints for live dashboard metrics, charts, CSV and Excel file downloads")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/dashboard/metrics")
    @Operation(summary = "Get live database-calculated dashboard metrics, charts, and activity")
    public ResponseEntity<DashboardMetricsDto> getDashboardMetrics(@RequestParam(required = false) Long branchId) {
        return ResponseEntity.ok(reportService.getDashboardMetrics(branchId));
    }

    @GetMapping("/reports/members/csv")
    @Operation(summary = "Export member directory to CSV file")
    public ResponseEntity<byte[]> exportMembersCsv(@RequestParam(required = false) Long branchId) {
        byte[] csvData = reportService.exportMembersCsv(branchId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "members_export.csv");
        return ResponseEntity.ok().headers(headers).body(csvData);
    }

    @GetMapping("/reports/members/excel")
    @Operation(summary = "Export member directory to Excel (.xlsx) file")
    public ResponseEntity<byte[]> exportMembersExcel(@RequestParam(required = false) Long branchId) {
        byte[] excelData = reportService.exportMembersExcel(branchId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", "members_report.xlsx");
        return ResponseEntity.ok().headers(headers).body(excelData);
    }

    @GetMapping("/reports/payments/csv")
    @Operation(summary = "Export financial payments to CSV file")
    public ResponseEntity<byte[]> exportPaymentsCsv(@RequestParam(required = false) Long branchId) {
        byte[] csvData = reportService.exportPaymentsCsv(branchId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "payments_export.csv");
        return ResponseEntity.ok().headers(headers).body(csvData);
    }
}
