// src/components/renter/bookingHistory/BookingHistoryTable.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Star, Eye, Car, X, FileText } from "lucide-react";

import CancelBookingModal from "../bookingCancel/CancelBookingModal";

const BookingHistoryTable = ({ bookings, statusMap, formatVND, onBookingUpdate }) => {
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const s = d.toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    return s.replace(",", "");
  };

  const formatDateWithTime = (dateString, timeString) => {
    if (!dateString) return "";
    const datePart = new Date(dateString).toLocaleDateString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const timePart = typeof timeString === "string" && timeString.length >= 5 ? timeString.slice(0, 5) : "";
    return timePart ? `${datePart} ${timePart}` : formatDateTime(dateString);
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
      case "confirmed":
        return `${base} bg-gradient-to-r from-purple-400 to-purple-500 text-white`;
      case "canceled":
        return `${base} bg-gradient-to-r from-red-400 to-pink-500 text-white`;
      case "in_progress":
        return `${base} bg-gradient-to-r from-blue-400 to-indigo-500 text-white`;
      default:
        return `${base} bg-gradient-to-r from-gray-400 to-gray-500 text-white`;
    }
  };

  return (
    <div className="w-full overflow-visible">
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl ring-1 ring-teal-100/50 overflow-visible">
        <div
          className="booking-table-scroll overflow-x-scroll overflow-y-visible"
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            scrollbarColor: '#14b8a6 #f3f4f6',
            width: '100%',
            position: 'relative',
            display: 'block',
            minHeight: '1px'
          }}
        >
          <style>{`
          .booking-table-scroll {
            -webkit-overflow-scrolling: touch !important;
            overflow-x: auto !important;
            overflow-y: visible !important;
            overscroll-behavior-x: contain;
            will-change: scroll-position;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .booking-table-scroll::-webkit-scrollbar {
            height: 14px !important;
            display: block !important;
            -webkit-appearance: none !important;
            appearance: none !important;
            background: #f3f4f6 !important;
          }
          .booking-table-scroll::-webkit-scrollbar-track {
            background: #e5e7eb !important;
            border-radius: 7px;
            margin: 2px;
          }
          .booking-table-scroll::-webkit-scrollbar-thumb {
            background: #14b8a6 !important;
            border-radius: 7px;
            border: 1px solid #e5e7eb;
          }
          .booking-table-scroll::-webkit-scrollbar-thumb:hover {
            background: #0d9488 !important;
          }
          @media (max-width: 768px) {
            .booking-table-scroll {
              -webkit-overflow-scrolling: touch !important;
              overflow-x: auto !important;
              overflow-y: visible !important;
              touch-action: pan-x pan-y !important;
              overscroll-behavior-x: contain;
              display: block !important;
              width: 100% !important;
              max-width: 100vw !important;
            }
            .booking-table-scroll::-webkit-scrollbar {
              height: 20px !important;
              display: block !important;
              -webkit-appearance: none !important;
              background: #e5e7eb !important;
            }
            .booking-table-scroll::-webkit-scrollbar-thumb {
              background: #14b8a6 !important;
              min-height: 20px;
              border-radius: 10px;
            }
            .booking-table-scroll::-webkit-scrollbar-track {
              background: #d1d5db !important;
              border-radius: 10px;
            }
          }
        `}</style>
          <table className="text-sm whitespace-nowrap" style={{ minWidth: '1400px', width: 'auto' }}>
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
                    className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wide"
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
                  <td className="px-2 sm:px-3 md:px-4 py-3 sm:py-4">
                    <div className="text-xs sm:text-sm font-mono text-gray-900">
                      #{booking.booking_id}
                    </div>
                  </td>

                  {/* Xe */}
                  <td className="px-2 sm:px-3 md:px-4 py-3 sm:py-4">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <h1 className="text-xs sm:text-sm font-medium text-gray-900">
                        {booking.vehicle?.model || "N/A"}
                      </h1>
                    </div>
                  </td>

                  {/* Ngày tạo đơn */}
                  <td className="px-2 sm:px-3 md:px-4 py-3 sm:py-4">
                    <div className="text-xs sm:text-sm text-gray-900">
                      {formatDateTime(booking.created_at)}
                    </div>
                  </td>

                  {/* Ngày nhận */}
                  <td className="px-2 sm:px-3 md:px-4 py-3 sm:py-4">
                    <div className="text-xs sm:text-sm font-medium text-gray-900">
                      {formatDateWithTime(booking.start_date, booking.start_time)}
                    </div>
                  </td>

                  {/* Ngày trả */}
                  <td className="px-2 sm:px-3 md:px-4 py-3 sm:py-4">
                    <div className="text-xs sm:text-sm font-medium text-gray-900">
                      {formatDateWithTime(booking.end_date, booking.end_time)}
                    </div>
                  </td>

                  {/* Tổng tiền */}
                  <td className="px-2 sm:px-3 md:px-4 py-3 sm:py-4">
                    <div className="text-xs sm:text-sm font-medium text-gray-900">
                      {formatVND(booking.total_amount)}
                    </div>
                  </td>

                  {/* Đã thanh toán */}
                  <td className="px-2 sm:px-3 md:px-4 py-3 sm:py-4">
                    <div className="text-xs sm:text-sm font-medium text-green-600">
                      {formatVND(booking.total_paid || 0)}
                    </div>
                  </td>

                  {/* Còn lại */}
                  <td className="px-2 sm:px-3 md:px-4 py-3 sm:py-4">
                    <div className="text-xs sm:text-sm font-medium text-red-600">
                      {formatVND(booking.remaining_amount || 0)}
                    </div>
                  </td>

                  {/* Trạng thái */}
                  <td className="px-2 sm:px-3 md:px-4 py-3 sm:py-4">
                    <span className={`${getStatusBadgeClass(booking.status)} text-xs`}>
                      {statusMap[booking.status] || booking.status}
                    </span>
                  </td>

                  {/* Hành động */}
                  <td className="px-2 sm:px-3 md:px-4 py-3 sm:py-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                      <Link
                        to={`/booking-history/booking-detail/${booking.booking_id}`}
                        className="inline-flex items-center px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        <span className="whitespace-nowrap">Chi tiết</span>
                      </Link>
                      {/* Nút Thanh toán tiền cọc - hiện khi trạng thái là confirmed */}
                      {booking.status === "confirmed" && (
                        <Link
                          to={`/payment-deposit/${booking.booking_id}`}
                          className="inline-flex items-center px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-green-600 hover:text-green-800"
                        >
                          <span className="whitespace-nowrap">Thanh toán tiền cọc</span>
                        </Link>
                      )}

                      {/* Nút Hợp đồng - hiện khi đã đặt cọc, thanh toán toàn bộ hoặc hoàn thành */}
                      {(booking.status === "deposit_paid" || booking.status === "in_progress" || booking.status === "fully_paid" || booking.status === "completed") && (
                        <Link
                          to={`/contract/${booking.booking_id}`}
                          className="inline-flex items-center px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-green-600 hover:text-green-800"
                        >
                          <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="whitespace-nowrap">Hợp đồng</span>
                        </Link>
                      )}

                      {/* Nút hủy booking - chỉ hiện khi có thể hủy */}
                      {(booking.status === "pending" ||
                        booking.status === "confirmed" ||
                        booking.status === "deposit_paid" ||
                        booking.status === "fully_paid") && (
                          <button
                            onClick={() => handleCancelClick(booking.booking_id)}
                            className="inline-flex items-center px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-red-600 hover:text-red-800"
                          >
                            <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            <span className="whitespace-nowrap">Hủy</span>
                          </button>
                        )}

                      {booking.status === "completed" &&
                        booking.review == null && (
                          <Link
                            to={`/booking-review/${booking.booking_id}`}
                            className="inline-flex items-center px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-yellow-600 hover:text-yellow-800"
                          >
                            <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            <span className="whitespace-nowrap">Đánh giá</span>
                          </Link>
                        )}
                      {booking.status === "completed" &&
                        booking.review != null && (
                          <span className="inline-flex items-center px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-yellow-600">
                            Đã đánh giá
                          </span>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
