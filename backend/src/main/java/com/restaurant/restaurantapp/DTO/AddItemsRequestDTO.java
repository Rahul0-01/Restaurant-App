package com.restaurant.restaurantapp.DTO;

import jakarta.validation.Valid;
import lombok.Data;
import java.util.List;

@Data
public class AddItemsRequestDTO {
    @Valid
    private List<OrderItemRequestDTO> items;
}