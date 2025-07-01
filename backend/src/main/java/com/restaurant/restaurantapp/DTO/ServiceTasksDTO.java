// src/main/java/com/restaurant/restaurantapp/DTO/ServiceTasksDTO.java
package com.restaurant.restaurantapp.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceTasksDTO {

    // A list of items that are READY for delivery.
    private List<KitchenOrderItemDTO> readyItems;

    // A list of tables that have requested assistance.
    private List<TableDTO> assistanceTables;

    // A list of orders that are awaiting final payment.
    private List<OrderResponseDTO> paymentOrders;

}