package com.restaurant.restaurantapp.DTO;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

@Data
public class DishRequestDTO {
    @NotBlank(message = "Dish name cannot be blank")
    private String name;

    private String description; // Optional

    @NotNull(message = "Price cannot be null")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be positive")
    private BigDecimal price;

    @NotNull(message = "Availability must be specified (true/false)")
    private Boolean available;

    @NotNull(message = "Category ID cannot be null")
    private Long categoryId;

    // Add imageUrl if using
}