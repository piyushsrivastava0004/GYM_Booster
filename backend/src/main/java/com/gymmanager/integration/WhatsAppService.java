package com.gymmanager.integration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class WhatsAppService {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppService.class);

    @Value("${app.whatsapp.token:}")
    private String apiToken;

    public boolean sendWhatsAppMessage(String phone, String templateName, String message) {
        if (apiToken == null || apiToken.isBlank()) {
            log.info("[WHATSAPP ADAPTER: SANDBOX] (No Token set, fallback logged) Phone: {}, Template: {}, Message: {}", phone, templateName, message);
            return true;
        }
        log.info("Sending WhatsApp template '{}' to {}: {}", templateName, phone, message);
        return true;
    }
}
