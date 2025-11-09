import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../../config/axiosInstance.js";
import ImageUploadViewer from "../../../components/common/ImageUploadViewer.jsx";
import {
  MdArrowBack,
  MdCalendarToday,
  MdPerson,
  MdDirectionsCar,
  MdLocationOn,
  MdAttachMoney,
} from "react-icons/md";

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBookingDetail();
  }, [id]);

  const fetchBookingDetail = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/api/owner/dashboard/bookings/detail/${id}`
      );
      console.log("dữ liệu detail booking", response.data);
      if (response.data.success) {
        setBooking(response.data.data);
      } else {
        setError("Không thể tải thông tin đơn thuê");
      }
    } catch (error) {
      console.error("Error fetching booking detail:", error);
      setError("Có lỗi xảy ra khi tải thông tin đơn thuê");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDateTime = (date, time) => {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString("vi-VN");
    return `${formattedDate} ${time}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "canceled":
        return "text-red-600 bg-red-100";
      case "deposit_paid":
        return "text-blue-600 bg-blue-100";
      case "fully_paid":
        return "text-blue-600 bg-blue-100";
      case "in_progress":
        return "text-blue-600 bg-blue-100";
      case "completed":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "deposit_paid":
        return "Đã thanh toán đặt cọc";
      case "fully_paid":
        return "Đã thanh toán toàn bộ";
      case "in_progress":
        return "Đang thuê";
      case "cancel_requested":
        return "Yêu cầu huỷ";
      case "canceled":
        return "Đã hủy";
      case "completed":
        return "Hoàn thành";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <button
          onClick={() => navigate("/owner/booking-management")}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500 text-xl">
          Không tìm thấy thông tin đơn thuê
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/owner/booking-management")}
            className="flex border border-gray-600 px-4 py-2 rounded items-center text-black-600 hover:text-gray-800 mb-4"
          >
            <MdArrowBack className="mr-2" />
            Quay lại danh sách đơn thuê
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Chi tiết đơn thuê #{booking.booking_id}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Booking Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MdCalendarToday className="mr-2 text-blue-600" />
                Thông tin đơn thuê
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã đơn:</span>
                  <span className="font-medium">#{booking.booking_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày bắt đầu:</span>
                  <span className="font-medium">
                    {formatDateTime(booking.start_date, booking.start_time)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày kết thúc:</span>
                  <span className="font-medium">
                    {formatDateTime(booking.end_date, booking.end_time)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Số ngày thuê:</span>
                  <span className="font-medium">{booking.total_days} ngày</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Địa điểm nhận xe:</span>
                  <span className="font-medium text-sm">
                    {booking.pickup_location}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Địa điểm trả xe:</span>
                  <span className="font-medium text-sm">
                    {booking.return_location}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trạng thái:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      booking.status
                    )}`}
                  >
                    {getStatusText(booking.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MdAttachMoney className="mr-2 text-green-600" />
                Thông tin thanh toán
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Chi phí thuê xe:</span>
                  <span className="font-medium">
                    {formatCurrency(booking.total_cost)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Giảm giá:</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(booking.discount_amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phí giao xe:</span>
                  <span className="font-medium">
                    {formatCurrency(booking.delivery_fee)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Điểm sử dụng:</span>
                  <span className="font-medium">
                    {booking.points_used} điểm
                  </span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between">
                  <span className="text-gray-600 font-semibold">
                    Tổng thanh toán:
                  </span>
                  <span className="font-bold text-green-600 text-lg">
                    {formatCurrency(booking.total_amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Đã thanh toán:</span>
                  <span className="font-medium text-blue-600">
                    {formatCurrency(booking.total_paid)}
                  </span>
                </div>
                {booking.voucher_code && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã voucher:</span>
                    <span className="font-medium">{booking.voucher_code}</span>
                  </div>
                )}
              </div>
            </div>
            {/* Booking Timeline */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Thời gian tạo đơn
              </h2>

              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Ngày tạo</p>
                  <p className="font-medium">
                    {new Date(booking.created_at).toLocaleDateString("vi-VN")}{" "}
                    {new Date(booking.created_at).toLocaleTimeString("vi-VN")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cập nhật lần cuối</p>
                  <p className="font-medium">
                    {new Date(booking.updated_at).toLocaleDateString("vi-VN")}{" "}
                    {new Date(booking.updated_at).toLocaleTimeString("vi-VN")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Vehicle Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MdDirectionsCar className="mr-2 text-blue-600" />
                Thông tin xe
              </h2>

              <div className="space-y-4">
                <div>
                  <img
                    src={booking.vehicle.main_image_url}
                    alt={booking.vehicle.model}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Model</p>
                    <p className="font-medium">{booking.vehicle.model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Biển số</p>
                    <p className="font-medium">
                      {booking.vehicle.license_plate}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Giá thuê/ngày</p>
                    <p className="font-medium text-green-600">
                      {formatCurrency(booking.vehicle.price_per_day)}
                    </p>
                  </div>
                  <div className="flex items-start">
                    <MdLocationOn className="mr-2 text-gray-600 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Vị trí xe</p>
                      <p className="text-sm">{booking.vehicle.location}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Renter Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MdPerson className="mr-2 text-blue-600" />
                Thông tin người thuê
              </h2>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Họ tên</p>
                  <p className="font-medium">{booking.renter.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{booking.renter.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Số điện thoại</p>
                  <p className="font-medium">{booking.renter.phone_number}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quản lý hình ảnh xe */}
        <div className="mt-8 space-y-8">
          {(booking.status === "fully_paid" ||
            booking.status === "in_progress" ||
            booking.status === "completed") && (
            <>
              <div className="flex items-center mb-4">
                <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                  1
                </span>
                <h2 className="text-xl font-semibold text-gray-900">
                  Hình ảnh xe trước khi bàn giao
                </h2>
              </div>
              <ImageUploadViewer
                bookingId={booking.booking_id}
                imageType="pre-rental"
                minImages={5}
                onUploadSuccess={fetchBookingDetail}
                userRole="owner"
                onConfirmSuccess={fetchBookingDetail}
                handoverData={booking.handover || {}}
              />
            </>
          )}

          {(booking.status === "fully_paid" ||
            booking.status === "in_progress" ||
            booking.status === "completed") &&
            booking.handover?.renter_handover_confirmed === true && (
              <>
                <div className="flex items-center mb-4">
                  <span className="bg-red-100 text-red-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                    2
                  </span>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Hình ảnh khi nhận xe trả lại
                  </h2>
                </div>
                <ImageUploadViewer
                  bookingId={booking.booking_id}
                  imageType="post-rental"
                  minImages={5}
                  onUploadSuccess={fetchBookingDetail}
                  userRole="owner"
                  handoverData={booking.handover || {}}
                />
              </>
            )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;
