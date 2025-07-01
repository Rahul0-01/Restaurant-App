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
import org.springframework.security.access.prepost.PreAuthorize; // Import this
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class TableService {

    private static final Logger log = LoggerFactory.getLogger(TableService.class);
    private final RestaurantTableRepository tableRepository;
    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public Optional<TableDTO> findTableByQrCode(String qrCodeIdentifier) {
        if (qrCodeIdentifier == null || qrCodeIdentifier.trim().isEmpty()) {
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
        Page<RestaurantTable> tablePage = tableRepository.findAll(pageable);
        return tablePage.map(this::mapTableToDTO);
    }

    public TableDTO createTable(TableRequestDTO requestDTO) {
        log.info("Creating new table: {}", requestDTO.getTableNumber());
        if (tableRepository.existsByTableNumber(requestDTO.getTableNumber())) {
            throw new DuplicateResourceException("Table with number '" + requestDTO.getTableNumber() + "' already exists.");
        }
        RestaurantTable table = new RestaurantTable();
        table.setTableNumber(requestDTO.getTableNumber());
        table.setStatus(requestDTO.getStatus());
        table.setCapacity(requestDTO.getCapacity());
        String qrCode = requestDTO.getQrCodeIdentifier();
        if (qrCode == null || qrCode.trim().isEmpty()) {
            qrCode = UUID.randomUUID().toString();
            log.info("Generated new QR code identifier for table {}: {}", requestDTO.getTableNumber(), qrCode);
        } else {
            if (tableRepository.findByQrCodeIdentifier(qrCode).isPresent()) {
                throw new DuplicateResourceException("QR Code Identifier '" + qrCode + "' is already in use.");
            }
        }
        table.setQrCodeIdentifier(qrCode);
        try {
            RestaurantTable savedTable = tableRepository.save(table);
            return mapTableToDTO(savedTable);
        } catch (DataIntegrityViolationException e) {
            throw new InvalidRequestException("Failed to create table due to data integrity issue: " + e.getMessage());
        }
    }

    public TableDTO updateTable(Long id, TableRequestDTO requestDTO) {
        log.info("Updating table with ID: {}", id);
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found with ID: " + id));

        if (!table.getTableNumber().equalsIgnoreCase(requestDTO.getTableNumber()) &&
                tableRepository.findByTableNumber(requestDTO.getTableNumber()).filter(t -> !t.getId().equals(id)).isPresent()) {
            throw new DuplicateResourceException("Another table with number '" + requestDTO.getTableNumber() + "' already exists.");
        }
        String newQrCode = requestDTO.getQrCodeIdentifier();
        if (newQrCode != null && !newQrCode.trim().isEmpty() &&
                !newQrCode.equalsIgnoreCase(table.getQrCodeIdentifier()) &&
                tableRepository.findByQrCodeIdentifier(newQrCode).filter(t -> !t.getId().equals(id)).isPresent()) {
            throw new DuplicateResourceException("Another table with QR Code Identifier '" + newQrCode + "' already exists.");
        }
        table.setTableNumber(requestDTO.getTableNumber());
        table.setStatus(requestDTO.getStatus());
        if (requestDTO.getCapacity() != null) {
            table.setCapacity(requestDTO.getCapacity());
        }
        if (newQrCode != null && !newQrCode.trim().isEmpty()) {
            table.setQrCodeIdentifier(newQrCode);
        }
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
        if (orderRepository.existsByRestaurantTableId(id)) {
            throw new DataIntegrityViolationException("Cannot delete table: Table ID " + id + " has associated orders.");
        }
        tableRepository.deleteById(id);
    }

    // --- NEW METHOD FOR "CALL WAITER" FEATURE ---
    public void toggleAssistanceRequest(Long tableId, boolean requested) {
        log.info("Setting assistance requested for table ID {} to: {}", tableId, requested);
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found with ID: " + tableId));
        table.setAssistanceRequested(requested);
        tableRepository.save(table); // No need to return anything, just save the change
    }
    
    // --- Mapper ---
    private TableDTO mapTableToDTO(RestaurantTable table) {
        if (table == null) {
            return null;
        }
        return new TableDTO(
                table.getId(),
                table.getTableNumber(),
                table.getQrCodeIdentifier(),
                table.getStatus(),
                table.getCapacity(),
                table.isAssistanceRequested() // <<< Important to include the new field in the DTO
        );
    }
}