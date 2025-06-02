package com.restaurant.restaurantapp.Controller; // Correct package name

import com.restaurant.restaurantapp.DTO.LoginRequestDTO;
import com.restaurant.restaurantapp.DTO.LoginResponseDTO;
import com.restaurant.restaurantapp.DTO.RegisterRequestDTO;
import com.restaurant.restaurantapp.Repository.UserRepository;
import com.restaurant.restaurantapp.model.Role;
import com.restaurant.restaurantapp.model.User;
import com.restaurant.restaurantapp.security.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication; // Import Authentication
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder; // Import SecurityContextHolder
import org.springframework.security.core.userdetails.UserDetails;
// Removed UserDetailsService import here as it's not directly used in this method, but injected for AuthManager
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;
import java.util.stream.Collectors;


@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthenticationManager authenticationManager;
    // UserDetailsService is used by DaoAuthenticationProvider, which is part of AuthenticationManager setup
    // private final UserDetailsService userDetailsService; // Not directly used here
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // In AuthController.java

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDTO loginRequestDTO) {
        log.info("Login attempt for user: {}", loginRequestDTO.getUsername());

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequestDTO.getUsername(),
                            loginRequestDTO.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            log.info("Authentication successful for user: {}", loginRequestDTO.getUsername());

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String username = userDetails.getUsername(); // Still useful to have the username string

            Set<String> roles = userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toSet());
            log.debug("User {} has roles: {}", username, roles);

            // Generate JWT using the UserDetails object
            final String jwt = jwtUtil.generateToken(userDetails); // <<< CORRECTED LINE
            log.debug("Generated JWT for user: {}", username);

            return ResponseEntity.ok(new LoginResponseDTO(jwt, username, roles));

        } catch (BadCredentialsException e) {
            log.warn("Authentication failed for user {}: Invalid Credentials", loginRequestDTO.getUsername());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password.");
        } catch (Exception e) {
            log.error("Authentication error for user {}: {}", loginRequestDTO.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred during authentication.");
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequestDTO registerRequest) {
        log.info("Registration attempt for username: {}", registerRequest.getUsername());

        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            log.warn("Registration failed: Username '{}' already exists.", registerRequest.getUsername());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Error: Username is already taken!");
        }

        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));

        // Assuming Role is an enum with values like ADMIN, STAFF
        // And User entity has a Set<Role> roles field.
        user.setRoles(Set.of(Role.ADMIN)); // Make sure Role.STAFF is a valid enum constant

        try {
            userRepository.save(user);
            log.info("User '{}' registered successfully with role(s): {}", user.getUsername(), user.getRoles());
            return ResponseEntity.status(HttpStatus.CREATED).body("User registered successfully!");
        } catch (Exception e) {
            log.error("Could not register user '{}': {}", registerRequest.getUsername(), e.getMessage(), e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error registering user.");
        }
    }
}