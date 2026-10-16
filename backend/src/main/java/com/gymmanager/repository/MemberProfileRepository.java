package com.gymmanager.repository;

import com.gymmanager.entity.MemberProfile;
import com.gymmanager.enums.MemberStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MemberProfileRepository extends JpaRepository<MemberProfile, Long> {
    Optional<MemberProfile> findByUserId(Long userId);
    Optional<MemberProfile> findByMemberCode(String memberCode);
    Optional<MemberProfile> findByQrCodeData(String qrCodeData);

    @Query("SELECT m FROM MemberProfile m WHERE (:branchId IS NULL OR m.user.branch.id = :branchId) " +
           "AND (:status IS NULL OR m.status = :status) " +
           "AND (:search IS NULL OR LOWER(m.user.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(m.user.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(m.memberCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(m.user.phone) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<MemberProfile> searchMembers(@Param("branchId") Long branchId,
                                      @Param("status") MemberStatus status,
                                      @Param("search") String search,
                                      Pageable pageable);

    long countByStatusAndUserBranchId(MemberStatus status, Long branchId);
    long countByStatus(MemberStatus status);
    List<MemberProfile> findByAssignedTrainerId(Long trainerId);
}
