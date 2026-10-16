package com.gymmanager.util;

import com.gymmanager.entity.User;
import com.gymmanager.exception.ResourceNotFoundException;
import com.gymmanager.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtils {

    private final UserRepository userRepository;

    public SecurityUtils(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails) {
            return ((UserDetails) principal).getUsername();
        }
        return principal.toString();
    }

    public User getCurrentUser() {
        String username = getCurrentUsername();
        if (username == null) {
            return null;
        }
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Current authenticated user not found: " + username));
    }

    public Long getCurrentBranchId() {
        User user = getCurrentUser();
        if (user != null && user.getBranch() != null) {
            return user.getBranch().getId();
        }
        return null;
    }

    public boolean isGymOwnerOrAdmin() {
        User user = getCurrentUser();
        if (user == null) return false;
        String role = user.getRole().name();
        return role.equals("ROLE_GYM_OWNER") || role.equals("ROLE_ADMINISTRATOR");
    }
}
