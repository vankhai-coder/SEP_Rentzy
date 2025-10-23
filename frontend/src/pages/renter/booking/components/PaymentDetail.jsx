import React from 'react';
import { FaMoneyBillWave, FaGift, FaCoins, FaCar, FaTruck } from 'react-icons/fa';
import './PaymentBreakdown.scss';
/**
 * PaymentDetail Component
 * 
 * CHỨC NĂNG CHÍNH:
 * - Hiển thị chi tiết breakdown của thanh toán
 * - Chỉ hiển thị các phí khi có giá trị > 0 để tránh hiển thị "0 đồng"
 * - Tính toán và format các giá trị tiền tệ
 * 
 * PROPS:
 * - booking: Object chứa thông tin booking và các phí
 * - formatCurrency: Function để format tiền tệ
 */
const PaymentDetail = ({ booking, formatCurrency }) => {
  // ==================== DATA EXTRACTION & VALIDATION ====================
  
  const totalDays = booking?.totalDays || 1;
  const pricePerDay = parseFloat(booking?.pricePerDay || booking?.vehicle?.price_per_day || 0);
  const totalCost = parseFloat(booking?.totalCost || 0);
  const deliveryFee = parseFloat(booking?.deliveryFee || 0);
  const discountAmount = parseFloat(booking?.discountAmount || 0);
  const pointsUsed = parseFloat(booking?.pointsUsed || 0); // Đổi thành parseFloat để đảm bảo
  const voucherCode_applied = booking?.voucherCode || null;
  const totalAmount = parseFloat(booking?.totalAmount || 0);

  // ==================== CONDITIONAL DISPLAY LOGIC ====================
  
  // Debug logging để kiểm tra giá trị
  console.log('PaymentDetail Debug:', {
    deliveryFee,
    discountAmount,
    pointsUsed,
    voucherCode_applied,
    totalCost,
    totalAmount
  });
  
  // Chỉ hiển thị phí giao xe khi > 0 (chặt chẽ)
  const shouldShowDeliveryFee = deliveryFee && !isNaN(deliveryFee) && deliveryFee > 0;
  
  // Chỉ hiển thị voucher khi có mã voucher VÀ số tiền giảm > 0 (chặt chẽ)
  const shouldShowVoucher = voucherCode_applied && 
                           voucherCode_applied !== null && 
                           voucherCode_applied !== '' && 
                           voucherCode_applied !== 'null' &&
                           discountAmount && 
                           !isNaN(discountAmount) &&
                           discountAmount > 0;
  
  // Chỉ hiển thị điểm tích lũy khi số điểm sử dụng > 0 (chặt chẽ)
  const shouldShowPoints = pointsUsed && !isNaN(pointsUsed) && pointsUsed > 0;
  
  // Đảm bảo giá thuê xe cơ bản luôn hiển thị (không bao giờ = 0)
  const shouldShowRentalCost = totalCost && !isNaN(totalCost) && totalCost > 0;
  
  // Debug conditional logic
  console.log('PaymentDetail Conditions:', {
    shouldShowDeliveryFee,
    shouldShowVoucher,
    shouldShowPoints,
    shouldShowRentalCost
  });
  
  // Kiểm tra có ít nhất một item để hiển thị breakdown không
  const hasAnyItems = shouldShowRentalCost || shouldShowDeliveryFee || shouldShowVoucher || shouldShowPoints;

  return (
    <div className="payment-breakdown">
      {/* ==================== HEADER ==================== */}
      <div className="breakdown-header">
        <FaMoneyBillWave className="header-icon" />
        <h3>Chi tiết thanh toán</h3>
      </div>
      
      
      <div className="breakdown-content">
        {/* Fallback message khi không có items nào để hiển thị */}
        {!hasAnyItems && (
          <div className="breakdown-item">
            <span className="item-label">Không có thông tin chi tiết thanh toán</span>
          </div>
        )}
        {/* Giá thuê xe riêng */}
        {shouldShowRentalCost && (
          <div className="breakdown-item">
            <div className="item-left">
              <FaCar className="item-icon rental" />
              <span className="item-label">Giá thuê xe ({totalDays} ngày × {formatCurrency(pricePerDay)})</span>
            </div>
            <span className="item-value">{formatCurrency(totalCost)}</span>
          </div>
        )}
        
        {/* Phí giao xe */}

          <div className="breakdown-item">
            <div className="item-left">
              <FaTruck className="item-icon delivery" />
              <span className="item-label">Phí giao xe</span>
            </div>
            <span className="item-value">{formatCurrency(deliveryFee)}</span>
          </div>
        
        {/* Voucher giảm giá - Chỉ hiển thị khi có voucher và số tiền giảm > 0 */}
 
          <div className="breakdown-item discount">
            <div className="item-left">
              <FaGift className="item-icon voucher" />
              <span className="item-label">Voucher {voucherCode_applied}</span>
            </div>
            <span className="item-value discount-value">-{formatCurrency(discountAmount)}</span>
          </div>
      
        
        {/* Điểm tích lũy sử dụng  */}

          <div className="breakdown-item discount">
            <div className="item-left">
              <FaCoins className="item-icon points" />
              <span className="item-label">Điểm tích lũy sử dụng</span>
            </div>
            <span className="item-value discount-value">-{formatCurrency(pointsUsed)}</span>
          </div>
   
        <div className="breakdown-divider"></div>
        
        {/* Tổng cộng đơn đã trùư các loại tiền */}
        <div className="breakdown-item total">
          <div className="item-left">
            <span className="item-label total-label">Tổng cộng</span>
          </div>
          <span className="item-value total-value">{formatCurrency(totalAmount)}</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetail;