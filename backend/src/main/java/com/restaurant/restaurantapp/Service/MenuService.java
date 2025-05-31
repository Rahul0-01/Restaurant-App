package com.restaurant.restaurantapp.Service;

import com.restaurant.restaurantapp.DTO.CategoryDTO;
import com.restaurant.restaurantapp.DTO.DishDTO;
import com.restaurant.restaurantapp.DTO.DishRequestDTO;
import com.restaurant.restaurantapp.Exception.DuplicateResourceException;
import com.restaurant.restaurantapp.Exception.ResourceNotFoundException;
import com.restaurant.restaurantapp.model.Category;
import com.restaurant.restaurantapp.model.Dish;
import com.restaurant.restaurantapp.Repository.CategoryRepository;
import com.restaurant.restaurantapp.Repository.DishRepository;
import lombok.RequiredArgsConstructor; // Lombok constructor injection
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor // Lombok: Creates constructor for final fields
@Transactional // Default transactionality for all public methods
public class MenuService {

    private static final Logger log = LoggerFactory.getLogger(MenuService.class);

    private final CategoryRepository categoryRepository;
    private final DishRepository dishRepository;

    // --- Category Operations ---





    @Transactional(readOnly = true)
    public Page<CategoryDTO> getAllCategories(Pageable pageable) { // <--- NOW accepts Pageable, returns Page
        log.debug("Fetching categories with pagination: {}", pageable);

        // Ask the repository for JUST ONE PAGE of categories,
        // using the instructions in the 'pageable' parameter.
        Page<Category> categoryPage = categoryRepository.findAll(pageable);

        // Convert the Category objects ON THAT PAGE into CategoryDTO objects.
        // The .map() function does this conversion while keeping pagination info.
        Page<CategoryDTO> categoryDtoPage = categoryPage.map(this::mapCategoryToDTO);

        // Return the single page containing DTOs and pagination info.
        return categoryDtoPage;
    }
    @Transactional(readOnly = true)
    public CategoryDTO getCategoryById(Long id) {
        log.debug("Fetching category with ID: {}", id);
        return categoryRepository.findById(id)
                .map(this::mapCategoryToDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + id));
    }

    public CategoryDTO createCategory(CategoryDTO categoryDTO) {
        log.info("Creating new category with name: {}", categoryDTO.getName());
        Category category = new Category();
        category.setName(categoryDTO.getName());
        category.setDescription(categoryDTO.getDescription());
        try {
            Category savedCategory = categoryRepository.save(category);
            return mapCategoryToDTO(savedCategory);
        } catch (DataIntegrityViolationException e) {
            // Catch potential unique constraint violation on name
            throw new DuplicateResourceException("Category with name '" + categoryDTO.getName() + "' already exists.");
        }
    }

    public CategoryDTO updateCategory(Long id, CategoryDTO categoryDTO) {
        log.info("Updating category with ID: {}", id);
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + id));

        // Check if name is being changed to one that already exists (excluding itself)
        if (!category.getName().equalsIgnoreCase(categoryDTO.getName()) &&
                categoryRepository.findAll().stream().anyMatch(c -> c.getName().equalsIgnoreCase(categoryDTO.getName()) && !c.getId().equals(id))) {
            throw new DuplicateResourceException("Another category with name '" + categoryDTO.getName() + "' already exists.");
        }

        category.setName(categoryDTO.getName());
        category.setDescription(categoryDTO.getDescription());
        try {
            Category updatedCategory = categoryRepository.save(category);
            return mapCategoryToDTO(updatedCategory);
        } catch (DataIntegrityViolationException e) {
            // Should ideally be caught by the check above, but belt-and-suspenders
            throw new DuplicateResourceException("Category with name '" + categoryDTO.getName() + "' already exists.");
        }
    }

    public void deleteCategory(Long id) {
        log.warn("Deleting category with ID: {}", id); // Log deletion as WARN
        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Category not found with ID: " + id);
        }
        // Consider checking if category has dishes - prevent deletion? Or let cascade handle it?
        // For now, cascade will delete associated dishes as defined in Category entity.
        categoryRepository.deleteById(id);
    }

    // --- Dish Operations ---

    @Transactional(readOnly = true)
    public List<DishDTO> getAllDishes(Long categoryId) {
        log.debug("Fetching all dishes, optional category filter: {}", categoryId);
        List<Dish> dishes;
        if (categoryId != null) {
            // Ensure category exists first
            if (!categoryRepository.existsById(categoryId)) {
                throw new ResourceNotFoundException("Cannot fetch dishes: Category not found with ID: " + categoryId);
            }
            dishes = dishRepository.findByCategoryIdOrderByNameAsc(categoryId);
        } else {
            dishes = dishRepository.findAll(Sort.by(Sort.Direction.ASC, "name"));
        }
        return dishes.stream().map(this::mapDishToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DishDTO> getAvailableDishesByCategoryId(Long categoryId) {
        log.debug("Fetching available dishes for category ID: {}", categoryId);
        if (!categoryRepository.existsById(categoryId)) {
            throw new ResourceNotFoundException("Category not found with ID: " + categoryId);
        }
        List<Dish> dishes = dishRepository.findByAvailableTrueAndCategoryIdOrderByNameAsc(categoryId);
        return dishes.stream().map(this::mapDishToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DishDTO getDishById(Long id) {
        log.debug("Fetching dish with ID: {}", id);
        return dishRepository.findById(id)
                .map(this::mapDishToDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Dish not found with ID: " + id));
    }

    public DishDTO createDish(DishRequestDTO dishRequestDTO) {
        log.info("Creating new dish: {}", dishRequestDTO.getName());
        // Find the category
        Category category = categoryRepository.findById(dishRequestDTO.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + dishRequestDTO.getCategoryId()));

        Dish dish = new Dish();
        dish.setName(dishRequestDTO.getName());
        dish.setDescription(dishRequestDTO.getDescription());
        dish.setPrice(dishRequestDTO.getPrice());
        dish.setAvailable(dishRequestDTO.getAvailable());
        dish.setCategory(category); // Associate with found category
        dish.setImageUrl(dishRequestDTO.getImageUrl());


        Dish savedDish = dishRepository.save(dish);
        return mapDishToDTO(savedDish);
    }

    public DishDTO updateDish(Long id, DishRequestDTO dishRequestDTO) {
        log.info("Updating dish with ID: {}", id);
        Dish dish = dishRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dish not found with ID: " + id));

        // Find the category if it's being changed
        Category category = categoryRepository.findById(dishRequestDTO.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + dishRequestDTO.getCategoryId()));

        dish.setName(dishRequestDTO.getName());
        dish.setDescription(dishRequestDTO.getDescription());
        dish.setPrice(dishRequestDTO.getPrice());
        dish.setAvailable(dishRequestDTO.getAvailable());
        dish.setCategory(category); // Update category association
        if (dishRequestDTO.getImageUrl() != null) { // Or however you want to handle optional updates
            dish.setImageUrl(dishRequestDTO.getImageUrl()); // Add this
        }

        Dish updatedDish = dishRepository.save(dish);
        return mapDishToDTO(updatedDish);
    }

    public void deleteDish(Long id) {
        log.warn("Deleting dish with ID: {}", id);
        if (!dishRepository.existsById(id)) {
            throw new ResourceNotFoundException("Dish not found with ID: " + id);
        }
        dishRepository.deleteById(id);
    }


    // --- Mappers ---
    private CategoryDTO mapCategoryToDTO(Category category) {
        return new CategoryDTO(category.getId(), category.getName(),category.getDescription());
    }

    // In DishService.java
    private DishDTO mapDishToDTO(Dish dish) {
        if (dish == null) {
            return null;
        }

        // Arguments must match the field order in DishDTO:
        // id, name, description, price, available, categoryId, imageUrl
        return new DishDTO(
                dish.getId(),                                                   // 1. id (Long)
                dish.getName(),                                                 // 2. name (String)
                dish.getDescription(),                                          // 3. description (String)
                dish.getPrice(),                                                // 4. price (BigDecimal)
                dish.isAvailable(),                                             // 5. available (boolean)
                dish.getCategory() != null ? dish.getCategory().getId() : null, // 6. categoryId (Long)
                dish.getImageUrl()                                              // 7. imageUrl (String)
        );
    }
}