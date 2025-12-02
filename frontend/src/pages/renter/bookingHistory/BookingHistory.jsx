// src/pages/renter/bookingHistory/BookingHistory.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchBookingStatuses,
  fetchBookings,
} from "../../../redux/features/renter/bookingHistory/bookingHistorySlice";
import BookingHistoryFilter from "../../../components/renter/bookingHistory/BookingHistoryFilter"; // Tách component Filter
import BookingHistoryTable from "../../../components/renter/bookingHistory/BookingHistoryTable"; // Tách component Table
import BookingStatistics from "../../../components/renter/bookingHistory/BookingStatistics"; // Component thống kê mới

const statusMap = {
  // Dịch status sang tiếng Việt
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận đặt xe",
  deposit_paid: "Đã đặt cọc",
  fully_paid: "Đã thanh toán toàn bộ",
  in_progress: "Đang thuê",
  completed: "Hoàn thành",
  cancel_requested: "Yêu cầu hủy",
  canceled: "Đã hủy",
};

const formatVND = (num) => new Intl.NumberFormat("vi-VN").format(num) + " đ";

const BookingHistory = () => {
  const dispatch = useDispatch();
  const { statuses, bookings, statistics, pagination, filters, loading } =
    useSelector((state) => state.bookingHistory);
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Fetch statuses on mount
  useEffect(() => {
    dispatch(fetchBookingStatuses());
  }, [dispatch]);

  // Memoize fetch parameters to prevent unnecessary re-renders
  const fetchParams = useMemo(
    () => ({
      status: selectedStatus,
      sortBy: filters?.sortBy || "created_at",
      sortOrder: filters?.sortOrder || "DESC",
      dateFilter: filters?.dateFilter || "all",
      limit: filters?.limit || 10,
      page: 1, // Always start from page 1 when filters change
    }),
    [
      selectedStatus,
      filters?.sortBy,
      filters?.sortOrder,
      filters?.dateFilter,
      filters?.limit,
    ]
  );

  // Fetch bookings when memoized parameters change
  useEffect(() => {
    dispatch(fetchBookings(fetchParams));
  }, [dispatch, fetchParams]);

  // Handle page changes
  const handlePageChange = (page) => {
    const fetchParams = {
      status: selectedStatus,
      ...filters,
      page: page,
    };
    dispatch(fetchBookings(fetchParams));
  };

  // Handle booking update (refresh data)
  const handleBookingUpdate = () => {
    dispatch(fetchBookings(fetchParams));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      {/* Div 1: Container riêng cho phần trên (Title, Statistics, Filter) - không bị ảnh hưởng bởi table */}
      <div 
        className="w-full box-border mx-auto px-1 sm:px-4 md:px-6" 
        style={{ 
          width: '100%', 
          maxWidth: '100%', 
          boxSizing: 'border-box',
          margin: '0 auto',
          overflowX: 'hidden'
        }}
      >
        <div className="mb-2 sm:mb-4 md:mb-6 w-full max-w-full box-border">
          <h1 className="text-base sm:text-xl md:text-2xl font-bold text-gray-800 mb-0.5 sm:mb-2">
            Lịch sử đặt xe
          </h1>
          <p className="text-[10px] sm:text-sm md:text-base text-gray-600">
            Theo dõi và quản lý các chuyến đi của bạn
          </p>
        </div>

        {/* Statistics Component */}
        <div className="w-full max-w-full mb-2 sm:mb-3 md:mb-4 lg:mb-6 box-border overflow-x-hidden">
          <BookingStatistics statistics={statistics} />
        </div>

        {/* Filter Component */}
        <div className="w-full max-w-full box-border overflow-x-hidden mb-4 sm:mb-6">
          <BookingHistoryFilter
            statuses={statuses}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
          />
        </div>
      </div>

      {/* Div 2: Container riêng cho phần bảng - có overflow-x-auto riêng */}
      <div 
        className="w-full box-border mx-auto px-2 sm:px-4 md:px-6" 
        style={{ 
          width: '100%', 
          maxWidth: '100%', 
          boxSizing: 'border-box',
          margin: '0 auto',
          overflowX: 'auto'
        }}
      >
        <div 
          className="w-full overflow-x-auto box-border" 
          style={{ 
            width: '100%', 
            maxWidth: '100%', 
            boxSizing: 'border-box'
          }}
        >
          <BookingHistoryTable
            bookings={bookings}
            statusMap={statusMap}
            formatVND={formatVND}
            onBookingUpdate={handleBookingUpdate}
          />
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="w-full max-w-full box-border mt-4 sm:mt-6">
            <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
              <div className="flex items-center justify-center">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage <= 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Trước
                  </button>
                  {Array.from(
                    { length: pagination.totalPages },
                    (_, i) => i + 1
                  ).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 text-sm border rounded-md ${
                        page === pagination.currentPage
                          ? "bg-blue-500 text-white border-blue-500"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage >= pagination.totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default BookingHistory;
