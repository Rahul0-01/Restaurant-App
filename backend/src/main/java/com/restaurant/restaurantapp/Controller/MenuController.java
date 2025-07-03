package com.restaurant.restaurantapp.Controller;

import com.restaurant.restaurantapp.DTO.CategoryDTO;
import com.restaurant.restaurantapp.DTO.DishDTO;
import com.restaurant.restaurantapp.DTO.DishRequestDTO;
import com.restaurant.restaurantapp.model.Category;
import com.restaurant.restaurantapp.Service.MenuService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
public class MenuController {

    private static final Logger log = LoggerFactory.getLogger(MenuController.class);
    private final MenuService menuService;

    // --- Category Endpoints ---

    @GetMapping("/categories")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Page<CategoryDTO>> getAllCategories(Pageable pageable) {
        log.info("GET /api/menu/categories with pagination: {}", pageable);
        // 3. Call the updated service method, passing Pageable
        Page<CategoryDTO> categoryPage = menuService.getAllCategories(pageable);
        // 4. Return the Page object directly in the ResponseEntity body
        return ResponseEntity.ok(categoryPage);
    }

    @GetMapping("/categories/{id}")
    public ResponseEntity<CategoryDTO> getCategoryById(@PathVariable Long id) {
        log.info("GET /api/menu/categories/{}", id);
        return ResponseEntity.ok(menuService.getCategoryById(id));
    }

    @PostMapping("/categories")
    public ResponseEntity<CategoryDTO> createCategory(@Valid @RequestBody CategoryDTO categoryDTO) {
        log.info("POST /api/menu/categories");
        CategoryDTO createdCategory = menuService.createCategory(categoryDTO);
        // Build location URI for the newly created resource
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(createdCategory.getId())
                .toUri();
        return ResponseEntity.created(location).body(createdCategory);
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<CategoryDTO> updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryDTO categoryDTO) {
        log.info("PUT /api/menu/categories/{}", id);
        return ResponseEntity.ok(menuService.updateCategory(id, categoryDTO));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        log.info("DELETE /api/menu/categories/{}", id);
        menuService.deleteCategory(id);
        return ResponseEntity.noContent().build(); // 204 No Content
    }

    // --- Dish Endpoints ---

    // Get all dishes, optionally filtered by category (available or all)
    @GetMapping("/dishes")
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<DishDTO>> getDishes(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false, defaultValue = "true") boolean availableOnly) {
        log.info("GET /api/menu/dishes?categoryId={}&availableOnly={}", categoryId, availableOnly);
        if (availableOnly && categoryId != null) {
            return ResponseEntity.ok(menuService.getAvailableDishesByCategoryId(categoryId));
        } else {
            // Handle getting all dishes or all dishes in a category (regardless of availability)
            return ResponseEntity.ok(menuService.getAllDishes(categoryId));
        }
    }

    @GetMapping("/dishes/{id}")
    public ResponseEntity<DishDTO> getDishById(@PathVariable Long id) {
        log.info("GET /api/menu/dishes/{}", id);
        return ResponseEntity.ok(menuService.getDishById(id));
    }

    // Get available dishes specifically for one category (Alternative to the /dishes endpoint)
    @GetMapping("/categories/{categoryId}/dishes")
    public ResponseEntity<List<DishDTO>> getAvailableDishesForCategory(@PathVariable Long categoryId) {
        log.info("GET /api/menu/categories/{}/dishes", categoryId);
        return ResponseEntity.ok(menuService.getAvailableDishesByCategoryId(categoryId));
    }

    @PostMapping("/dishes")
    public ResponseEntity<DishDTO> createDish(@Valid @RequestBody DishRequestDTO dishRequestDTO) {
        log.info("POST /api/menu/dishes");
        DishDTO createdDish = menuService.createDish(dishRequestDTO);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(createdDish.getId())
                .toUri();
        return ResponseEntity.created(location).body(createdDish);
    }

    @PutMapping("/dishes/{id}")
    public ResponseEntity<DishDTO> updateDish(@PathVariable Long id, @Valid @RequestBody DishRequestDTO dishRequestDTO) {
        log.info("PUT /api/menu/dishes/{}", id);
        return ResponseEntity.ok(menuService.updateDish(id, dishRequestDTO));
    }

    @DeleteMapping("/dishes/{id}")
    public ResponseEntity<Void> deleteDish(@PathVariable Long id) {
        log.info("DELETE /api/menu/dishes/{}", id);
        menuService.deleteDish(id);
        return ResponseEntity.noContent().build();
    }
}