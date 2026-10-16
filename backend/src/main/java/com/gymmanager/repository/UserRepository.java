package com.gymmanager.repository;

import com.gymmanager.entity.User;
import com.gymmanager.enums.RoleType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    List<User> findByRole(RoleType role);
    List<User> findByRoleAndBranchId(RoleType role, Long branchId);

    @Query("SELECT u FROM User u WHERE u.role = :role AND (:branchId IS NULL OR u.branch.id = :branchId) " +
           "AND (:search IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.phone) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> searchUsersByRole(@Param("role") RoleType role,
                                 @Param("branchId") Long branchId,
                                 @Param("search") String search,
                                 Pageable pageable);
}
