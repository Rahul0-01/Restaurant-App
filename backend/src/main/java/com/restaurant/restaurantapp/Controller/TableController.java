package com.restaurant.restaurantapp.Controller;

import com.restaurant.restaurantapp.DTO.TableDTO;
import com.restaurant.restaurantapp.DTO.TableRequestDTO;
import com.restaurant.restaurantapp.Service.TableService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // Import this
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping("/api/tables")
@RequiredArgsConstructor
public class TableController {

    private static final Logger log = LoggerFactory.getLogger(TableController.class);
    private final TableService tableService;

    // --- Customer Facing ---
    @GetMapping("/qr/{qrCodeIdentifier}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<TableDTO> getTableByQrCode(@PathVariable String qrCodeIdentifier) {
        log.info("GET /api/tables/qr/{}", qrCodeIdentifier);
        return tableService.findTableByQrCode(qrCodeIdentifier)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }



    // --- Admin/Internal Facing (Assumed Admin for all modifications) ---
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<TableDTO> getTableById(@PathVariable Long id) {
        log.info("GET /api/tables/{}", id);
        return ResponseEntity.ok(tableService.findTableById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<Page<TableDTO>> getAllTables(Pageable pageable) {
        log.info("GET /api/tables with pagination: {}", pageable);
        Page<TableDTO> tablePage = tableService.getAllTables(pageable);
        return ResponseEntity.ok(tablePage);
    }
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TableDTO> createTable(@Valid @RequestBody TableRequestDTO tableRequestDTO) {
        log.info("POST /api/tables");
        TableDTO createdTable = tableService.createTable(tableRequestDTO);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(createdTable.getId()).toUri();
        return ResponseEntity.created(location).body(createdTable);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TableDTO> updateTable(@PathVariable Long id, @Valid @RequestBody TableRequestDTO tableRequestDTO) {
        log.info("PUT /api/tables/{}", id);
        return ResponseEntity.ok(tableService.updateTable(id, tableRequestDTO));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTable(@PathVariable Long id) {
        log.info("DELETE /api/tables/{}", id);
        tableService.deleteTable(id);
        return ResponseEntity.noContent().build();
    }


    // --- NEW "CALL WAITER" ENDPOINT ---
    @PostMapping("/{tableId}/assistance")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Void> requestAssistance(@PathVariable Long tableId) {
        log.info("POST /api/tables/{}/assistance", tableId);
        tableService.toggleAssistanceRequest(tableId, true); // Set assistance to true
        return ResponseEntity.ok().build();
    }
    // You would also need an endpoint for staff to clear the assistance request.
    // For example, in a new StaffController or here:
    @DeleteMapping("/{tableId}/assistance")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<Void> clearAssistanceRequest(@PathVariable Long tableId) {
        log.info("DELETE /api/tables/{}/assistance (clear request)", tableId);
        tableService.toggleAssistanceRequest(tableId, false); // Set assistance to false
        return ResponseEntity.noContent().build();
    }
}