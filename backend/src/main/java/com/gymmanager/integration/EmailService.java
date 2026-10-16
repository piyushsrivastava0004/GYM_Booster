package com.gymmanager.integration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public boolean sendEmail(String to, String subject, String body) {
        try {
            if (fromEmail == null || fromEmail.contains("notifications@gymmanagement.in")) {
                log.info("[EMAIL ADAPTER: SIMULATION/SANDBOX] To: {}, Subject: {}, Body: {}", to, subject, body);
                return true;
            }

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email successfully sent to: {}", to);
            return true;
        } catch (Exception e) {
            log.warn("Failed to send email via SMTP to {}: {}", to, e.getMessage());
            return false;
        }
    }
}
