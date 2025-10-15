// src/components/renter/bookingHistory/BookingHistoryTable.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Star, Eye, FileText, Car } from "lucide-react";

const BookingHistoryTable = ({
  bookings,
  statusMap,
  formatVND,
  formatDate,
}) => {
  if (bookings.length === 0) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-3xl shadow-2xl border border-teal-200/50">
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

          <tbody className="divide-y divide-teal-100/50">
            {bookings.map((booking, i) => {
              const isCompleted = booking.status === "completed";
              const hasReview = booking.hasReview;

              return (
                <tr
                  key={booking.booking_id}
                  className={`transition-all duration-300 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 hover:shadow-inner ${
                    i % 2 === 0 ? "bg-white/50" : "bg-teal-50/30"
                  }`}
                >
                  <td className="px-6 py-4 font-bold text-teal-700">
                    #{booking.booking_id}
                  </td>

                  {/* Cột Xe - Thêm icon */}
                  <td className="px-6 py-4 whitespace-nowrap max-w-[250px] truncate flex items-center">
                    <Car className="h-4 w-4 text-cyan-500 mr-2" />
                    {booking.vehicle}
                  </td>

                  <td className="px-6 py-4 text-gray-700 font-medium">
                    {formatDate(booking.start_date)}
                  </td>
                  <td className="px-6 py-4 text-gray-700 font-medium">
                    {formatDate(booking.end_date)}
                  </td>
                  <td className="px-6 py-4 font-bold text-indigo-600">
                    {formatVND(booking.total_amount)}
                  </td>
                  <td className="px-6 py-4 text-teal-600">
                    {formatVND(booking.total_paid)}
                  </td>
                  <td className="px-6 py-4 font-bold text-green-600">
                    {formatVND(booking.remaining)}
                  </td>

                  {/* Cột trạng thái - Gradient badges */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2 items-start">
                      {isCompleted ? (
                        hasReview ? (
                          <span className="inline-flex items-center px-3 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg">
                            Hoàn thành & Đã đánh giá
                          </span>
                        ) : (
                          <Link
                            to={`/booking-review/${booking.booking_id}`}
                            className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 rounded-full shadow-lg transition-all duration-300 hover:scale-105"
                          >
                            <Star className="mr-1 h-3.5 w-3.5" />
                            Đánh giá ngay
                          </Link>
                        )
                      ) : (
                        <span className={getStatusBadgeClass(booking.status)}>
                          {statusMap[booking.status] || booking.status}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Cột hành động - Compact row layout, responsive stack on mobile */}
                  <td className="px-6 py-3">
                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                      <Link
                        to={`/booking-detail/${booking.booking_id}`}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold rounded-lg text-white bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105 min-w-[80px]"
                      >
                        <Eye className="mr-1 h-3 w-3 flex-shrink-0" />
                        Chi tiết
                      </Link>

                      <Link
                        to={`/contract/${booking.booking_id}`}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold rounded-lg text-teal-700 bg-white/90 border border-teal-300 hover:bg-teal-50 hover:border-teal-500 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105 min-w-[80px]"
                      >
                        <FileText className="mr-1 h-3 w-3 flex-shrink-0" />
                        Hợp đồng
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookingHistoryTable;
