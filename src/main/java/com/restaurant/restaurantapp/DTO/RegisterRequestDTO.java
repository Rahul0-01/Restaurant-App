package com.restaurant.restaurantapp.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size; // For password length
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequestDTO {

    @NotBlank(message = "Username cannot be blank")
    @Size(min = 3, max = 30, message = "Username must be between 3 and 30 characters")
    private String username;

    @NotBlank(message = "Password cannot be blank")
    @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    // Add more complex password validation annotations if needed (@Pattern, custom validator)
    private String password;

    // Optional: Add other fields if needed during registration
    // private String email;
    // private String firstName;
}