package com.restaurant.restaurantapp.DTO;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class PaymentVerificationRequestDTO {
    @NotBlank(message = "Razorpay Order ID cannot be blank")
    private String razorpay_order_id;

    @NotBlank(message = "Razorpay Payment ID cannot be blank")
    private String razorpay_payment_id;

    @NotBlank(message = "Razorpay Signature cannot be blank")
    private String razorpay_signature;

    @NotNull(message = "Internal Order ID cannot be null")
    private Long internalOrderId; // Your application's order ID
}