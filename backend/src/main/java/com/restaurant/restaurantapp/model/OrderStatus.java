package com.restaurant.restaurantapp.model;

public enum OrderStatus {
    OPEN,            // Tab is open and running
    AWAITING_PAYMENT, // Customer has requested the bill, waiting for payment
    COMPLETED,       // Bill paid, tab closed
    CANCELLED        // Tab cancelled
}