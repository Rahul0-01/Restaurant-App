package com.restaurant.restaurantapp.model;
/**
 * Defines the possible user roles within the application.
 */
public enum Role {
    /**
     * Administrator role with full access to manage menus, tables, users, etc.
     */
    ADMIN,

    /**
     * Staff role with permissions for operational tasks like placing orders,
     * updating order status, viewing tables.
     */
    STAFF
    // Add other roles like CUSTOMER, KITCHEN_STAFF etc. here in the future if needed.
}