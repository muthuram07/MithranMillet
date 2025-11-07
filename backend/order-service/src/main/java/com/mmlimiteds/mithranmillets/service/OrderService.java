package com.mmlimiteds.mithranmillets.service;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.mmlimiteds.mithranmillets.client.CartClient;
import com.mmlimiteds.mithranmillets.client.PaymentClient;
import com.mmlimiteds.mithranmillets.client.ProductClient;
import com.mmlimiteds.mithranmillets.dto.AddressDTO;
import com.mmlimiteds.mithranmillets.dto.CartItemDTO;
import com.mmlimiteds.mithranmillets.dto.OrderDTO;
import com.mmlimiteds.mithranmillets.dto.PaymentRequestDTO;
import com.mmlimiteds.mithranmillets.dto.PaymentResponseDTO;
import com.mmlimiteds.mithranmillets.dto.ProductStockUpdateDTO;
import com.mmlimiteds.mithranmillets.dto.SummaryTotalsDTO;
import com.mmlimiteds.mithranmillets.entity.Address;
import com.mmlimiteds.mithranmillets.entity.Order;
import com.mmlimiteds.mithranmillets.entity.OrderStatusHistory;
import com.mmlimiteds.mithranmillets.exception.AddressNotFoundException;
import com.mmlimiteds.mithranmillets.exception.CartEmptyException;
import com.mmlimiteds.mithranmillets.exception.OrderNotFoundException;
import com.mmlimiteds.mithranmillets.repository.AddressRepository;
import com.mmlimiteds.mithranmillets.repository.OrderRepository;
import com.mmlimiteds.mithranmillets.repository.OrderStatusHistoryRepository;
import com.mmlimiteds.mithranmillets.security.JwtUtil;

import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepo;

    @Autowired
    private AddressRepository addressRepo;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    private CartClient cartClient;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PaymentClient paymentClient;

    @Autowired
    private ProductClient productClient;
    
    @Autowired
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Transactional
    public OrderDTO placeOrder(OrderDTO dto) {
        String username = getCurrentUsername();
        String token = "Bearer " + jwtUtil.generateToken(username, "USER");

        List<CartItemDTO> cartItems = cartClient.getCartItems(token);
        if (cartItems == null || cartItems.isEmpty()) throw new CartEmptyException(username);

        if (dto.getAddress() == null || dto.getAddress().getId() == null)
            throw new IllegalArgumentException("Address ID must not be null");

        Address address = addressRepo.findById(dto.getAddress().getId())
            .orElseThrow(() -> new AddressNotFoundException(dto.getAddress().getId()));

        // compute subtotal and total quantity using BigDecimal
        BigDecimal subtotal = cartItems.stream()
            .map(ci -> {
                BigDecimal price = ci.getPrice() == null ? BigDecimal.ZERO : BigDecimal.valueOf(ci.getPrice());
                int qty = ci.getQuantity() == null ? 0 : ci.getQuantity();
                return price.multiply(BigDecimal.valueOf(qty));
            })
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalQty = cartItems.stream()
            .mapToInt(ci -> ci.getQuantity() == null ? 0 : ci.getQuantity())
            .sum();

        if (subtotal.compareTo(BigDecimal.ZERO) <= 0) throw new IllegalStateException("Cart total is zero; cannot place order");

        // If you have taxes/discounts/delivery, compute totalAmount here; for now totalAmount = subtotal
        BigDecimal totalAmount = subtotal;

        Order order = new Order();
        order.setSubtotal(subtotal);                      // ensure Order.subtotal exists (BigDecimal)
        order.setTotalQuantity(totalQty);                 // ensure Order.totalQuantity exists (Integer)
        order.setTotalAmount(totalAmount);                // BigDecimal setter
        order.setPaymentMethod(dto.getPaymentMethod());
        order.setStatus("PLACED");
        order.setOrderDate(new Date());
        order.setAddress(address);
        order.setUsername(username);

        Order saved = orderRepo.save(order);

        // Payment client may expect primitive types; convert as needed.
        // If PaymentRequestDTO accepts BigDecimal replace below accordingly.
        // Here we pass amount as double (in rupees). For Razorpay you typically send amount in paise on server.
        PaymentRequestDTO paymentRequest = new PaymentRequestDTO(totalAmount.doubleValue(), "INR", "order_rcpt_" + saved.getId());
        PaymentResponseDTO paymentResponse = paymentClient.initiatePayment(paymentRequest);

        saved.setRazorpayOrderId(paymentResponse.getOrderId());
        saved.setPaymentStatus("PENDING");
        orderRepo.save(saved);

        List<ProductStockUpdateDTO> stockUpdates = cartItems.stream()
            .map(item -> new ProductStockUpdateDTO(item.getProductId(), item.getQuantity()))
            .collect(Collectors.toList());

        productClient.updateStock(stockUpdates);

        cartClient.clearCart(token);

        return modelMapper.map(saved, OrderDTO.class);
    }


    public Address saveAddress(AddressDTO dto) {
        Address address = modelMapper.map(dto, Address.class);
        address.setUsername(getCurrentUsername());
        return addressRepo.save(address);
    }

    private String getCurrentUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    public List<OrderDTO> getOrderHistory() {
        String username = getCurrentUsername();
        List<Order> orders = orderRepo.findByUsername(username);
        return orders.stream()
                     .map(order -> modelMapper.map(order, OrderDTO.class))
                     .collect(Collectors.toList());
    }

    public List<OrderDTO> getAllOrders() {
        List<Order> orders = orderRepo.findAll();
        return orders.stream()
                     .map(o -> modelMapper.map(o, OrderDTO.class))
                     .collect(Collectors.toList());
    }

    public Order markOrderAsPaid(String razorpayOrderId) {
        Order order = orderRepo.findByRazorpayOrderId(razorpayOrderId)
            .orElseThrow(() -> new OrderNotFoundException("No order found with Razorpay ID: " + razorpayOrderId));

        if ("PAID".equalsIgnoreCase(order.getPaymentStatus())) {
            throw new IllegalStateException("Order is already marked as PAID");
        }

        order.setPaymentStatus("PAID");
        order.setStatus("CONFIRMED");
        return orderRepo.save(order);
    }
    
    @Transactional
    public OrderDTO updateShipmentStatus(Long orderId, String newStatus, String changedBy) {
        Order order = orderRepo.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException("Order not found: " + orderId));

        // Allowed sequence
        String[] steps = new String[] {"PLACED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"};
        String current = (order.getStatus() == null || order.getStatus().isBlank()) ? "PLACED" : order.getStatus().toUpperCase();
        String target = newStatus == null ? null : newStatus.toUpperCase();

        int currentIdx = -1;
        int targetIdx = -1;
        for (int i = 0; i < steps.length; i++) {
            if (steps[i].equalsIgnoreCase(current)) currentIdx = i;
            if (steps[i].equalsIgnoreCase(target)) targetIdx = i;
        }

        if (targetIdx == -1) {
            throw new IllegalArgumentException("Invalid status: " + newStatus);
        }
        if (currentIdx > targetIdx) {
            throw new IllegalStateException("Cannot move status backwards from " + current + " to " + target);
        }
        if (currentIdx + 1 != targetIdx && !current.equalsIgnoreCase(target)) {
            throw new IllegalStateException("Must progress step-by-step. Next allowed: " + (currentIdx + 1 < steps.length ? steps[currentIdx + 1] : current));
        }

        order.setStatus(target);
        Order saved = orderRepo.save(order);

        OrderStatusHistory hist = new OrderStatusHistory();
        hist.setOrder(saved);
        hist.setStatus(target);
        hist.setChangedAt(new Date());
        hist.setChangedBy(changedBy);
        orderStatusHistoryRepository.save(hist);

        return modelMapper.map(saved, OrderDTO.class);
    }

    /**
     * Return Address entity for the currently authenticated user.
     * Throws AddressNotFoundException if not found.
     */
    public Address getAddressForCurrentUser() {
        String username = getCurrentUsername();
        return addressRepo.findByUsername(username)
                .orElseThrow(() -> new AddressNotFoundException("Address not found for user: " + username));
    }

    /**
     * Return Address entity by username (admin usage).
     * Throws AddressNotFoundException if not found.
     */
    public Address getAddressByUsername(String username) {
        return addressRepo.findByUsername(username)
                .orElseThrow(() -> new AddressNotFoundException("Address not found for user: " + username));
    }
    

    @Transactional(readOnly = true)
    public SummaryTotalsDTO fetchCurrentCartTotals() {
        String username = getCurrentUsername();
        String token = "Bearer " + jwtUtil.generateToken(username, "USER");

        List<CartItemDTO> cartItems = cartClient.getCartItems(token);
        if (cartItems == null || cartItems.isEmpty()) {
            return new SummaryTotalsDTO(0, BigDecimal.ZERO);
        }

        int totalQty = cartItems.stream()
            .mapToInt(ci -> (ci.getQuantity() == null ? 0 : ci.getQuantity()))
            .sum();

        BigDecimal subtotal = cartItems.stream()
            .map(ci -> {
                BigDecimal price = ci.getPrice() == null ? BigDecimal.ZERO : BigDecimal.valueOf(ci.getPrice());
                int qty = ci.getQuantity() == null ? 0 : ci.getQuantity();
                return price.multiply(BigDecimal.valueOf(qty));
            })
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new SummaryTotalsDTO(totalQty, subtotal);
     
      
        
    
      
    }

}
