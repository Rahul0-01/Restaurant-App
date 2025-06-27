package com.restaurant.restaurantapp.Controller;

import com.restaurant.restaurantapp.DTO.CustomerOrderStatusDto;
import com.restaurant.restaurantapp.DTO.OrderRequestDTO;
import com.restaurant.restaurantapp.DTO.OrderResponseDTO;
import com.restaurant.restaurantapp.DTO.UpdateOrderStatusDTO;
import com.restaurant.restaurantapp.model.OrderStatus;
import com.restaurant.restaurantapp.Service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // <<< IMPORT THIS
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private static final Logger log = LoggerFactory.getLogger(OrderController.class);
    private final OrderService orderService;

    @PostMapping
    @PreAuthorize("permitAll()") // <<< Also add this to the order placement endpoint
    public ResponseEntity<OrderResponseDTO> placeOrder(@Valid @RequestBody OrderRequestDTO orderRequestDTO) {
        log.info("POST /api/orders");
        OrderResponseDTO createdOrder = orderService.placeOrder(orderRequestDTO);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(createdOrder.getId())
                .toUri();
        return ResponseEntity.created(location).body(createdOrder);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')") // It's good practice to secure all endpoints explicitly
    public ResponseEntity<OrderResponseDTO> getOrderById(@PathVariable Long id) {
        log.info("GET /api/orders/{}", id);
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')") // Secure this as well
    public ResponseEntity<Page<OrderResponseDTO>> getOrders(
            @RequestParam(required = false) Long tableId,
            @RequestParam(required = false) OrderStatus status,
            Pageable pageable) {
        log.info("GET /api/orders?tableId={}&status={}&pageable={}", tableId, status, pageable);
        Page<OrderResponseDTO> orderPage = orderService.getOrders(tableId, status, pageable);
        return ResponseEntity.ok(orderPage);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')") // Secure this as well
    public ResponseEntity<OrderResponseDTO> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderStatusDTO statusUpdateDTO) {
        log.info("PUT /api/orders/{}/status", id);
        OrderResponseDTO updatedOrder = orderService.updateOrderStatus(id, statusUpdateDTO.getStatus());
        return ResponseEntity.ok(updatedOrder);
    }

    // --- NEW ENDPOINT FOR CUSTOMER TO CHECK ORDER STATUS ---
    @GetMapping("/status/{publicTrackingId}")
    @PreAuthorize("permitAll()") // <<< THIS IS THE CRUCIAL ADDITION
    public ResponseEntity<CustomerOrderStatusDto> getOrderStatusByPublicId(@PathVariable String publicTrackingId) {
        log.info("GET /api/orders/status/{}", publicTrackingId);
        CustomerOrderStatusDto statusDto = orderService.getOrderStatusByPublicTrackingId(publicTrackingId);
        return ResponseEntity.ok(statusDto);
    }
}