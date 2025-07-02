// src/main/java/com/restaurant/restaurantapp/Service/WebSocketService.java
package com.restaurant.restaurantapp.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebSocketService {

    private static final Logger log = LoggerFactory.getLogger(WebSocketService.class);

    // This is Spring's magic tool for sending WebSocket messages. We inject it.
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public WebSocketService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Sends a message to a specific "order" channel.
     * The frontend will subscribe to this channel to get live updates for their order.
     *
     * @param publicTrackingId The unique ID of the order, used to create the channel name.
     * @param payload The data we want to send (e.g., an OrderItemDTO).
     */
    public void sendOrderStatusUpdate(String publicTrackingId, Object payload) {
        // This is the "channel" name. It's like a private radio frequency for this specific order.
        // Example: "/topic/orders/a1b2-c3d4-e5f6"
        String destination = "/topic/orders/" + publicTrackingId;

        log.info("Sending WebSocket message to destination: {} with payload: {}", destination, payload);

        // This is the line that actually sends the message over the WebSocket connection.
        messagingTemplate.convertAndSend(destination, payload);
    }
}