package com.restaurant.restaurantapp.Service;

import com.restaurant.restaurantapp.DTO.DashboardStatsDTO;
import com.restaurant.restaurantapp.Repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private final OrderRepository orderRepository;
    private final DishRepository dishRepository;
    private final RestaurantTableRepository tableRepository;

    public DashboardStatsDTO getDashboardStats() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        DashboardStatsDTO stats = new DashboardStatsDTO();
        stats.setTodaysRevenue(orderRepository.findTodaysRevenue(startOfDay));
        stats.setTodaysOrdersCount(orderRepository.countTodaysOrders(startOfDay));
        stats.setTotalDishesCount(dishRepository.count());
        stats.setTotalTablesCount(tableRepository.count());

        return stats;
    }
}