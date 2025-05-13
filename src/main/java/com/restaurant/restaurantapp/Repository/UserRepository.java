package com.restaurant.restaurantapp.Repository;

import com.restaurant.restaurantapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for User entities.
 * Provides methods for accessing and manipulating User data in the database.
 */
@Repository // Indicates this is a Spring Data repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Finds a user by their username.
     * Spring Data JPA automatically implements this method based on its name.
     * Used by UserDetailsService to load user details during authentication.
     *
     * @param username The username to search for.
     * @return An Optional containing the User if found, or an empty Optional otherwise.
     */
    Optional<User> findByUsername(String username);

    /**
     * Checks if a user exists with the given username.
     * Spring Data JPA automatically implements this method.
     * Useful for registration checks.
     *
     * @param username The username to check for.
     * @return true if a user with the username exists, false otherwise.
     */
    Boolean existsByUsername(String username);

    // JpaRepository already provides standard CRUD methods like:
    // - save(User user)           -> Saves a new user or updates an existing one
    // - findById(Long id)         -> Finds a user by ID (returns Optional<User>)
    // - findAll()                 -> Finds all users
    // - deleteById(Long id)       -> Deletes a user by ID
    // - count()                   -> Counts the number of users
    // - existsById(Long id)       -> Checks if a user exists by ID
    // ...and many more!
}