// src/components/renter/bookingHistory/BookingHistoryFilter.jsx
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateFilters } from "../../../redux/features/renter/bookingHistory/bookingHistorySlice";
import { ChevronDown, Filter } from "lucide-react";

// Map status codes to display names
const statusMap = {
  all: "Tất cả trang thái",
  pending: "Chờ xác nhận",
  deposit_paid: "Đã đặt cọc",
  fully_paid: "Đã thanh toán toàn bộ",
  in_progress: "Đang thuê",
  completed: "Hoàn thành",
  cancel_requested: "Yêu cầu hủy",
  canceled: "Đã hủy",
};

const BookingHistoryFilter = ({
  statuses,
  selectedStatus,
  onStatusChange,
}) => {
  const dispatch = useDispatch();
  const { filters } = useSelector((state) => state.bookingHistory);

  const handleFilterChange = (key, value) => {
    dispatch(updateFilters({ [key]: value }));
  };
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="text-gray-500 h-4 w-4" />
          <span className="text-sm font-medium text-gray-700">Bộ lọc:</span>
        </div>
        
        {/* Status Filter */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8 min-w-[160px]"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {statusMap[status] || status}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Date Filter */}
        <div className="relative">
          <select
            value={filters?.dateFilter || "all"}
            onChange={(e) => handleFilterChange("dateFilter", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8 min-w-[120px]"
          >
            <option value="all">Ngày tạo</option>
            <option value="today">Hôm nay</option>
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
            <option value="year">Năm này</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Sort Order */}
        <div className="relative">
          <select
            value={filters?.sortOrder || "desc"}
            onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8 min-w-[100px]"
          >
            <option value="desc">Mới nhất</option>
            <option value="asc">Cũ nhất</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>


      </div>
    </div>
  );
};

export default BookingHistoryFilter;
