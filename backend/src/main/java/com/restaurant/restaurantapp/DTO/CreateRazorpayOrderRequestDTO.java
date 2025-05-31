package com.restaurant.restaurantapp.DTO;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal; // If sending amount as BigDecimal from frontend

@Data
public class CreateRazorpayOrderRequestDTO {

    @NotNull(message = "Amount cannot be null")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount; // Amount in your primary currency (e.g., 100.50 for INR 100.50)

    @NotBlank(message = "Currency cannot be blank")
    private String currency; // e.g., "INR"

    @NotBlank(message = "Receipt ID cannot be blank")
    private String receipt; // Your internal unique order ID or reference
}