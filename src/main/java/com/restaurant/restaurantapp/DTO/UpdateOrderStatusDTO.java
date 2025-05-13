package com.restaurant.restaurantapp.DTO;

import com.restaurant.restaurantapp.model.OrderStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateOrderStatusDTO {
    @NotNull(message = "New status cannot be null")
    private OrderStatus status;
}
