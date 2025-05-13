package com.restaurant.restaurantapp.config;

import com.restaurant.restaurantapp.security.JwtRequestFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration; // <-- ADDED IMPORT
import org.springframework.web.cors.CorsConfigurationSource; // <-- ADDED IMPORT
import org.springframework.web.cors.UrlBasedCorsConfigurationSource; // <-- ADDED IMPORT

import java.util.Arrays; // <-- ADDED IMPORT
import java.util.List;   // <-- ADDED IMPORT


@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtRequestFilter jwtRequestFilter;
    private final UserDetailsService userDetailsService;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    // +++++++++++++ CORS CONFIGURATION BEAN +++++++++++++++
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173")); // Your React frontend URL
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-XSRF-TOKEN")); // Ensure "Authorization" is here
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L); // 1 hour

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration); // Apply to all paths
        return source;
    }
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource())) // **** ENABLE CORS HERE ****
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authz -> authz
                        // --- Public Endpoints ---
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/register").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tables/qr/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/menu/**").permitAll()

                        // --- Menu Management (ADMIN Only) ---
                        .requestMatchers(HttpMethod.POST, "/api/menu/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/menu/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/menu/**").hasRole("ADMIN")

                        // --- Order Management (STAFF or ADMIN) ---
                        .requestMatchers(HttpMethod.POST, "/api/orders").hasAnyRole("STAFF", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/orders/**/status").hasAnyRole("STAFF", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/orders", "/api/orders/**").hasAnyRole("STAFF", "ADMIN") // Added /api/orders explicit GET

                        // --- Table Management ---
                        .requestMatchers(HttpMethod.POST, "/api/tables").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/tables/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/tables/**").hasRole("ADMIN")
                        // The order of matchers matters. Specific ones first.
                        .requestMatchers(HttpMethod.GET, "/api/tables/{id}").hasAnyRole("STAFF", "ADMIN") // Get Table by specific ID
                        .requestMatchers(HttpMethod.GET, "/api/tables").hasAnyRole("STAFF", "ADMIN") // Get All Tables (covers base /api/tables)

                        // Note: /api/tables/qr/** is already permitAll. Other GET /api/tables/** would be caught by anyRequest if not specified.
                        // The rules above for GET /api/tables and GET /api/tables/{id} should cover STAFF/ADMIN access for non-QR GETs.

                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}