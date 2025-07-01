// src/main/java/com/restaurant/restaurantapp/Controller/ServiceController.java
package com.restaurant.restaurantapp.Controller;

import com.restaurant.restaurantapp.DTO.ServiceTasksDTO;
import com.restaurant.restaurantapp.Service.OrderService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/service") // Note the new base path
@RequiredArgsConstructor
public class ServiceController {

    private static final Logger log = LoggerFactory.getLogger(ServiceController.class);
    private final OrderService orderService; // We can reuse the OrderService

    @GetMapping("/tasks")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')") // This portal is for authenticated staff
    public ResponseEntity<ServiceTasksDTO> getServiceTasks() {
        log.info("GET /api/service/tasks");
        ServiceTasksDTO tasks = orderService.getServiceTasks();
        return ResponseEntity.ok(tasks);
    }
}