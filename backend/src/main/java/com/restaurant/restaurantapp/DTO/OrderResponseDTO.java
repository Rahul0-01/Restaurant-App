package com.restaurant.restaurantapp.DTO;

import com.restaurant.restaurantapp.model.OrderStatus;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderResponseDTO {
    private Long id;
    private String publicTrackingId; // <<< THIS IS THE NEW, ADDED FIELD
    private Long tableId;
    private String tableNumber;
    private LocalDateTime orderTime;
    private OrderStatus status;
    private BigDecimal totalPrice;
    private String notes;
    private List<OrderItemResponseDTO> items;
}