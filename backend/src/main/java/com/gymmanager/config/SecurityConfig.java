package com.gymmanager.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final CustomUserDetailsService customUserDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(CustomUserDetailsService customUserDetailsService,
                          JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.customUserDetailsService = customUserDetailsService;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(customUserDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(AbstractHttpConfigurer::disable)
            .headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::disable)) // for H2 console
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/auth/**", "/health/**", "/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**", "/h2-console/**", "/payments/razorpay-webhook").permitAll()
                .requestMatchers(HttpMethod.GET, "/settings/public", "/plans/public").permitAll()
                // Owner & Admin have broad access
                .requestMatchers("/admin/**", "/branches/**").hasAnyRole("GYM_OWNER", "ADMINISTRATOR")
                .requestMatchers("/reports/**").hasAnyRole("GYM_OWNER", "ADMINISTRATOR", "ACCOUNTANT")
                .requestMatchers("/expenses/**").hasAnyRole("GYM_OWNER", "ADMINISTRATOR", "ACCOUNTANT")
                .requestMatchers("/members/**").hasAnyRole("GYM_OWNER", "ADMINISTRATOR", "RECEPTIONIST", "TRAINER", "NUTRITIONIST", "MEMBER")
                .requestMatchers("/staff/**").hasAnyRole("GYM_OWNER", "ADMINISTRATOR", "RECEPTIONIST", "TRAINER", "NUTRITIONIST")
                .requestMatchers("/attendance/**").hasAnyRole("GYM_OWNER", "ADMINISTRATOR", "RECEPTIONIST", "MEMBER")
                .requestMatchers("/workouts/**", "/diet/**").hasAnyRole("GYM_OWNER", "ADMINISTRATOR", "TRAINER", "NUTRITIONIST", "MEMBER")
                .requestMatchers("/classes/**", "/appointments/**").hasAnyRole("GYM_OWNER", "ADMINISTRATOR", "RECEPTIONIST", "TRAINER", "MEMBER")
                .requestMatchers("/payments/**", "/invoices/**").hasAnyRole("GYM_OWNER", "ADMINISTRATOR", "RECEPTIONIST", "ACCOUNTANT", "MEMBER")
                .requestMatchers("/subscriptions/**", "/plans/**", "/exercises/**").hasAnyRole("GYM_OWNER", "ADMINISTRATOR", "RECEPTIONIST", "TRAINER", "NUTRITIONIST", "ACCOUNTANT", "MEMBER")
                .requestMatchers("/portal/**").hasRole("MEMBER")
                // Any other request must be authenticated
                .anyRequest().authenticated()
            );

        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"));
        configuration.setExposedHeaders(Arrays.asList("Access-Control-Allow-Origin", "Access-Control-Allow-Credentials", "Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
