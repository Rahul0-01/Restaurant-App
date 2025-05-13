package com.restaurant.restaurantapp.Service;

import com.restaurant.restaurantapp.DTO.*;
import com.restaurant.restaurantapp.Exception.InvalidRequestException;
import com.restaurant.restaurantapp.Exception.ResourceNotFoundException;
import com.restaurant.restaurantapp.model.*;
import com.restaurant.restaurantapp.Repository.*; // Import all repositories
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final DishRepository dishRepository;
    private final RestaurantTableRepository tableRepository;

    // --- Place Order (from previous example, seems complete) ---
    public OrderResponseDTO placeOrder(OrderRequestDTO orderRequestDTO) {
        log.info("Placing new order for table ID: {}", orderRequestDTO.getTableId());
        // 1. Basic Validation
        if (orderRequestDTO.getTableId() == null || orderRequestDTO.getItems() == null || orderRequestDTO.getItems().isEmpty()) {
            throw new InvalidRequestException("Order request must include table ID and at least one item.");
        }

        // 2. Find Table
        RestaurantTable table = tableRepository.findById(orderRequestDTO.getTableId())
                .orElseThrow(() -> new ResourceNotFoundException("Table not found with ID: " + orderRequestDTO.getTableId()));

        // 3. Create Order
        Order newOrder = new Order();
        newOrder.setRestaurantTable(table);
        newOrder.setStatus(OrderStatus.PENDING); // Initial status
        newOrder.setNotes(orderRequestDTO.getNotes());

        // 4. Process Items
        for (OrderItemRequestDTO itemDto : orderRequestDTO.getItems()) {
            Dish dish = dishRepository.findById(itemDto.getDishId())
                    .orElseThrow(() -> new ResourceNotFoundException("Dish not found with ID: " + itemDto.getDishId()));

            if (!dish.isAvailable()) {
                throw new InvalidRequestException("Dish '" + dish.getName() + "' is currently unavailable.");
            }
            if(dish.getPrice() == null || dish.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw new InvalidRequestException("Dish '" + dish.getName() + "' does not have a valid price.");
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setDish(dish);
            orderItem.setQuantity(itemDto.getQuantity());
            orderItem.setPrice(dish.getPrice()); // Price at time of order

            newOrder.addItem(orderItem); // Adds item and recalculates total
        }

        // 5. Save Order (cascades to items)
        Order savedOrder = orderRepository.save(newOrder);
        log.info("Successfully placed order ID: {}", savedOrder.getId());

        // 6. Map and Return DTO
        return mapOrderToResponseDTO(savedOrder);
    }

    // --- Get Orders ---

    @Transactional(readOnly = true)
    public OrderResponseDTO getOrderById(Long orderId) {
        log.debug("Fetching order by ID: {}", orderId);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));
        return mapOrderToResponseDTO(order);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponseDTO> getOrders(Long tableId, OrderStatus status, Pageable pageable) {
        log.debug("Fetching orders with filter - tableId: {}, status: {}, pagination: {}", tableId, status, pageable);
        Page<Order> orderPage; // Will hold the Page of Order entities

        // 3. Call the correct PAGINATED repository method based on filters
        if (tableId != null && status != null) {
            orderPage = orderRepository.findByRestaurantTableIdAndStatus(tableId, status, pageable);
        } else if (tableId != null) {
            orderPage = orderRepository.findByRestaurantTableId(tableId, pageable);
        } else if (status != null) {
            orderPage = orderRepository.findByStatus(status, pageable);
        } else {
            // If no filters, get all orders with pagination
            orderPage = orderRepository.findAll(pageable);
        }

        // 4. Map Page<Order> to Page<OrderResponseDTO>
        Page<OrderResponseDTO> orderDtoPage = orderPage.map(this::mapOrderToResponseDTO);

        // 5. Return the page of DTOs
        return orderDtoPage;
    }

    // --- Update Order Status ---
    public OrderResponseDTO updateOrderStatus(Long orderId, OrderStatus newStatus) {
        log.info("Updating status for order ID {} to {}", orderId, newStatus);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));

        // Optional: Add logic to validate status transitions (e.g., can't go from SERVED back to PENDING)
        log.info("Order {} status changing from {} to {}", orderId, order.getStatus(), newStatus);
        order.setStatus(newStatus);

        Order updatedOrder = orderRepository.save(order);
        return mapOrderToResponseDTO(updatedOrder);
    }


    // --- Mappers (Ensure these are present and correct) ---
    private OrderResponseDTO mapOrderToResponseDTO(Order order) {
        OrderResponseDTO dto = new OrderResponseDTO();
        dto.setId(order.getId());
        if (order.getRestaurantTable() != null) {
            dto.setTableId(order.getRestaurantTable().getId());
            dto.setTableNumber(order.getRestaurantTable().getTableNumber());
        }
        dto.setOrderTime(order.getOrderTime());
        dto.setStatus(order.getStatus());
        dto.setTotalPrice(order.getTotalPrice());
        dto.setNotes(order.getNotes());
        dto.setItems(order.getItems().stream()
                .map(this::mapOrderItemToResponseDTO)
                .collect(Collectors.toList()));
        return dto;
    }

    private OrderItemResponseDTO mapOrderItemToResponseDTO(OrderItem item) {
        OrderItemResponseDTO dto = new OrderItemResponseDTO();
        dto.setId(item.getId());
        if (item.getDish() != null) {
            dto.setDishId(item.getDish().getId());
            dto.setDishName(item.getDish().getName());
        }
        dto.setQuantity(item.getQuantity());
        dto.setPrice(item.getPrice());
        // Calculate line item total
        dto.setLineItemTotal(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        return dto;
    }
}