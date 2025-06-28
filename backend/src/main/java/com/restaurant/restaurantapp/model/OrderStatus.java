package com.restaurant.restaurantapp.model;

public enum OrderStatus {
    PENDING,        // Waiting for online payment processing
    UNPAID,         // <<< ADD THIS NEW STATUS (Placed, to be paid at the counter)
    PAYMENT_FAILED, // Online payment was attempted but failed
    PAID,           // Successfully paid online, ready to be processed
    PROCESSING,     // In the kitchen
    READY,          // Ready for pickup/serving
    COMPLETED,      // Served and finished
    CANCELLED       // Cancelled by staff or customer
}