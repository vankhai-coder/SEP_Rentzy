import React from 'react';
import { FaMoneyBillWave } from 'react-icons/fa';

/**
 * PaymentMethods Component
 * 
 * CHỨC NĂNG CHÍNH:
 * - Hiển thị thông tin về các phương thức thanh toán có sẵn
 * - Giải thích quy trình thanh toán 2 giai đoạn (30% trước + 70% khi nhận xe)
 * - Cung cấp thông tin rõ ràng cho user về cách thức thanh toán
 * 
 * PAYMENT FLOW:
 * 1. Thanh toán trước 30% - Để giữ chỗ và xác nhận booking
 * 2. Thanh toán 70% còn lại - Khi nhận xe tại địa điểm
 * 
 * PROPS: Không có props (static content)
 * 
 * STRUCTURE:
 * - Header với icon và title
 * - Content area với 2 payment method items
 * - Mỗi item có title và description
 */
const PaymentMethods = () => {
  return (
    <section className="payment-method-section">
      {/* ==================== HEADER ==================== */}
      <h3 className="section-subtitle">
        <FaMoneyBillWave className="section-icon" />
        Phương thức thanh toán
      </h3>
      
      {/* ==================== CONTENT ==================== */}
      <div className="payment-method-content">
        {/* Phương thức 1: Thanh toán cọc 30% */}
        <div className="payment-method-item">
          <div className="method-info">
            <span className="method-title">Thanh toán trước 30% </span>
            <span className="method-description">Thanh toán ngay để giữ chỗ</span>
          </div>
        </div>
        
        {/* Phương thức 2: Thanh toán 70% còn lại */}
        <div className="payment-method-item">
          <div className="method-info">
            <span className="method-title">Thanh toán 70% còn lại</span>
            <span className="method-description">Thanh toán khi nhận xe</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PaymentMethods;