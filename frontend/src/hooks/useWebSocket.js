// src/hooks/useWebSocket.js
import { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export const useWebSocket = (publicTrackingId) => {
  // This state will hold the most recent message received from the server.
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    // We only try to connect if we have a valid tracking ID.
    if (!publicTrackingId) {
      return;
    }

    // 1. Configure the STOMP client
    const client = new Client({
      // The SockJS anction is what makes it compatible with our Spring Boot backend
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      
      // You can add debug messages to see what's happening
      debug: (str) => {
        console.log('STOMP: ' + str);
      },

      // Try to reconnect every 5 seconds if the connection is lost
      reconnectDelay: 5000,
    });

    // 2. Define what happens when the connection is successful
    client.onConnect = (frame) => {
      console.log('Connected to WebSocket server:', frame);
      
      // This is where we subscribe to our specific channel.
      // The channel name must exactly match what the backend is sending to.
      const destination = `/topic/orders/${publicTrackingId}`;
      
      client.subscribe(destination, (message) => {
        // This function is called every time a message arrives on our channel.
        if (message.body) {
          const receivedData = JSON.parse(message.body);
          console.log('Received WebSocket message:', receivedData);
          // We update our state with the new message data.
          setLastMessage(receivedData);
        }
      });
    };

    // Define what happens on an error
    client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    // 3. Activate the client to start the connection
    client.activate();

    // 4. Define the cleanup function.
    // This runs when the component unmounts to prevent memory leaks.
    return () => {
      if (client.active) {
        console.log('Deactivating WebSocket client...');
        client.deactivate();
      }
    };

  }, [publicTrackingId]); // The effect re-runs if the tracking ID changes

  // The hook returns the last message received.
  return lastMessage;
};

