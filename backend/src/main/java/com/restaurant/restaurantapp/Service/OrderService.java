package com.restaurant.restaurantapp.Service;

import com.restaurant.restaurantapp.DTO.*;
import com.restaurant.restaurantapp.Exception.InvalidRequestException;
import com.restaurant.restaurantapp.Exception.ResourceNotFoundException;
import com.restaurant.restaurantapp.model.*;
import com.restaurant.restaurantapp.Repository.*;
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

    // --- Place Order ---
    public OrderResponseDTO placeOrder(OrderRequestDTO orderRequestDTO) {
        log.info("Placing new order for table ID: {}", orderRequestDTO.getTableId());
        if (orderRequestDTO.getTableId() == null || orderRequestDTO.getItems() == null || orderRequestDTO.getItems().isEmpty()) {
            throw new InvalidRequestException("Order request must include table ID and at least one item.");
        }

        RestaurantTable table = tableRepository.findById(orderRequestDTO.getTableId())
                .orElseThrow(() -> new ResourceNotFoundException("Table not found with ID: " + orderRequestDTO.getTableId()));

        Order newOrder = new Order();
        newOrder.setRestaurantTable(table);


        if (orderRequestDTO.getPaymentType() == null || orderRequestDTO.getPaymentType() == PaymentType.ONLINE) {
            // If payment type is ONLINE or not specified, default to PENDING for the online payment flow.
            newOrder.setStatus(OrderStatus.PENDING);
        } else if (orderRequestDTO.getPaymentType() == PaymentType.PAY_AT_COUNTER) {
            // If paying at the counter, set the status directly to UNPAID.
            newOrder.setStatus(OrderStatus.UNPAID);
        } else {
            // This case should ideally not be hit if you use the enum, but it's good practice.
            throw new InvalidRequestException("Invalid payment type specified.");
        }
// --------------------------------------------------------


        newOrder.setNotes(orderRequestDTO.getNotes());

        for (OrderItemRequestDTO itemDto : orderRequestDTO.getItems()) {
            Dish dish = dishRepository.findById(itemDto.getDishId())
                    .orElseThrow(() -> new ResourceNotFoundException("Dish not found with ID: " + itemDto.getDishId()));

            if (!dish.isAvailable()) {
                throw new InvalidRequestException("Dish '" + dish.getName() + "' is currently unavailable.");
            }
            if (dish.getPrice() == null || dish.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw new InvalidRequestException("Dish '" + dish.getName() + "' does not have a valid price.");
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setDish(dish);
            orderItem.setQuantity(itemDto.getQuantity());
            orderItem.setPrice(dish.getPrice());

            newOrder.addItem(orderItem);
        }

        Order savedOrder = orderRepository.save(newOrder);
        log.info("Successfully placed order ID: {}", savedOrder.getId());

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
        Page<Order> orderPage;

        if (tableId != null && status != null) {
            orderPage = orderRepository.findByRestaurantTableIdAndStatus(tableId, status, pageable);
        } else if (tableId != null) {
            orderPage = orderRepository.findByRestaurantTableId(tableId, pageable);
        } else if (status != null) {
            orderPage = orderRepository.findByStatus(status, pageable);
        } else {
            orderPage = orderRepository.findAll(pageable);
        }

        return orderPage.map(this::mapOrderToResponseDTO);
    }

    // --- Get Order Status By Public Tracking ID ---
    @Transactional(readOnly = true)
    public CustomerOrderStatusDto getOrderStatusByPublicTrackingId(String publicTrackingId) {
        log.debug("Fetching order status by publicTrackingId: {}", publicTrackingId);

        Order order = orderRepository.findByPublicTrackingId(publicTrackingId)
                .orElseThrow(() -> {
                    log.warn("Order not found with publicTrackingId: {}", publicTrackingId);
                    return new ResourceNotFoundException("Order not found with tracking ID: " + publicTrackingId);
                });

        CustomerOrderStatusDto dto = new CustomerOrderStatusDto();
        dto.setInternalOrderId(order.getId()); // <<< THIS IS THE ONLY ADDED LINE
        dto.setPublicTrackingId(order.getPublicTrackingId());
        dto.setStatus(order.getStatus());
        dto.setOrderTime(order.getOrderTime());
        dto.setTotalPrice(order.getTotalPrice());

        if (order.getItems() != null && !order.getItems().isEmpty()) {
            List<CustomerOrderStatusDto.OrderItemSimpleDto> itemDtos = order.getItems().stream()
                    .map(orderItem -> {
                        String dishName = (orderItem.getDish() != null) ? orderItem.getDish().getName() : "Unknown Dish";
                        return new CustomerOrderStatusDto.OrderItemSimpleDto(
                                dishName,
                                orderItem.getQuantity(),
                                orderItem.getPrice()
                        );
                    })
                    .collect(Collectors.toList());
            dto.setItems(itemDtos);
        } else {
            dto.setItems(new ArrayList<>());
        }

        log.info("Successfully fetched order status for publicTrackingId: {}", publicTrackingId);
        return dto;
    }

    // --- Update Order Status ---
    public OrderResponseDTO updateOrderStatus(Long orderId, OrderStatus newStatus) {
        log.info("Updating status for order ID {} to {}", orderId, newStatus);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));

        log.info("Order {} status changing from {} to {}", orderId, order.getStatus(), newStatus);
        order.setStatus(newStatus);

        Order updatedOrder = orderRepository.save(order);
        return mapOrderToResponseDTO(updatedOrder);
    }

    // --- Mappers ---
    private OrderResponseDTO mapOrderToResponseDTO(Order order) {
        OrderResponseDTO dto = new OrderResponseDTO();
        dto.setId(order.getId());
        dto.setPublicTrackingId(order.getPublicTrackingId());
        if (order.getRestaurantTable() != null) {
            dto.setTableId(order.getRestaurantTable().getId());
            dto.setTableNumber(order.getRestaurantTable().getTableNumber());
        }
        dto.setOrderTime(order.getOrderTime());
        dto.setStatus(order.getStatus());
        dto.setTotalPrice(order.getTotalPrice());
        dto.setNotes(order.getNotes());
        if (order.getItems() != null) {
            dto.setItems(order.getItems().stream()
                    .map(this::mapOrderItemToResponseDTO)
                    .collect(Collectors.toList()));
        } else {
            dto.setItems(new ArrayList<>());
        }
        return dto;
    }

    private OrderItemResponseDTO mapOrderItemToResponseDTO(OrderItem item) {
        OrderItemResponseDTO dto = new OrderItemResponseDTO();
        dto.setId(item.getId());
        if (item.getDish() != null) {
            dto.setDishId(item.getDish().getId());
            dto.setDishName(item.getDish().getName());
        } else {
            dto.setDishName("Unknown Dish");
        }
        dto.setQuantity(item.getQuantity());
        dto.setPrice(item.getPrice());
        if (item.getPrice() != null && item.getQuantity() > 0) {
            dto.setLineItemTotal(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        } else {
            dto.setLineItemTotal(BigDecimal.ZERO);
        }
        return dto;
    }
}