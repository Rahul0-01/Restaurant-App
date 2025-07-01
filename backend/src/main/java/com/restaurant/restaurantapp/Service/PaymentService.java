package com.restaurant.restaurantapp.Service;

import com.restaurant.restaurantapp.DTO.CreateRazorpayOrderRequestDTO;
import com.restaurant.restaurantapp.DTO.CreateRazorpayOrderResponseDTO;
import com.restaurant.restaurantapp.DTO.PaymentVerificationRequestDTO;
import com.restaurant.restaurantapp.DTO.PaymentVerificationResponseDto;
import com.restaurant.restaurantapp.Exception.InvalidRequestException;
import com.restaurant.restaurantapp.Exception.ResourceNotFoundException;
import com.restaurant.restaurantapp.model.Order;
import com.restaurant.restaurantapp.model.OrderStatus;
import com.restaurant.restaurantapp.Repository.OrderRepository;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
            log.info("SUCCESS: Razorpay client initialized successfully.");
        } catch (RazorpayException e) {
            log.error("ERROR: Initializing Razorpay client failed: {}", e.getMessage(), e);
            throw new RuntimeException("Could not initialize Razorpay client", e);
        }
    }

    @Transactional
    public CreateRazorpayOrderResponseDTO createRazorpayOrder(CreateRazorpayOrderRequestDTO requestDTO) throws RazorpayException {
        log.info("Attempting to create Razorpay order for application receipt ID: {}, Amount: {} {}",
                requestDTO.getReceipt(), requestDTO.getAmount(), requestDTO.getCurrency());

        Long internalAppOrderId = Long.parseLong(requestDTO.getReceipt());

        Order appOrder = orderRepository.findById(internalAppOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order with ID " + internalAppOrderId + " not found in our system."));
        
        // --- LOGIC CHANGE FOR NEW MODEL ---
        // Verify that the order is actually awaiting payment before creating a Razorpay order.
        if (appOrder.getStatus() != OrderStatus.AWAITING_PAYMENT) {
            throw new InvalidRequestException("Cannot create payment for an order that is not awaiting payment. Current status: " + appOrder.getStatus());
        }
        // ------------------------------------

        BigDecimal authoritativeAmount = appOrder.getTotalPrice();
        BigDecimal amountInPaiseBigDecimal = authoritativeAmount.multiply(new BigDecimal("100"));
        long amountInPaiseLong = amountInPaiseBigDecimal.longValue();

        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amountInPaiseLong);
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", appOrder.getId().toString());

        com.razorpay.Order razorpayApiOrder = this.razorpayClient.orders.create(orderRequest);
        String rzpOrderId = razorpayApiOrder.get("id").toString();
        log.info("Razorpay Order created successfully. Razorpay Order ID: {}", rzpOrderId);

        appOrder.setRazorpayOrderId(rzpOrderId);
        orderRepository.save(appOrder);
        log.info("Linked Razorpay Order ID {} to application order ID {}", rzpOrderId, appOrder.getId());

        return new CreateRazorpayOrderResponseDTO(rzpOrderId, this.razorpayKeyId, amountInPaiseLong, "INR");
    }

    @Transactional
    public PaymentVerificationResponseDto verifyPaymentAndUpdateOrder(PaymentVerificationRequestDTO verificationRequest) {
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
                        .orElseThrow(() -> new ResourceNotFoundException("Order with ID " + verificationRequest.getInternalOrderId() + " not found."));

                // --- LOGIC CHANGE FOR NEW MODEL ---
                OrderStatus newStatus = OrderStatus.COMPLETED; // The new final status after payment.
                String message = "Payment verified and order is now complete.";

                // Only update if the order is actually awaiting payment.
                if (appOrder.getStatus() == OrderStatus.AWAITING_PAYMENT) {
                    appOrder.setStatus(newStatus);
                    appOrder.setRazorpayPaymentId(verificationRequest.getRazorpay_payment_id());
                    orderRepository.save(appOrder);
                    log.info("Internal Order ID {} status updated to {}. Razorpay Payment ID: {}",
                            appOrder.getId(), newStatus, verificationRequest.getRazorpay_payment_id());
                } else {
                    log.warn("Internal Order ID {} already in status {}. No status update made, but payment considered verified.",
                            appOrder.getId(), appOrder.getStatus());
                    newStatus = appOrder.getStatus(); // Reflect the current (already completed) status
                    message = "Payment already processed for this order.";
                }
                // ------------------------------------

                return new PaymentVerificationResponseDto(
                        true,
                        message,
                        appOrder.getId(),
                        appOrder.getPublicTrackingId(),
                        newStatus // Return the final status, which is COMPLETED
                );
            } else {
                log.error("Razorpay payment signature INVALID for Razorpay Order ID: {}. Internal Order ID: {}",
                        verificationRequest.getRazorpay_order_id(), verificationRequest.getInternalOrderId());
                return new PaymentVerificationResponseDto(false, "Payment verification failed. Signature mismatch.", verificationRequest.getInternalOrderId(), null, null);
            }
        } catch (RazorpayException | ResourceNotFoundException | InvalidRequestException e) {
            log.error("Exception during payment verification: {}", e.getMessage());
            return new PaymentVerificationResponseDto(false, e.getMessage(), verificationRequest.getInternalOrderId(), null, null);
        } catch (Exception e) {
            log.error("General exception during payment verification: {}", e.getMessage(), e);
            return new PaymentVerificationResponseDto(false, "An unexpected error occurred during verification.", verificationRequest.getInternalOrderId(), null, null);
        }
    }
}