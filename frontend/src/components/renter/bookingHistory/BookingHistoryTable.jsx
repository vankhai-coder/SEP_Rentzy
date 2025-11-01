// src/components/renter/bookingHistory/BookingHistoryTable.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Star, Eye, Car, X, FileText } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import CancelBookingModal from "../bookingCancel/CancelBookingModal";

const BookingHistoryTable = ({ bookings, statusMap, formatVND, onBookingUpdate }) => {
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  const formatDateTime = (dateString) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: vi });
  };

  const handleCancelClick = (bookingId) => {
    setSelectedBookingId(bookingId);
    setCancelModalOpen(true);
  };

  const handleCancelSuccess = () => {
    setCancelModalOpen(false);
    setSelectedBookingId(null);
    if (onBookingUpdate) {
      onBookingUpdate(); // Refresh danh sách booking
    }
  };
  if (bookings.length === 0) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-12 shadow-2xl border border-teal-200/50">
        <div className="text-teal-400 mb-6 p-4 bg-white/20 rounded-2xl inline-block">
          <Car className="mx-auto h-16 w-16 animate-bounce" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Chưa có chuyến đi nào?
        </h3>
        <p className="text-gray-500 mb-6">
          Bắt đầu hành trình với chiếc xe mơ ước ngay hôm nay!
        </p>
        <Link
          to="/vehicles" // Giả sử route đến trang xe
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
        >
          <Star className="mr-2 h-4 w-4" />
          Khám phá xe
        </Link>
      </div>
    );
  }

  const getStatusBadgeClass = (status) => {
    const base =
      "inline-flex items-center px-3 py-2 rounded-full text-xs font-bold shadow-lg transform transition-all duration-200 hover:scale-105";
    switch (status) {
      case "completed":
        return `${base} bg-gradient-to-r from-green-400 to-emerald-500 text-white`;
      case "pending":
        return `${base} bg-gradient-to-r from-yellow-400 to-orange-500 text-white`;
      case "canceled":
        return `${base} bg-gradient-to-r from-red-400 to-pink-500 text-white`;
      case "in_progress":
        return `${base} bg-gradient-to-r from-blue-400 to-indigo-500 text-white`;
      default:
        return `${base} bg-gradient-to-r from-gray-400 to-gray-500 text-white`;
    }
  };

  return (
    <div className="overflow-hidden bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl ring-1 ring-teal-100/50">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm whitespace-nowrap">
          <thead className="bg-gradient-to-r from-teal-500 via-cyan-500 to-indigo-600 text-white">
            <tr>
              {[
                "Mã đơn",
                "Xe",
                "Ngày tạo đơn",
                "Ngày nhận",
                "Ngày trả",
                "Tổng tiền",
                "Đã thanh toán",
                "Còn lại",
                "Trạng thái",
                "Hành động",
              ].map((title) => (
                <th
                  key={title}
                  className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide transform rotate-1"
                >
                  {title}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr key={booking.booking_id} className="hover:bg-gray-50">
                {/* Mã đơn */}
                <td className="px-4 py-4">
                  <div className="text-sm font-mono text-gray-900">
                    #{booking.booking_id}
                  </div>
                </td>

                {/* Xe */}
                <td className="px-4 py-4">
                  <div className="flex items-center space-x-3">
                    <h1 className="font-medium text-gray-900">
                      {booking.vehicle?.model || "N/A"}
                    </h1>
                  </div>
                </td>

                {/* Ngày tạo đơn */}
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-900">
                    {formatDateTime(booking.created_at)}
                  </div>
                </td>

                {/* Ngày nhận */}
                <td className="px-4 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {formatDateTime(booking.start_date)}
                  </div>
                </td>

                {/* Ngày trả */}
                <td className="px-4 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {formatDateTime(booking.end_date)}
                  </div>
                </td>

                {/* Tổng tiền */}
                <td className="px-4 py-4">
                  <div className="font-medium text-gray-900">
                    {formatVND(booking.total_amount)}
                  </div>
                </td>

                {/* Đã thanh toán */}
                <td className="px-4 py-4">
                  <div className="text-sm font-medium text-green-600">
                    {formatVND(booking.total_paid || 0)}
                  </div>
                </td>

                {/* Còn lại */}
                <td className="px-4 py-4">
                  <div className="text-sm font-medium text-red-600">
                    {formatVND(booking.remaining_amount || 0)}
                  </div>
                </td>

                {/* Trạng thái */}
                <td className="px-4 py-4">
                  <span className={getStatusBadgeClass(booking.status)}>
                    {statusMap[booking.status] || booking.status}
                  </span>
                </td>

                {/* Hành động */}
                <td className="px-4 py-4">
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/booking-history/booking-detail/${booking.booking_id}`}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Chi tiết
                    </Link>
                    
                    {/* Nút xem hợp đồng - chỉ hiện khi đã thanh toán đầy đủ hoặc hoàn thành */}
                    {(booking.status === "fully_paid" || booking.status === "completed") && (
                      <Link
                        to={`/contract/${booking.booking_id}`}
                        className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-600 hover:text-green-800"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Hợp đồng
                      </Link>
                    )}
                    
                    {/* Nút hủy booking - chỉ hiện khi có thể hủy */}
                    {(booking.status === "pending" || 
                      booking.status === "confirmed" || 
                      booking.status === "deposit_paid" || 
                      booking.status === "fully_paid") && (
                      <button
                        onClick={() => handleCancelClick(booking.booking_id)}
                        className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Hủy
                      </button>
                    )}
                    
                    {booking.status === "completed" &&
                      booking.review == null && (
                        <Link
                          to={`/booking-review/${booking.booking_id}`}
                          className="inline-flex items-center px-3 py-1 text-sm font-medium text-yellow-600 hover:text-yellow-800"
                        >
                          <Star className="w-4 h-4 mr-1" />
                          Đánh giá
                        </Link>
                      )}
                    {booking.status === "completed" &&
                      booking.review != null && (
                        <h3 className="inline-flex items-center px-3 py-1 text-sm font-medium text-yellow-600 hover:text-yellow-800">
                          Đánh giá đã gửi
                        </h3>
                      )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Modal hủy booking */}
      <CancelBookingModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        bookingId={selectedBookingId}
        onCancelSuccess={handleCancelSuccess}
      />
    </div>
  );
};

export default BookingHistoryTable;
