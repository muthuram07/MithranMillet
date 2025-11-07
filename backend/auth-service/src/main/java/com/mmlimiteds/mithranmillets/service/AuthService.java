package com.mmlimiteds.mithranmillets.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.mmlimiteds.mithranmillets.dto.UserProfileDTO;
import com.mmlimiteds.mithranmillets.entity.User;
import com.mmlimiteds.mithranmillets.exception.InvalidCredentialsException;
import com.mmlimiteds.mithranmillets.exception.UserAlreadyExistsException;
import com.mmlimiteds.mithranmillets.repository.UserRepository;
import com.mmlimiteds.mithranmillets.security.JwtUtil;

@Service
public class AuthService {

    private final UserRepository userRepo;
    private final JwtUtil jwtUtil;
    private final ModelMapper modelMapper;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Autowired
    public AuthService(UserRepository userRepo, JwtUtil jwtUtil, ModelMapper modelMapper) {
        this.userRepo = userRepo;
        this.jwtUtil = jwtUtil;
        this.modelMapper = modelMapper;
    }

    public ResponseEntity<?> signup(User user) {
        Optional<User> existingUser = userRepo.findByUsername(user.getUsername());
        if (existingUser.isPresent()) {
            throw new UserAlreadyExistsException(user.getUsername());
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepo.save(user);
        return ResponseEntity.status(201).body(Map.of("message", "User registered successfully"));
    }

    public ResponseEntity<?> login(Map<String, String> creds) {
        String username = creds.get("username");
        String password = creds.get("password");

        Optional<User> userOpt = userRepo.findByUsername(username);
        User user = userOpt.orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new InvalidCredentialsException();
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());
        return ResponseEntity.ok(Map.of("token", token));
    }

    public ResponseEntity<UserProfileDTO> getProfile(Authentication authentication) {
        String username = authentication.getName();
        Optional<User> userOpt = userRepo.findByUsername(username);

        return userOpt.map(user -> {
            UserProfileDTO dto = toProfileDto(user);
            return ResponseEntity.ok(dto);
        }).orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    public ResponseEntity<UserProfileDTO> updateProfile(Authentication authentication, Map<String, Object> updates) {
        String username = authentication.getName();
        Optional<User> userOpt = userRepo.findByUsername(username);

        if (userOpt.isEmpty()) {
            throw new UsernameNotFoundException("User not found");
        }

        User user = userOpt.get();

        if (updates.containsKey("email")) {
            user.setEmail((String) updates.get("email"));
        }
        if (updates.containsKey("fullName")) {
            user.setFullName((String) updates.get("fullName"));
        }
        if (updates.containsKey("phone")) {
            user.setPhone((String) updates.get("phone"));
        }

        User updatedUser = userRepo.save(user);
        UserProfileDTO dto = toProfileDto(updatedUser);
        return ResponseEntity.ok(dto);
    }

    /**
     * Removed getAddress method as address is no longer part of the User entity.
     * If you still need an address endpoint backed by a separate Address entity,
     * implement it in an AddressService / AddressController.
     */

    /**
     * Admin utility - returns all users mapped to UserProfileDTO
     * Make sure controller secures this endpoint (e.g. @PreAuthorize("hasRole('ADMIN')"))
     */
    public List<UserProfileDTO> getAllUsersForAdmin() {
        return userRepo.findAll()
                .stream()
                .map(this::toProfileDto)
                .collect(Collectors.toList());
    }

    private UserProfileDTO toProfileDto(User user) {
        // Map explicitly to avoid exposing sensitive fields (like password)
        UserProfileDTO dto = modelMapper.map(user, UserProfileDTO.class);
        return dto;
    }

}
