package com.restaurant.restaurantapp.Repository;

import com.restaurant.restaurantapp.model.OrderItem;
import com.restaurant.restaurantapp.model.OrderItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    // Additional custom queries can be added here if needed

    List<OrderItem> findByItemStatusIn(List<OrderItemStatus> statuses);
} 