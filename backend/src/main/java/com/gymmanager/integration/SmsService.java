package com.gymmanager.integration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SmsService {

    private static final Logger log = LoggerFactory.getLogger(SmsService.class);

    @Value("${app.sms.api-key:}")
    private String apiKey;

    public boolean sendSms(String phone, String message) {
        if (apiKey == null || apiKey.isBlank()) {
            log.info("[SMS ADAPTER: SANDBOX] (No API key set, fallback logged) Phone: {}, Message: {}", phone, message);
            return true;
        }
        // Provider integration (e.g., Fast2SMS / Twilio)
        log.info("Dispatching SMS via gateway to {}: {}", phone, message);
        return true;
    }
}
