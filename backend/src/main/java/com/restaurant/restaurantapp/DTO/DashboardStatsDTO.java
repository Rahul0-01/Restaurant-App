package com.restaurant.restaurantapp.DTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DashboardStatsDTO {
    private BigDecimal todaysRevenue;
    private long todaysOrdersCount;
    private long totalDishesCount;
    private long totalTablesCount;

}