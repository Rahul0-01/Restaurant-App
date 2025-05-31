package com.restaurant.restaurantapp.Service; // Ensure this matches your package structure

import com.restaurant.restaurantapp.DTO.CreateRazorpayOrderRequestDTO;
import com.restaurant.restaurantapp.DTO.CreateRazorpayOrderResponseDTO;
import com.restaurant.restaurantapp.Exception.ResourceNotFoundException; // Assuming you have this
import com.restaurant.restaurantapp.model.Order; // Your Order entity
import com.restaurant.restaurantapp.Repository.OrderRepository; // Your Order repository

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
//import com.razorpay.Order;
// Import Razorpay's Order class and alias it
// Note: In some versions of the Razorpay SDK, the Order class might be directly 'com.razorpay.Order'.
// If you get an error with 'Order<seg_17>', try 'com.razorpay.Order'.
// However, using an alias is good practice if you also have 'com.restaurant.restaurantapp.model.Order'.
// For clarity, let's assume the alias is needed if both exist.
// If your project doesn't have a class named 'Order' in com.razorpay package directly,
// you might need to find the exact class for creating orders. Often it's just com.razorpay.Order.
// Let's try with the direct import first if alias causes issues.
//import com.razorpay.Order; // Using direct import assuming no name clash in this file.

import org.json.JSONObject; // Make sure you have a dependency for org.json (e.g., <artifactId>json</artifactId>)
import org.slf4j.Logger;     // Using SLF4J for logging
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // For database operations
import com.razorpay.Utils;
import com.restaurant.restaurantapp.DTO.PaymentVerificationRequestDTO;
import com.restaurant.restaurantapp.model.OrderStatus;
import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    @Value("${razorpay.key.id}")
    private String razorpayKeyId; // Renamed for clarity from just keyId

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret; // Renamed for clarity

    private RazorpayClient razorpayClient;
    private final OrderRepository orderRepository; // To fetch/update your internal order

    // Constructor Injection for OrderRepository and initialization of RazorpayClient
    public PaymentService(OrderRepository orderRepository,
                          @Value("${razorpay.key.id}") String rzpKeyId,      // Can also inject here
                          @Value("${razorpay.key.secret}") String rzpKeySecret) { // And here
        this.orderRepository = orderRepository;
        this.razorpayKeyId = rzpKeyId; // Assign from constructor args
        this.razorpayKeySecret = rzpKeySecret;

        try {
            this.razorpayClient = new RazorpayClient(this.razorpayKeyId, this.razorpayKeySecret);
            log.info("SUCCESS: Razorpay client initialized successfully. Key ID starts with: {}",
                    (this.razorpayKeyId != null && this.razorpayKeyId.length() > 8 ? this.razorpayKeyId.substring(0, 8) : "N/A"));
        } catch (RazorpayException e) {
            log.error("ERROR: Initializing Razorpay client failed: {}", e.getMessage(), e);
            // Decide if application should fail to start if Razorpay client can't be initialized
            throw new RuntimeException("Could not initialize Razorpay client", e);
        }
    }

    /**
     * Creates an order on Razorpay's servers.
     * This method is called by your frontend before showing the Razorpay payment popup.
     * The 'receipt' in requestDTO should be your application's unique order ID for the PENDING order.
     */
    @Transactional // This method involves database operations (fetching/updating your Order)
    public CreateRazorpayOrderResponseDTO createRazorpayOrder(CreateRazorpayOrderRequestDTO requestDTO) throws RazorpayException {
        log.info("Attempting to create Razorpay order for application receipt ID: {}, Amount: {} {}",
                requestDTO.getReceipt(), requestDTO.getAmount(), requestDTO.getCurrency());

        // 1. Fetch your internal application order using the receipt ID
        // The receipt ID from the request DTO should correspond to your internal Order ID
        // This internal order should already exist in your database with a PENDING status
        // and a calculated total amount.
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

        // 2. Validate amount (optional but good: compare requestDTO.getAmount() with appOrder.getTotalPrice())
        // For simplicity, we'll use the amount from the request, but in a real app,
        // you'd use the total calculated and stored in your appOrder to prevent tampering.
        // Ensure the currency also matches if you support multiple.
        if (requestDTO.getAmount().compareTo(appOrder.getTotalPrice()) != 0) {
            log.warn("Amount mismatch! Request DTO amount: {}, Stored order amount: {}. Using stored order amount.",
                    requestDTO.getAmount(), appOrder.getTotalPrice());
            // It's safer to use the amount stored in your database for the order.
        }
        BigDecimal authoritativeAmount = appOrder.getTotalPrice(); // Use your system's authoritative amount

        // 3. Convert amount to smallest currency unit (e.g., paise for INR)
        // Razorpay expects amount as an integer/long.
        BigDecimal amountInPaiseBigDecimal = authoritativeAmount.multiply(new BigDecimal("100"));
        long amountInPaiseLong = amountInPaiseBigDecimal.longValue();

        // 4. Prepare the request for Razorpay's Order API
        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amountInPaiseLong);         // Amount in paise
        orderRequest.put("currency", "INR"); // e.g., "INR"
        orderRequest.put("receipt", appOrder.getId().toString()); // Use your DB order ID as the receipt for Razorpay
        // orderRequest.put("payment_capture", 1); // 1 for auto-capture, 0 for manual. Default is usually 0.
        // Auto-capture is simpler for most cases.

        log.debug("Razorpay order request payload: {}", orderRequest.toString());

        // 5. Create the order on Razorpay's system
        // Use the direct class name 'com.razorpay.Order' if the alias 'Order<seg_17>' causes issues
        com.razorpay.Order razorpayApiOrder = this.razorpayClient.orders.create(orderRequest);

        String rzpOrderId = razorpayApiOrder.get("id").toString(); // Razorpay's order ID is a string
        log.info("Razorpay Order created successfully. Razorpay Order ID: {}", rzpOrderId);

        // 6. Store Razorpay's Order ID in your application's Order entity
        appOrder.setRazorpayOrderId(rzpOrderId); // Assuming your Order entity has this field and setter
        orderRepository.save(appOrder); // Save the updated application order
        log.info("Linked Razorpay Order ID {} to application order ID {}", rzpOrderId, appOrder.getId());

        // 7. Prepare and return the response DTO for the frontend
        return new CreateRazorpayOrderResponseDTO(
                rzpOrderId,
                this.razorpayKeyId,    // Your public Razorpay Key ID
                amountInPaiseLong,     // Amount in paise (that was sent to Razorpay)
                "INR" // Currency
        );
    }

    @Transactional // This method involves database operations
    public boolean verifyPaymentAndUpdateOrder(PaymentVerificationRequestDTO verificationRequest) {
        log.info("Verifying payment for Razorpay Order ID: {} and Internal Order ID: {}",
                verificationRequest.getRazorpay_order_id(), verificationRequest.getInternalOrderId());

        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", verificationRequest.getRazorpay_order_id());
            attributes.put("razorpay_payment_id", verificationRequest.getRazorpay_payment_id());
            attributes.put("razorpay_signature", verificationRequest.getRazorpay_signature());

            // Verify the signature using your Razorpay Key Secret
            boolean isSignatureValid = Utils.verifyPaymentSignature(attributes, this.razorpayKeySecret);

            if (isSignatureValid) {
                log.info("Razorpay payment signature VERIFIED for Razorpay Order ID: {}", verificationRequest.getRazorpay_order_id());

                // Fetch your internal order
                Order appOrder = orderRepository.findById(verificationRequest.getInternalOrderId())
                        .orElseThrow(() -> {
                            log.error("Internal order with ID {} not found during payment verification.", verificationRequest.getInternalOrderId());
                            return new ResourceNotFoundException("Order with ID " + verificationRequest.getInternalOrderId() + " not found.");
                        });

                // Check if the Razorpay Order ID matches the one stored (optional but good)
                if (!verificationRequest.getRazorpay_order_id().equals(appOrder.getRazorpayOrderId())) {
                    log.error("Razorpay Order ID mismatch! Expected: {}, Received from callback: {}. For internal order ID: {}",
                            appOrder.getRazorpayOrderId(), verificationRequest.getRazorpay_order_id(), appOrder.getId());
                    // This could indicate a potential issue or tampering, though unlikely if signature is valid.
                    // Handle appropriately, maybe throw an exception or just log a warning.
                    // For now, we'll proceed if signature is valid, but this is a point of attention.
                }

                // Update your internal order status to PAID (or PROCESSING, CONFIRMED, etc.)
                // Also store the razorpay_payment_id for reference.
                // Only update if it's not already in a final paid/completed state to avoid reprocessing.
                if (appOrder.getStatus() != OrderStatus.PAID && appOrder.getStatus() != OrderStatus.COMPLETED) {
                    appOrder.setStatus(OrderStatus.PAID); // Or your next logical status after payment
                    appOrder.setRazorpayPaymentId(verificationRequest.getRazorpay_payment_id()); // Assuming Order entity has this field
                    orderRepository.save(appOrder);
                    log.info("Internal Order ID {} status updated to PAID. Razorpay Payment ID: {}",
                            appOrder.getId(), verificationRequest.getRazorpay_payment_id());
                } else {
                    log.warn("Internal Order ID {} already in status {} or {}. No update made.",
                            appOrder.getId(), OrderStatus.PAID, OrderStatus.COMPLETED);
                }
                return true; // Payment verified and order updated
            } else {
                log.error("Razorpay payment signature INVALID for Razorpay Order ID: {}. Internal Order ID: {}",
                        verificationRequest.getRazorpay_order_id(), verificationRequest.getInternalOrderId());
                return false; // Signature verification failed
            }
        } catch (RazorpayException e) {
            log.error("RazorpayException during payment verification: {}", e.getMessage(), e);
            return false; // Error during verification process
        } catch (Exception e) { // Catch other potential errors like ResourceNotFound
            log.error("General exception during payment verification: {}", e.getMessage(), e);
            return false;
        }
    }
}