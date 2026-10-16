package com.gymmanager.service;

import com.gymmanager.dto.BranchDto;
import com.gymmanager.entity.Branch;
import com.gymmanager.exception.BadRequestException;
import com.gymmanager.exception.ResourceNotFoundException;
import com.gymmanager.repository.BranchRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BranchService {

    private final BranchRepository branchRepository;

    public BranchService(BranchRepository branchRepository) {
        this.branchRepository = branchRepository;
    }

    @Transactional(readOnly = true)
    public List<BranchDto> getAllBranches() {
        return branchRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public BranchDto createBranch(BranchDto dto) {
        if (branchRepository.findByCode(dto.getCode()).isPresent()) {
            throw new BadRequestException("Branch with code " + dto.getCode() + " already exists!");
        }

        Branch branch = Branch.builder()
                .name(dto.getName())
                .code(dto.getCode().toUpperCase())
                .address(dto.getAddress())
                .city(dto.getCity())
                .state(dto.getState())
                .pincode(dto.getPincode())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .taxNumber(dto.getTaxNumber())
                .currency(dto.getCurrency() != null ? dto.getCurrency() : "INR")
                .timezone(dto.getTimezone() != null ? dto.getTimezone() : "Asia/Kolkata")
                .active(dto.getActive() != null ? dto.getActive() : true)
                .build();
        branch = branchRepository.save(branch);

        return mapToDto(branch);
    }

    @Transactional
    public BranchDto updateBranch(Long id, BranchDto dto) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with ID: " + id));

        branch.setName(dto.getName());
        branch.setAddress(dto.getAddress());
        branch.setCity(dto.getCity());
        branch.setState(dto.getState());
        branch.setPincode(dto.getPincode());
        branch.setPhone(dto.getPhone());
        branch.setEmail(dto.getEmail());
        branch.setTaxNumber(dto.getTaxNumber());
        branch.setActive(dto.getActive());
        branch = branchRepository.save(branch);

        return mapToDto(branch);
    }

    private BranchDto mapToDto(Branch b) {
        return BranchDto.builder()
                .id(b.getId())
                .name(b.getName())
                .code(b.getCode())
                .address(b.getAddress())
                .city(b.getCity())
                .state(b.getState())
                .pincode(b.getPincode())
                .phone(b.getPhone())
                .email(b.getEmail())
                .taxNumber(b.getTaxNumber())
                .currency(b.getCurrency())
                .timezone(b.getTimezone())
                .active(b.getActive())
                .createdAt(b.getCreatedAt())
                .build();
    }
}
