// src/components/renter/bookingHistory/BookingHistoryFilter.jsx
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateFilters } from "../../../redux/features/renter/bookingHistory/bookingHistorySlice";
import { ChevronDown, Filter } from "lucide-react";

// Map status codes to display names
const statusMap = {
  all: "Tất cả trang thái",
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận đặt xe",
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
    <div 
      className="bg-white rounded-lg shadow-sm border p-1.5 sm:p-3 md:p-4 w-full max-w-full box-border overflow-x-hidden"
      style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', margin: '0 auto' }}
    >
      <div 
        className="flex flex-col sm:flex-row sm:flex-wrap gap-1.5 sm:gap-3 md:gap-4 items-stretch sm:items-center w-full justify-start sm:justify-start"
        style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
      >
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0" style={{ boxSizing: 'border-box' }}>
          <Filter className="text-gray-500 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="text-[10px] sm:text-sm font-medium text-gray-700 whitespace-nowrap">Bộ lọc:</span>
        </div>
        
        {/* Status Filter */}
        <div 
          className="relative flex-1 sm:flex-initial w-full sm:w-auto min-w-0"
          style={{ minWidth: 0, maxWidth: '100%', boxSizing: 'border-box', flex: '1 1 0%' }}
        >
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full sm:w-auto px-1.5 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md text-[10px] sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-6 sm:pr-8 sm:min-w-[140px] md:min-w-[160px] max-w-full box-border"
            style={{ maxWidth: '100%', boxSizing: 'border-box', width: '100%' }}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {statusMap[status] || status}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Date Filter */}
        <div 
          className="relative flex-1 sm:flex-initial w-full sm:w-auto min-w-0"
          style={{ minWidth: 0, maxWidth: '100%', boxSizing: 'border-box', flex: '1 1 0%' }}
        >
          <select
            value={filters?.dateFilter || "all"}
            onChange={(e) => handleFilterChange("dateFilter", e.target.value)}
            className="w-full sm:w-auto px-1.5 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md text-[10px] sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-6 sm:pr-8 sm:min-w-[120px] md:min-w-[140px] max-w-full box-border"
            style={{ maxWidth: '100%', boxSizing: 'border-box', width: '100%' }}
          >
            <option value="all">Ngày tạo</option>
            <option value="today">Hôm nay</option>
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
            <option value="year">Năm này</option>
          </select>
          <ChevronDown className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Sort Order */}
        <div 
          className="relative flex-1 sm:flex-initial w-full sm:w-auto min-w-0"
          style={{ minWidth: 0, maxWidth: '100%', boxSizing: 'border-box', flex: '1 1 0%' }}
        >
          <select
            value={filters?.sortOrder || "desc"}
            onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
            className="w-full sm:w-auto px-1.5 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md text-[10px] sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-6 sm:pr-8 sm:min-w-[100px] md:min-w-[120px] max-w-full box-border"
            style={{ maxWidth: '100%', boxSizing: 'border-box', width: '100%' }}
          >
            <option value="desc">Mới nhất</option>
            <option value="asc">Cũ nhất</option>
          </select>
          <ChevronDown className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default BookingHistoryFilter;
