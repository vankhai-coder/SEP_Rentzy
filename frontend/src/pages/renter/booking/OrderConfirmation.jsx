import React, { useState, useEffect } from 'react';
import { 
  FaArrowLeft, 
  FaUser, 
  FaPhone, 
  FaRegCircle, 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaCheck, 
  FaCar, 
  FaClock, 
  FaTag, 
  FaStar,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaGift,
  FaCoins
} from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import './OrderConfirmation.css';
import axiosInstance from "@/config/axiosInstance";

const OrderConfirmation = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('UNKNOWN');

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const res = await axiosInstance.get(`/api/renter/booking/${bookingId}`);
        console.log(res.data);
        setBooking(res.data.booking);
        setLoading(false);

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

  const handleBack = () => {
    navigate(-1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Chờ xác nhận',
      'deposit_paid': 'Đã đặt cọc',
      'rental_paid': 'Đã thanh toán toàn bộ',
      'confirmed': 'Đã xác nhận',
      'in_progress': 'Đang thuê',
      'completed': 'Hoàn thành',
      'cancel_requested': 'Yêu cầu hủy',
      'canceled': 'Đã hủy'
    };
    return statusMap[status] || status;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleConfirm = async () => {
    if (booking && booking.booking_id) {
      navigate(`/payment-deposit/${booking.booking_id}`);
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
    return (
      <div className="order-confirmation-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-confirmation-container">
        <div className="error-container">
          <FaTimesCircle className="error-icon" />
          <h2>Có lỗi xảy ra</h2>
          <p>{error}</p>
          <button onClick={handleBack} className="back-button">
            <FaArrowLeft /> Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="order-confirmation-container">
        <div className="error-container">
          <FaExclamationTriangle className="error-icon" />
          <h2>Không tìm thấy đơn hàng</h2>
          <p>Đơn hàng bạn tìm kiếm không tồn tại hoặc đã bị xóa</p>
          <button onClick={handleBackToHome} className="back-button">
            <FaArrowLeft /> Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-confirmation-container">
      <div className="order-card">
        {/* Header */}
        <header className="order-header">
          <button className="back-button" onClick={handleBack}>
            <FaArrowLeft />
            <span>Quay lại</span>
          </button>
          <h1 className="page-title">Xác nhận đơn hàng</h1>
        </header>

        {/* Progress Steps */}
        <section className="progress-section">
          <div className="progress-steps">
            <div className="progress-step completed">
              <div className="step-circle">
                <FaCheck />
              </div>
              <span className="step-label">Chọn xe</span>
            </div>
            
            <div className="progress-line completed"></div>
            
            <div className="progress-step completed">
              <div className="step-circle">
                <FaCheck />
              </div>
              <span className="step-label">Xác nhận</span>
            </div>
            
            <div className="progress-line"></div>
            
            <div className={`progress-step ${isPaymentCompleted ? 'completed' : 'current'}`}>
              <div className="step-circle">
                {isPaymentCompleted ? <FaCheck /> : <FaMoneyBillWave />}
              </div>
              <span className="step-label">Thanh toán</span>
            </div>
            
            <div className="progress-line"></div>
            
            <div className={`progress-step ${isPaymentCompleted ? 'current' : ''}`}>
              <div className="step-circle">
                <FaCar />
              </div>
              <span className="step-label">Nhận xe</span>
            </div>
          </div>
        </section>

        {/* Status Message */}
        <section className="status-section">
          {isPaymentCompleted && (
            <div className="status-card success">
              <div className="status-icon">
                <FaCheckCircle />
              </div>
              <div className="status-content">
                <h2>Thanh toán thành công!</h2>
                <p>Đơn hàng của bạn đã được xác nhận. Chúng tôi sẽ liên hệ với bạn sớm nhất để xác nhận thời gian nhận xe.</p>
                <div className="order-code">
                  <span>Mã đơn hàng: <strong>{booking.booking_id}</strong></span>
                </div>
              </div>
            </div>
          )}
          
          {isPaymentFailedOrCanceled && (
            <div className="status-card error">
              <div className="status-icon">
                <FaTimesCircle />
              </div>
              <div className="status-content">
                <h2>Thanh toán thất bại</h2>
                <p>Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại hoặc liên hệ hỗ trợ.</p>
              </div>
            </div>
          )}
          

        </section>

        {/* Main Content */}
        <div className="main-content">
          {/* Customer Information */}
          {booking.renter && (
            <section className="info-section">
              <h3 className="section-title">
                <FaUser className="title-icon" />
                Thông tin khách hàng
              </h3>
              <div className="info-card">
                <div className="info-row">
                  <div className="info-item">
                    <FaUser className="info-icon" />
                    <div className="info-content">
                      <span className="info-label">Họ và tên</span>
                      <span className="info-value">{booking.renter.full_name || booking.renter.name || 'Chưa cập nhật'}</span>
                    </div>
                  </div>
                  <div className="info-item">
                    <FaPhone className="info-icon" />
                    <div className="info-content">
                      <span className="info-label">Số điện thoại</span>
                      <span className="info-value">{booking.renter.phone_number || booking.renter.phone || 'Chưa cập nhật'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Vehicle Information */}
          {booking.vehicle && (
            <section className="info-section">
              <h3 className="section-title">
                <FaCar className="title-icon" />
                Thông tin xe
              </h3>
              <div className="vehicle-card">
                <div className="vehicle-image-container">
                  {booking.vehicle.main_image_url ? (
                    <img 
                      src={booking.vehicle.main_image_url} 
                      alt={booking.vehicle.model}
                      className="vehicle-image"
                    />
                  ) : (
                    <div className="vehicle-placeholder">
                      <FaCar />
                    </div>
                  )}
                </div>
                <div className="vehicle-info">
                  <h4 className="vehicle-model">{booking.vehicle.model}</h4>
                  <div className="vehicle-details">
                    <div className="vehicle-detail">
                      <FaMapMarkerAlt className="detail-icon" />
                      <span>{booking.vehicle.location}</span>
                    </div>
                    <div className="vehicle-detail">
                      <FaMoneyBillWave className="detail-icon" />
                      <span>{formatCurrency(booking.vehicle.price_per_day)}/ngày</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Booking Time */}
          <section className="info-section">
            <h3 className="section-title">
              <FaCalendarAlt className="title-icon" />
              Thời gian thuê xe
            </h3>
            <div className="info-card">
              <div className="info-row">
                <div className="info-item">
                  <FaCalendarAlt className="info-icon" />
                  <div className="info-content">
                    <span className="info-label">Ngày nhận xe</span>
                    <span className="info-value">{formatDate(booking.startDate)} - {formatTime(booking.startTime)}</span>
                  </div>
                </div>
                <div className="info-item">
                  <FaCalendarAlt className="info-icon" />
                  <div className="info-content">
                    <span className="info-label">Ngày trả xe</span>
                    <span className="info-value">{formatDate(booking.endDate)} - {formatTime(booking.endTime)}</span>
                  </div>
                </div>
              </div>
              <div className="info-row">
                <div className="info-item">
                  <FaClock className="info-icon" />
                  <div className="info-content">
                    <span className="info-label">Tổng thời gian thuê</span>
                    <span className="info-value">{booking.totalDays} ngày</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Location Information */}
          <section className="info-section">
            <h3 className="section-title">
              <FaMapMarkerAlt className="title-icon" />
              Địa điểm
            </h3>
            <div className="info-card">
              <div className="info-row">
                <div className="info-item">
                  <FaMapMarkerAlt className="info-icon pickup" />
                  <div className="info-content">
                    <span className="info-label">Địa điểm nhận xe</span>
                    <span className="info-value">{booking.pickupLocation}</span>
                  </div>
                </div>
                <div className="info-item">
                  <FaMapMarkerAlt className="info-icon return" />
                  <div className="info-content">
                    <span className="info-label">Địa điểm trả xe</span>
                    <span className="info-value">{booking.returnLocation}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Payment Details */}
          <section className="info-section">
            <h3 className="section-title">
              <FaMoneyBillWave className="title-icon" />
              Chi tiết thanh toán
            </h3>
            <div className="payment-card">
              <div className="payment-breakdown">
                <div className="payment-item">
                  <span className="payment-label">Giá thuê xe ({booking.totalDays} ngày)</span>
                  <span className="payment-value">{formatCurrency(booking.totalCost)}</span>
                </div>
                
                <div className="payment-item">
                  <span className="payment-label">Phí giao xe</span>
                  <span className="payment-value">
                    {booking.deliveryFee > 0 ? `+${formatCurrency(booking.deliveryFee)}` : 'Miễn phí'}
                  </span>
                </div>

                {booking.voucherCode && (
                  <div className="payment-item voucher">
                    <span className="payment-label">
                      <FaGift className="payment-icon" />
                      Mã voucher: {booking.voucherCode}
                    </span>
                    <span className="payment-value discount">
                      -{formatCurrency(booking.discountAmount || 0)}
                    </span>
                  </div>
                )}

                {booking.pointsUsed > 0 && (
                  <div className="payment-item points">
                    <span className="payment-label">
                      <FaCoins className="payment-icon" />
                      Điểm đã sử dụng ({booking.pointsUsed} điểm)
                    </span>
                    <span className="payment-value discount">
                      -{formatCurrency(booking.pointsUsed * 1000)}
                    </span>
                  </div>
                )}

                <div className="payment-divider"></div>
                
                <div className="payment-item total">
                  <span className="payment-label">Tổng tiền</span>
                  <span className="payment-value">{formatCurrency(booking.totalCost)}</span>
                </div>
              </div>

              <div className="payment-method">
                <h4 className="payment-method-title">Phương thức thanh toán</h4>
                <div className="payment-split">
                  <div className="payment-item paid">
                    <span className="payment-label">Thanh toán trước (30%)</span>
                    <span className="payment-value">{formatCurrency(Math.round(booking.totalCost * 0.3))}</span>
                  </div>
                  <div className="payment-item remaining">
                    <span className="payment-label">Thanh toán khi nhận xe (70%)</span>
                    <span className="payment-value">{formatCurrency(booking.totalCost - Math.round(booking.totalCost * 0.3))}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Payment Policy */}
          <section className="policy-section">
            <div className="policy-card">
              <div className="policy-header">
                <FaClock className="policy-icon" />
                <h4>Chính sách thanh toán</h4>
              </div>
              <div className="policy-content">
                <div className="policy-item">
                  <span className="policy-step">1</span>
                  <span className="policy-text">Thanh toán trước <strong>30%</strong> tổng giá trị để xác nhận đặt xe</span>
                </div>
                <div className="policy-item">
                  <span className="policy-step">2</span>
                  <span className="policy-text">Thanh toán <strong>70%</strong> còn lại khi nhận xe</span>
                </div>
                <div className="policy-item">
                  <span className="policy-step">3</span>
                  <span className="policy-text">Hỗ trợ thanh toán bằng <strong>tiền mặt</strong> hoặc <strong>chuyển khoản</strong></span>
                </div>
              </div>
            </div>
          </section>

          {/* Order Information */}
          <section className="info-section">
            <h3 className="section-title">
              <FaTag className="title-icon" />
              Thông tin đơn hàng
            </h3>
            <div className="info-card">
              <div className="info-row">
                <div className="info-item">
                  <FaTag className="info-icon" />
                  <div className="info-content">
                    <span className="info-label">Mã đơn hàng</span>
                    <span className="info-value">{booking.booking_id}</span>
                  </div>
                </div>
                <div className="info-item">
                  <FaCalendarAlt className="info-icon" />
                  <div className="info-content">
                    <span className="info-label">Ngày tạo</span>
                    <span className="info-value">{formatDate(booking.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="info-row">
                <div className="info-item">
                  <FaStar className="info-icon" />
                  <div className="info-content">
                    <span className="info-label">Trạng thái</span>
                    <span className={`info-value status-badge status-${booking.status}`}>
                      {getStatusText(booking.status)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Action Buttons */}
        <footer className="action-section">
          {!isPaymentCompleted && !isPaymentFailedOrCanceled && (
            <button className="primary-button" onClick={handleConfirm}>
              <FaMoneyBillWave />
              Thanh toán giữ chỗ
            </button>
          )}
          <button className="secondary-button" onClick={handleBackToHome}>
            <FaArrowLeft />
            Quay về trang chủ
          </button>
        </footer>
      </div>
    </div>
  );
};

export default OrderConfirmation;