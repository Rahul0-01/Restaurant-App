package com.restaurant.restaurantapp.DTO; // Correct package name

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
 @AllArgsConstructor
 @NoArgsConstructor

public class DishDTO {

     private Long id;
     private String name;
     private String description;
     private BigDecimal price;
     private boolean available; // Important to tell the client if it can be ordered
     private Long categoryId; // Send only the ID of the category







 }