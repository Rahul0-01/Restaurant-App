package com.restaurant.restaurantapp.model;
import jakarta.persistence.*; // Make sure you import from jakarta.persistence
import lombok.Data; // If you included Lombok, otherwise you need getters/setters

@Entity // Tells JPA this class represents a table
@Table(name = "restaurant_tables") // Optional: Specifies the exact table name
@Data // Lombok: Adds getters, setters, toString, etc. automatically
// If NOT using Lombok, you need to manually add public getters and setters for all fields below
public class RestaurantTable {

    @Id // Marks this field as the primary key
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Auto-increments the ID using the database's strategy
    private Long id;


    @Column(unique = true, nullable = false) // Makes this column unique and not allowed to be empty
    private String tableNumber; // e.g., "T1", "A5", "BarSeat-3"

    private int capacity; // How many people can sit here

    @Column(length = 50) // Sets a max length for the status string in the DB
    private String status; // e.g., "AVAILABLE", "OCCUPIED", "RESERVED"

    @Column(unique = true) // Ensure QR code identifier is unique
    private String qrCodeIdentifier; // e.g., a unique string for the QR code link


}