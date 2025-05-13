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
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/tables")
@RequiredArgsConstructor
public class TableController {

    private static final Logger log = LoggerFactory.getLogger(TableController.class);
    private final TableService tableService;

    // --- Customer Facing ---
    @GetMapping("/qr/{qrCodeIdentifier}")
    public ResponseEntity<TableDTO> getTableByQrCode(@PathVariable String qrCodeIdentifier) {
        log.info("GET /api/tables/qr/{}", qrCodeIdentifier);
        // Service returns Optional, map directly in controller for specific 404
        return tableService.findTableByQrCode(qrCodeIdentifier)
                .map(ResponseEntity::ok) // If present, wrap in 200 OK
                .orElse(ResponseEntity.notFound().build()); // If empty, return 404
    }

    // --- Admin/Internal Facing ---
    @GetMapping("/{id}")
    public ResponseEntity<TableDTO> getTableById(@PathVariable Long id) {
        log.info("GET /api/tables/{}", id);
        return ResponseEntity.ok(tableService.findTableById(id)); // Service throws exception if not found
    }

    @GetMapping
    public ResponseEntity<Page<TableDTO>> getAllTables(Pageable pageable) {
        log.info("GET /api/tables with pagination: {}", pageable);
        // 3. Call updated service method
        Page<TableDTO> tablePage = tableService.getAllTables(pageable);
        // 4. Return Page directly
        return ResponseEntity.ok(tablePage);
    }
    @PostMapping
    public ResponseEntity<TableDTO> createTable(@Valid @RequestBody TableRequestDTO tableRequestDTO) {
        log.info("POST /api/tables");
        TableDTO createdTable = tableService.createTable(tableRequestDTO);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(createdTable.getId())
                .toUri();
        return ResponseEntity.created(location).body(createdTable);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TableDTO> updateTable(@PathVariable Long id, @Valid @RequestBody TableRequestDTO tableRequestDTO) {
        log.info("PUT /api/tables/{}", id);
        return ResponseEntity.ok(tableService.updateTable(id, tableRequestDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTable(@PathVariable Long id) {
        log.info("DELETE /api/tables/{}", id);
        tableService.deleteTable(id);
        return ResponseEntity.noContent().build();
    }
}