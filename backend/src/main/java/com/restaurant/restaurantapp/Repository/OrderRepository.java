package com.restaurant.restaurantapp.Repository;

import com.restaurant.restaurantapp.model.Order;
import com.restaurant.restaurantapp.model.OrderItem;
import com.restaurant.restaurantapp.model.OrderItemStatus;
import com.restaurant.restaurantapp.model.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // --- Methods for paginated fetching ---
    Page<Order> findByRestaurantTableId(Long tableId, Pageable pageable);
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);
    Page<Order> findByRestaurantTableIdAndStatus(Long tableId, OrderStatus status, Pageable pageable);

    // --- Other query methods ---
    List<Order> findByStatusIn(List<OrderStatus> statuses);
    List<Order> findByOrderTimeBetween(LocalDateTime start, LocalDateTime end);

    // --- UPDATED QUERY for Active Orders ---
    // An "active" order is now one that is OPEN.
    @Query("SELECT o FROM Order o WHERE o.status = 'OPEN' ORDER BY o.orderTime ASC")
    List<Order> findActiveOrdersSorted();

    // This query is fine as 'COMPLETED' is still a valid status
    @Query("SELECT SUM(o.totalPrice) FROM Order o WHERE o.restaurantTable.id = :tableId AND o.status = 'COMPLETED'")
    BigDecimal findTotalCompletedOrderPriceForTable(@Param("tableId") Long tableId);

    boolean existsByRestaurantTableId(Long tableId);

    Optional<Order> findByPublicTrackingId(String publicTrackingId);

    // --- UPDATED QUERY for Today's Revenue ---
    // Revenue is recognized when an order is COMPLETED (i.e., fully paid and closed).
    @Query("SELECT COALESCE(SUM(o.totalPrice), 0) FROM Order o WHERE o.status = 'COMPLETED' AND o.orderTime >= :startOfDay")
    BigDecimal findTodaysRevenue(@Param("startOfDay") LocalDateTime startOfDay);

    // This query is fine as it just counts all orders regardless of status
    @Query("SELECT COUNT(o) FROM Order o WHERE o.orderTime >= :startOfDay")
    long countTodaysOrders(@Param("startOfDay") LocalDateTime startOfDay);

    List<Order> findByStatus(OrderStatus status);

    // This is the important query for the "Open Tab" check
    Optional<Order> findByRestaurantTableIdAndStatus(Long tableId, OrderStatus status);
}