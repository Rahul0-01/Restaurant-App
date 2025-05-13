package com.restaurant.restaurantapp.Controller;

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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private static final Logger log = LoggerFactory.getLogger(OrderController.class);
    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponseDTO> placeOrder(@Valid @RequestBody OrderRequestDTO orderRequestDTO) {
        log.info("POST /api/orders");
        OrderResponseDTO createdOrder = orderService.placeOrder(orderRequestDTO);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(createdOrder.getId())
                .toUri();
        // Return 201 Created status
        return ResponseEntity.created(location).body(createdOrder);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponseDTO> getOrderById(@PathVariable Long id) {
        log.info("GET /api/orders/{}", id);
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    // Get orders, optionally filtered by tableId or status
    @GetMapping
    public ResponseEntity<Page<OrderResponseDTO>> getOrders(
            @RequestParam(required = false) Long tableId,
            @RequestParam(required = false) OrderStatus status,
            Pageable pageable) { // <-- Add Pageable here
        log.info("GET /api/orders?tableId={}&status={}&pageable={}", tableId, status, pageable);
        // 3. Call the updated service method, passing Pageable
        Page<OrderResponseDTO> orderPage = orderService.getOrders(tableId, status, pageable);
        // 4. Return the Page object directly
        return ResponseEntity.ok(orderPage);
    }
    // Update order status
    @PutMapping("/{id}/status") // Or use PATCH
    public ResponseEntity<OrderResponseDTO> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderStatusDTO statusUpdateDTO) {
        log.info("PUT /api/orders/{}/status", id);
        OrderResponseDTO updatedOrder = orderService.updateOrderStatus(id, statusUpdateDTO.getStatus());
        return ResponseEntity.ok(updatedOrder);
    }
}