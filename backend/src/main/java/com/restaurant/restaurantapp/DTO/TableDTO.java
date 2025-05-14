package com.restaurant.restaurantapp.DTO; // Correct package name (use lowercase dto if refactored)

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TableDTO {

    private Long id;
    private String tableNumber;
    private String qrCodeIdentifier; // ADDED - Usually needed, even if just for admin
    private String status;
    private Integer capacity;
    // Keep capacity out for now unless the client specifically needs it

}