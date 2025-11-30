import React from 'react';
import { useNavigate } from 'react-router-dom';
import LocationInfo from './LocationInfo';
import PaymentDetail from './PaymentDetail';
import PaymentMethods from './PaymentMethods';
import CountdownTimer from '../../../../components/common/CountdownTimer';

/**
 * PaymentSection Component
 * 
 * CHỨC NĂNG CHÍNH:
 * - Hiển thị UI tương ứng với từng step của quy trình thanh toán
 * - Render conditional dựa trên step và trạng thái isTimeUp
 * - Cung cấp các nút action cho từng step
 * 
 * STEP MAPPING:
 * - Step 1 + !isTimeUp: Thanh toán cọc 30% + countdown timer
 * - Step 1 + isTimeUp: Thông báo hết hạn + nút về trang chủ
 * - Step 2: Ký hợp đồng + nút chuyển đến contract page
 * - Step 3: Thành công + nút xem đơn hàng/về trang chủ
 * - Step 0: Đã hủy + nút về trang chủ
 * 
 * PROPS:
 * - step: Bước hiện tại (0-3)
 * - isTimeUp: True khi countdown hết thời gian
 * - booking: Thông tin booking từ API
 * - deposit/remaining: Số tiền cọc và còn lại
 * - isPaying: Loading state khi đang xử lý payment
 * - formatCurrency: Function format tiền tệ
 * - setConfirmType/setShowConfirmModal: Functions để hiển thị modal xác nhận
 */
const PaymentSummary = ({ 
  step, 
  isTimeUp, 
  booking, 
  deposit, 
  remaining, 
  isPaying,
  formatCurrency, 
  setConfirmType,
  setShowConfirmModal
}) => {
  // ==================== HOOKS ====================
  const navigate = useNavigate();

  // ==================== RENDER CONDITIONS ====================
  
  /**
   * STEP 1 - THANH TOÁN CỌC (Chưa hết hạn)
   * 
   * HIỂN THỊ:
   * - Tiêu đề "Thanh toán trước 30%"
   * - Số tiền cọc lớn
   * - CountdownTimer với thời gian 10 phút
   * - Mã đơn đặt xe
   * - PaymentBreakdown (chi tiết giá)
   * - PaymentMethods (phương thức thanh toán)
   * - Nút "Thanh toán trước 30%" → mở modal xác nhận
   * 
   * LOGIC:
   * - Chỉ hiển thị khi step = 1 và chưa hết thời gian
   * - Nút bị disable khi isPaying = true
   * - Click nút → set confirmType = 'deposit' và hiển thị modal
   */
  if (step === 1 && !isTimeUp) {
    return (
      <div className="deposit-section-beautiful">
        {/* Header section với tiêu đề và số tiền */}
        <h2 className="deposit-title">Thanh toán trước 30% để giữ xe</h2>
        <div className="deposit-amount-large">{formatCurrency(deposit)}</div>
        
        {/* Countdown timer - tự động hủy khi hết 15 phút */}
        <CountdownTimer 
          startAt={booking?.updated_at} // Dùng updated_at khi chuyển sang confirmed
          duration={15 * 60 * 1000} // 15 phút = 900,000ms
          warningThreshold={2 * 60 * 1000} // Cảnh báo khi còn 2 phút
        />      

        {/* Chi tiết hoá đơn thanh toán */}
        <PaymentDetail booking={booking} formatCurrency={formatCurrency} />
        <PaymentMethods deposit={deposit} remaining={remaining} formatCurrency={formatCurrency} />

        {/* Section thanh toán chính */}
        <div className="payment-section">
          <h3 className="section-subtitle">Thanh toán trực tuyến qua PayOS</h3>
          <p className="payment-instruction">
            Nhấn nút bên dưới để thanh toán trước 30% qua cổng PayOS.
          </p>
          
          {/* Nút thanh toán - mở modal xác nhận */}
          <button 
            className="payment-button" 
            onClick={() => { 
              setConfirmType('deposit'); 
              setShowConfirmModal(true); 
            }} 
            disabled={isPaying}
          >
            {isPaying ? 'Đang xử lý...' : 'Thanh toán trước 30%'}
          </button>
        </div>
      </div>
    );
  }

  /**
   * STEP 1 - HẾT THỜI GIAN THANH TOÁN
   * 
   * HIỂN THỊ:
   * - Thông báo hết hạn thanh toán
   * - Thông báo đơn đã bị hủy
   * - Nút "Về Trang Chủ"
   * 
   * LOGIC:
   * - Hiển thị khi step = 1 và isTimeUp = true
   * - Không có action nào khác ngoài về trang chủ
   */
  if (step === 1 && isTimeUp) {
    return (
      <div className="payment-expired-message">
        <p>Thời gian thanh toán đã hết hạn.</p>
        <p>Đơn đặt xe của bạn đã bị hủy.</p>
        <button onClick={() => navigate('/')} className="confirm-button">
          Về Trang Chủ
        </button>
      </div>
    );
  }

  /**
   * STEP 2 - KÝ HỢP ĐỒNG
   * 
   * HIỂN THỊ:
   * - Tiêu đề "Ký hợp đồng"
   * - Thông báo đã thanh toán cọc
   * - Hướng dẫn ký hợp đồng
   * - Nút "Ký hợp đồng" → chuyển đến contract page
   * 
   * LOGIC:
   * - Hiển thị khi step = 2 (booking.status = "deposit_paid")
   * - Click nút → navigate đến /contracts/:bookingId
   */
  if (step === 2) {
    return (
      <>
        <h2 className="section-title">Ký hợp đồng</h2>
        <p className="deposit-amount">Đã thanh toán trước 30%: {formatCurrency(deposit)}</p>
        
        <div className="contract-section">
          <p>Vui lòng ký hợp đồng để hoàn tất quá trình đặt xe.</p>
          <button 
            onClick={() => navigate(`/contracts/${booking?.booking_id}`)} 
            className="contract-button"
          >
            Ký hợp đồng
          </button>
        </div>
      </>
    );
  }

  /**
   * STEP 3 - HOÀN TẤT THANH TOÁN
   * 
   * HIỂN THỊ:
   * - Thông báo thanh toán thành công
   * - Mã đơn hàng
   * - Nút "Xem Đơn Hàng Của Tôi"
   * - Nút "Về Trang Chủ"
   * 
   * LOGIC:
   * - Hiển thị khi step = 3 (booking.status = "contract_signed")
   * - 2 options: xem chi tiết đơn hàng hoặc về trang chủ
   */
  if (step === 3) {
    return (
      <div className="payment-success-message">
        <p>Đơn hàng đã được thanh toán đầy đủ!</p>
        <p>Mã đơn hàng: <strong>{booking?.booking_id}</strong></p>
        
        {/* Action buttons */}
        <button 
          onClick={() => navigate(`/bookings/${booking?.booking_id}`)} 
          className="confirm-button"
        >
          Xem Đơn Hàng Của Tôi
        </button>
        <button 
          onClick={() => navigate('/')} 
          className="back-to-home-button"
        >
          Về Trang Chủ
        </button>
      </div>
    );
  }

  /**
   * STEP 0 - ĐÃ HỦY/KHÔNG HỢP LỆ
   * 
   * HIỂN THỊ:
   * - Thông báo đơn đã bị hủy
   * - Nút "Về Trang Chủ"
   * 
   * LOGIC:
   * - Hiển thị khi step = 0 (booking.status = "canceled"/"refunded"/"rejected")
   * - Chỉ có option về trang chủ
   */
  if (step === 0) {
    return (
      <div className="payment-fail-message">
        <p>Đơn đặt xe đã bị hủy hoặc không hợp lệ.</p>
        <button onClick={() => navigate('/')} className="confirm-button">
          Về Trang Chủ
        </button>
      </div>
    );
  }

  /**
   * DEFAULT FALLBACK
   * 
   * Trả về null nếu không match step nào
   * Không nên xảy ra trong điều kiện bình thường
   */
  return null;
};

export default PaymentSummary;