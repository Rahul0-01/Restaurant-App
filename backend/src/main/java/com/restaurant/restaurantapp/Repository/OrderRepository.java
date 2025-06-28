package com.restaurant.restaurantapp.Repository;

import com.restaurant.restaurantapp.model.Order;
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

    // --- Methods to be PAGINATED for getOrders(tableId, status, pageable) ---
    Page<Order> findByRestaurantTableId(Long tableId, Pageable pageable);
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);
    Page<Order> findByRestaurantTableIdAndStatus(Long tableId, OrderStatus status, Pageable pageable);

    // --- KEEP YOUR OTHER EXISTING METHODS AS THEY ARE ---
    List<Order> findByStatusIn(List<OrderStatus> statuses);
    List<Order> findByOrderTimeBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT o FROM Order o WHERE o.status = com.restaurant.restaurantapp.model.OrderStatus.PENDING OR o.status = com.restaurant.restaurantapp.model.OrderStatus.PROCESSING ORDER BY o.orderTime ASC")
    List<Order> findActiveOrdersSorted();

    @Query("SELECT SUM(o.totalPrice) FROM Order o WHERE o.restaurantTable.id = :tableId AND o.status = com.restaurant.restaurantapp.model.OrderStatus.COMPLETED")
    BigDecimal findTotalCompletedOrderPriceForTable(@Param("tableId") Long tableId);

    boolean existsByRestaurantTableId(Long tableId);


    Optional<Order> findByPublicTrackingId(String publicTrackingId);
    @Query("SELECT COALESCE(SUM(o.totalPrice), 0) FROM Order o WHERE o.status = 'PAID' AND o.orderTime >= :startOfDay")
    BigDecimal findTodaysRevenue(@Param("startOfDay") LocalDateTime startOfDay);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.orderTime >= :startOfDay")
    long countTodaysOrders(@Param("startOfDay") LocalDateTime startOfDay);
}