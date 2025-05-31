package com.restaurant.restaurantapp.Controller; // Ensure this matches your package structure

import com.restaurant.restaurantapp.DTO.CreateRazorpayOrderRequestDTO;
import com.restaurant.restaurantapp.DTO.CreateRazorpayOrderResponseDTO;
import com.restaurant.restaurantapp.Exception.ResourceNotFoundException;
import com.restaurant.restaurantapp.Service.PaymentService; // Import your PaymentService
import com.razorpay.RazorpayException; // Import RazorpayException
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // For securing the endpoint
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.restaurant.restaurantapp.DTO.PaymentVerificationRequestDTO;

import java.util.Map;

@RestController
@RequestMapping("/api/payments") // Base path for payment-related endpoints
@RequiredArgsConstructor // Lombok for constructor injection
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);
    private final PaymentService paymentService; // Inject PaymentService

    @PostMapping("/create-razorpay-order")
    // This endpoint should be protected, only authenticated users who have an order to pay should call this.
    // Assuming any authenticated user (customer who just placed an order in your system) can initiate payment.
    // If you have specific roles for customers, you could use @PreAuthorize("hasRole('CUSTOMER')")
    // For now, let's assume it's protected by general authentication in SecurityConfig for /api/**
    // or you can add @PreAuthorize("isAuthenticated()")
    @PreAuthorize("isAuthenticated()") // Ensures only logged-in users can create payment orders
    public ResponseEntity<?> createRazorpayOrder(@Valid @RequestBody CreateRazorpayOrderRequestDTO requestDTO) {
        log.info("Received request to create Razorpay order for receipt: {}", requestDTO.getReceipt());
        try {
            CreateRazorpayOrderResponseDTO responseDTO = paymentService.createRazorpayOrder(requestDTO);
            return ResponseEntity.ok(responseDTO);
        } catch (RazorpayException e) {
            log.error("Razorpay API error while creating order: {}", e.getMessage(), e);
            // Consider mapping RazorpayException to a more specific HTTP error if needed
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE) // Or BAD_GATEWAY
                    .body("Error communicating with payment provider: " + e.getMessage());
        } catch (IllegalArgumentException | ResourceNotFoundException e) {
            // Catch specific exceptions from your service (like invalid receipt or order not found)
            log.warn("Failed to create Razorpay order due to client error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            // Generic catch-all for other unexpected errors
            log.error("Unexpected error while creating Razorpay order: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An unexpected error occurred while initiating payment.");
        }
    }

    @PostMapping("/verify-payment")
    @PreAuthorize("isAuthenticated()") // Ensure only authenticated users can attempt verification
    public ResponseEntity<?> verifyPaymentSignature(@Valid @RequestBody PaymentVerificationRequestDTO verificationRequest) {
        log.info("Received request to verify payment signature for Razorpay Order ID: {} and Internal Order ID: {}",
                verificationRequest.getRazorpay_order_id(), verificationRequest.getInternalOrderId());

        boolean verificationSuccess = paymentService.verifyPaymentAndUpdateOrder(verificationRequest);

        if (verificationSuccess) {
            log.info("Payment verification successful for Internal Order ID: {}", verificationRequest.getInternalOrderId());
            // You can return a custom success DTO or just a simple message
            return ResponseEntity.ok().body(Map.of("message", "Payment verified and order updated successfully."));
        } else {
            log.error("Payment verification FAILED for Internal Order ID: {}", verificationRequest.getInternalOrderId());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST) // Or 422 Unprocessable Entity if signature is just invalid
                    .body(Map.of("message", "Payment verification failed. Please contact support if payment was deducted."));
        }
    }

    // We will add another endpoint here later for POST /verify-razorpay-signature
    // And a webhook endpoint POST /razorpay-webhooks
}