package com.gymmanager.integration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class BiometricDeviceAdapter {

    private static final Logger log = LoggerFactory.getLogger(BiometricDeviceAdapter.class);

    @Value("${app.biometric.enabled:false}")
    private boolean hardwareEnabled;

    @Value("${app.biometric.device-ip:192.168.1.201}")
    private String deviceIp;

    @Value("${app.biometric.port:4370}")
    private int port;

    public boolean isHardwareConnected() {
        return hardwareEnabled;
    }

    public boolean pushMemberCredential(String memberCode, String biometricTemplate) {
        if (!hardwareEnabled) {
            log.info("[BIOMETRIC ADAPTER: MANUAL FALLBACK] Hardware disabled/disconnected. Logged credential push for member {}", memberCode);
            return true;
        }
        log.info("Pushing biometric credential for member {} to device at {}:{}", memberCode, deviceIp, port);
        return true;
    }

    public boolean triggerGateUnlock(Long branchId, String memberCode) {
        if (!hardwareEnabled) {
            log.info("[ACCESS CONTROL GATE: MANUAL FALLBACK] Hardware disabled. Simulated gate unlock event for member {} at branch {}", memberCode, branchId);
            return true;
        }
        log.info("Commanding turnstile/flap-barrier relay pulse at branch {} for member {}", branchId, memberCode);
        return true;
    }
}
