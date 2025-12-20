import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../config/axiosInstance.js";
import {
  MdNotifications,
  MdNotificationsActive,
  MdMarkEmailRead,
  MdFilterList,
} from "react-icons/md";
import Pagination from "@/components/common/Pagination.jsx";
import { toast } from "sonner";

const RenterNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [filters, setFilters] = useState({ is_read: "", page: 1, limit: 10 });
  const [hasRealtimeNew, setHasRealtimeNew] = useState(false);

  const typeLabels = {
    system: "Hệ thống",
    rental: "Thuê xe",
    promotion: "Khuyến mãi",
    alert: "Cảnh báo",
    payout: "Thanh toán",
  };

  const typeColors = {
    system: "bg-blue-100 text-blue-800",
    rental: "bg-green-100 text-green-800",
    promotion: "bg-purple-100 text-purple-800",
    alert: "bg-red-100 text-red-800",
    payout: "bg-orange-100 text-orange-800",
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/renter/notifications", {
        params: filters,
      });
      if (response.data.success) {
        setNotifications(response.data.data.notifications);
        setPagination(response.data.data.pagination);
        setUnreadCount(response.data.data.unreadCount);
        setHasRealtimeNew(false);
      }
    } catch (err) {
      setError("Không thể tải thông báo");
      console.error("Error fetching renter notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filters]);

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || "";
    if (!base) return;
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${protocol}://${window.location.host}/ws`;

    let ws;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg && msg.type === "NOTIFICATIONS_UNREAD_COUNT") {
            const next =
              msg.data && typeof msg.data.unreadCount === "number"
                ? msg.data.unreadCount
                : 0;
            setUnreadCount(next);
            setHasRealtimeNew(next > 0);
          }
        } catch (err) {
          console.error("WebSocket message parsing error:", err);
        }
      };
      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
      };
    } catch (err) {
      console.error("WebSocket connection error:", err);
    }
    return () => {
      // eslint-disable-next-line no-unused-vars
      try {
        if (ws) ws.close();
      } catch (err) {
        console.error("WebSocket close error:", err);
        /* ignore close errors */
      }
    };
  }, []);

  const handleRealtimeRefresh = () => {
    setHasRealtimeNew(false);
    fetchNotifications();
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await axiosInstance.patch(
        `/api/renter/notifications/${notificationId}/read`
      );
      if (response.data.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.notification_id === notificationId ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
      toast.error("Có lỗi xảy ra khi đánh dấu thông báo");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await axiosInstance.patch(
        "/api/renter/notifications/mark-all-read"
      );
      if (response.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
        toast.success("Đã đánh dấu tất cả thông báo là đã đọc");
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      toast.error("Có lỗi xảy ra khi đánh dấu tất cả thông báo");
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== "page" ? 1 : value,
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    if (diffInMinutes < 1) return "Vừa xong";
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    if (diffInMinutes < 10080)
      return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  // Extract booking_id từ notification content và title
  const extractBookingId = (content, title = "") => {
    const searchText = `${title} ${content}`;
    const patterns = [
      /đơn thuê #(\d+)/i,
      /đơn #(\d+)/i,
      /booking #(\d+)/i,
      /cho đơn thuê #(\d+)/i,
      /cho đơn #(\d+)/i,
      /cho booking #(\d+)/i,
      /#(\d+)/i,
    ];
    for (const pattern of patterns) {
      const match = searchText.match(pattern);
      if (match) {
        const id = parseInt(match[1]);
        if (id && id > 0 && id < 1000000) {
          return String(id);
        }
      }
    }
    return null;
  };

  // Xác định route điều hướng dựa trên loại thông báo
  const getNotificationRoute = (notification) => {
    const { title, content, type } = notification;
    const titleLower = title?.toLowerCase() || "";
    const contentLower = content?.toLowerCase() || "";

    // Tìm booking_id trong cả title và content
    const bookingId = extractBookingId(content, title);

    // Thông báo về phạt nguội
    if (
      titleLower.includes("phạt nguội") ||
      titleLower.includes("traffic fine") ||
      contentLower.includes("phạt nguội") ||
      contentLower.includes("traffic fine")
    ) {
      if (bookingId) {
        return `/booking-history/booking-detail/${bookingId}`;
      }
      return "/booking-history";
    }

    // Thông báo về booking (hủy, hết hạn, xác nhận, v.v.)
    if (
      titleLower.includes("booking") ||
      titleLower.includes("đơn") ||
      titleLower.includes("đặt xe") ||
      titleLower.includes("thuê xe") ||
      titleLower.includes("hủy") ||
      titleLower.includes("hết hạn") ||
      titleLower.includes("xác nhận") ||
      titleLower.includes("chấp nhận") ||
      type === "rental" ||
      contentLower.includes("đơn thuê") ||
      contentLower.includes("booking") ||
      contentLower.includes("đặt xe")
    ) {
      if (bookingId) {
        return `/booking-history/booking-detail/${bookingId}`;
      }
      return "/booking-history";
    }

    // Thông báo về thanh toán
    if (
      titleLower.includes("thanh toán") ||
      titleLower.includes("payment") ||
      type === "payout"
    ) {
      if (bookingId) {
        return `/booking-history/booking-detail/${bookingId}`;
      }
      return "/transaction-history";
    }

    // Thông báo về transaction
    if (
      titleLower.includes("giao dịch") ||
      titleLower.includes("transaction") ||
      contentLower.includes("giao dịch")
    ) {
      return "/transaction-history";
    }

    // Thông báo về điểm thưởng
    if (
      titleLower.includes("điểm") ||
      titleLower.includes("points") ||
      contentLower.includes("điểm")
    ) {
      return "/points";
    }

    // Mặc định: điều hướng đến booking history nếu có booking_id
    if (bookingId) {
      return `/booking-history/booking-detail/${bookingId}`;
    }

    // Nếu là thông báo hệ thống/alert, điều hướng đến booking history
    if (type === "alert" || type === "system") {
      return "/booking-history";
    }

    // Mặc định: điều hướng đến booking history
    return "/booking-history";
  };

  // Xử lý khi click vào thông báo
  const handleNotificationClick = (notification, e) => {
    // Nếu click vào button "Đánh dấu đã đọc", chỉ đánh dấu không điều hướng
    if (e && (e.target.closest("button") || e.target.tagName === "BUTTON")) {
      return;
    }

    // Ngăn event bubbling và default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Đánh dấu đã đọc nếu chưa đọc (không chờ async)
    if (!notification.is_read) {
      handleMarkAsRead(notification.notification_id).catch((error) => {
        console.error("Error marking notification as read:", error);
      });
    }

    // Xác định route điều hướng và điều hướng ngay lập tức
    const route = getNotificationRoute(notification);

    // Luôn điều hướng (route luôn có giá trị vì đã có fallback)
    navigate(route || "/booking-history");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Thông báo</h1>
            <p className="text-gray-600">
              Hiển thị và quản lý thông báo của bạn
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasRealtimeNew && (
              <button
                onClick={handleRealtimeRefresh}
                className="inline-flex items-center justify-center px-3 py-2 rounded-full bg-red-600 text-white text-sm font-semibold shadow hover:bg-red-700 transition sm:px-4"
              >
                <MdNotificationsActive className="h-4 w-4 mr-2" />
                Có thông báo mới
              </button>
            )}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <MdMarkEmailRead className="h-4 w-4 mr-2" />
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MdNotifications className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">
                Tổng thông báo
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {pagination.totalItems || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <MdNotificationsActive className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Chưa đọc</p>
              <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <MdMarkEmailRead className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Đã đọc</p>
              <p className="text-2xl font-bold text-gray-900">
                {(pagination.totalItems || 0) - unreadCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <MdFilterList className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Bộ lọc:</span>
          </div>
          <select
            value={filters.is_read}
            onChange={(e) => handleFilterChange("is_read", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả</option>
            <option value="false">Chưa đọc</option>
            <option value="true">Đã đọc</option>
          </select>
          <select
            value={filters.limit}
            onChange={(e) =>
              handleFilterChange("limit", parseInt(e.target.value))
            }
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={5}>5 thông báo/trang</option>
            <option value={10}>10 thông báo/trang</option>
            <option value={20}>20 thông báo/trang</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Danh sách thông báo
          </h3>
        </div>

        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <MdNotifications className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Không có thông báo nào
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Chưa có thông báo nào trong hệ thống.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div
                key={notification.notification_id}
                className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.is_read
                  ? "bg-blue-50 border-l-4 border-blue-500"
                  : ""
                  }`}
                onClick={(e) => handleNotificationClick(notification, e)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4
                        className={`text-sm font-medium ${!notification.is_read
                          ? "text-gray-900"
                          : "text-gray-700"
                          }`}
                      >
                        {notification.title}
                      </h4>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${typeColors[notification.type] ||
                          "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {typeLabels[notification.type] || notification.type}
                      </span>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <p
                      className={`text-sm mb-3 ${!notification.is_read
                        ? "text-gray-700"
                        : "text-gray-600"
                        }`}
                    >
                      {notification.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {formatDate(notification.created_at)}
                      </div>
                      {!notification.is_read ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.notification_id);
                          }}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <MdMarkEmailRead className="h-3 w-3 mr-1" />
                          Đánh dấu đã đọc
                        </button>
                      ) : (
                        <div className="flex items-center text-xs text-gray-500">
                          <MdMarkEmailRead className="h-3 w-3 mr-1" />
                          Đã đọc
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={(p) => handleFilterChange("page", p)}
              />
            </div>
          </div>
        )}
      </div>
      {hasRealtimeNew && (
        <button
          onClick={handleRealtimeRefresh}
          className="fixed bottom-5 right-5 sm:hidden w-12 h-12 rounded-full bg-red-600 text-white shadow-lg flex items-center justify-center animate-pulse"
          aria-label="Có thông báo mới"
        >
          <MdNotificationsActive className="h-6 w-6" />
        </button>
      )}
    </div>
  );
};

export default RenterNotifications;
