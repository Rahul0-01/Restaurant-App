package com.restaurant.restaurantapp.Controller; // Ensure this matches your package structure

import com.restaurant.restaurantapp.DTO.CreateRazorpayOrderRequestDTO;
import com.restaurant.restaurantapp.DTO.CreateRazorpayOrderResponseDTO;
import com.restaurant.restaurantapp.DTO.PaymentVerificationRequestDTO;
import com.restaurant.restaurantapp.DTO.PaymentVerificationResponseDto; // <<< ADD THIS IMPORT
import com.restaurant.restaurantapp.Exception.ResourceNotFoundException;
import com.restaurant.restaurantapp.Service.PaymentService;

import com.razorpay.RazorpayException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);
    private final PaymentService paymentService;

    @PostMapping("/create-razorpay-order")
    @PreAuthorize("permitAll()")
    public ResponseEntity<?> createRazorpayOrder(@Valid @RequestBody CreateRazorpayOrderRequestDTO requestDTO) {
        log.info("Received request to create Razorpay order for receipt: {}", requestDTO.getReceipt());
        try {
            CreateRazorpayOrderResponseDTO responseDTO = paymentService.createRazorpayOrder(requestDTO);
            return ResponseEntity.ok(responseDTO);
        } catch (RazorpayException e) {
            log.error("Razorpay API error while creating order: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("message", "Error communicating with payment provider: " + e.getMessage()));
        } catch (IllegalArgumentException | ResourceNotFoundException e) {
            log.warn("Failed to create Razorpay order due to client error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error while creating Razorpay order: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "An unexpected error occurred while initiating payment."));
        }
    }

    // --- MODIFIED METHOD ---
    @PostMapping("/verify-payment")
    @PreAuthorize("permitAll()")
    public ResponseEntity<?> verifyPaymentSignature(@Valid @RequestBody PaymentVerificationRequestDTO verificationRequest) {
        log.info("Received request to verify payment signature for Razorpay Order ID: {} and Internal Order ID: {}",
                verificationRequest.getRazorpay_order_id(), verificationRequest.getInternalOrderId());

        try {
            // Call the service method which now returns PaymentVerificationResponseDto
            PaymentVerificationResponseDto responseDto = paymentService.verifyPaymentAndUpdateOrder(verificationRequest);

            if (responseDto.isSuccess()) {
                log.info("Payment verification successful for Internal Order ID: {}. PublicTrackingID: {}",
                        responseDto.getInternalOrderId(), responseDto.getPublicTrackingId());
                return ResponseEntity.ok(responseDto); // <<< RETURN THE FULL DTO
            } else {
                log.error("Payment verification FAILED for Internal Order ID: {}. Reason: {}",
                        verificationRequest.getInternalOrderId(), responseDto.getMessage());
                // Return a response body consistent with what the frontend might expect for errors
                // Using the DTO itself can be consistent for the frontend to parse
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(responseDto);
            }
        } catch (ResourceNotFoundException e) { // Catch specific exceptions if service might still throw them
            log.error("Error during payment verification: Order not found for ID {}", verificationRequest.getInternalOrderId(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new PaymentVerificationResponseDto(false, e.getMessage(), verificationRequest.getInternalOrderId(), null, null));
        } catch (Exception e) { // Catch any other unexpected exceptions from the service or elsewhere
            log.error("Unexpected error during payment verification for order ID {}: {}",
                    verificationRequest.getInternalOrderId(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new PaymentVerificationResponseDto(false, "An unexpected error occurred during payment verification.", verificationRequest.getInternalOrderId(), null, null));
        }
    }
    // ----------------------
}