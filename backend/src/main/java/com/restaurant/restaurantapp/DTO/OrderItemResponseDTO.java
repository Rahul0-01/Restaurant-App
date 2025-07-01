package com.restaurant.restaurantapp.DTO;

import lombok.Data;
import java.math.BigDecimal;
import com.restaurant.restaurantapp.model.OrderItemStatus;

@Data // Lombok
public class OrderItemResponseDTO {
    private Long id; // OrderItem ID (optional, maybe not needed by frontend)
    // Decide what dish info to return - ID? Name? Both?
    private Long dishId;
    private String dishName;
    private int quantity;
    private BigDecimal price; // Price per unit at time of order
    private BigDecimal lineItemTotal; // Calculated: quantity * price
    private OrderItemStatus itemStatus;
}