package com.restaurant.restaurantapp.Repository;

import com.restaurant.restaurantapp.model.Dish; // Import the Dish entity
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List; // Import List for methods returning multiple dishes

@Repository // Optional but recommended Spring annotation
public interface DishRepository extends JpaRepository<Dish, Long> {

    // Again, inherits standard CRUD methods like:
    // save(Dish dish), findById(Long id), findAll(), deleteById(Long id), etc.
    // for the Dish entity.

    // --- Custom Query Methods ---
    // Spring Data JPA will generate the SQL for these based on their names.

    /**
     * Finds all dishes belonging to a specific category, identified by its ID.
     * Spring Data JPA translates this method name into a query like:
     * SELECT d FROM Dish d WHERE d.category.id = :categoryId
     *
     * @param categoryId The ID of the category to search for.
     * @return A List of Dish objects belonging to the specified category, or an empty list if none found.
     */
    List<Dish> findByCategoryId(Long categoryId);

    /**
     * Finds all dishes that are currently marked as available.
     * Translates to: SELECT d FROM Dish d WHERE d.available = true
     *
     * @return A List of available Dish objects.
     */
    List<Dish> findByAvailableTrue();

    /**
     * Finds all available dishes belonging to a specific category.
     * Combines the conditions using 'And'.
     * Translates to: SELECT d FROM Dish d WHERE d.available = true AND d.category.id = :categoryId
     *
     * @param categoryId The ID of the category to search within.
     * @return A List of available Dish objects within the specified category.
     */
    List<Dish> findByAvailableTrueAndCategoryId(Long categoryId);

    List<Dish> findByAvailableTrueAndCategoryIdOrderByNameAsc(Long categoryId);

    List<Dish> findByCategoryIdOrderByNameAsc(Long categoryId);

    // You could add many other methods following the convention:
    // e.g., findByNameIgnoreCase(String name);
    // e.g., findByPriceLessThan(BigDecimal maxPrice);

}
