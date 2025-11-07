	package com.mmlimiteds.mithranmillets.controller;
	
	import com.mmlimiteds.mithranmillets.dto.UserProfileDTO;
import com.mmlimiteds.mithranmillets.entity.User;
	import com.mmlimiteds.mithranmillets.service.AuthService;
	import jakarta.validation.Valid;
	import org.springframework.beans.factory.annotation.Autowired;
	import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
	import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
	
	@RestController
	@RequestMapping("/auth")
	@CrossOrigin(origins = "http://localhost:5173")
	public class AuthController {
	
	    @Autowired
	    private AuthService authService;
	
	    @PostMapping("/signup")
	    public ResponseEntity<?> signup(@Valid @RequestBody User user) {
	        return authService.signup(user);
	    }
	
	    @PostMapping("/login")
	    public ResponseEntity<?> login(@RequestBody Map<String, String> creds) {
	        return authService.login(creds);
	    }
	
	    @GetMapping("/profile")
	    public ResponseEntity<UserProfileDTO> getProfile(Authentication authentication) {
	        return authService.getProfile(authentication);
	    }
	    
	    @PatchMapping("/profile")
	    public ResponseEntity<UserProfileDTO> updateProfile(
	            Authentication authentication,
	            @RequestBody Map<String, Object> updates) {
	        return authService.updateProfile(authentication, updates);
	    }

	    @GetMapping("/admin/users")
	    @PreAuthorize("hasRole('ADMIN')")
	    public ResponseEntity<List<UserProfileDTO>> getAllUsersForAdmin() {
	        List<UserProfileDTO> users = authService.getAllUsersForAdmin();
	        return ResponseEntity.ok(users);
	    }

	}
