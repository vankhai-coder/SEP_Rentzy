import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaInfoCircle } from 'react-icons/fa';
import axiosInstance from '@/config/axiosInstance';
import HandoverImageViewer from '@/components/common/HandoverImageViewer';
import './BookingDetailsPage.scss';

const BookingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    fetchBookingDetails();
    
    // Xử lý kết quả thanh toán PayOS
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      // Hiển thị thông báo thành công và refresh data
      setTimeout(() => {
        alert('Thanh toán thành công! Thông tin đặt xe đã được cập nhật.');
        fetchBookingDetails();
      }, 1000);
      
      // Xóa parameter khỏi URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'cancel') {
      // Hiển thị thông báo hủy
      setTimeout(() => {
        alert('Thanh toán đã bị hủy.');
      }, 1000);
      
      // Xóa parameter khỏi URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching booking details for ID:', id);
      const response = await axiosInstance.get(`/api/renter/booking/${id}`);
      
      console.log('API Response:', response.data);
      
      if (response.data.success && response.data.booking) {
        setBooking(response.data.booking);
      } else {
        throw new Error('Không thể tải thông tin đặt xe');
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      setError(error.response?.data?.message || error.message || 'Có lỗi xảy ra khi tải thông tin đặt xe');
    } finally {
      setLoading(false);
    }
  };



  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  };

  // Xử lý thanh toán PayOS
  const handlePayOSPayment = async (amount, isRemaining = false) => {
    // Hiển thị dialog xác nhận
    const paymentType = isRemaining ? 'phần còn lại' : 'đặt cọc';
    const confirmMessage = `Bạn có muốn thanh toán ${paymentType} với số tiền ${formatCurrency(amount)} không?`;
    
    const userConfirmed = window.confirm(confirmMessage);
    
    if (!userConfirmed) {
      return; // Người dùng hủy, không thực hiện thanh toán
    }

    try {
      setPaymentLoading(true);
      
      const currentUrl = window.location.origin;
      const returnUrl = `${currentUrl}/booking-history/booking-detail/${booking.booking_id}?payment=success`;
      const cancelUrl = `${currentUrl}/booking-history/booking-detail/${booking.booking_id}?payment=cancel`;
      
      const endpoint = isRemaining ? '/api/payment/payos/remaining-link' : '/api/payment/payos/link';
      
      const response = await axiosInstance.post(endpoint, {
        bookingId: booking.booking_id,
        returnUrl,
        cancelUrl
      });

      if (response.data.payUrl) {
        // Chuyển hướng đến trang thanh toán PayOS
        window.location.href = response.data.payUrl;
      } else {
        throw new Error('Không thể tạo link thanh toán');
      }
    } catch (error) {
      console.error('PayOS payment error:', error);
      
      let errorMessage = 'Có lỗi xảy ra khi tạo link thanh toán';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 400) {
        errorMessage = 'Thông tin thanh toán không hợp lệ. Vui lòng thử lại.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Lỗi hệ thống. Vui lòng thử lại sau ít phút.';
      }
      
      alert(errorMessage);
    } finally {
      setPaymentLoading(false);
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'deposit_paid':
        return 'Đã thanh toán cọc';
      case 'fully_paid':
        return 'Đã thanh toán đầy đủ';
      case 'completed':
        return 'Hoàn thành';
      case 'canceled':
        return 'Đã hủy';
      default:
        return status || 'Không xác định';
    }
  };

  // Tính toán số tiền đã thanh toán và còn lại
  const calculatePaymentDetails = () => {
    if (!booking) return { totalPaid: 0, remaining: 0, showPaymentButton: false };

    const totalPaid = parseFloat(booking.totalPaid) || 0;
    const totalAmount = parseFloat(booking.totalAmount) || 0;
    const remaining = totalAmount - totalPaid;

    // Hiển thị nút thanh toán nếu còn tiền phải trả và trạng thái phù hợp
    const showPaymentButton = remaining > 0 && 
      (booking.status === 'deposit_paid' || booking.status === 'pending');

    return {
      totalPaid,
      remaining,
      showPaymentButton,
      nextPaymentAmount: remaining
    };
  };

  const { totalPaid, remaining, showPaymentButton, nextPaymentAmount } = calculatePaymentDetails();

  if (loading) {
    return (
      <div className="booking-details-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải thông tin đặt xe...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="booking-details-container">
        <div className="error-message">
          <h3>Có lỗi xảy ra</h3>
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className="back-button">
            <FaArrowLeft /> Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="booking-details-container">
        <div className="error-message">
          <h3>Không tìm thấy thông tin đặt xe</h3>
          <button onClick={() => navigate(-1)} className="back-button">
            <FaArrowLeft /> Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-details-container">
      {/* Header với nút quay lại */}
      <div className="booking-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <FaArrowLeft /> Quay lại
        </button>
        <h1>Chi tiết đặt xe #{booking.booking_id}</h1>
      </div>

      {/* Unified content trong một div duy nhất */}
      <div className="unified-booking-content">
        {/* Thông tin tổng quan */}
        <div className="overview-section">
          <div className="status-badge">
            <span className={`status-indicator ${booking.status?.toLowerCase()}`}>
              {getStatusText(booking.status)}
            </span>
          </div>
          <div className="booking-meta">
            <span className="booking-date">Đặt Xe ngày: {formatDateTime(booking.created_at)}</span>
          </div>
        </div>

        {/* Thông tin xe và hình ảnh */}
        <div className="vehicle-section">
          <div className="vehicle-image-container">
            <img 
              src={booking.vehicle?.main_image_url || '/default-car.jpg'} 
              alt={booking.vehicle?.model}
              className="vehicle-main-image"
            />
          </div>
          <div className="vehicle-info-container">
            <h2 className="vehicle-title">{booking.vehicle?.model}</h2>
            <p className="vehicle-location">{booking.vehicle?.location}</p>
            <p className="vehicle-price">{formatCurrency(booking.vehicle?.price_per_day)}/ngày</p>
            <button 
              className="view-vehicle-btn"
              onClick={() => navigate(`/detail/${booking.vehicle?.vehicle_id}`)}
            >
              <FaInfoCircle /> Xem chi tiết xe
            </button>
          </div>
        </div>

        {/* Pre-Rental Images Section */}
        <div className="pre-rental-images-section">
          <HandoverImageViewer 
            bookingId={booking.booking_id}
            booking={booking}
            userRole="renter"
            imageType="pre-rental"
            onConfirmSuccess={fetchBookingDetails}
          />
        </div>

        {/* Post-Rental Images Section */}
        <div className="pre-rental-images-section">
          <HandoverImageViewer 
            bookingId={booking.booking_id}
            booking={booking}
            userRole="renter"
            imageType="post-rental"
            onConfirmSuccess={fetchBookingDetails}
          />
        </div>


        {/* Thời gian và địa điểm */}
        <div className="rental-details-section">
          <div className="rental-time">
            <h3>Thời gian thuê</h3>
            <div className="time-info">
              <div className="time-item">
                <span className="label">Nhận xe:</span>
                <span className="value">{formatDate(booking.startDate)} {booking.startTime}</span>
              </div>
              <div className="time-item">
                <span className="label">Trả xe:</span>
                <span className="value">{formatDate(booking.endDate)} {booking.endTime}</span>
              </div>
              <div className="time-item">
                <span className="label">Tổng thời gian:</span>
                <span className="value">{booking.totalDays} ngày</span>
              </div>
            </div>
          </div>
          
          <div className="rental-locations">
            <h3>Địa điểm</h3>
            <div className="location-info">
              <div className="location-item">
                <span className="label">Nhận xe:</span>
                <span className="value">{booking.pickupLocation}</span>
              </div>
              <div className="location-item">
                <span className="label">Trả xe:</span>
                <span className="value">{booking.returnLocation}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Thông tin người thuê */}
        <div className="renter-section">
          <h3>Thông tin người thuê</h3>
          <div className="renter-details">
            <div className="renter-item">
              <span className="label">Họ tên:</span>
              <span className="value">{booking.renter?.full_name}</span>
            </div>
            <div className="renter-item">
              <span className="label">Số điện thoại:</span>
              <span className="value">{booking.renter?.phone_number}</span>
            </div>
            <div className="renter-item">
              <span className="label">Email:</span>
              <span className="value">{booking.renter?.email}</span>
            </div>
          </div>
        </div>

        {/* Thông tin thanh toán */}
        <div className="payment-section">
          <h3>Chi tiết thanh toán</h3>
          <div className="payment-breakdown">
            <div className="payment-row">
              <span className="payment-label">Giá thuê ({booking.totalDays} ngày × {formatCurrency(booking.pricePerDay)})</span>
              <span className="payment-value">{formatCurrency(booking.totalCost)}</span>
            </div>
            <div className="payment-row">
              <span className="payment-label">Phí giao xe</span>
              <span className="payment-value">{formatCurrency(booking.deliveryFee)}</span>
            </div>
          
              <div className="payment-row discount">
                <span className="payment-label">Giảm giá</span>
                <span className="payment-value">-{formatCurrency(booking.discountAmount)}</span>
              </div>
   
       
              <div className="payment-row points">
                <span className="payment-label">Điểm đã sử dụng ({booking.pointsUsed} điểm)</span>
                <span className="payment-value">-{formatCurrency(booking.pointsUsed * 1000)}</span>
              </div>
   
            <div className="payment-row total">
              <span className="payment-label">Tổng cộng</span>
              <span className="payment-value">{formatCurrency(booking.totalAmount)}</span>
            </div>
            <div className="payment-row paid">
              <span className="payment-label">Đã thanh toán</span>
              <span className="payment-value">{formatCurrency(totalPaid)}</span>
            </div>
           
              <div className="payment-row remaining">
                <span className="payment-label">Còn lại</span>
                <span className="payment-value">{formatCurrency(remaining)}</span>
              </div>

          </div>

          {showPaymentButton && (
            <div className="payment-action">
              <button 
                className="payment-button"
                onClick={() => {
                  const isRemaining = booking.status === 'deposit_paid';
                  handlePayOSPayment(nextPaymentAmount, isRemaining);
                }}
                disabled={paymentLoading}
              >
                {paymentLoading ? 'Đang tạo link thanh toán...' : `Thanh toán ${formatCurrency(nextPaymentAmount)}`}
              </button>
            </div>
          )}
        </div>

        {/* Lịch sử giao dịch */}
        <div className="transaction-section">
          <h3>Lịch sử giao dịch</h3>
          {booking.transactions && booking.transactions.length > 0 ? (
            <div className="transaction-list">
              {booking.transactions.map((transaction, index) => (
                <div key={transaction.transaction_id || index} className="transaction-card">
                  <div className="transaction-header">
                    <span className="transaction-type">
                      {transaction.transaction_type === 'DEPOSIT' ? 'Thanh toán cọc' : 
                       transaction.transaction_type === 'RENTAL' ? 'Thanh toán còn lại' : 
                       transaction.transaction_type}
                    </span>
                    <span className="transaction-amount">
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                  <div className="transaction-footer">
                    <span className="transaction-date">
                      {formatDateTime(transaction.created_at)}
                    </span>
                    <span className={`transaction-status ${transaction.status?.toLowerCase()}`}>
                      {transaction.status === 'COMPLETED' ? 'Thành công' : 
                       transaction.status === 'PENDING' ? 'Đang xử lý' : 
                       transaction.status === 'FAILED' ? 'Thất bại' : 
                       transaction.status === 'CANCELLED' ? 'Đã hủy' : transaction.status}
                    </span>
                  </div>
                  {transaction.payment_method && (
                    <div className="transaction-method">
                      <span>Phương thức: {transaction.payment_method}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-transactions">
              <p>Chưa có giao dịch nào</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsPage;