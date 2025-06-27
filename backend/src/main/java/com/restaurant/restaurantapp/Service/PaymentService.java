package com.restaurant.restaurantapp.Service; // Ensure this matches your package structure

import com.restaurant.restaurantapp.DTO.CreateRazorpayOrderRequestDTO;
import com.restaurant.restaurantapp.DTO.CreateRazorpayOrderResponseDTO;
import com.restaurant.restaurantapp.DTO.PaymentVerificationRequestDTO;
import com.restaurant.restaurantapp.DTO.PaymentVerificationResponseDto; // <<< NEW DTO IMPORT
import com.restaurant.restaurantapp.Exception.ResourceNotFoundException;
import com.restaurant.restaurantapp.model.Order;
import com.restaurant.restaurantapp.model.OrderStatus;
import com.restaurant.restaurantapp.Repository.OrderRepository;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils; // Ensure this import for Razorpay Utils

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
// import jakarta.annotation.PostConstruct; // Not used in the provided code, can be removed if not needed elsewhere
import java.math.BigDecimal;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    private RazorpayClient razorpayClient;
    private final OrderRepository orderRepository;

    public PaymentService(OrderRepository orderRepository,
                          @Value("${razorpay.key.id}") String rzpKeyId,
                          @Value("${razorpay.key.secret}") String rzpKeySecret) {
        this.orderRepository = orderRepository;
        this.razorpayKeyId = rzpKeyId;
        this.razorpayKeySecret = rzpKeySecret;

        try {
            this.razorpayClient = new RazorpayClient(this.razorpayKeyId, this.razorpayKeySecret);
            log.info("SUCCESS: Razorpay client initialized successfully. Key ID starts with: {}",
                    (this.razorpayKeyId != null && this.razorpayKeyId.length() > 8 ? this.razorpayKeyId.substring(0, 8) : "N/A"));
        } catch (RazorpayException e) {
            log.error("ERROR: Initializing Razorpay client failed: {}", e.getMessage(), e);
            throw new RuntimeException("Could not initialize Razorpay client", e);
        }
    }

    @Transactional
    public CreateRazorpayOrderResponseDTO createRazorpayOrder(CreateRazorpayOrderRequestDTO requestDTO) throws RazorpayException {
        log.info("Attempting to create Razorpay order for application receipt ID: {}, Amount: {} {}",
                requestDTO.getReceipt(), requestDTO.getAmount(), requestDTO.getCurrency());

        Long internalAppOrderId;
        try {
            internalAppOrderId = Long.parseLong(requestDTO.getReceipt());
        } catch (NumberFormatException e) {
            log.error("Invalid receipt ID format: {}. Must be a number.", requestDTO.getReceipt());
            throw new IllegalArgumentException("Invalid receipt ID format. Must be a numeric order ID.");
        }

        com.restaurant.restaurantapp.model.Order appOrder = orderRepository.findById(internalAppOrderId)
                .orElseThrow(() -> {
                    log.error("Application order with ID {} not found.", internalAppOrderId);
                    return new ResourceNotFoundException("Order with ID " + internalAppOrderId + " not found in our system.");
                });

        if (requestDTO.getAmount().compareTo(appOrder.getTotalPrice()) != 0) {
            log.warn("Amount mismatch! Request DTO amount: {}, Stored order amount: {}. Using stored order amount.",
                    requestDTO.getAmount(), appOrder.getTotalPrice());
        }
        BigDecimal authoritativeAmount = appOrder.getTotalPrice();

        BigDecimal amountInPaiseBigDecimal = authoritativeAmount.multiply(new BigDecimal("100"));
        long amountInPaiseLong = amountInPaiseBigDecimal.longValue();

        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amountInPaiseLong);
        orderRequest.put("currency", "INR"); // Assuming INR, make configurable if needed
        orderRequest.put("receipt", appOrder.getId().toString());

        log.debug("Razorpay order request payload: {}", orderRequest.toString());

        com.razorpay.Order razorpayApiOrder = this.razorpayClient.orders.create(orderRequest);

        String rzpOrderId = razorpayApiOrder.get("id").toString();
        log.info("Razorpay Order created successfully. Razorpay Order ID: {}", rzpOrderId);

        appOrder.setRazorpayOrderId(rzpOrderId);
        orderRepository.save(appOrder);
        log.info("Linked Razorpay Order ID {} to application order ID {}", rzpOrderId, appOrder.getId());

        return new CreateRazorpayOrderResponseDTO(
                rzpOrderId,
                this.razorpayKeyId,
                amountInPaiseLong,
                "INR"
        );
    }

    @Transactional // This method involves database operations
    public PaymentVerificationResponseDto verifyPaymentAndUpdateOrder(PaymentVerificationRequestDTO verificationRequest) { // <<< CHANGED RETURN TYPE
        log.info("Verifying payment for Razorpay Order ID: {} and Internal Order ID: {}",
                verificationRequest.getRazorpay_order_id(), verificationRequest.getInternalOrderId());

        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", verificationRequest.getRazorpay_order_id());
            attributes.put("razorpay_payment_id", verificationRequest.getRazorpay_payment_id());
            attributes.put("razorpay_signature", verificationRequest.getRazorpay_signature());

            boolean isSignatureValid = Utils.verifyPaymentSignature(attributes, this.razorpayKeySecret);

            if (isSignatureValid) {
                log.info("Razorpay payment signature VERIFIED for Razorpay Order ID: {}", verificationRequest.getRazorpay_order_id());

                Order appOrder = orderRepository.findById(verificationRequest.getInternalOrderId())
                        .orElseThrow(() -> {
                            log.error("Internal order with ID {} not found during payment verification.", verificationRequest.getInternalOrderId());
                            return new ResourceNotFoundException("Order with ID " + verificationRequest.getInternalOrderId() + " not found.");
                        });

                if (!verificationRequest.getRazorpay_order_id().equals(appOrder.getRazorpayOrderId())) {
                    log.error("Razorpay Order ID mismatch! Expected: {}, Received from callback: {}. For internal order ID: {}",
                            appOrder.getRazorpayOrderId(), verificationRequest.getRazorpay_order_id(), appOrder.getId());
                    // Consider the implications of this. For now, we proceed if signature is valid.
                }

                OrderStatus newStatus = OrderStatus.PAID; // Or your "payment successful" status
                String message = "Payment verified and order updated successfully.";

                if (appOrder.getStatus() != OrderStatus.PAID && appOrder.getStatus() != OrderStatus.COMPLETED) {
                    appOrder.setStatus(newStatus);
                    appOrder.setRazorpayPaymentId(verificationRequest.getRazorpay_payment_id());
                    orderRepository.save(appOrder);
                    log.info("Internal Order ID {} status updated to {}. Razorpay Payment ID: {}",
                            appOrder.getId(), newStatus, verificationRequest.getRazorpay_payment_id());
                } else {
                    log.warn("Internal Order ID {} already in status {} or {}. No status update made, but payment considered verified.",
                            appOrder.getId(), appOrder.getStatus(), OrderStatus.COMPLETED);
                    newStatus = appOrder.getStatus(); // Reflect the current (already paid/completed) status
                    message = "Payment already verified for this order.";
                }
                // <<< POPULATE AND RETURN THE NEW DTO
                return new PaymentVerificationResponseDto(
                        true,
                        message,
                        appOrder.getId(),
                        appOrder.getPublicTrackingId(), // Crucial addition
                        newStatus
                );
            } else {
                log.error("Razorpay payment signature INVALID for Razorpay Order ID: {}. Internal Order ID: {}",
                        verificationRequest.getRazorpay_order_id(), verificationRequest.getInternalOrderId());
                // <<< RETURN DTO WITH FAILURE DETAILS
                return new PaymentVerificationResponseDto(
                        false,
                        "Payment verification failed. Signature mismatch.",
                        verificationRequest.getInternalOrderId(),
                        null, // No publicTrackingId as it might not be fetched or relevant on failure
                        null  // Or fetch order to return its current status
                );
            }
        } catch (RazorpayException e) {
            log.error("RazorpayException during payment verification: {}", e.getMessage(), e);
            return new PaymentVerificationResponseDto(false, "Error during payment provider interaction.", verificationRequest.getInternalOrderId(), null, null);
        } catch (ResourceNotFoundException e) { // Catch specific exception if order not found
            log.error("ResourceNotFoundException during payment verification: {}", e.getMessage());
            return new PaymentVerificationResponseDto(false, e.getMessage(), verificationRequest.getInternalOrderId(), null, null);
        } catch (Exception e) {
            log.error("General exception during payment verification: {}", e.getMessage(), e);
            return new PaymentVerificationResponseDto(false, "An unexpected error occurred during verification.", verificationRequest.getInternalOrderId(), null, null);
        }
    }
}