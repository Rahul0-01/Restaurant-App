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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;


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

        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173", // Your React local dev frontend URL
                "https://cool-kleicha-7eaec9.netlify.app" // YOUR LIVE NETLIFY FRONTEND URL
        ));

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")); // Added PATCH
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-XSRF-TOKEN", "X-Requested-With", "Origin", "Accept")); // Added common headers
        configuration.setExposedHeaders(Arrays.asList("Authorization")); // Good to expose Authorization if your frontend needs to read it from response
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
                .cors(cors -> cors.configurationSource(corsConfigurationSource())) // Uses your defined CorsConfigurationSource
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authz -> authz
                        // --- PUBLIC AUTHENTICATION & REGISTRATION ---
                        .requestMatchers("/api/auth/**").permitAll() // Covers /login, /register

                        // --- PUBLIC CUSTOMER-FACING MENU & TABLE LOOKUP ---
                        .requestMatchers(HttpMethod.GET, "/api/tables/qr/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/menu/**").permitAll() // Covers categories & dishes for viewing

                        // --- PUBLIC CUSTOMER ORDERING & PAYMENT FLOW ---
                        .requestMatchers(HttpMethod.POST, "/api/orders").permitAll() // Customer places initial PENDING order
                        .requestMatchers(HttpMethod.POST, "/api/payments/create-razorpay-order").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/payments/verify-payment").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/orders/status/**").permitAll() // Customer checks their order status

                        // --- ADMIN ONLY: Menu Management (Categories & Dishes CRUD) ---
                        // Assuming /api/menu/categories and /api/menu/dishes are the base paths for these
                        .requestMatchers(HttpMethod.POST, "/api/menu/categories", "/api/menu/categories/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/menu/categories/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/menu/categories/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/menu/dishes", "/api/menu/dishes/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/menu/dishes/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/menu/dishes/**").hasRole("ADMIN")

                        // --- ADMIN ONLY: Table Management (Full CRUD) ---
                        .requestMatchers("/api/tables", "/api/tables/**").hasRole("ADMIN") // Simplifies if all /api/tables mutations are ADMIN only
                        // If staff needs to GET tables, that was covered by permitAll to /api/menu/** assuming it included tables,
                        // or you'd need a specific GET rule for STAFF here if it's separate from /api/menu/**

                        // --- STAFF & ADMIN: Order Management (Viewing list, specific order, updating status) ---
                        .requestMatchers(HttpMethod.GET, "/api/orders").hasAnyRole("STAFF", "ADMIN")          // List all orders
                        .requestMatchers(HttpMethod.GET, "/api/orders/{orderId}").hasAnyRole("STAFF", "ADMIN") // Get specific order
                        .requestMatchers(HttpMethod.PUT, "/api/orders/{orderId}/status").hasAnyRole("STAFF", "ADMIN") // Update order status
                        // Add other order management PUT/POST specific to staff/admin if any (e.g., cancel)

                        // --- Any other request must be authenticated ---
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider()) // Make sure you have this bean defined
                .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class); // Your JWT filter

        return http.build();
    }
}