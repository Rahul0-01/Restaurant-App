package com.restaurant.restaurantapp.DTO; // Correct package name

// Lombok annotations can reduce boilerplate, but we'll write explicitly for clarity
 import lombok.AllArgsConstructor;
 import lombok.Data;
 import lombok.NoArgsConstructor;

@Data // Generates getters, setters, toString, equals, hashCode
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDTO {

    private Long id;
    private String name;
    // Add other fields from Category entity if needed by the frontend, e.g., description


    }