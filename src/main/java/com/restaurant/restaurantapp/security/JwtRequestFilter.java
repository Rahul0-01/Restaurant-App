package com.restaurant.restaurantapp.security;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull; // For indicating non-null parameters
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter; // Ensure filter runs only once per request

import java.io.IOException;

/**
 * Custom Spring Security filter that intercepts incoming requests to validate JWT tokens.
 * If a valid JWT is found in the Authorization header, it sets the authentication
 * context for Spring Security.
 */
@Component // Mark as a Spring component so it can be auto-detected and injected
@RequiredArgsConstructor // Lombok constructor injection
public class JwtRequestFilter extends OncePerRequestFilter { // Extends OncePerRequestFilter

    private static final Logger log = LoggerFactory.getLogger(JwtRequestFilter.class);

    private final JwtUtil jwtUtil; // Inject the JWT utility class
    private final UserDetailsService userDetailsService; // Inject the service to load UserDetails

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,         // The incoming HTTP request
            @NonNull HttpServletResponse response,       // The outgoing HTTP response
            @NonNull FilterChain filterChain             // Chain of responsibility for filters
    ) throws ServletException, IOException {

        log.trace("Processing request URI: {}", request.getRequestURI()); // Trace logging

        // 1. Extract the Authorization header
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;

        // 2. Check if header exists and starts with "Bearer "
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.trace("No JWT Token found in Authorization header or header doesn't start with Bearer. Passing to next filter.");
            filterChain.doFilter(request, response); // Pass control to the next filter in the chain
            return; // Stop processing in this filter
        }

        // 3. Extract the JWT token string (remove "Bearer ")
        jwt = authHeader.substring(7); // "Bearer ".length() is 7
        log.trace("Extracted JWT: {}", jwt);

        // 4. Extract username from the token
        try {
            username = jwtUtil.extractUsername(jwt);
            log.trace("Username extracted from JWT: {}", username);
        } catch (ExpiredJwtException e) {
            log.warn("JWT token has expired: {}", e.getMessage());
            // You could optionally modify the response here (e.g., set status 401)
            // or let the subsequent security mechanisms handle it.
            // For simplicity, we'll let it proceed, but SecurityContext will remain unauthenticated.
            filterChain.doFilter(request, response);
            return;
        } catch (SignatureException | MalformedJwtException e) {
            log.warn("JWT token is invalid (signature/format): {}", e.getMessage());
            filterChain.doFilter(request, response);
            return;
        } catch (Exception e) { // Catch any other potential JWT parsing errors
            log.error("Error processing JWT token: {}", e.getMessage());
            filterChain.doFilter(request, response);
            return;
        }


        // 5. Check if username is extracted AND user is not already authenticated in the current context
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            log.trace("Username found and user is not yet authenticated. Loading UserDetails.");
            // 6. Load UserDetails from the database using UserDetailsService
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

            // 7. Validate the token against the loaded UserDetails
            if (jwtUtil.isTokenValid(jwt, userDetails)) {
                log.trace("JWT token is valid for user: {}", username);
                // 8. Create an authentication token (represents the authenticated user)
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails, // Principal (the UserDetails object)
                        null,       // Credentials (not needed for JWT authentication)
                        userDetails.getAuthorities() // Authorities (roles/permissions)
                );
                // 9. Set additional details (like IP address, session ID - though session is stateless)
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );
                // 10. Set the authentication token in the SecurityContextHolder
                //     THIS IS THE KEY STEP: Tells Spring Security the user is authenticated for this request
                SecurityContextHolder.getContext().setAuthentication(authToken);
                log.debug("User '{}' authenticated successfully via JWT.", username);
            } else {
                log.warn("JWT token validation failed for user: {}", username);
            }
        } else {
            log.trace("Username is null or user is already authenticated.");
        }

        // 11. Always continue the filter chain, regardless of authentication outcome
        filterChain.doFilter(request, response);
    }
}