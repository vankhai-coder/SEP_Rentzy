// src/components/renter/bookingHistory/BookingHistoryFilter.jsx
import React from "react";
import { ChevronDown, Filter } from "lucide-react";

// Map status codes to display names
const statusMap = {
  all: "Tất cả",
  pending: "Đang chờ",
  confirmed: "Đã xác nhận",
  cancelled: "Đã hủy",
  completed: "Hoàn thành",
  // Add other status mappings as needed
};

const BookingHistoryFilter = ({
  statuses,
  selectedStatus,
  onStatusChange,
  getStatusCount,
  totalBookings,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-teal-200/30">
      {/* Dropdown Filter - Styled như button với icon */}
      <div className="relative w-full sm:w-auto">
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full sm:w-[280px] px-4 py-3 text-sm font-semibold bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all duration-300 hover:shadow-md hover:scale-[1.02] appearance-none cursor-pointer"
        >
          {statuses.map((status) => (
            <option key={status} value={status} className="bg-white">
              {status === "all" ? (
                <span>
                  <Filter className="inline h-4 w-4 mr-2" />
                  Tất cả ({getStatusCount(status)} đơn)
                </span>
              ) : (
                `${statusMap[status] || status} (${getStatusCount(status)} đơn)`
              )}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-500 pointer-events-none" />
      </div>

      {/* Tổng số - Glow effect */}
      <p className="text-sm font-bold text-teal-600 bg-teal-100 px-3 py-1 rounded-full shadow-md">
        Tổng: {totalBookings} chuyến phiêu lưu
      </p>
    </div>
  );
};

export default BookingHistoryFilter;
