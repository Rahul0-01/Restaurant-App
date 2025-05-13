package com.restaurant.restaurantapp.Repository;

import com.restaurant.restaurantapp.model.Order;
import com.restaurant.restaurantapp.model.OrderStatus;
import org.springframework.data.domain.Page; // <<< ADDED/ENSURE
import org.springframework.data.domain.Pageable; // <<< ADDED/ENSURE
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List; // Keep for methods not being paginated yet

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // --- Methods to be PAGINATED for getOrders(tableId, status, pageable) ---

    /**
     * Finds all orders placed by a specific table, identified by the table's ID.
     * NOW PAGINATED.
     * @param tableId The ID of the RestaurantTable.
     * @param pageable Pagination information.
     * @return A Page of Order objects placed at that table.
     */
    Page<Order> findByRestaurantTableId(Long tableId, Pageable pageable); // Keep this one (already paginated in your example)

    /**
     * Finds all orders currently in a specific status.
     * NOW PAGINATED.
     * @param status The OrderStatus enum value to search for.
     * @param pageable Pagination information.
     * @return A Page of Order objects with the specified status.
     */
    Page<Order> findByStatus(OrderStatus status, Pageable pageable); // Keep this one (already paginated in your example)

    /**
     * Finds all orders for a specific table that are in a specific status.
     * NOW PAGINATED.
     * @param tableId The ID of the RestaurantTable.
     * @param status The OrderStatus value.
     * @param pageable Pagination information.
     * @return A Page of Order objects matching the criteria.
     */
    Page<Order> findByRestaurantTableIdAndStatus(Long tableId, OrderStatus status, Pageable pageable); // Keep this one (already paginated)


    // --- KEEP YOUR OTHER EXISTING METHODS AS THEY ARE (unless you want to paginate them too) ---

    /**
     * Finds all orders whose status is one of the statuses provided in the list.
     * Useful for finding all 'active' orders (e.g., PENDING, PROCESSING, READY).
     * Translates to: SELECT o FROM Order o WHERE o.status IN :statuses
     *
     * @param statuses A List of OrderStatus enum values.
     * @return A List of Order objects matching any of the statuses in the list.
     */
    List<Order> findByStatusIn(List<OrderStatus> statuses); // Remains List, not paginated for now

    /**
     * Finds all orders placed within a specific time range.
     * Demonstrates using 'Between' keyword for date/time ranges.
     * Translates to: SELECT o FROM Order o WHERE o.orderTime BETWEEN :start AND :end
     *
     * @param start The start timestamp (inclusive).
     * @param end The end timestamp (inclusive).
     * @return A List of Order objects placed within the time range.
     */
    List<Order> findByOrderTimeBetween(LocalDateTime start, LocalDateTime end); // Remains List, not paginated

    @Query("SELECT o FROM Order o WHERE o.status = com.restaurant.restaurantapp.model.OrderStatus.PENDING OR o.status = com.restaurant.restaurantapp.model.OrderStatus.PROCESSING ORDER BY o.orderTime ASC")
    List<Order> findActiveOrdersSorted(); // Remains List, not paginated

    @Query("SELECT SUM(o.totalPrice) FROM Order o WHERE o.restaurantTable.id = :tableId AND o.status = com.restaurant.restaurantapp.model.OrderStatus.COMPLETED")
    BigDecimal findTotalCompletedOrderPriceForTable(@Param("tableId") Long tableId); // Returns BigDecimal, not paginated


}