package com.restaurant.restaurantapp.DTO;

import lombok.Data;


//this dto class will contains the details of one dish order of customer....... means if the customer ordered 3 dishes then this will contains the data of all thw 3 ones
// that is .....To represent one single item requested by the customer within their order.
@Data
public class OrderItemRequestDTO {
    private Long dishId;
    private int quantity;
   }