package com.restaurant.restaurantapp.Repository;

import com.restaurant.restaurantapp.model.RestaurantTable; // Import the Entity
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List; // For methods potentially returning multiple tables
import java.util.Optional; // For methods that might find zero or one result

@Repository // Optional but recommended Spring annotation
public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {

    // Inherits standard CRUD methods for RestaurantTable:
    // save(RestaurantTable table), findById(Long id), findAll(), deleteById(Long id), etc.

    // --- Custom Query Methods ---

    /**
     * Finds a specific table by its unique table number (e.g., "T1", "A5").
     * Since tableNumber is marked as unique in the entity, this method returns an Optional,
     * indicating it will find at most one result.
     * Translates to: SELECT rt FROM RestaurantTable rt WHERE rt.tableNumber = :tableNumber
     *
     * @param tableNumber The exact table number to search for.
     * @return An Optional containing the found RestaurantTable, or an empty Optional if not found.
     */
    Optional<RestaurantTable> findByTableNumber(String tableNumber);

    /**
     * Finds a specific table by its unique QR code identifier.
     * Crucial for linking a scanned QR code back to a table.
     * Returns Optional because qrCodeIdentifier is also unique.
     * Translates to: SELECT rt FROM RestaurantTable rt WHERE rt.qrCodeIdentifier = :qrCodeIdentifier
     *
     * @param qrCodeIdentifier The unique identifier associated with the QR code.
     * @return An Optional containing the found RestaurantTable, or an empty Optional if not found.
     */
    Optional<RestaurantTable> findByQrCodeIdentifier(String qrCodeIdentifier);

    /**
     * Finds all tables with a specific status (e.g., "AVAILABLE", "OCCUPIED").
     * Returns a List because multiple tables can have the same status.
     * Translates to: SELECT rt FROM RestaurantTable rt WHERE rt.status = :status
     *
     * @param status The status to filter tables by.
     * @return A List of RestaurantTable objects matching the status, or an empty list.
     */
    List<RestaurantTable> findByStatus(String status);

    /**
     * Finds all tables with capacity greater than or equal to a specified number.
     * Demonstrates using comparison keywords (GreaterThanEqual) in method names.
     * Translates to: SELECT rt FROM RestaurantTable rt WHERE rt.capacity >= :minCapacity
     *
     * @param minCapacity The minimum capacity required.
     * @return A List of RestaurantTable objects meeting the capacity requirement.
     */
    List<RestaurantTable> findByCapacityGreaterThanEqual(int minCapacity);

    boolean existsByTableNumber(String tableNumber);
}
