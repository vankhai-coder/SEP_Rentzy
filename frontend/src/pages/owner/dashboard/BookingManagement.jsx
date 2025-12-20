import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../config/axiosInstance.js";
import { useOwnerTheme } from "@/contexts/OwnerThemeContext";
import { createThemeUtils } from "@/utils/themeUtils";
import {
  MdCalendarToday,
  MdPerson,
  MdDirectionsCar,
  MdSearch,
  MdFilterList,
} from "react-icons/md";
import { DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { setMessageUserDetails } from "@/redux/features/admin/messageSlice.js";

const BookingManagement = () => {
  const navigate = useNavigate();
  const theme = useOwnerTheme();
  const themeUtils = createThemeUtils(theme);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    status: "",
    page: 1,
    limit: 10,
    sortBy: "created_at",
    sortOrder: "DESC",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const dispatch = useDispatch();

  const statusLabels = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận đặt xe",
    deposit_paid: "Đã đặt cọc",
    fully_paid: "Đã thanh toán",
    in_progress: "Đang thuê",
    canceled: "Đã hủy",
    completed: "Hoàn thành",
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    deposit_paid: "bg-blue-100 text-blue-800",
    fully_paid: "bg-green-100 text-green-800",
    confirmed: "bg-purple-100 text-purple-800",
    in_progress: "bg-indigo-100 text-indigo-800",
    completed: "bg-green-100 text-green-800",
    canceled: "bg-gray-100 text-gray-800",
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        "/api/owner/dashboard/bookings",
        {
          params: filters,
        }
      );

      if (response.data.success) {
        setBookings(response.data.data.bookings);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      setError("Không thể tải danh sách đơn thuê");
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== "page" ? 1 : value, // Reset to page 1 when changing filters
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    });
  };

  const formatDateTime = (dateString, timeString) => {
    // Dùng phần ngày (YYYY-MM-DD) từ dateString
    const dateOnly = dateString.split("T")[0];
    const combined = new Date(`${dateOnly}T${timeString}`);
    return combined.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleRowClick = (bookingId) => {
    navigate(`/owner/booking-management/detail/${bookingId}`);
  };

  const approveBooking = async (bookingId) => {
    try {
      const isConfirmed = window.confirm(
        "Bạn có chắc chắn muốn duyệt đơn này?"
      );
      if (!isConfirmed) return;
      setActionLoading(true);
      const res = await axiosInstance.patch(
        `/api/owner/dashboard/bookings/${bookingId}/accept`
      );
      if (res?.data?.success) {
        await fetchBookings();
      } else {
        toast.error(res?.data?.message || "Không thể duyệt đơn. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Error approving booking:", err);
      toast.error("Có lỗi xảy ra khi duyệt đơn.");
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (bookingId) => {
    setSelectedBookingId(bookingId);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const submitReject = async () => {
    if (!selectedBookingId) return;
    try {
      if (!rejectReason.trim()) {
        const proceed = window.confirm(
          "Bạn chưa nhập lý do. Bạn có muốn tiếp tục từ chối mà không có lý do?"
        );
        if (!proceed) return;
      }
      setActionLoading(true);
      const res = await axiosInstance.patch(
        `/api/owner/dashboard/bookings/${selectedBookingId}/reject`,
        { reason: rejectReason.trim() }
      );
      if (res?.data?.success) {
        setShowRejectModal(false);
        setSelectedBookingId(null);
        setRejectReason("");
        await fetchBookings();
      } else {
        toast.error(res?.data?.message || "Không thể từ chối đơn. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Error rejecting booking:", err);
      toast.error("Có lỗi xảy ra khi từ chối đơn.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`p-4 lg:p-6 min-h-screen ${themeUtils.bgMain}`}>
      <div className="mb-6">
        <h1 className={`text-2xl font-bold mb-2 ${themeUtils.textPrimary}`}>
          Quản lý đơn thuê
        </h1>
        <p className={themeUtils.textSecondary}>
          Theo dõi và quản lý các đơn thuê xe của bạn
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <MdFilterList className="text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bộ lọc:</span>
          </div>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange("sortBy", e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="created_at">Ngày tạo</option>
            <option value="start_date">Ngày bắt đầu</option>
            <option value="total_amount">Tổng tiền</option>
          </select>

          <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="DESC">Mới nhất</option>
            <option value="ASC">Cũ nhất</option>
          </select>

          <select
            value={filters.limit}
            onChange={(e) =>
              handleFilterChange("limit", parseInt(e.target.value))
            }
            className="px-3 py-2 border border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={5}>5 đơn/trang</option>
            <option value={10}>10 đơn/trang</option>
            <option value={20}>20 đơn/trang</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <MdCalendarToday className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng đơn</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {pagination.totalItems || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Đơn hoàn thành
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {bookings.filter((b) => b.status === "completed").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <MdPerson className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Đang chờ</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {bookings.filter((b) => b.status === "pending").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <MdDirectionsCar className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Đang thuê</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {bookings.filter((b) => b.status === "in_progress").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-secondary-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Danh sách đơn thuê
          </h3>
        </div>

        {error && (
          <div className="px-6 py-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <MdCalendarToday className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Không có đơn thuê nào
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Chưa có đơn thuê nào được tạo.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-secondary-700">
              <thead className="bg-gray-50 dark:bg-secondary-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Mã đơn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Xe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Thao tác
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nhắn
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-secondary-800 divide-y divide-gray-200 dark:divide-secondary-700">
                {bookings.map((booking) => (
                  <tr key={booking.booking_id} className="hover:bg-gray-50 dark:hover:bg-secondary-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          #{booking.booking_id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {booking.renter?.full_name || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {booking.renter?.email || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {booking.vehicle?.model || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {booking.vehicle?.license_plate || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDateTime(booking.start_date, booking.start_time)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDateTime(booking.end_date, booking.end_time)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(booking.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(booking.total_amount)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {booking.total_days} ngày
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[booking.status] ||
                          "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                          }`}
                      >
                        {statusLabels[booking.status] || booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(booking.booking_id);
                        }}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                      >
                        Chi tiết
                      </button>
                      {booking.status === "pending" && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              approveBooking(booking.booking_id);
                            }}
                            className="ml-2 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 disabled:opacity-50"
                            disabled={actionLoading}
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openRejectModal(booking.booking_id);
                            }}
                            className="ml-2 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                      {(booking.status === "deposit_paid" ||
                        booking.status === "fully_paid" ||
                        booking.status === "completed") && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/owner/contract/${booking.booking_id}`);
                            }}
                            className="ml-2 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                          >
                            Hợp đồng
                          </button>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        className="text-gray-600 hover:text-green-500 hidden lg:block cursor-pointer transition-colors"
                        title="Messages"
                        onClick={

                          () => {
                            // dispatch to redux store :
                            dispatch(setMessageUserDetails({
                              userFullNameOrEmail: booking.renter?.full_name || booking.renter?.email,
                              userIdToChatWith: booking.renter?.user_id,
                              userImageURL: booking.renter?.avatar_url
                            }));
                            navigate('/messages');
                          }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị{" "}
                {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} đến{" "}
                {Math.min(
                  pagination.currentPage * pagination.itemsPerPage,
                  pagination.totalItems
                )}{" "}
                của {pagination.totalItems} kết quả
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    handleFilterChange("page", pagination.currentPage - 1)
                  }
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
                    onClick={() => handleFilterChange("page", page)}
                    className={`px-3 py-1 text-sm border rounded-md ${page === pagination.currentPage
                      ? "bg-blue-500 text-white border-blue-500"
                      : "border-gray-300 hover:bg-gray-50"
                      }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() =>
                    handleFilterChange("page", pagination.currentPage + 1)
                  }
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
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true">
          <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Từ chối đơn đặt xe</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Vui lòng nhập lý do (tuỳ chọn) cho việc từ chối đơn.</p>
            <textarea
              className="w-full p-3 border border-gray-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
              rows={4}
              placeholder="Nhập lý do từ chối..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                  setSelectedBookingId(null);
                }}
                className="px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-secondary-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={submitReject}
                disabled={actionLoading}
                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;
