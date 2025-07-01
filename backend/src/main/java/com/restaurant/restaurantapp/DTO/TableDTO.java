package com.restaurant.restaurantapp.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TableDTO {

    private Long id;
    private String tableNumber;
    private String qrCodeIdentifier;
    private String status;
    private Integer capacity;

    // --- NEW FIELD ---
    // This will be true if a customer has pressed the "Call Waiter" button.
    private boolean assistanceRequested; 
    
}