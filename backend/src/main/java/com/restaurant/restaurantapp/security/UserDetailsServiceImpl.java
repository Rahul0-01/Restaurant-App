package com.restaurant.restaurantapp.security;
import com.restaurant.restaurantapp.model.User;
import com.restaurant.restaurantapp.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Optional, but good practice for DB access

import java.util.Collection;
import java.util.stream.Collectors;

/**
 * Service responsible for loading user-specific data for Spring Security.
 */
@Service // Marks this as a Spring service component
@RequiredArgsConstructor // Lombok constructor injection for UserRepository
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository; // Inject the repository

    /**
     * Locates the user based on the username. Required by Spring Security.
     *
     * @param username the username identifying the user whose data is required.
     * @return a fully populated UserDetails object (never null)
     * @throws UsernameNotFoundException if the user could not be found or the user has no GrantedAuthority
     */
    @Override
    @Transactional(readOnly = true) // Database access should be transactional (readOnly is efficient here)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 1. Find the user in our database using the UserRepository
        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found with username: " + username));

        // 2. Convert our application User's roles (ADMIN, STAFF) into
        //    Spring Security's GrantedAuthority objects (ROLE_ADMIN, ROLE_STAFF)
        Collection<? extends GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.name())) // IMPORTANT: Prefix with "ROLE_"
                .collect(Collectors.toList());

        // 3. Create and return Spring Security's UserDetails object
        //    This object contains the information Spring Security needs:
        //    - username
        //    - password (the HASHED password from your database)
        //    - authorities (the GrantedAuthority list created above)
        //    - account status flags (enabled, locked, etc. - using defaults here)
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                authorities // The collection of GrantedAuthority
                // You can add more flags here if needed (e.g., account enabled/disabled, locked)
                // true, // enabled
                // true, // accountNonExpired
                // true, // credentialsNonExpired
                // true  // accountNonLocked
        );
    }
}