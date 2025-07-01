package com.restaurant.restaurantapp.DTO;

import com.restaurant.restaurantapp.model.OrderItemStatus;
import lombok.Data;

@Data
public class UpdateOrderItemStatusDTO {
    // This field must exactly match the JSON key sent from the frontend.
    private OrderItemStatus itemStatus;
}