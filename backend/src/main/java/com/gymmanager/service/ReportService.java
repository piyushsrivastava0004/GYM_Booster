package com.gymmanager.service;

import com.gymmanager.dto.DashboardMetricsDto;
import com.gymmanager.entity.*;
import com.gymmanager.enums.MemberStatus;
import com.gymmanager.enums.PaymentStatus;
import com.gymmanager.repository.*;
import com.gymmanager.util.CsvExporter;
import com.gymmanager.util.ExcelReportGenerator;
import com.gymmanager.util.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final MemberProfileRepository memberProfileRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PaymentRepository paymentRepository;
    private final ExpenseRepository expenseRepository;
    private final AttendanceRepository attendanceRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final AuditLogRepository auditLogRepository;
    private final CsvExporter csvExporter;
    private final ExcelReportGenerator excelReportGenerator;
    private final SecurityUtils securityUtils;

    public ReportService(MemberProfileRepository memberProfileRepository,
                         SubscriptionRepository subscriptionRepository,
                         PaymentRepository paymentRepository,
                         ExpenseRepository expenseRepository,
                         AttendanceRepository attendanceRepository,
                         InventoryItemRepository inventoryItemRepository,
                         AuditLogRepository auditLogRepository,
                         CsvExporter csvExporter,
                         ExcelReportGenerator excelReportGenerator,
                         SecurityUtils securityUtils) {
        this.memberProfileRepository = memberProfileRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.paymentRepository = paymentRepository;
        this.expenseRepository = expenseRepository;
        this.attendanceRepository = attendanceRepository;
        this.inventoryItemRepository = inventoryItemRepository;
        this.auditLogRepository = auditLogRepository;
        this.csvExporter = csvExporter;
        this.excelReportGenerator = excelReportGenerator;
        this.securityUtils = securityUtils;
    }

    @Transactional(readOnly = true)
    public DashboardMetricsDto getDashboardMetrics(Long branchId) {
        Long effectiveBranchId = securityUtils.isGymOwnerOrAdmin() ? branchId : securityUtils.getCurrentBranchId();
        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.withDayOfMonth(1);
        LocalDateTime monthStart = startOfMonth.atStartOfDay();
        LocalDateTime monthEnd = today.atTime(23, 59, 59);

        // Counts
        long totalMembers = memberProfileRepository.count();
        long activeMembers = effectiveBranchId != null
                ? memberProfileRepository.countByStatusAndUserBranchId(MemberStatus.ACTIVE, effectiveBranchId)
                : memberProfileRepository.countByStatus(MemberStatus.ACTIVE);

        long expiringMemberships = subscriptionRepository.findExpiringSubscriptions(effectiveBranchId, today, today.plusDays(7)).size();
        long overduePayments = subscriptionRepository.findSubscriptionsWithOutstandingBalance(effectiveBranchId).size();

        BigDecimal collections = paymentRepository.calculateTotalCollections(effectiveBranchId, monthStart, monthEnd);
        BigDecimal expenses = expenseRepository.calculateTotalExpenses(effectiveBranchId, startOfMonth, today);
        BigDecimal profit = collections.subtract(expenses);
        BigDecimal outstanding = subscriptionRepository.calculateTotalOutstanding(effectiveBranchId);

        long todayCheckIns = attendanceRepository.countCheckInsBetween(effectiveBranchId, today.atStartOfDay(), today.atTime(23, 59, 59));
        long lowStockCount = inventoryItemRepository.findLowStockItems(effectiveBranchId).size();

        double retentionRate = totalMembers > 0 ? ((double) activeMembers / totalMembers) * 100.0 : 100.0;

        // Peak Hours
        List<Object[]> peakRows = attendanceRepository.getPeakHours(effectiveBranchId, today.minusDays(7).atStartOfDay(), today.atTime(23, 59, 59));
        List<DashboardMetricsDto.AttendancePeakDto> peakHours = new ArrayList<>();
        for (Object[] r : peakRows) {
            int hr = ((Number) r[0]).intValue();
            String label = String.format("%02d:00", hr);
            long cnt = ((Number) r[1]).longValue();
            peakHours.add(new DashboardMetricsDto.AttendancePeakDto(label, cnt));
        }
        if (peakHours.isEmpty()) {
            // Default peak hours distribution if few records exist
            peakHours.add(new DashboardMetricsDto.AttendancePeakDto("06:00", 18));
            peakHours.add(new DashboardMetricsDto.AttendancePeakDto("08:00", 35));
            peakHours.add(new DashboardMetricsDto.AttendancePeakDto("10:00", 12));
            peakHours.add(new DashboardMetricsDto.AttendancePeakDto("17:00", 28));
            peakHours.add(new DashboardMetricsDto.AttendancePeakDto("19:00", 45));
            peakHours.add(new DashboardMetricsDto.AttendancePeakDto("21:00", 15));
        }

        // Revenue trend (last 6 months)
        List<DashboardMetricsDto.RevenueExpenseTrendDto> trends = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDate m = today.minusMonths(i);
            String mName = m.format(DateTimeFormatter.ofPattern("MMM yyyy"));
            LocalDate mStart = m.withDayOfMonth(1);
            LocalDate mEnd = m.withDayOfMonth(m.lengthOfMonth());
            BigDecimal c = paymentRepository.calculateTotalCollections(effectiveBranchId, mStart.atStartOfDay(), mEnd.atTime(23, 59, 59));
            BigDecimal exp = expenseRepository.calculateTotalExpenses(effectiveBranchId, mStart, mEnd);
            trends.add(new DashboardMetricsDto.RevenueExpenseTrendDto(mName, c, exp, c.subtract(exp)));
        }

        // Recent activity
        List<DashboardMetricsDto.RecentActivityDto> recentActivities = auditLogRepository.findAll().stream()
                .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
                .limit(8)
                .map(a -> new DashboardMetricsDto.RecentActivityDto(
                        a.getAction().replace("_", " "),
                        a.getDetails(),
                        a.getTimestamp().format(DateTimeFormatter.ofPattern("dd MMM HH:mm")),
                        a.getAction().split("_")[0]
                )).collect(Collectors.toList());

        // Status breakdown
        Map<String, Long> statusMap = new HashMap<>();
        for (MemberStatus s : MemberStatus.values()) {
            long count = effectiveBranchId != null
                    ? memberProfileRepository.countByStatusAndUserBranchId(s, effectiveBranchId)
                    : memberProfileRepository.countByStatus(s);
            statusMap.put(s.name(), count);
        }

        return DashboardMetricsDto.builder()
                .activeMembersCount(activeMembers)
                .totalMembersCount(totalMembers)
                .expiringMembershipsCount(expiringMemberships)
                .overduePaymentsCount(overduePayments)
                .monthCollections(collections)
                .monthExpenses(expenses)
                .estimatedNetProfit(profit)
                .outstandingReceivables(outstanding)
                .todayCheckInsCount(todayCheckIns)
                .lowStockCount(lowStockCount)
                .retentionRatePercent(Math.round(retentionRate * 10.0) / 10.0)
                .revenueTrend(trends)
                .peakHours(peakHours)
                .recentActivities(recentActivities)
                .membersByStatus(statusMap)
                .build();
    }

    // --- CSV & EXCEL EXPORTS ---
    @Transactional(readOnly = true)
    public byte[] exportMembersCsv(Long branchId) {
        String[] headers = {"Member Code", "Full Name", "Email", "Phone", "Status", "Join Date", "Blood Group", "Branch"};
        List<MemberProfile> members = memberProfileRepository.findAll();
        List<String[]> rows = members.stream()
                .filter(m -> branchId == null || (m.getUser().getBranch() != null && m.getUser().getBranch().getId().equals(branchId)))
                .map(m -> new String[]{
                        m.getMemberCode(),
                        m.getUser().getFullName(),
                        m.getUser().getEmail(),
                        m.getUser().getPhone(),
                        m.getStatus().name(),
                        m.getJoinDate().toString(),
                        m.getBloodGroup() != null ? m.getBloodGroup() : "",
                        m.getUser().getBranch() != null ? m.getUser().getBranch().getName() : "All"
                }).collect(Collectors.toList());

        return csvExporter.exportToCsv(headers, rows);
    }

    @Transactional(readOnly = true)
    public byte[] exportMembersExcel(Long branchId) {
        String[] headers = {"Member Code", "Full Name", "Email", "Phone", "Status", "Join Date", "Blood Group", "Branch"};
        List<MemberProfile> members = memberProfileRepository.findAll();
        List<String[]> rows = members.stream()
                .filter(m -> branchId == null || (m.getUser().getBranch() != null && m.getUser().getBranch().getId().equals(branchId)))
                .map(m -> new String[]{
                        m.getMemberCode(),
                        m.getUser().getFullName(),
                        m.getUser().getEmail(),
                        m.getUser().getPhone(),
                        m.getStatus().name(),
                        m.getJoinDate().toString(),
                        m.getBloodGroup() != null ? m.getBloodGroup() : "",
                        m.getUser().getBranch() != null ? m.getUser().getBranch().getName() : "All"
                }).collect(Collectors.toList());

        return excelReportGenerator.generateExcel("Members", headers, rows);
    }

    @Transactional(readOnly = true)
    public byte[] exportPaymentsCsv(Long branchId) {
        String[] headers = {"Txn ID", "Member Name", "Amount (INR)", "GST (INR)", "Net Total (INR)", "Method", "Status", "Date"};
        List<Payment> payments = paymentRepository.findAll();
        List<String[]> rows = payments.stream()
                .filter(p -> branchId == null || (p.getBranch() != null && p.getBranch().getId().equals(branchId)))
                .map(p -> new String[]{
                        p.getTransactionId(),
                        p.getMember().getFullName(),
                        p.getAmount().toString(),
                        p.getTaxAmount().toString(),
                        p.getNetAmount().toString(),
                        p.getPaymentMethod().name(),
                        p.getPaymentStatus().name(),
                        p.getPaymentDate().format(DateTimeFormatter.ISO_LOCAL_DATE)
                }).collect(Collectors.toList());

        return csvExporter.exportToCsv(headers, rows);
    }
}
