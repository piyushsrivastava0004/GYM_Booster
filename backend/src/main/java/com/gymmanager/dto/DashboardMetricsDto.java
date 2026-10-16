package com.gymmanager.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardMetricsDto {
    private long activeMembersCount;
    private long totalMembersCount;
    private long expiringMembershipsCount;
    private long overduePaymentsCount;
    private BigDecimal monthCollections;
    private BigDecimal monthExpenses;
    private BigDecimal estimatedNetProfit;
    private BigDecimal outstandingReceivables;
    private long todayCheckInsCount;
    private long lowStockCount;
    private double retentionRatePercent;

    private List<RevenueExpenseTrendDto> revenueTrend;
    private List<AttendancePeakDto> peakHours;
    private List<RecentActivityDto> recentActivities;
    private Map<String, Long> membersByStatus;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RevenueExpenseTrendDto {
        private String month;
        private BigDecimal collections;
        private BigDecimal expenses;
        private BigDecimal profit;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AttendancePeakDto {
        private String hourLabel;
        private long count;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecentActivityDto {
        private String title;
        private String description;
        private String timestamp;
        private String type; // PAYMENT, MEMBER, ATTENDANCE, CLASS
    }
}
