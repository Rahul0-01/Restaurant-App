package com.restaurant.restaurantapp.model; // Should match your package structure

import jakarta.persistence.*;
import lombok.Data;
// We might add relation to Dish later, keep it simple for now
// import java.util.List;

@Entity // Mark this class as a JPA entity (maps to a database table)
@Table(name = "categories") // Explicitly name the database table "categories"
@Data // Lombok: Generate getters, setters, toString, etc.
public class Category {

    @Id // Mark 'id' as the primary key column
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Use database auto-increment for the ID
    private Long id;

    @Column(nullable = false, unique = true, length = 100) // Category name must exist, be unique, and have a max length
    private String name;

    @Column(length = 255) // Allow a longer description, nullable by default
    private String description;

    // Optional relationship: A Category can have many Dishes.
    // We define the other side (Dish to Category) first, which is more common.
    // Uncomment this later if you want to navigate from Category -> Dishes directly.
    // @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    // private List<Dish> dishes;

    // --- If NOT using Lombok, add constructors, getters and setters ---

}