package com.restaurant.restaurantapp.Service;

import com.restaurant.restaurantapp.DTO.TableDTO;
import com.restaurant.restaurantapp.DTO.TableRequestDTO;
import com.restaurant.restaurantapp.Exception.DuplicateResourceException;
import com.restaurant.restaurantapp.Exception.InvalidRequestException;
import com.restaurant.restaurantapp.Exception.ResourceNotFoundException;
import com.restaurant.restaurantapp.Repository.OrderRepository;
import com.restaurant.restaurantapp.model.RestaurantTable;
import com.restaurant.restaurantapp.Repository.RestaurantTableRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID; // For generating QR codes
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TableService {

    private static final Logger log = LoggerFactory.getLogger(TableService.class);
    private final RestaurantTableRepository tableRepository;
    private final OrderRepository  orderRepository;

    @Transactional(readOnly = true)
    public Optional<TableDTO> findTableByQrCode(String qrCodeIdentifier) {
        if (qrCodeIdentifier == null || qrCodeIdentifier.trim().isEmpty()) {
            // Don't throw exception here, just return empty if invalid format for lookup
            log.debug("QR code identifier provided was null or empty.");
            return Optional.empty();
        }
        log.debug("Finding table by QR code: {}", qrCodeIdentifier);
        return tableRepository.findByQrCodeIdentifier(qrCodeIdentifier)
                .map(this::mapTableToDTO);
    }

    @Transactional(readOnly = true)
    public TableDTO findTableById(Long id) {
        log.debug("Finding table by ID: {}", id);
        return tableRepository.findById(id)
                .map(this::mapTableToDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found with ID: " + id));
    }

    @Transactional(readOnly = true)
    public Page<TableDTO> getAllTables(Pageable pageable) {
        log.debug("Fetching all tables with pagination: {}", pageable);

        // 3. Call repository's findAll(pageable)
        Page<RestaurantTable> tablePage = tableRepository.findAll(pageable);

        // 4. Map Page<RestaurantTable> to Page<TableDTO>
        Page<TableDTO> tableDtoPage = tablePage.map(this::mapTableToDTO);

        // 5. Return the page of DTOs
        return tableDtoPage;
    }

    public TableDTO createTable(TableRequestDTO requestDTO) {
        log.info("Creating new table: {}", requestDTO.getTableNumber());

        // Check for duplicate table number
        if (tableRepository.existsByTableNumber(requestDTO.getTableNumber())) {
            throw new DuplicateResourceException("Table with number '" + requestDTO.getTableNumber() + "' already exists.");
        }

        RestaurantTable table = new RestaurantTable();
        table.setTableNumber(requestDTO.getTableNumber());
        table.setStatus(requestDTO.getStatus()); // Add validation for allowed statuses if needed

        // Handle QR Code Generation/Assignment
        String qrCode = requestDTO.getQrCodeIdentifier();
        if (qrCode == null || qrCode.trim().isEmpty()) {
            qrCode = UUID.randomUUID().toString(); // Generate a unique QR code
            log.info("Generated new QR code identifier for table {}: {}", requestDTO.getTableNumber(), qrCode);
        } else {
            // Optional: Check if provided QR code already exists
            if (tableRepository.findByQrCodeIdentifier(qrCode).isPresent()) {
                throw new DuplicateResourceException("QR Code Identifier '" + qrCode + "' is already in use.");
            }
        }
        table.setQrCodeIdentifier(qrCode);

        try {
            RestaurantTable savedTable = tableRepository.save(table);
            return mapTableToDTO(savedTable);
        } catch (DataIntegrityViolationException e) {
            // Catch potential DB constraint violations not caught by initial checks
            throw new InvalidRequestException("Failed to create table due to data integrity issue: " + e.getMessage());
        }
    }

    public TableDTO updateTable(Long id, TableRequestDTO requestDTO) {
        log.info("Updating table with ID: {}", id);
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found with ID: " + id));

        // Check if table number is being changed to one that already exists (excluding itself)
        if (!table.getTableNumber().equalsIgnoreCase(requestDTO.getTableNumber()) &&
                tableRepository.findByTableNumber(requestDTO.getTableNumber()).filter(t -> !t.getId().equals(id)).isPresent()) {
            throw new DuplicateResourceException("Another table with number '" + requestDTO.getTableNumber() + "' already exists.");
        }

        // Check if QR code is being changed to one that already exists (excluding itself)
        String newQrCode = requestDTO.getQrCodeIdentifier();
        if (newQrCode != null && !newQrCode.trim().isEmpty() &&
                !newQrCode.equalsIgnoreCase(table.getQrCodeIdentifier()) &&
                tableRepository.findByQrCodeIdentifier(newQrCode).filter(t -> !t.getId().equals(id)).isPresent()) {
            throw new DuplicateResourceException("Another table with QR Code Identifier '" + newQrCode + "' already exists.");
        }

        table.setTableNumber(requestDTO.getTableNumber());
        table.setStatus(requestDTO.getStatus()); // Add validation?

        if (requestDTO.getCapacity() != null) { // Check if capacity was sent in the request
            log.debug("Updating capacity for table ID {} to: {}", id, requestDTO.getCapacity());
            table.setCapacity(requestDTO.getCapacity());
        } else {
            // Optional: If capacity is not in the DTO, do you want to set it to null on the entity?
            // Or leave it as is? For partial updates, leaving it as is if not provided is common.
            // If you want to allow setting it to null explicitly, the DTO might need to differentiate
            // between "not provided" and "provided as null".
            // For simplicity, if it's in the DTO (even if DTO's capacity is null), we update.
            // If your TableRequestDTO's Integer capacity can be null, and you want to set the entity's capacity to null:
            // table.setCapacity(requestDTO.getCapacity()); // This would work if DTO.capacity can be null
            log.debug("Capacity not provided in update request for table ID {}. Current capacity: {}", id, table.getCapacity());
        }
        if (newQrCode != null && !newQrCode.trim().isEmpty()) {
            table.setQrCodeIdentifier(newQrCode);
        } // else keep the existing one if not provided or empty

        try {
            RestaurantTable updatedTable = tableRepository.save(table);
            return mapTableToDTO(updatedTable);
        } catch (DataIntegrityViolationException e) {
            throw new InvalidRequestException("Failed to update table due to data integrity issue: " + e.getMessage());
        }
    }

    public void deleteTable(Long id) {
        log.warn("Deleting table with ID: {}", id);
        if (!tableRepository.existsById(id)) {
            throw new ResourceNotFoundException("Table not found with ID: " + id);
        }

        // Check for associated orders
        if (orderRepository.existsByRestaurantTableId(id)) { // Assuming you add this method to OrderRepository
            throw new DataIntegrityViolationException("Cannot delete table: Table ID " + id + " has associated orders.");
        }
            tableRepository.deleteById(id);

    }

    // --- Mapper ---
    private TableDTO mapTableToDTO(RestaurantTable table) {
        // Handle null input defensively
        if (table == null) {
            return null;
        }

          return new TableDTO(
                table.getId(),               // Long id
                table.getTableNumber(),      // String tableNumber
                table.getQrCodeIdentifier(), // String qrCodeIdentifier (use getter)
                table.getStatus(),// String status (use getter)
                  table.getCapacity()
        );
    }
}