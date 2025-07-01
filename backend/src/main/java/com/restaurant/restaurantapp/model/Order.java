package com.restaurant.restaurantapp.model;

import jakarta.persistence.*;
import lombok.Data;
// Exclude relationships from Lombok's default equals/hashCode to prevent infinite loops
import lombok.EqualsAndHashCode;
import lombok.ToString; // Also exclude relationships from toString if needed

import java.math.BigDecimal;
import java.time.LocalDateTime; // Modern Java Date/Time API
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity // Mark this class as a JPA entity (maps to a database table)
@Table(name = "customer_orders") // Explicitly map to "customer_orders" table to avoid SQL keyword conflict
@Data // Lombok: Generates getters, setters, requiredArgsConstructor, toString, equals, hashCode
@EqualsAndHashCode(exclude = {"restaurantTable", "items"}) // Prevent recursion in equals/hashCode
@ToString(exclude = {"restaurantTable", "items"}) // Prevent recursion in toString
public class Order {

    @Id // Mark 'id' as the primary key
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Use database auto-increment for the ID
    private Long id;

    // --- Relationship: Which table placed the order? ---
    // Many Orders can belong to One RestaurantTable
    @ManyToOne(fetch = FetchType.LAZY) // LAZY: Load table details only when explicitly asked (good practice)
    @JoinColumn(name = "table_id", nullable = false) // The foreign key column in 'customer_orders' table
    // linking to the 'id' of 'restaurant_tables'.
    // 'nullable = false' means every order MUST be linked to a table.
    private RestaurantTable restaurantTable;
    // ----------------------------------------------------

    @Column(name = "razorpay_order_id", length = 100, unique = true)
    private String razorpayOrderId;

    @Column
    private String razorpayPaymentId;

    @Column(nullable = false, updatable = false) // Order time shouldn't be null and shouldn't be changed after creation
    private LocalDateTime orderTime; // Stores the exact date and time the order was placed

    @Enumerated(EnumType.STRING) // Store the enum constant's *name* (e.g., "OPEN") in the database
    @Column(nullable = false, length = 30) // Status column must exist and have sufficient length for enum names
    private OrderStatus status = OrderStatus.OPEN; // Default status for a new order is OPEN

    @Column(precision = 10, scale = 2) // For storing currency accurately (e.g., DECIMAL(10, 2))
    private BigDecimal totalPrice = BigDecimal.ZERO; // The calculated total price of all items in the order. Initialize to 0.

    @Column(length = 500) // Allow some space for notes
    private String notes; // Optional notes from the customer (e.g., allergies, special requests)

    @Column(unique = true, nullable = false, length = 36) // UUIDs are 36 characters long (e.g., "550e8400-e29b-41d4-a716-446655440000")
    private String publicTrackingId;
    // --- Relationship: What items are in this order? ---
    // One Order can have Many OrderItems
    @OneToMany(
            mappedBy = "order",           // IMPORTANT: Links to the 'order' field in the OrderItem class.
            // This side (Order) does NOT own the relationship column.
            // The OrderItem table will have the 'order_id' foreign key.
            cascade = CascadeType.ALL,    // Cascade operations: If we save/update/delete an Order,
            // do the same for its associated OrderItems.
            orphanRemoval = true,         // If an OrderItem is removed from this 'items' list,
            // delete it from the database as it's now an "orphan".
            fetch = FetchType.LAZY       
           
    )
    private List<OrderItem> items = new ArrayList<>(); // The list holding the actual items (dishes + quantity) for this order.
    // Initialize to prevent NullPointerExceptions.
    // --------------------------------------------------


    // --- JPA Lifecycle Callback ---
    @PrePersist // This annotation marks a method to be called BEFORE the entity is first saved to the DB
    protected void onCreate() {
        // Automatically set the order time to the current time only when the order is first created
        if (this.orderTime == null) {
            this.orderTime = LocalDateTime.now();
        }
        if (this.publicTrackingId == null) {
            this.publicTrackingId = UUID.randomUUID().toString();
        }
    }
    // ----------------------------


    // --- Helper Methods (Good Object-Oriented Practice) ---
    // These methods help manage the 'items' list correctly and keep the total price updated.

    /**
     * Adds an OrderItem to this order, sets the bidirectional link,
     * and recalculates the total price.
     * @param item The OrderItem to add.
     */
    public void addItem(OrderItem item) {
        if (item != null) {
            this.items.add(item);
            item.setOrder(this); // Crucial: Set the reference back to this order in the OrderItem
            recalculateTotalPrice();
        }
    }

    /**
     * Removes an OrderItem from this order, breaks the bidirectional link,
     * and recalculates the total price.
     * Due to 'orphanRemoval = true', the removed item will be deleted from the DB
     * when the order is saved/updated.
     * @param item The OrderItem to remove.
     */
    public void removeItem(OrderItem item) {
        if (item != null && this.items.contains(item)) {
            this.items.remove(item);
            item.setOrder(null); // Crucial: Remove the reference back to this order
            recalculateTotalPrice();
        }
    }

    /**
     * Recalculates the total price of the order based on the current items.
     * Uses Java Streams for summing the item prices (price * quantity).
     */
    public void recalculateTotalPrice() {
        if (this.items == null) {
            this.totalPrice = BigDecimal.ZERO;
            return;
        }
        // Using Streams:
        // 1. Get the stream of items.
        // 2. Filter out any potential null items or items without price/quantity (safety check).
        // 3. Map each valid item to its line total (item.price * item.quantity).
        // 4. Reduce the stream of line totals by adding them together, starting from BigDecimal.ZERO.
        this.totalPrice = this.items.stream()
                .filter(i -> i != null && i.getPrice() != null && i.getQuantity() > 0)
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add); // 'reduce' performs the summation
    }
    // ---------------------------------------------------------

   //-------------------------------------------------------------------
}