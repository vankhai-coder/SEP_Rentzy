import React, { useState, useEffect, useCallback } from 'react';
import { FaCheck, FaCar, FaFileSignature } from 'react-icons/fa';
import './PaymentDeposit.css';

import axiosInstance from '../../../config/axiosInstance';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import Header from '../../../components/common/Header';

const PaymentDeposit = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [countdown, setCountdown] = useState(0);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [step, setStep] = useState(1); // 1: chờ cọc, 2: ký hợp đồng, 3: chờ thanh toán còn lại, 4: hoàn tất
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmType, setConfirmType] = useState(null); // 'deposit' | 'remaining'
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Lấy thông tin booking
  const fetchBooking = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/renter/booking/${bookingId}`);
      setBooking(res.data.booking);
      setError(null);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải thông tin đơn hàng');
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  // Xác định trạng thái và bước thanh toán
  useEffect(() => {
    if (!booking) return;
    if (booking.status === 'pending') {
      setStep(1); // Chờ cọc
      // Vì API response không có created_at, ta sẽ set countdown mặc định 10 phút
      const tenMinutes = 10 * 60; // 10 phút tính bằng giây
      setCountdown(tenMinutes);
      setIsTimeUp(false);
    } else if (booking.status === 'deposit_paid') {
      setStep(2); // Ký hợp đồng
      setCountdown(0);
      setIsTimeUp(false);
    } else if (booking.status === 'contract_signed') {
      setStep(3); // Chờ thanh toán còn lại
      setCountdown(0);
      setIsTimeUp(false);
    } else if (booking.status === 'confirmed' || booking.status === 'in_progress' || booking.status === 'fully_paid' || booking.status === 'completed') {
      setStep(4); // Hoàn tất
      setCountdown(0);
      setIsTimeUp(false);
    } else if (booking.status === 'canceled' || booking.status === 'refunded' || booking.status === 'rejected') {
      setStep(0);
      setCountdown(0);
      setIsTimeUp(false);
    }
  }, [booking]);

  // Đếm ngược thời gian giữ chỗ
  useEffect(() => {
    if (step !== 1 || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsTimeUp(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Tính toán số tiền cọc (30%) và còn lại (70%) dựa trên totalCost từ backend
  const getPaidAndRemaining = () => {
    if (!booking) return { remaining: 0, deposit: 0, total: 0 };
    const total = booking.totalCost || 0;
    const deposit = Math.round(total * 0.3);
    const remaining = total - deposit;
    return { remaining, deposit, total };
  };
  const { remaining, deposit, total } = getPaidAndRemaining();

  // Thanh toán cọc qua PayOS
  const handleDepositPaymentPayOS = async () => {
    if (!booking) return;
    setIsPaying(true);
    try {
      const res = await axiosInstance.post(
        '/api/payment/payos/link',
        {
          bookingId: booking.booking_id,
          returnUrl: window.location.origin + `/contracts/${booking.booking_id}`,
          cancelUrl: window.location.origin + `/payment-deposit/${booking.booking_id}`
        }
      );
      if (res.data.payUrl) {
        window.location.href = res.data.payUrl;
      } else {
        toast.error('Không lấy được link thanh toán!');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Có lỗi khi tạo link thanh toán!');
    } finally {
      setIsPaying(false);
    }
  };

  // Huỷ booking (xoá khỏi DB)
  const handleCancelBooking = async () => {
    if (!booking) return;
    setIsPaying(true);
    try {
      const res = await axiosInstance.delete(`/api/renter/booking/${booking.booking_id}`);
      if (res.data.success) {
        toast.success('Đã xoá đơn đặt xe!');
        setTimeout(() => {
          navigate('/'); // hoặc navigate('/my-bookings') nếu có trang danh sách đơn
        }, 1200);
      } else {
        toast.error(res.data.message || 'Xoá đơn thất bại.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi khi xoá đơn.');
    } finally {
      setIsPaying(false);
      setShowCancelModal(false);
    }
  };

  // Format helpers
  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  const formatDateTime = (dateString, timeString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return timeString ? `${dateStr} ${timeString}` : dateStr;
  };
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // UI
  if (loading) return (
    <>
      <Header />
      <div className="loading-screen">Đang tải thông tin...</div>
    </>
  );
  
  if (error) return (
    <>
      <Header />
      <div className="error-screen">Lỗi: {error}</div>
    </>
  );
  
  if (!booking) return (
    <>
      <Header />
      <div className="error-screen">Không tìm thấy đơn hàng.</div>
    </>
  );

  return (
    <>
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
      
      {/* Confirm Payment Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Xác nhận thanh toán</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Bạn có chắc chắn muốn thanh toán {confirmType === 'deposit' ? formatCurrency(deposit) : formatCurrency(remaining)} cho đơn này?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Huỷ
            </Button>
            <Button onClick={async () => {
              setShowConfirmModal(false);
              if (confirmType === 'deposit') await handleDepositPaymentPayOS();
            }}>
              Đồng ý
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Booking Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Xác nhận huỷ đơn</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Bạn có chắc chắn muốn xoá đơn đặt xe này? Hành động này không thể hoàn tác.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>
              Huỷ
            </Button>
            <Button variant="destructive" onClick={handleCancelBooking}>
              Đồng ý
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="reservation-payment-container">
        <div className="progress-bar-wrapper">
          <div className="progress-steps">
            <div className="progress-step completed">
              <div className="step-icon active">
                <FaCheck />
              </div>
              <span className="step-text">Tìm và chọn xe</span>
            </div>
            <div className="progress-step completed">
              <div className="step-icon active">
                <FaCheck />
              </div>
              <span className="step-text">Xác nhận đơn hàng</span>
            </div>
            <div className={`progress-step ${step > 1 ? 'completed' : ''}`}> 
              <div className={`step-icon ${step > 1 ? 'active' : 'current'}`}>
                {step > 1 ? <FaCheck /> : <FaCar />}
              </div>
              <span className="step-text">Thanh toán cọc 30%</span>
            </div>
            <div className="progress-step"> 
              <div className={`step-icon ${step > 1 ? 'current' : 'inactive'}`}>
                <FaFileSignature />
              </div>
              <span className="step-text">Ký hợp đồng</span>
            </div>
            <div className="progress-step"> 
              <div className="step-icon inactive">
                <FaCar />
              </div>
              <span className="step-text">Nhận xe</span>
            </div>
          </div>
        </div>
        <div className="content-wrapper">
          <div className="payment-details-section">
            {step === 1 && !isTimeUp && (
              <div className="deposit-section-beautiful">
                <h2 className="deposit-title">Thanh toán trước 30% để giữ xe</h2>
                <div className="deposit-amount-large">{formatCurrency(deposit)}</div>
                <div className="deposit-info-row">
                  <span className="deposit-label">Thời gian giữ chỗ còn lại:</span>
                  <span className="deposit-countdown">{formatTime(countdown)}</span>
                </div>
                <div className="deposit-info-row">
                  <span className="deposit-label">Mã đơn đặt xe:</span>
                  <span className="deposit-order-id">{booking.booking_id}</span>
                </div>
                {/* Thanh toán trực tuyến qua PayOS */}
                <div className="payment-section">
                  <h3 className="section-subtitle">Thanh toán trực tuyến qua PayOS</h3>
                  <p className="payment-instruction">Nhấn nút bên dưới để thanh toán trước 30% qua cổng PayOS.</p>
                  <button className="payment-button beautiful-pay-btn" onClick={() => { setConfirmType('deposit'); setShowConfirmModal(true); }} disabled={isPaying}>
                    {isPaying ? 'Đang xử lý...' : 'Thanh toán trước 30%'}
                  </button>
                </div>
              </div>
            )}
            {step === 1 && isTimeUp && (
              <div className="payment-expired-message text-center">
                <p>Thời gian thanh toán đã hết hạn.</p>
                <p>Đơn đặt xe của bạn đã bị hủy.</p>
                <button onClick={() => navigate('/')} className="confirm-button">Về Trang Chủ</button>
              </div>
            )}
            {step === 2 && (
              <>
                <h2 className="section-title">Ký hợp đồng</h2>
                <p className="deposit-amount">Đã thanh toán trước 30%: {formatCurrency(deposit)}</p>
                <div className="contract-section">
                  <p>Vui lòng ký hợp đồng để hoàn tất quá trình đặt xe.</p>
                  <button onClick={() => navigate(`/contracts/${booking.booking_id}`)} className="contract-button">Ký hợp đồng</button>
                </div>
              </>
            )}
            {(step === 1 || step === 2) && (
              <button className="cancel-booking-button" onClick={() => setShowCancelModal(true)} disabled={isPaying}>Huỷ đơn</button>
            )}
            {step === 3 && (
              <div className="payment-success-message text-center">
                <p>Đơn hàng đã được thanh toán đầy đủ!</p>
                <p>Mã đơn hàng: <strong>{booking.booking_id}</strong></p>
                <button onClick={() => navigate(`/bookings/${bookingId}`)} className="confirm-button">Xem Đơn Hàng Của Tôi</button>
                <button onClick={() => navigate('/')} className="back-to-home-button">Về Trang Chủ</button>
              </div>
            )}
            {step === 0 && (
              <div className="payment-fail-message text-center">
                <p>Đơn đặt xe đã bị hủy hoặc không hợp lệ.</p>
                <button onClick={() => navigate('/')} className="confirm-button">Về Trang Chủ</button>
              </div>
            )}
          </div>
          <div className="order-summary-section">
            <h2 className="section-title">Thông tin đơn thuê</h2>
            <div className="car-image-container">
              <img src={booking.vehicle?.main_image_url || "/images/car-placeholder.png"} alt="Car" className="car-image" />
            </div>
            <div className="order-details-info">
              <div className="detail-row"><span>Mã đặt xe</span><span className="detail-value">{booking.booking_id}</span></div>
              <div className="detail-row"><span>Tên khách thuê</span><span className="detail-value">{booking.renter?.full_name || 'N/A'}</span></div>
              <div className="detail-row"><span>Số điện thoại</span><span className="detail-value">{booking.renter?.phone_number || 'N/A'}</span></div>
              <div className="detail-row"><span>Ngày nhận:</span><span className="detail-value">{formatDateTime(booking.startDate, booking.startTime)}</span></div>
              <div className="detail-row"><span>Ngày trả:</span><span className="detail-value">{formatDateTime(booking.endDate, booking.endTime)}</span></div>
              <div className="detail-row"><span>Loại xe:</span><span className="detail-value">{booking.vehicle?.model}</span></div>
              <div className="total-rental-fee-box"><span>Tổng tiền thuê xe</span><span className="total-fee">{formatCurrency(total)}</span></div>
            </div>
            <h2 className="section-title">Các bước thanh toán</h2>
            <div className="payment-steps-summary">
              <div className={`payment-step-item ${step > 1 ? 'completed' : ''}`}> 
                <div className="step-number">1</div>
                <div className="step-content">
                  <p className="step-title">Thanh toán trước 30%</p>
                  <p className="step-description">Thanh toán trước 30% tổng giá trị đơn hàng để giữ xe, số tiền này sẽ được trừ vào tổng thanh toán khi nhận xe.</p>
                </div>
                <span className="step-amount">{formatCurrency(deposit)}</span>
              </div>
              <div className={`payment-step-item ${step === 3 ? 'completed' : ''}`}> 
                <div className="step-number">2</div>
                <div className="step-content">
                  <p className="step-title">Thanh toán 70% còn lại khi nhận xe</p>
                  <div className="sub-details">
                    <p>Tiền còn lại <span>{formatCurrency(remaining)}</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentDeposit;