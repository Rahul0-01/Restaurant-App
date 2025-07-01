package com.restaurant.restaurantapp.model;

public enum OrderItemStatus {
    NEEDS_PREPARATION, // Item needs to be prepared by kitchen
    IN_PROGRESS,       // Item is being prepared
    READY,             // Item is ready to be served
    DELIVERED          // Item has been delivered to the table
} 