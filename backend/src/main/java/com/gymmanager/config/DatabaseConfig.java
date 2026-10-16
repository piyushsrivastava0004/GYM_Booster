package com.gymmanager.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Configuration
@Profile("prod")
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    private static final Pattern DB_URL_PATTERN = Pattern.compile(
        "^(?:jdbc:)?postgres(?:ql)?://(?:([^:@]+)(?::([^@]+))?@)?([^/?#]+)(?:/([^?#]*))?(?:\\?(.*))?$"
    );

    @Value("${spring.datasource.url:}")
    private String rawUrl;

    @Value("${spring.datasource.username:}")
    private String defaultUsername;

    @Value("${spring.datasource.password:}")
    private String defaultPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setDriverClassName("org.postgresql.Driver");

        String jdbcUrl = rawUrl;
        String username = defaultUsername;
        String password = defaultPassword;

        if (rawUrl != null && !rawUrl.isBlank()) {
            Matcher matcher = DB_URL_PATTERN.matcher(rawUrl.trim());
            if (matcher.matches()) {
                String userFromUrl = matcher.group(1);
                String passFromUrl = matcher.group(2);
                String host = matcher.group(3);
                String database = matcher.group(4);

                if (userFromUrl != null && !userFromUrl.isBlank()) {
                    username = userFromUrl;
                }
                if (passFromUrl != null && !passFromUrl.isBlank()) {
                    password = passFromUrl;
                }

                StringBuilder sb = new StringBuilder("jdbc:postgresql://").append(host);
                if (database != null && !database.isBlank()) {
                    sb.append("/").append(database);
                }
                sb.append("?sslmode=require");
                jdbcUrl = sb.toString();
            }
        }

        log.info("Configured PostgreSQL connection to: {}", jdbcUrl);
        config.setJdbcUrl(jdbcUrl);
        config.setUsername(username);
        config.setPassword(password);
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setIdleTimeout(300000);
        config.setMaxLifetime(1200000);
        config.setConnectionTimeout(30000);

        return new HikariDataSource(config);
    }
}
