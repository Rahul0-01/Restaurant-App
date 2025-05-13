package com.restaurant.restaurantapp.DTO;

import lombok.Data;
import java.util.List;


// this dto class will contains the overall order of any customer/table.......... that is ....To represent the entire order submission coming from the customer's app. It bundles together all the necessary pieces.
@Data
public class OrderRequestDTO {
    private Long tableId;
    private List<OrderItemRequestDTO> items;
    private String notes;


}