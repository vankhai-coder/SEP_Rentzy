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

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-blue-600">Đang tải...</span>
      </div>
    );

  return (
    <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
          Lịch sử đặt xe
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Theo dõi và quản lý các chuyến đi của bạn
        </p>
      </div>

      {/* Statistics Component */}
      <BookingStatistics statistics={statistics} />

      {/* Filter Component */}
      <BookingHistoryFilter
        statuses={statuses}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      {/* Table Component - Wrapper để đảm bảo scroll hoạt động */}
      <div className="w-full overflow-visible -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6">
        <BookingHistoryTable
          bookings={bookings}
          statusMap={statusMap}
          formatVND={formatVND}
          onBookingUpdate={handleBookingUpdate}
        />
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-sm border p-4 mt-6">
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
      )}
    </div>
  );
};

export default BookingHistory;
