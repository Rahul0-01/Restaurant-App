package com.restaurant.restaurantapp.Repository;


import com.restaurant.restaurantapp.model.Category; // Import the Entity class
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository; // Optional but good practice

// Optional: Marks this interface as a Spring component (specifically a repository)
// Spring Boot auto-configuration usually finds JpaRepository interfaces even without it,
// but it's good for clarity and consistency.
@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    // Spring Data JPA automatically provides common methods like:
    // - save(Category category): Saves a new category or updates an existing one.
    // - findById(Long id): Finds a category by its primary key (ID).
    // - findAll(): Finds all categories.
    // - deleteById(Long id): Deletes a category by its ID.
    // - count(): Counts the total number of categories.
    // - existsById(Long id): Checks if a category with the given ID exists.
    // ... and many more!

    // You can also define CUSTOM query methods just by declaring their signature.
    // Spring Data JPA will parse the method name and create the query automatically.
    // Example (we don't necessarily need this right now, just showing):
    // Optional<Category> findByName(String name); // Finds a category by its exact name

    // List<Category> findByNameContainingIgnoreCase(String keyword); // Finds categories whose names contain the keyword (case-insensitive)

}
