// src/main/java/com/restaurant/restaurantapp/config/WebSocketConfig.java
package com.restaurant.restaurantapp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker // This enables WebSocket message handling, backed by a message broker.
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // This is the endpoint that your frontend client will connect to to establish the WebSocket connection.
        // e.g., "http://localhost:8080/ws"
        registry.addEndpoint("/ws")
                // Allow connections from any origin. For production, you would restrict this to your frontend's domain.
                .setAllowedOriginPatterns("*")
                // SockJS is a fallback for older browsers that don't support WebSockets well. Good practice to have.
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Configures the message broker.

        // These are the "destinations" that the client can subscribe to.
        // The broker will deliver messages starting with "/topic" or "/user" to clients.
        // "/topic" is for public, broadcast-style messages (everyone subscribed gets it).
        // "/user" is for sending private messages to a specific user.
        registry.enableSimpleBroker("/topic", "/user");

        // This is the prefix for messages that are bound for @MessageMapping-annotated methods in your controllers.
        // For example, if a client sends a message to "/app/hello", it will be routed to a controller method.
        registry.setApplicationDestinationPrefixes("/app");

        // This configures the destination for user-specific messages.
        // Spring uses this to make sure a message sent to "/user/queue/updates" goes only to that one user.
        registry.setUserDestinationPrefix("/user");
    }
}