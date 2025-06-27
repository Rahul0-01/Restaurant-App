package com.restaurant.restaurantapp.DTO; // Ensure this matches your DTO package path

import com.restaurant.restaurantapp.model.OrderStatus; // Import your OrderStatus enum
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data // Lombok: Generates getters, setters, toString, equals, hashCode
@NoArgsConstructor // Lombok: Generates a no-argument constructor
@AllArgsConstructor // Lombok: Generates a constructor with all arguments
public class PaymentVerificationResponseDto {

    private boolean success;          // Was the payment verification successful?
    private String message;           // A message indicating success or failure
    private Long internalOrderId;     // The internal ID of the order (e.g., 55)
    private String publicTrackingId;  // The UUID tracking ID for the customer
    private OrderStatus newStatus;    // The new status of the order (e.g., PAID)

}