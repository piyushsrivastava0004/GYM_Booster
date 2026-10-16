package com.gymmanager.enums;

public enum PlanDurationType {
    DAILY(1),
    WEEKLY(7),
    MONTHLY(30),
    QUARTERLY(90),
    HALF_YEARLY(180),
    ANNUAL(365),
    CUSTOM(0);

    private final int defaultDays;

    PlanDurationType(int defaultDays) {
        this.defaultDays = defaultDays;
    }

    public int getDefaultDays() {
        return defaultDays;
    }
}
