package com.restaurant.restaurantapp.DTO;
import com.restaurant.restaurantapp.model.OrderStatus;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerOrderStatusDto {

    private String publicTrackingId;
    private Long internalOrderId;
    private OrderStatus status;
    private LocalDateTime orderTime;
    private BigDecimal totalPrice;
    // Optional: A simplified list of items
    private List<OrderItemSimpleDto> items;
    // You might want a timestamp for when the status was last updated, if you store that
    // private LocalDateTime lastStatusUpdateTime;

    // You'll also need a simple DTO for order items if you include them
    // Static inner class for simplicity or a separate file
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemSimpleDto {
        private String dishName;
        private int quantity;
        private BigDecimal pricePerItem;
        private BigDecimal lineItemTotal;
    }
}
