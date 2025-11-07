package com.mmlimiteds.mithranmillets.controller;

import java.util.List;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

import com.mmlimiteds.mithranmillets.dto.AddressDTO;
import com.mmlimiteds.mithranmillets.dto.OrderDTO;
import com.mmlimiteds.mithranmillets.dto.OrderSummaryDTO;
import com.mmlimiteds.mithranmillets.dto.SummaryTotalsDTO;
import com.mmlimiteds.mithranmillets.entity.Address;
import com.mmlimiteds.mithranmillets.entity.Order;
import com.mmlimiteds.mithranmillets.exception.OrderNotFoundException;
import com.mmlimiteds.mithranmillets.service.OrderService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/order")
@CrossOrigin(origins = "http://localhost:5173")
public class OrderController {

    private final OrderService service;
    private final ModelMapper modelMapper;

    @Autowired
    public OrderController(OrderService service, ModelMapper modelMapper) {
        this.service = service;
        this.modelMapper = modelMapper;
    }

    @PostMapping("/place")
    public ResponseEntity<?> placeOrder(@Valid @RequestBody OrderDTO dto) {
        OrderDTO placed = service.placeOrder(dto);
        if (placed == null) {
            return ResponseEntity.badRequest().body("Invalid address ID or missing order details");
        }
        return ResponseEntity.ok(placed);
    }

    @PostMapping("/address")
    public ResponseEntity<?> saveAddress(@Valid @RequestBody AddressDTO dto) {
        Address saved = service.saveAddress(dto);
        AddressDTO out = modelMapper.map(saved, AddressDTO.class);
        return ResponseEntity.ok(out);
    }

    @GetMapping("/history")
    public ResponseEntity<List<OrderDTO>> getOrderHistory() {
        List<OrderDTO> orders = service.getOrderHistory();
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<OrderDTO>> getAllOrdersForAdmin() {
        List<OrderDTO> orders = service.getAllOrders();
        return ResponseEntity.ok(orders);
    }

    @PutMapping("/mark-paid/{razorpayOrderId}")
    public ResponseEntity<?> markOrderPaid(@PathVariable String razorpayOrderId) {
        try {
            Order updated = service.markOrderAsPaid(razorpayOrderId);
            return ResponseEntity.ok("Order marked as paid");
        } catch (OrderNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Update failed: " + e.getMessage());
        }
    }
    
    @PutMapping("/admin/{orderId}/shipment-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateShipmentStatus(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        try {
            String status = body.get("status");
            OrderDTO updated = service.updateShipmentStatus(orderId, status, authentication != null ? authentication.getName() : null);
            return ResponseEntity.ok(updated);
        } catch (OrderNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update status: " + e.getMessage());
        }
    }

    /**
     * Get address for the authenticated user
     */
    @GetMapping("/address")
    public ResponseEntity<?> getMyAddress(Authentication authentication) {
        try {
            Address addr = service.getAddressForCurrentUser();
            AddressDTO dto = modelMapper.map(addr, AddressDTO.class);
            return ResponseEntity.ok(dto);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
        }
    }

    /**
     * Admin only: get address by username
     */
    @GetMapping("/address/{username}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAddressByUsername(@PathVariable String username) {
        try {
            Address addr = service.getAddressByUsername(username);
            AddressDTO dto = modelMapper.map(addr, AddressDTO.class);
            return ResponseEntity.ok(dto);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
        }
    }
    
   
    @GetMapping("/cart-totals")
    public ResponseEntity<SummaryTotalsDTO> getCartTotals() {
        SummaryTotalsDTO totals = service.fetchCurrentCartTotals();
        return ResponseEntity.ok(totals);
    }
}

