import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// UI Components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';

// Custom Components
import ProgressBar from './components/ProgressBar';
import PaymentSummary from './components/PaymentSummary';
import OrderSummary from './components/OrderSummary';

// Custom Hooks & Utils
import { usePaymentLogic } from './hooks/usePaymentLogic';
import { formatCurrency, formatDateTime } from './utils/formatters';

// Styles
import './PaymentDeposit.scss';

/**
 * PaymentDeposit Component
 * 
 * LUỒNG CHẠY CHÍNH:
 * 1. Component mount → fetchBooking() → load thông tin booking từ API
 * 2. usePaymentLogic hook xử lý logic:
 *    - Xác định step hiện tại dựa trên booking.status
 *    - Khởi tạo countdown timer cho step 1 (pending)
 *    - Cung cấp các hàm xử lý payment và cancel
 * 3. Render UI dựa trên state:
 *    - Loading state: hiển thị loading message
 *    - Error state: hiển thị error message với nút về trang chủ
 *    - Success state: hiển thị ProgressBar + OrderSummary + PaymentSection
 * 4. User interaction:
 *    - Thanh toán: mở confirm modal → gọi handleDepositPaymentPayOS → redirect PayOS
 *    - Hủy đơn: mở cancel modal → gọi handleCancelBooking → về trang chủ
 * 
 * PAYMENT STEPS:
 * - Step 1: pending → Thanh toán cọc 30% (có countdown 10 phút)
 * - Step 2: deposit_paid → Ký hợp đồng
 * - Step 3: contract_signed → Hoàn tất
 * - Step 4: confirmed/completed → Đã hoàn thành
 */
const PaymentDeposit = () => {
  // ==================== ROUTER HOOKS ====================
  const { bookingId } = useParams(); // Lấy bookingId từ URL params
  const navigate = useNavigate(); // Hook để điều hướng
  
  // ==================== LOCAL STATE ====================
  // Modal states - quản lý việc hiển thị các modal
  const [showConfirmModal, setShowConfirmModal] = useState(false); // Modal xác nhận thanh toán
  const [confirmType, setConfirmType] = useState(null); // Loại xác nhận (deposit/full)
  const [showCancelModal, setShowCancelModal] = useState(false); // Modal xác nhận hủy đơn

  // ==================== CUSTOM HOOKS ====================
  /**
   * usePaymentLogic Hook - Xử lý toàn bộ logic payment
   * 
   * INPUT: bookingId
   * OUTPUT:
   * - booking: thông tin đơn hàng từ API
   * - loading: trạng thái loading khi fetch data
   * - error: thông báo lỗi nếu có
   * - isTimeUp: true nếu hết thời gian countdown (10 phút)
   * - isPaying: true khi đang xử lý payment/cancel
   * - step: bước hiện tại trong quy trình (1-4)
   * - fetchBooking: hàm fetch lại data từ API
   * - getPaidAndRemaining: hàm tính toán số tiền cọc/còn lại
   * - handleDepositPaymentPayOS: hàm xử lý thanh toán cọc qua PayOS
   * - handleCancelBooking: hàm hủy đơn hàng
   */
  const {
    booking,
    loading,
    error,
    isTimeUp,
    isPaying,
    step,
    fetchBooking,
    getPaidAndRemaining,
    handleDepositPaymentPayOS,
    handleCancelBooking
  } = usePaymentLogic(bookingId);

  // ==================== EFFECTS ====================
  /**
   * Effect: Initialize data khi component mount
   * - Gọi fetchBooking() để load thông tin booking từ API
   * - Dependency: [fetchBooking] để tránh infinite loop
   */
  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  // ==================== COMPUTED VALUES ====================
  /**
   * Tính toán số tiền cọc và còn lại
   * - deposit: 30% tổng tiền
   * - remaining: 70% còn lại
   */
  const { remaining, deposit } = getPaidAndRemaining();

  // ==================== EVENT HANDLERS ====================
  /**
   * Xử lý xác nhận thanh toán
   * - Kiểm tra loại thanh toán (deposit/full)
   * - Gọi hàm xử lý tương ứng
   * - Đóng modal sau khi xử lý
   */
  const handleConfirmPayment = async () => {
    try {
      if (confirmType === 'deposit') {
        await handleDepositPaymentPayOS();
      }
      // Có thể thêm các loại thanh toán khác ở đây
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setShowConfirmModal(false);
    }
  };

  /**
   * Xử lý hủy đơn hàng với điều hướng
   * - Gọi handleCancelBooking() từ hook
   * - Nếu thành công: delay 1.2s rồi về trang chủ
   * - Đóng modal sau khi xử lý
   */
  const handleCancelBookingWithNavigation = async () => {
    try {
      const success = await handleCancelBooking();
      if (success) {
        // Delay để user thấy toast message trước khi redirect
        setTimeout(() => {
          navigate('/');
        }, 1200);
      }
    } catch (error) {
      console.error('Cancel booking error:', error);
    } finally {
      setShowCancelModal(false);
    }
  };

  // ==================== RENDER CONDITIONS ====================
  /**
   * Loading State
   * Hiển thị khi đang fetch data từ API
   */
  if (loading) {
    return (
      <div className="reservation-payment-container">
        <div className="loading-message">
          Đang tải thông tin đơn hàng...
        </div>
      </div>
    );
  }

  /**
   * Error State
   * Hiển thị khi có lỗi từ API hoặc network
   */
  if (error) {
    return (
      <div className="reservation-payment-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="confirm-button">
            Về Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  /**
   * No Data State
   * Hiển thị khi không có thông tin booking
   */
  if (!booking) {
    return (
      <div className="reservation-payment-container">
        <div className="error-message">
          <p>Không tìm thấy thông tin đơn hàng</p>
          <button onClick={() => navigate('/')} className="confirm-button">
            Về Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  // ==================== MAIN RENDER ====================
  return (
    <>
      {/* Toast Container cho thông báo */}
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* ==================== MODALS ==================== */}
      
      {/* Modal xác nhận thanh toán */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Xác nhận thanh toán</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Bạn có chắc chắn muốn thanh toán {formatCurrency(deposit)} để giữ xe?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Huỷ
            </Button>
            <Button onClick={handleConfirmPayment} disabled={isPaying}>
              {isPaying ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal xác nhận hủy đơn */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Xác nhận huỷ đơn</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Bạn có chắc chắn muốn huỷ đơn đặt xe này? Hành động này không thể hoàn tác.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>
              Huỷ
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelBookingWithNavigation}
              disabled={isPaying}
            >
              {isPaying ? 'Đang xử lý...' : 'Đồng ý'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== MAIN CONTENT ==================== */}
      <div className="reservation-payment-container">
        {/* Progress Bar - hiển thị bước hiện tại */}
        <ProgressBar step={step} />
        
        {/* Content Wrapper */}
        <div className="content-wrapper">
          {/* Order Summary - thông tin tổng quan đơn hàng */}
          <OrderSummary
            booking={booking}
            formatDateTime={formatDateTime}
          />
          
          {/* Payment Details Section */}
          <div className="payment-details-section">
            {/* Payment Section - xử lý thanh toán theo từng step */}
            <PaymentSummary
              step={step}
              isTimeUp={isTimeUp}
              booking={booking}
              deposit={booking.totalAmount * 0.3}
              remaining={remaining}
              isPaying={isPaying}
              formatCurrency={formatCurrency}
              setConfirmType={setConfirmType}
              setShowConfirmModal={setShowConfirmModal}
            />
            
            {/* Cancel Button - chỉ hiển thị ở step 1 và 2 */}
            {(step === 1 || step === 2) && (
              <button 
                className="cancel-booking-button" 
                onClick={() => setShowCancelModal(true)} 
                disabled={isPaying}
              >
                {isPaying ? 'Đang xử lý...' : 'Huỷ đơn'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentDeposit;