package com.restaurant.restaurantapp.security; // Adjust package name if needed

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value; // To read properties
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component; // Mark as a Spring component

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Utility class for handling JWT (JSON Web Token) operations like
 * generation, validation, and extraction of claims.
 */
@Component // Make this class available for dependency injection
public class JwtUtil {

    private static final Logger log = LoggerFactory.getLogger(JwtUtil.class);

    // Inject properties from application.properties/.yml
    @Value("${application.security.jwt.secret-key}")
    private String secretKeyString;

    @Value("${application.security.jwt.expiration}")
    private long jwtExpirationMs; // Expiration time in milliseconds

    // --- Token Generation ---

    /**
     * Generates a JWT for the given UserDetails.
     *
     * @param userDetails The user details object from Spring Security.
     * @return A JWT string.
     */
    public String generateToken(UserDetails userDetails) {
        // You can add extra claims (data) to the token if needed
        Map<String, Object> extraClaims = new HashMap<>();
        // Example: Add roles if needed, but often just username (subject) is enough
        // extraClaims.put("roles", userDetails.getAuthorities().stream()...);



       // The extraClaims map is a box for putting any extra, custom information you want inside the JWT, beyond the
        // standard stuff like username and expiration date. You .put() your custom info into the map (the box), and .setClaims()
        // adds the contents of the box to the token. If you don't put anything in the box (like in our current code), then no extra custom info is added.
        return buildToken(extraClaims, userDetails.getUsername());
    }

    private String buildToken(Map<String, Object> extraClaims, String subject) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        log.debug("Generating JWT for subject: {}, expiry: {}", subject, expiryDate);

        return Jwts.builder()
                .setClaims(extraClaims) // Add any extra data
                .setSubject(subject)     // Set the username as the subject
                .setIssuedAt(now)       // Set the time the token was created
                .setExpiration(expiryDate) // Set the expiration time
                .signWith(getSignInKey(), SignatureAlgorithm.HS256) // Sign with HS256 algorithm and secret key
                .compact(); // Build the token string
    }


    // --- Token Validation and Parsing ---

    /**
     * Checks if a JWT is valid for the given UserDetails.
     * Valid means: belongs to the user, signature matches, and not expired.
     *
     * @param token       The JWT string.
     * @param userDetails The user details to validate against.
     * @return true if the token is valid, false otherwise.
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
        } catch (Exception e) {
            log.warn("JWT validation failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Extracts the username (subject) from the JWT.
     *
     * @param token The JWT string.
     * @return The username stored in the token's subject claim.
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extracts the expiration date from the JWT.
     *
     * @param token The JWT string.
     * @return The Date object representing the expiration time.
     */
    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Checks if the JWT has expired.
     *
     * @param token The JWT string.
     * @return true if the token is expired, false otherwise.
     */
    private boolean isTokenExpired(String token) {
        try {
            return extractExpiration(token).before(new Date());
        } catch (Exception e) {
            // If we can't extract expiration (e.g., malformed token), treat as expired/invalid
            log.warn("Could not determine token expiration: {}", e.getMessage());
            return true;
        }
    }

    /**
     * Generic method to extract a specific claim from the JWT.
     *
     * @param token          The JWT string.
     * @param claimsResolver A function to apply to the Claims object to get the desired value.
     * @param <T>            The type of the claim value.
     * @return The extracted claim value.
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Parses the JWT string and returns all claims contained within it.
     * Handles signature validation during parsing.
     *
     * @param token The JWT string.
     * @return The Claims object containing all data from the token payload.
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey()) // Provide the secret key for validation
                .build()
                .parseClaimsJws(token) // Parse and validate signature
                .getBody(); // Get the payload (claims)
    }


    // --- Key Handling ---

    /**
     * Generates the SecretKey object used for signing and validation
     * from the base64 encoded string stored in properties.
     *
     * @return The SecretKey object.
     */
    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKeyString);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}