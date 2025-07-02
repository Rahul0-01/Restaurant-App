// src/main/java/com/restaurant/restaurantapp/Service/OrderService.java
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
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final DishRepository dishRepository;
    private final RestaurantTableRepository tableRepository;
    private final OrderItemRepository orderItemRepository;
    private final WebSocketService webSocketService; // <<< Correctly Injected

    // This is the private helper method for adding items to an order.
    private void addItemsToOrderEntity(Order order, List<OrderItemRequestDTO> itemsToAdd) {
        if (itemsToAdd == null || itemsToAdd.isEmpty()) {
            throw new InvalidRequestException("Item list cannot be empty.");
        }
        for (OrderItemRequestDTO itemDto : itemsToAdd) {
            Dish dish = dishRepository.findById(itemDto.getDishId())
                    .orElseThrow(() -> new ResourceNotFoundException("Dish not found: " + itemDto.getDishId()));
            if (!dish.isAvailable()) {
                throw new InvalidRequestException("Dish '" + dish.getName() + "' is unavailable.");
            }

            Optional<OrderItem> existingItemOpt = order.findItemByDishId(dish.getId());
            if (existingItemOpt.isPresent()) {
                OrderItem existingItem = existingItemOpt.get();
                int newQuantity = existingItem.getQuantity() + itemDto.getQuantity();
                existingItem.setQuantity(newQuantity);
            } else {
                OrderItem orderItem = new OrderItem();
                orderItem.setDish(dish);
                orderItem.setQuantity(itemDto.getQuantity());
                orderItem.setPrice(dish.getPrice());
                orderItem.setItemStatus(OrderItemStatus.NEEDS_PREPARATION);
                order.addItem(orderItem);
            }
        }
        order.recalculateTotalPrice();
    }

    public OrderResponseDTO startNewOrder(OrderRequestDTO orderRequestDTO) {
        log.info("Starting new tab for table ID: {}", orderRequestDTO.getTableId());
        RestaurantTable table = tableRepository.findById(orderRequestDTO.getTableId())
                .orElseThrow(() -> new ResourceNotFoundException("Table not found with ID: " + orderRequestDTO.getTableId()));

        if (orderRepository.findByRestaurantTableIdAndStatus(table.getId(), OrderStatus.OPEN).isPresent()) {
            throw new InvalidRequestException("An open tab already exists for this table.");
        }

        Order newOrder = new Order();
        newOrder.setRestaurantTable(table);
        newOrder.setStatus(OrderStatus.OPEN);
        newOrder.setNotes(orderRequestDTO.getNotes());
        addItemsToOrderEntity(newOrder, orderRequestDTO.getItems());
        Order savedOrder = orderRepository.save(newOrder);
        return mapOrderToResponseDTO(savedOrder);
    }

    public OrderResponseDTO addItemsToExistingOrder(Long orderId, List<OrderItemRequestDTO> itemsToAdd) {
        log.info("Adding {} item(s) to existing order ID: {}", itemsToAdd.size(), orderId);
        Order existingOrder = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));
        if (existingOrder.getStatus() != OrderStatus.OPEN) {
            throw new InvalidRequestException("Cannot add items to an order that is not OPEN.");
        }
        addItemsToOrderEntity(existingOrder, itemsToAdd);
        Order savedOrder = orderRepository.save(existingOrder);
        return mapOrderToResponseDTO(savedOrder);
    }

    @Transactional(readOnly = true)
    public Optional<OrderResponseDTO> getActiveOrderForTable(Long tableId) {
        return orderRepository.findByRestaurantTableIdAndStatus(tableId, OrderStatus.OPEN)
                .map(this::mapOrderToResponseDTO);
    }

    @Transactional(readOnly = true)
    public OrderResponseDTO getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));
        return mapOrderToResponseDTO(order);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponseDTO> getOrders(Long tableId, OrderStatus status, Pageable pageable) {
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

    @Transactional(readOnly = true)
    public CustomerOrderStatusDto getOrderStatusByPublicTrackingId(String publicTrackingId) {
        Order order = orderRepository.findByPublicTrackingId(publicTrackingId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with tracking ID: " + publicTrackingId));
        return mapOrderToCustomerStatusDTO(order);
    }

    // --- THIS METHOD IS NOW ENHANCED ---
    public OrderResponseDTO updateOrderStatus(Long orderId, OrderStatus newStatus) {
        log.info("Updating order status for ID {} to {}", orderId, newStatus);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));
        order.setStatus(newStatus);
        Order updatedOrder = orderRepository.save(order);
        OrderResponseDTO responseDto = mapOrderToResponseDTO(updatedOrder);

        // Send a WebSocket message to the customer's bill page when payment is completed offline
        if (newStatus == OrderStatus.COMPLETED) {
            webSocketService.sendOrderStatusUpdate(updatedOrder.getPublicTrackingId(), responseDto);
        }

        return responseDto;
    }

    // --- THIS METHOD IS NOW ENHANCED ---
    public OrderItemResponseDTO updateOrderItemStatus(Long itemId, OrderItemStatus newStatus) {
        log.info("Updating order item status for ID {} to {}", itemId, newStatus);
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Order item not found with ID: " + itemId));
        item.setItemStatus(newStatus);
        OrderItem updatedItem = orderItemRepository.save(item);
        OrderItemResponseDTO responseDto = mapOrderItemToResponseDTO(updatedItem);

        // Send a WebSocket message to the customer's menu page with the updated item
        String publicTrackingId = updatedItem.getOrder().getPublicTrackingId();
        webSocketService.sendOrderStatusUpdate(publicTrackingId, responseDto);

        return responseDto;
    }

    public OrderResponseDTO requestBill(Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));
        if (order.getStatus() != OrderStatus.OPEN) {
            throw new InvalidRequestException("Can only request bill for an OPEN tab.");
        }
        order.setStatus(OrderStatus.AWAITING_PAYMENT);
        Order updated = orderRepository.save(order);
        return mapOrderToResponseDTO(updated);
    }

    public List<KitchenOrderItemDTO> getKitchenOrders() {
        return orderItemRepository.findByItemStatusIn(
                List.of(OrderItemStatus.NEEDS_PREPARATION, OrderItemStatus.IN_PROGRESS)
        ).stream().map(this::mapItemToKitchenDTO).collect(Collectors.toList());
    }

    public void toggleAssistanceRequest(Long tableId, boolean requested) {
        RestaurantTable table = tableRepository.findById(tableId).orElseThrow(() -> new ResourceNotFoundException("Table not found with ID: " + tableId));
        table.setAssistanceRequested(requested);
        tableRepository.save(table);
    }

    @Transactional(readOnly = true)
    public ServiceTasksDTO getServiceTasks() {
        // ... your existing getServiceTasks logic is correct ...
        List<OrderItem> readyItems = orderItemRepository.findByItemStatusIn(List.of(OrderItemStatus.READY));
        List<KitchenOrderItemDTO> readyItemsDto = readyItems.stream().map(this::mapItemToKitchenDTO).collect(Collectors.toList());
        List<RestaurantTable> assistanceTables = tableRepository.findByAssistanceRequested(true);
        List<TableDTO> assistanceTablesDto = assistanceTables.stream().map(this::mapTableToDto).collect(Collectors.toList());
        List<Order> paymentOrders = orderRepository.findByStatus(OrderStatus.AWAITING_PAYMENT);
        List<OrderResponseDTO> paymentOrdersDto = paymentOrders.stream().map(this::mapOrderToResponseDTO).collect(Collectors.toList());
        return new ServiceTasksDTO(readyItemsDto, assistanceTablesDto, paymentOrdersDto);
    }


    // mappers...............

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
        dto.setItems(order.getItems().stream().map(this::mapOrderItemToResponseDTO).collect(Collectors.toList()));
        return dto;
    }

    private CustomerOrderStatusDto mapOrderToCustomerStatusDTO(Order order) {
        CustomerOrderStatusDto dto = new CustomerOrderStatusDto();
        dto.setInternalOrderId(order.getId());
        dto.setPublicTrackingId(order.getPublicTrackingId());
        dto.setStatus(order.getStatus());
        dto.setOrderTime(order.getOrderTime());
        dto.setTotalPrice(order.getTotalPrice());
        dto.setItems(order.getItems().stream()
                .map(item -> new CustomerOrderStatusDto.OrderItemSimpleDto(
                        item.getDish().getName(),
                        item.getQuantity(),
                        item.getPrice(), // The price of a single item
                        item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())) // The calculated total for the line
                ))
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
        if (item.getPrice() != null && item.getQuantity() > 0) {
            dto.setLineItemTotal(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        } else {
            dto.setLineItemTotal(BigDecimal.ZERO);
        }
        dto.setItemStatus(item.getItemStatus());
        return dto;
    }

    private KitchenOrderItemDTO mapItemToKitchenDTO(OrderItem item) {
        KitchenOrderItemDTO dto = new KitchenOrderItemDTO();
        dto.setOrderItemId(item.getId());
        dto.setDishName(item.getDish() != null ? item.getDish().getName() : "Unknown");
        dto.setQuantity(item.getQuantity());
        dto.setItemStatus(item.getItemStatus());
        dto.setTableNumber(item.getOrder() != null && item.getOrder().getRestaurantTable() != null ? item.getOrder().getRestaurantTable().getTableNumber() : "N/A");
        dto.setOrderId(item.getOrder() != null ? item.getOrder().getId() : null);
        return dto;
    }

    private TableDTO mapTableToDto(RestaurantTable table) {
        TableDTO dto = new TableDTO();
        dto.setId(table.getId());
        dto.setTableNumber(table.getTableNumber());
        dto.setCapacity(table.getCapacity());
        dto.setStatus(table.getStatus());
        dto.setQrCodeIdentifier(table.getQrCodeIdentifier());
        // Do not map the assistance requested flag if it's not in the DTO, or add it if needed.
        return dto;
    }
}