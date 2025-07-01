package com.restaurant.restaurantapp.DTO;

import com.restaurant.restaurantapp.model.OrderItemStatus;
import lombok.Data;

@Data
public class KitchenOrderItemDTO {
    private Long orderItemId;
    private String dishName;
    private int quantity;
    private OrderItemStatus itemStatus;
    private String tableNumber;
    private Long orderId;
} 