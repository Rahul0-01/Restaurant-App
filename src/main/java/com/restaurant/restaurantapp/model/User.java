package com.restaurant.restaurantapp.model;

import jakarta.persistence.*;
import lombok.Getter; // Optional Lombok annotations
import lombok.Setter; // Optional Lombok annotations
import lombok.NoArgsConstructor; // Optional Lombok annotations
import lombok.AllArgsConstructor; // Optional Lombok annotations

import java.util.HashSet;
import java.util.Set;

/**
 * Represents a user account in the application.
 */
@Entity
@Table(name = "users", // Optional: Explicitly name the table 'users'
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "username") // Ensure usernames are unique at DB level
        })
@Getter // Lombok: Generate getters for all fields
@Setter // Lombok: Generate setters for all fields
@NoArgsConstructor // Lombok: Generate no-args constructor
@AllArgsConstructor // Lombok: Generate all-args constructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Use auto-incrementing ID
    private Long id;

    @Column(nullable = false, unique = true) // Handled by @UniqueConstraint above, but good practice
    private String username;

    @Column(nullable = false)
    private String password; // IMPORTANT: Store the HASHED password, not plaintext

    // --- Role Mapping ---
    @ElementCollection(targetClass = Role.class, fetch = FetchType.EAGER) // Eager fetch is often ok for roles
    @CollectionTable(
            name = "user_roles", // Name of the table linking users to roles
            joinColumns = @JoinColumn(name = "user_id") // Foreign key column in user_roles referencing User's ID
    )
    @Enumerated(EnumType.STRING) // Store role names ("ADMIN", "STAFF") in the database
    @Column(name = "role", nullable = false) // Column name in the user_roles table storing the role string
    private Set<Role> roles = new HashSet<>(); // Initialize to avoid NullPointerExceptions

}