package com.mmlimiteds.mithranmillets.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.util.Date;
import java.math.BigDecimal;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "orders")
public class Order {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  @NotBlank(message = "Username is required")
  private String username;

  /**
   * Subtotal before taxes/discounts/delivery. Optional but useful to keep
   * a clear breakdown on the order record.
   */
  @Column(name = "subtotal", precision = 15, scale = 2)
  @DecimalMin(value = "0.00", inclusive = true, message = "Subtotal must be >= 0")
  private BigDecimal subtotal;

  /**
   * Total monetary amount customer pays (after tax/discount/delivery).
   * Use BigDecimal for monetary values to avoid floating point errors.
   */
  @NotNull(message = "Total amount is required")
  @Column(name = "total_amount", precision = 15, scale = 2, nullable = false)
  @DecimalMin(value = "0.00", inclusive = false, message = "Amount must be greater than zero")
  private BigDecimal totalAmount;

  /**
   * Total quantity of items across the order. Use Integer (non-nullable).
   */
  @NotNull(message = "Total quantity is required")
  @Min(value = 0, message = "Quantity must be >= 0")
  @Column(name = "total_quantity", nullable = false)
  private Integer totalQuantity;

  @NotBlank(message = "Payment method is required")
  private String paymentMethod;

  @NotBlank(message = "Order status is required")
  private String status;

  @Temporal(TemporalType.TIMESTAMP)
  @NotNull(message = "Order date is required")
  private Date orderDate;

  @ManyToOne(optional = false)
  @JoinColumn(name = "address_id")
  @NotNull(message = "Address is required")
  private Address address;

  @Column(name = "razorpay_order_id")
  private String razorpayOrderId;

  @Column(name = "payment_status")
  private String paymentStatus;

  public Long getId() {
	return id;
  }

  public void setId(Long id) {
	this.id = id;
  }

  public String getUsername() {
	return username;
  }

  public void setUsername(String username) {
	this.username = username;
  }

  public BigDecimal getSubtotal() {
	return subtotal;
  }

  public void setSubtotal(BigDecimal subtotal) {
	this.subtotal = subtotal;
  }

  public BigDecimal getTotalAmount() {
	return totalAmount;
  }

  public void setTotalAmount(BigDecimal totalAmount) {
	this.totalAmount = totalAmount;
  }

  public Integer getTotalQuantity() {
	return totalQuantity;
  }

  public void setTotalQuantity(Integer totalQuantity) {
	this.totalQuantity = totalQuantity;
  }

  public String getPaymentMethod() {
	return paymentMethod;
  }

  public void setPaymentMethod(String paymentMethod) {
	this.paymentMethod = paymentMethod;
  }

  public String getStatus() {
	return status;
  }

  public void setStatus(String status) {
	this.status = status;
  }

  public Date getOrderDate() {
	return orderDate;
  }

  public void setOrderDate(Date orderDate) {
	this.orderDate = orderDate;
  }

  public Address getAddress() {
	return address;
  }

  public void setAddress(Address address) {
	this.address = address;
  }

  public String getRazorpayOrderId() {
	return razorpayOrderId;
  }

  public void setRazorpayOrderId(String razorpayOrderId) {
	this.razorpayOrderId = razorpayOrderId;
  }

  public String getPaymentStatus() {
	return paymentStatus;
  }

  public void setPaymentStatus(String paymentStatus) {
	this.paymentStatus = paymentStatus;
  }
}
