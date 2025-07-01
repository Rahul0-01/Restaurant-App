// src/main/java/com/restaurant/restaurantapp/Controller/OrderController.java
package com.restaurant.restaurantapp.Controller;

import com.restaurant.restaurantapp.DTO.*;
import com.restaurant.restaurantapp.model.OrderStatus;
import com.restaurant.restaurantapp.model.OrderItemStatus;
import com.restaurant.restaurantapp.Service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private static final Logger log = LoggerFactory.getLogger(OrderController.class);
    private final OrderService orderService;

    /**
     * Creates a new Order (starts a new tab).
     * The frontend should call this ONLY when it knows no active tab exists for the table.
     */
    @PostMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<OrderResponseDTO> startNewOrder(@Valid @RequestBody OrderRequestDTO orderRequestDTO) {
        log.info("POST /api/orders (Start new tab)");
        OrderResponseDTO createdOrder = orderService.startNewOrder(orderRequestDTO);
        URI location = URI.create(String.format("/api/orders/%s", createdOrder.getId()));
        return ResponseEntity.created(location).body(createdOrder);
    }

    /**
     * Adds one or more items to an existing OPEN order.
     * This is the endpoint for adding subsequent items to a tab.
     */
    @PostMapping("/{orderId}/items")
    @PreAuthorize("permitAll()")
    public ResponseEntity<OrderResponseDTO> addItemsToOrder(
            @PathVariable Long orderId,
            @Valid @RequestBody AddItemsRequestDTO addItemsRequest) {
        log.info("POST /api/orders/{}/items", orderId);
        OrderResponseDTO updatedOrder = orderService.addItemsToExistingOrder(orderId, addItemsRequest.getItems());
        return ResponseEntity.ok(updatedOrder);
    }

    /**
     * Endpoint for customers to check if there is an active ('OPEN') tab for their table.
     */
    @GetMapping("/table/{tableId}/active")
    @PreAuthorize("permitAll()")
    public ResponseEntity<OrderResponseDTO> getActiveOrderForTable(@PathVariable Long tableId) {
        log.info("GET /api/orders/table/{}/active", tableId);
        return orderService.getActiveOrderForTable(tableId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Endpoint for the customer to request the final bill.
     */
    @PutMapping("/{orderId}/request-bill")
    @PreAuthorize("permitAll()")
    public ResponseEntity<OrderResponseDTO> requestBill(@PathVariable Long orderId) {
        log.info("PUT /api/orders/{}/request-bill", orderId);
        OrderResponseDTO order = orderService.requestBill(orderId);
        return ResponseEntity.ok(order);
    }

    /**
     * Endpoint for staff to update a single item's status.
     */
    @PutMapping("/items/{itemId}/status")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<OrderItemResponseDTO> updateOrderItemStatus(
            @PathVariable Long itemId,
            @RequestBody UpdateOrderItemStatusDTO statusDTO) {
        log.info("PUT /api/orders/items/{}/status", itemId);
        OrderItemResponseDTO updatedItem = orderService.updateOrderItemStatus(itemId, statusDTO.getItemStatus());
        return ResponseEntity.ok(updatedItem);
    }

    /**
     * Endpoint for the Kitchen Display System (KDS).
     */
    @GetMapping("/kitchen")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<List<KitchenOrderItemDTO>> getKitchenOrders() {
        log.info("GET /api/orders/kitchen");
        List<KitchenOrderItemDTO> kitchenItems = orderService.getKitchenOrders();
        return ResponseEntity.ok(kitchenItems);
    }

    /**
     * Endpoint for staff to get all orders (paginated).
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<Page<OrderResponseDTO>> getOrders(Pageable pageable) {
        log.info("GET /api/orders with pagination: {}", pageable);
        // We can add filters back here later if needed
        Page<OrderResponseDTO> orderPage = orderService.getOrders(null, null, pageable);
        return ResponseEntity.ok(orderPage);
    }

    /**
     * Endpoint for staff to get a single order's details.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<OrderResponseDTO> getOrderById(@PathVariable Long id) {
        log.info("GET /api/orders/{}", id);
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    /**
     * Endpoint for staff to update the overall order status (e.g., to CANCELLED).
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<OrderResponseDTO> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderStatusDTO statusUpdateDTO) {
        log.info("PUT /api/orders/{}/status to {}", id, statusUpdateDTO.getStatus());
        OrderResponseDTO updatedOrder = orderService.updateOrderStatus(id, statusUpdateDTO.getStatus());
        return ResponseEntity.ok(updatedOrder);
    }

    /**
     * Endpoint for customers to check their order status after payment.
     */
    @GetMapping("/status/{publicTrackingId}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<CustomerOrderStatusDto> getOrderStatusByPublicId(@PathVariable String publicTrackingId) {
        log.info("GET /api/orders/status/{}", publicTrackingId);
        CustomerOrderStatusDto statusDto = orderService.getOrderStatusByPublicTrackingId(publicTrackingId);
        return ResponseEntity.ok(statusDto);
    }
}