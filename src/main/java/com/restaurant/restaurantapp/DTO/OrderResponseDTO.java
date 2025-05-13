package com.restaurant.restaurantapp.DTO;

import com.restaurant.restaurantapp.model.OrderStatus; // Assuming you want the enum here
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data // Lombok to generate getters, setters, etc.
public class OrderResponseDTO {
    private Long id; // Order ID
    // Decide what table info to return - ID? Number? Both?
    private Long tableId;
    private String tableNumber;
    private LocalDateTime orderTime;
    private OrderStatus status; // Or String if preferred for JSON
    private BigDecimal totalPrice;
    private String notes;
    private List<OrderItemResponseDTO> items; // List of item DTOs
}