package com.restaurant.restaurantapp.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TableRequestDTO {
    @NotBlank(message = "Table number cannot be blank")
    private String tableNumber;
    private Integer capacity;

    // QR code might be generated automatically or provided
    private String qrCodeIdentifier;

    @NotBlank(message = "Status cannot be blank")
    private String status; // Add validation for allowed statuses if needed
}