package com.restaurant.restaurantapp.model; // Should match your package structure

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal; // Use BigDecimal for precise monetary values

@Entity // Mark this class as a JPA entity
@Table(name = "dishes") // Map to the "dishes" table in the database
@Data // Lombok: Generate getters, setters, toString, etc.
public class Dish {

    @Id // Primary key
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Auto-increment ID
    private Long id;

    @Column(nullable = false, length = 150) // Dish name is required
    private String name;

    @Column(length = 500) // Longer description allowed, optional
    private String description;

    @Column(nullable = false, precision = 10, scale = 2) // Price is required, use precision/scale for currency
    private BigDecimal price; // Use BigDecimal for money to avoid floating-point errors

    @Column(name = "image_url", length = 1024) // Optional: specify column name and length
    private String imageUrl;

    @Column(nullable = false) // Must know if it's available or not
    private boolean available = true; // Default to available when creating a new dish

    // --- The Relationship to Category ---
    @ManyToOne(fetch = FetchType.EAGER) // Defines the relationship: Many Dishes belong to One Category
    @JoinColumn(name = "category_id", nullable = false) // Specifies the foreign key column in the 'dishes' table
    private Category category; // Reference to the Category object this dish belongs to
    // ------------------------------------



}