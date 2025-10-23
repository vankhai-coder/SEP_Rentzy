import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaUser,
  FaPhone,
  FaCheck,
  FaCar,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaGift,
  FaCoins,
  FaClock,
  FaTag,
  FaStar,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaFileSignature,
} from 'react-icons/fa';
import axiosInstance from '@/config/axiosInstance';

// Utility functions
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatTime = (timeString) => {
  return timeString ? timeString.substring(0, 5) : '';
};

const getStatusText = (status) => {
  const statusMap = {
    pending: 'Chờ xác nhận',
    deposit_paid: 'Đã đặt cọc',
    rental_paid: 'Đã thanh toán toàn bộ',
    confirmed: 'Đã xác nhận',
    in_progress: 'Đang thuê',
    completed: 'Hoàn thành',
    cancel_requested: 'Yêu cầu hủy',
    canceled: 'Đã hủy',
  };
  return statusMap[status] || status;
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

// Sub-components
const LoadingState = () => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-t-indigo-500 border-gray-200 rounded-full animate-spin mb-4"></div>
      <p className="text-white text-lg">Đang tải thông tin đơn hàng...</p>
    </div>
  </div>
);

const ErrorState = ({ error, onBack }) => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
      <FaTimesCircle className="text-red-500 text-5xl mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Có lỗi xảy ra</h2>
      <p className="text-gray-600 mb-6">{error}</p>
      <button
        onClick={onBack}
        className="flex items-center justify-center gap-2 bg-indigo-500 text-white px-6 py-3 rounded-lg hover:bg-indigo-600 transition-all"
      >
        <FaArrowLeft /> Quay lại
      </button>
    </div>
  </div>
);

const NotFoundState = ({ onBack }) => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
      <FaExclamationTriangle className="text-yellow-500 text-5xl mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy đơn hàng</h2>
      <p className="text-gray-600 mb-6">Đơn hàng bạn tìm kiếm không tồn tại hoặc đã bị xóa</p>
      <button
        onClick={onBack}
        className="flex items-center justify-center gap-2 bg-indigo-500 text-white px-6 py-3 rounded-lg hover:bg-indigo-600 transition-all"
      >
        <FaArrowLeft /> Về trang chủ
      </button>
    </div>
  </div>
);

const ProgressSteps = ({ isPaymentCompleted }) => (
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
      <div className={`progress-step ${isPaymentCompleted ? 'completed' : ''}`}>
        <div className={`step-icon ${isPaymentCompleted ? 'active' : 'current'}`}>
          {isPaymentCompleted ? <FaCheck /> : <FaMoneyBillWave />}
        </div>
        <span className="step-text">Thanh toán cọc 30%</span>
      </div>
      <div className="progress-step">
        <div className={`step-icon inactive`}>
          <FaFileSignature />
        </div>
        <span className="step-text">Ký hợp đồng</span>
      </div>
      <div className="progress-step">
        <div className={`step-icon ${isPaymentCompleted ? 'current' : 'inactive'}`}>
          <FaCar />
        </div>
        <span className="step-text">Nhận xe</span>
      </div>
    </div>
  </div>
);

const StatusMessage = ({ isPaymentCompleted, isPaymentFailedOrCanceled, bookingId }) => (
  <section className="py-8 px-4">
    {isPaymentCompleted && (
      <div className="max-w-lg mx-auto bg-green-50 border border-green-500 rounded-lg shadow-md p-6 flex items-center gap-5">
        <FaCheckCircle className="text-green-500 text-4xl" />
        <div>
          <h2 className="text-xl font-bold text-green-500">Thanh toán thành công!</h2>
          <p className="text-gray-700">
            Đơn hàng của bạn đã được xác nhận. Chúng tôi sẽ liên hệ với bạn sớm nhất để xác nhận thời gian nhận xe.
          </p>
          <div className="bg-white p-3 rounded-lg border border-gray-200 mt-3">
            <span className="text-gray-700">
              Mã đơn hàng: <strong className="text-gray-900">{bookingId}</strong>
            </span>
          </div>
        </div>
      </div>
    )}
    {isPaymentFailedOrCanceled && (
      <div className="max-w-lg mx-auto bg-red-50 border border-red-500 rounded-lg shadow-md p-6 flex items-center gap-5">
        <FaTimesCircle className="text-red-500 text-4xl" />
        <div>
          <h2 className="text-xl font-bold text-red-500">Thanh toán thất bại</h2>
          <p className="text-gray-700">
            Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại hoặc liên hệ hỗ trợ.
          </p>
        </div>
      </div>
    )}
  </section>
);

const CustomerInfo = ({ renter }) => (
  <section className="mb-8">
    <h3 className="flex items-center gap-3 text-xl font-bold text-gray-900 mb-5">
      <FaUser className="text-indigo-500" /> Thông tin khách hàng
    </h3>
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-start gap-3">
          <FaUser className="text-indigo-500 text-lg mt-1" />
          <div>
            <span className="block text-sm font-medium text-gray-600">Họ và tên</span>
            <span className="block text-base font-semibold text-gray-900">
              {renter?.full_name || renter?.name || 'Chưa cập nhật'}
            </span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <FaPhone className="text-indigo-500 text-lg mt-1" />
          <div>
            <span className="block text-sm font-medium text-gray-600">Số điện thoại</span>
            <span className="block text-base font-semibold text-gray-900">
              {renter?.phone_number || renter?.phone || 'Chưa cập nhật'}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const VehicleInfo = ({ vehicle }) => (
  <section className="mb-8">
    <h3 className="flex items-center gap-3 text-xl font-bold text-gray-900 mb-5">
      <FaCar className="text-indigo-500" /> Thông tin xe
    </h3>
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col md:flex-row gap-6">
      <div className="flex-shrink-0">
        {vehicle?.main_image_url ? (
          <img
            src={vehicle.main_image_url}
            alt={vehicle.model}
            className="w-32 h-20 object-cover rounded-lg border border-gray-200"
          />
        ) : (
          <div className="w-32 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
            <FaCar className="text-gray-400 text-3xl" />
          </div>
        )}
      </div>
      <div>
        <h4 className="text-lg font-bold text-gray-900 mb-3">{vehicle?.model}</h4>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-gray-600">
            <FaMapMarkerAlt className="text-indigo-500 text-sm" />
            <span>{vehicle?.location}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <FaMoneyBillWave className="text-indigo-500 text-sm" />
            <span>{formatCurrency(vehicle?.price_per_day || 0)}/ngày</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const BookingTime = ({ booking }) => (
  <section className="mb-8">
    <h3 className="flex items-center gap-3 text-xl font-bold text-gray-900 mb-5">
      <FaCalendarAlt className="text-indigo-500" /> Thời gian thuê xe
    </h3>
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-start gap-3">
          <FaCalendarAlt className="text-indigo-500 text-lg mt-1" />
          <div>
            <span className="block text-sm font-medium text-gray-600">Ngày nhận xe</span>
            <span className="block text-base font-semibold text-gray-900">
              {formatDate(booking.startDate)} - {formatTime(booking.startTime)}
            </span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <FaCalendarAlt className="text-indigo-500 text-lg mt-1" />
          <div>
            <span className="block text-sm font-medium text-gray-600">Ngày trả xe</span>
            <span className="block text-base font-semibold text-gray-900">
              {formatDate(booking.endDate)} - {formatTime(booking.endTime)}
            </span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <FaClock className="text-indigo-500 text-lg mt-1" />
          <div>
            <span className="block text-sm font-medium text-gray-600">Tổng thời gian thuê</span>
            <span className="block text-base font-semibold text-gray-900">{booking.totalDays} ngày</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const LocationInfo = ({ booking }) => (
  <section className="mb-8">
    <h3 className="flex items-center gap-3 text-xl font-bold text-gray-900 mb-5">
      <FaMapMarkerAlt className="text-indigo-500" /> Địa điểm
    </h3>
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-start gap-3">
          <FaMapMarkerAlt className="text-indigo-500 text-lg mt-1" />
          <div>
            <span className="block text-sm font-medium text-gray-600">Địa điểm nhận xe</span>
            <span className="block text-base font-semibold text-gray-900">{booking.pickupLocation}</span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <FaMapMarkerAlt className="text-indigo-500 text-lg mt-1" />
          <div>
            <span className="block text-sm font-medium text-gray-600">Địa điểm trả xe</span>
            <span className="block text-base font-semibold text-gray-900">{booking.returnLocation}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const PaymentDetails = ({ booking }) => (
  <section className="mb-8">
    <h3 className="flex items-center gap-3 text-xl font-bold text-gray-900 mb-5">
      <FaMoneyBillWave className="text-indigo-500" /> Chi tiết thanh toán
    </h3>
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="text-gray-700">Giá thuê xe ({booking.totalDays} ngày)</span>
          <span className="font-semibold text-gray-900">{formatCurrency(booking.totalCost)}</span>
        </div>
        {booking.deliveryFee && parseFloat(booking.deliveryFee) > 0 && (
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-gray-700">Phí giao xe</span>
            <span className="font-semibold text-gray-900">+{formatCurrency(booking.deliveryFee)}</span>
          </div>
        )}
        {booking.voucherCode && (
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-green-500 flex items-center gap-2">
              <FaGift /> Mã voucher: {booking.voucherCode}
            </span>
            <span className="font-semibold text-green-500">-{formatCurrency(booking.discountAmount || 0)}</span>
          </div>
        )}
        {booking.pointsUsed && booking.pointsUsed > 0 && (
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-green-500 flex items-center gap-2">
              <FaCoins /> Điểm đã sử dụng ({booking.pointsUsed} điểm)
            </span>
            <span className="font-semibold text-green-500">
              -{formatCurrency(
                parseFloat(booking.totalCost) +
                  parseFloat(booking.deliveryFee || 0) -
                  parseFloat(booking.discountAmount || 0) -
                  parseFloat(booking.totalAmount)
              )}
            </span>
          </div>
        )}
        <div className="h-px bg-gray-200 my-4"></div>
        <div className="flex justify-between items-center py-3">
          <span className="text-lg font-bold text-gray-900">Tổng tiền</span>
          <span className="text-lg font-bold text-indigo-500">{formatCurrency(booking.totalAmount)}</span>
        </div>
      </div>
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Phương thức thanh toán</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-500 rounded-lg p-4">
            <span className="block text-gray-700">Thanh toán trước (30%)</span>
            <span className="block font-semibold text-gray-900">
              {formatCurrency(Math.round(booking.totalAmount * 0.3))}
            </span>
          </div>
          <div className="bg-yellow-50 border border-yellow-500 rounded-lg p-4">
            <span className="block text-gray-700">Thanh toán khi nhận xe (70%)</span>
            <span className="block font-semibold text-gray-900">
              {formatCurrency(booking.totalAmount - Math.round(booking.totalAmount * 0.3))}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const PaymentPolicy = () => (
  <section className="mb-8">
    <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <FaClock className="text-indigo-500" />
        <h4 className="text-lg font-bold text-gray-900">Chính sách thanh toán</h4>
      </div>
      <div className="flex flex-col gap-4">
        {[
          'Thanh toán trước <strong>30%</strong> tổng giá trị để xác nhận đặt xe',
          'Thanh toán <strong>70%</strong> còn lại khi nhận xe',
          'Hỗ trợ thanh toán bằng <strong>tiền mặt</strong> hoặc <strong>chuyển khoản</strong>',
        ].map((text, index) => (
          <div key={index} className="flex items-start gap-3">
            <span className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
              {index + 1}
            </span>
            <span className="text-gray-700" dangerouslySetInnerHTML={{ __html: text }} />
          </div>
        ))}
      </div>
    </div>
  </section>
);

const OrderInfo = ({ booking }) => (
  <section className="mb-8">
    <h3 className="flex items-center gap-3 text-xl font-bold text-gray-900 mb-5">
      <FaTag className="text-indigo-500" /> Thông tin đơn hàng
    </h3>
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-start gap-3">
          <FaTag className="text-indigo-500 text-lg mt-1" />
          <div>
            <span className="block text-sm font-medium text-gray-600">Mã đơn hàng</span>
            <span className="block text-base font-semibold text-gray-900">{booking.booking_id}</span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <FaCalendarAlt className="text-indigo-500 text-lg mt-1" />
          <div>
            <span className="block text-sm font-medium text-gray-600">Ngày tạo</span>
            <span className="block text-base font-semibold text-gray-900">{formatDate(booking.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <FaStar className="text-indigo-500 text-lg mt-1" />
          <div>
            <span className="block text-sm font-medium text-gray-600">Trạng thái</span>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                {
                  pending: 'bg-yellow-50 text-yellow-500',
                  deposit_paid: 'bg-indigo-50 text-indigo-500',
                  confirmed: 'bg-green-50 text-green-500',
                  canceled: 'bg-red-50 text-red-500',
                  in_progress: 'bg-blue-50 text-blue-500',
                  completed: 'bg-green-50 text-green-500',
                  cancel_requested: 'bg-yellow-50 text-yellow-500',
                  rental_paid: 'bg-green-50 text-green-500',
                }[booking.status] || 'bg-gray-50 text-gray-500'
              }`}
            >
              {getStatusText(booking.status)}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

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
        if (!bookingId) throw new Error('No booking ID provided');
        const res = await axiosInstance.get(`/api/renter/booking/${bookingId}`);
        setBooking(res.data.booking);
        const depositTransaction = res.data.booking.transactions?.find(
          (t) => t.type === 'DEPOSIT' && t.paymentMethod === 'MOMO'
        );
        setPaymentStatus(depositTransaction ? depositTransaction.status : 'NO_DEPOSIT_FOUND');
      } catch (err) {
        console.error('Error fetching booking details:', err);
        setError(err.response?.data?.message || 'Failed to fetch booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  const handleBack = () => navigate(-1);
  const handleBackToHome = () => navigate('/');
  const handleConfirm = () => {
    if (booking?.booking_id) {
      navigate(`/payment-deposit/${booking.booking_id}`);
    } else {
      console.error('Booking ID not available for navigation.');
    }
  };

  const isPaymentCompleted = paymentStatus === 'COMPLETED';
  const isPaymentFailedOrCanceled = paymentStatus === 'FAILED' || paymentStatus === 'CANCELED';

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onBack={handleBack} />;
  if (!booking) return <NotFoundState onBack={handleBackToHome} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 font-sans">
      <div className="bg-white min-h-screen w-full flex flex-col">
        <header className="flex items-center gap-4 p-6 bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-indigo-500 font-semibold text-base rounded-lg hover:bg-indigo-50 px-4 py-2 transition-all"
          >
            <FaArrowLeft /> Quay lại
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Xác nhận đơn hàng</h1>
        </header>

        <ProgressSteps isPaymentCompleted={isPaymentCompleted} />
        <StatusMessage
          isPaymentCompleted={isPaymentCompleted}
          isPaymentFailedOrCanceled={isPaymentFailedOrCanceled}
          bookingId={booking.booking_id}
        />
        <div className="p-4 md:p-6 max-w-5xl mx-auto w-full">
          {booking.renter && <CustomerInfo renter={booking.renter} />}
          {booking.vehicle && <VehicleInfo vehicle={booking.vehicle} />}
          <BookingTime booking={booking} />
          <LocationInfo booking={booking} />
          <PaymentDetails booking={booking} />
          <PaymentPolicy />
          <OrderInfo booking={booking} />
        </div>
        <footer className="p-6 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleBackToHome}
            className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 px-8 py-3 rounded-lg hover:bg-gray-50 transition-all"
          >
            <FaArrowLeft /> Quay về trang chủ
          </button>
          {!isPaymentCompleted && !isPaymentFailedOrCanceled && (
            <button
              onClick={handleConfirm}
              className="flex items-center justify-center gap-2 bg-indigo-500 text-white px-8 py-3 rounded-lg hover:bg-indigo-600 transition-all"
            >
              <FaMoneyBillWave /> Thanh toán giữ chỗ
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

export default OrderConfirmation;