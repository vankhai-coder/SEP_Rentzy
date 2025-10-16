import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaUser, FaPhone,FaRegCircle, FaCalendarAlt, FaMapMarkerAlt, FaCheck, FaCar, FaCircle } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import './OrderConfirmation.css';
import axiosInstance from "@/config/axiosInstance";
const OrderConfirmation = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('UNKNOWN'); // PENDING, COMPLETED, FAILED, CANCELED

  // Constants
  const HOLD_FEE = 500000; // Tiền giữ chỗ
  const DELIVERY_FEE = 200000; // Phí giao xe 2 chiều

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const res = await axiosInstance.get(`/api/renter/booking/${bookingId}`);
        console.log(res.data);
        setBooking(res.data.booking);
        setLoading(false);

        // Determine payment status from transactions
        const depositTransaction = res.data.booking.transactions.find(
          t => t.type === 'DEPOSIT' && t.paymentMethod === 'MOMO'
        );

        if (depositTransaction) {
          setPaymentStatus(depositTransaction.status);
        } else {
          setPaymentStatus('NO_DEPOSIT_FOUND');
        }

      } catch (err) {
        console.error('Error fetching booking details:', err);
        setError(err.response?.data?.message || 'Failed to fetch booking details');
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId, navigate]);

  // Add back button handler
  const handleBack = () => {
    navigate(-1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Tính toán các khoản phí từ dữ liệu API
  const calculateFees = () => {
    if (!booking) return null;

    // Sử dụng dữ liệu trực tiếp từ database
    const totalCost = parseFloat(booking.totalCost) || 0; // Tổng chi phí thuê xe
    const deliveryFee = parseFloat(booking.deliveryFee) || 0; // Phí giao xe
    const discountAmount = parseFloat(booking.discountAmount) || 0; // Giảm giá
    const pointsUsed = booking.pointsUsed || 0; // Điểm đã sử dụng
    const totalAmount = parseFloat(booking.totalAmount) || 0; // Tổng tiền phải trả
    const totalPaid = parseFloat(booking.totalPaid) || 0; // Tổng tiền đã thanh toán

    // Tính tiền cọc (30% tổng tiền)
    const depositAmount = Math.round(totalAmount * 0.3);
    // Tiền còn lại (70% tổng tiền)
    const remainingAmount = totalAmount - depositAmount;

    // Thông tin chi tiết
    const totalDays = booking.totalDays || 0;
    const pricePerDay = parseFloat(booking.pricePerDay) || 0;

    return {
      totalCost,
      deliveryFee,
      discountAmount,
      pointsUsed,
      depositAmount,
      remainingAmount,
      totalAmount,
      totalPaid,
      totalDays,
      pricePerDay
    };
  };

  const fees = calculateFees();

  const handleConfirm = async () => {
    // Directly navigate to the payment page
    if (booking && booking._id) {
      navigate(`/payment-deposit/${booking._id}`);
    } else {
      console.error('Booking ID not available for navigation.');
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const isPaymentCompleted = paymentStatus === 'COMPLETED';
  const isPaymentFailedOrCanceled = paymentStatus === 'FAILED' || paymentStatus === 'CANCELED';

  if (loading) {
    return <div className="loading">Đang tải thông tin...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!booking) {
    return <div className="error">Không tìm thấy thông tin đơn hàng</div>;
  }

  return (
    <>
    <div className="order-confirmation-container">
      <div className="order-card">
        <div className="back-link" onClick={handleBack}>
          <FaArrowLeft className="mr-2" />
          <span className="font-semibold">Quay lại</span>
        </div>

        <div className="progress-steps">
            <div className="progress-step completed">
              <div className="step-icon">
                <FaCheck />
              </div>
              <span className="step-text">Tìm và chọn xe</span>
            </div>
            <div className="progress-divider completed"></div>
            <div className={`progress-step completed ${isPaymentCompleted ? 'completed' : 'current'}`}>
              <div className="step-icon">
                <FaCheck />
              </div>
              <span className="step-text">Xác nhận đơn hàng</span>
            </div>
            <div className={`progress-divider ${isPaymentCompleted ? 'completed' : ''}`}></div>
            <div className={`progress-step ${isPaymentCompleted ? 'completed' : 'current'}`}>
              <div className="step-icon">
                <FaCar />
              </div>
              <span className="step-text">Thanh toán giữ chỗ</span>
            </div>
            <div className={`progress-divider ${isPaymentCompleted ? 'completed' : ''}`}></div>
            <div className={`progress-step ${isPaymentCompleted ? 'completed' : ''}`}>
              <div className="step-icon">
                <FaRegCircle />
              </div>
              <span className="step-text">Tải app & lấy xe</span>
            </div>
          </div>

        <h2 className="section-title text-center">
            {isPaymentCompleted ? 'Thanh toán giữ chỗ thành công!' : isPaymentFailedOrCanceled ? 'Thanh toán thất bại hoặc đã hủy.' : 'Đang chờ xác nhận thanh toán...'}
        </h2>
        {isPaymentCompleted && (
            <div className="payment-success-message text-center">
                <p>Mã đơn hàng của bạn: <strong>{booking._id}</strong></p>
                <p>Cảm ơn bạn đã thanh toán thành công</p>
            </div>
        )}

        {!isPaymentCompleted && (
            <div className="input-grid">
                <div className="input-field">
                    <FaUser />
                    <span className="display-field">{booking.renter?.name || 'Chưa có thông tin tên'}</span>
                </div>
                <div className="input-field">
                    <FaPhone />
                    <span className="display-field">{booking.renter?.phone || 'Chưa có thông tin số điện thoại'}</span>
                </div>
            </div>
        )}

        <h2 className="section-title">Thông tin đơn hàng</h2>

        <div className="order-details-section">
          <div className="order-detail-item">
            <FaCalendarAlt />
            <div>
              <p className="detail-label">Thời gian thuê</p>
              <p className="detail-value">
                {formatDate(booking.startDate)} đến {formatDate(booking.endDate)}
              </p>
            </div>
          </div>
          <div className="order-detail-item">
            <FaMapMarkerAlt />
            <div>
              <p className="detail-label">Địa điểm nhận xe</p>
              <p className="detail-value">{booking.pickupLocation}</p>
            </div>
          </div>
          <div className="order-detail-item">
            <FaMapMarkerAlt />
            <div>
              <p className="detail-label">Địa điểm trả xe</p>
              <p className="detail-value">{booking.returnLocation}</p>
            </div>
          </div>

          <div className="summary-section">
            <div className="summary-item">
              <span className="summary-label">Tổng tiền thuê xe ({fees?.totalDays || 0} ngày × {formatCurrency(fees?.pricePerDay || 0)})</span>
              <span className="summary-value">{formatCurrency(fees?.totalCost || 0)}</span>
            </div>
            
            <div className="summary-item">
              <span className="summary-label">Phí giao xe</span>
              <span className="summary-value">+{formatCurrency(fees?.deliveryFee || 0)}</span>
            </div>
            
            <div className="summary-item">
              <span className="summary-label">Giảm giá voucher</span>
              <span className="summary-value discount">-{formatCurrency(fees?.discountAmount || 0)}</span>
            </div>
            
            <div className="summary-item">
              <span className="summary-label">Điểm sử dụng</span>
              <span className="summary-value discount">-{fees?.pointsUsed || 0} điểm</span>
            </div>
            
            <div className="total-summary">
              <span>Tổng tiền phải trả</span>
              <span>{formatCurrency(fees?.totalAmount || 0)}</span>
            </div>
            
            <div className="payment-breakdown">
              <div className="summary-item">
                <span className="summary-label">Thanh toán trước (30%)</span>
                <span className="summary-value highlight">{formatCurrency(fees?.depositAmount || 0)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Thanh toán khi nhận xe (70%)</span>
                <span className="summary-value">{formatCurrency(fees?.remainingAmount || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        <h2 className="section-title">Các bước thanh toán</h2>

        <div className="payment-steps-section">
          <div className="payment-step">
            <div className="payment-step-number">
              1
            </div>
            <div className="payment-step-content">
              <p className="payment-step-title">Thanh toán giữ chỗ qua Rentzy</p>
              <p className="payment-step-description">Tiền này để xác nhận đơn thuê và giữ xe, sẽ được trừ vào số tiền còn lại phải thanh toán khi nhận xe.</p>
            </div>
            <span className="payment-amount">{formatCurrency(fees?.depositAmount || 0)}</span>
          </div>
          <div className="payment-step">
            <div className={`payment-step-number ${isPaymentCompleted ? 'completed' : ''}`}>
              2
            </div>
            <div className="payment-step-content">
              <p className="payment-step-title">Thanh toán số tiền còn lại khi nhận xe</p>
              <p className="payment-step-description">Số tiền còn lại <span>{formatCurrency(fees?.remainingAmount || 0)}</span></p>
              <p className="payment-step-description">Tiền cọc xe sẽ được thanh toán sau khi hoàn thành chuyến đi <span>{formatCurrency(fees?.depositAmount || 0)}</span></p>
            </div>
            <span className="payment-amount">{formatCurrency(fees?.remainingAmount || 0)}</span>
          </div>
        </div>

        <div className="action-buttons">
            {!isPaymentCompleted && (
                <button className="confirm-button" onClick={handleConfirm}>
                    Đi đến thanh toán giữ chỗ
                </button>
            )}
        </div>

        <p className="terms-text">
          Bằng việc chuyển giữ chỗ và thuê xe, bạn đồng ý với <a href="#">Điều khoản sử dụng</a> và <a href="#">Chính sách bảo mật</a>
        </p>

        <button className="back-to-home-button" onClick={handleBackToHome}>
          Quay về trang chủ
        </button>
      </div>
    </div>
    </>
  );
};

export default OrderConfirmation;