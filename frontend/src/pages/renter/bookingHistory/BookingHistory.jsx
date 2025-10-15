// src/pages/renter/bookingHistory/BookingHistory.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchBookingStatuses,
  fetchBookings,
} from "../../../redux/features/renter/bookingHistory/bookingHistorySlice";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import BookingHistoryFilter from "../../../components/renter/bookingHistory/BookingHistoryFilter"; // Tách component Filter
import BookingHistoryTable from "../../../components/renter/bookingHistory/BookingHistoryTable"; // Tách component Table

const statusMap = {
  // Dịch status sang tiếng Việt
  pending: "Chờ xác nhận",
  deposit_paid: "Đã đặt cọc",
  rental_paid: "Đã thanh toán toàn bộ",
  confirmed: "Đã xác nhận",
  in_progress: "Đang thuê",
  completed: "Hoàn thành",
  cancel_requested: "Yêu cầu hủy",
  canceled: "Đã hủy",
};

const formatVND = (num) => new Intl.NumberFormat("vi-VN").format(num) + " đ";

const formatDate = (dateStr) =>
  format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });

const BookingHistory = () => {
  const dispatch = useDispatch();
  const { statuses, bookings, loading } = useSelector(
    (state) => state.bookingHistory
  );
  const [selectedStatus, setSelectedStatus] = useState("all");
  // const navigate = useNavigate();

  // Fetch statuses on mount
  useEffect(() => {
    dispatch(fetchBookingStatuses());
  }, [dispatch]);

  // Fetch bookings khi selectedStatus thay đổi
  useEffect(() => {
    dispatch(fetchBookings(selectedStatus));
  }, [dispatch, selectedStatus]);

  // Tính đếm cho từng status (client-side từ bookings)
  const getStatusCount = (status) => {
    if (status === "all") return bookings.length;
    return bookings.filter((b) => b.status === status).length;
  };

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        <span className="ml-2 text-teal-600">Đang tải...</span>
      </div>
    );

  return (
    <div className="space-y-8 p-4 md:p-0">
      {" "}
      {/* Thêm padding responsive */}
      {/* Tiêu đề - Modern gradient text */}
      <div className="space-y-3 bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-2xl shadow-lg border border-teal-100/50">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-indigo-600 bg-clip-text text-transparent">
          Lịch sử đặt xe
        </h1>
        <p className="text-gray-600 font-medium">
          Theo dõi hành trình của bạn với giao diện mới mẻ!
        </p>
      </div>
      {/* Filter Component */}
      <BookingHistoryFilter
        statuses={statuses}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        getStatusCount={getStatusCount}
        totalBookings={bookings.length}
      />
      {/* Table Component */}
      <BookingHistoryTable
        bookings={bookings}
        statusMap={statusMap}
        formatVND={formatVND}
        formatDate={formatDate}
      />
    </div>
  );
};

export default BookingHistory;
