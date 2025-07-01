package com.restaurant.restaurantapp.model; // Ensure this matches your package structure

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import com.restaurant.restaurantapp.model.OrderItemStatus;

@Entity // Mark this class as a JPA entity
@Table(name = "order_items") // Map to the "order_items" table
@Data // Lombok: Generate getters, setters, etc.
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"order", "dish"}) // Exclude relationships from equals/hashCode
@ToString(exclude = {"order", "dish"}) // Exclude relationships from toString
public class OrderItem {

    @Id // Primary key
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Auto-increment ID
    private Long id;

    // --- Relationship: Which Order does this item belong to? ---
    // Many OrderItems belong to One Order
    @ManyToOne(fetch = FetchType.LAZY) // Lazy fetch is usually good practice here
    @JoinColumn(name = "order_id", nullable = false) // Foreign key column IN THIS TABLE ('order_items')
    // linking back to the 'customer_orders' table.
    // This side OWNS the relationship with Order.
    private Order order; // Reference back to the parent Order object
    // ----------------------------------------------------------

    // --- Relationship: Which Dish was ordered? ---
    // Many OrderItems can refer to the same One Dish
    @ManyToOne(fetch = FetchType.EAGER) // EAGER fetch: Often want Dish details immediately with the item
    @JoinColumn(name = "dish_id", nullable = false) // Foreign key column IN THIS TABLE ('order_items')
    // linking to the 'dishes' table.
    private Dish dish; // Reference to the specific Dish object that was ordered
    // ------------------------------------------------

    @Column(nullable = false) // Quantity must be specified
    private int quantity; // How many of this dish were ordered in this line item?

    @Column(nullable = false, precision = 10, scale = 2) // Price must be stored
    private BigDecimal price; // Price PER UNIT of the dish *at the time the order was placed*
    // Important: Store this here in case the Dish price changes later!

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderItemStatus itemStatus = OrderItemStatus.NEEDS_PREPARATION;

}
