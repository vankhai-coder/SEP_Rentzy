import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../config/axiosInstance.js';
import { MdNotifications, MdNotificationsActive, MdMarkEmailRead, MdMarkEmailUnread, MdFilterList } from 'react-icons/md';
import { useOwnerTheme } from "@/contexts/OwnerThemeContext";
import { createThemeUtils } from "@/utils/themeUtils";
import { toast } from 'sonner';

const Notifications = () => {
  const theme = useOwnerTheme();
  const themeUtils = createThemeUtils(theme);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [filters, setFilters] = useState({
    is_read: '',
    page: 1,
    limit: 10
  });

  const typeLabels = {
    'system': 'Hệ thống',
    'rental': 'Thuê xe',
    'promotion': 'Khuyến mãi',
    'alert': 'Cảnh báo'
  };

  const typeColors = {
    'system': 'bg-blue-100 text-blue-800',
    'rental': 'bg-green-100 text-green-800',
    'promotion': 'bg-purple-100 text-purple-800',
    'alert': 'bg-red-100 text-red-800'
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/owner/dashboard/notifications', {
        params: filters
      });

      if (response.data.success) {
        setNotifications(response.data.data.notifications);
        setPagination(response.data.data.pagination);
        setUnreadCount(response.data.data.unreadCount);
      }
    } catch (error) {
      setError('Không thể tải thông báo');
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filters]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await axiosInstance.patch(`/api/owner/dashboard/notifications/${notificationId}/read`);

      if (response.data.success) {
        // Update the notification in the list but DO NOT remove from view
        setNotifications(prev => prev.map(n => (
          n.notification_id === notificationId ? { ...n, is_read: true } : n
        )));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Có lỗi xảy ra khi đánh dấu thông báo');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await axiosInstance.patch('/api/owner/dashboard/notifications/mark-all-read');

      if (response.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        // Refresh lại danh sách để đảm bảo dữ liệu đồng bộ
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi đánh dấu tất cả thông báo';
      toast.error(errorMessage);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  };

  // Extract booking_id từ notification content và title
  const extractBookingId = (content, title = '') => {
    // Tìm pattern trong cả content và title: "đơn thuê #123" hoặc "đơn #123" hoặc "booking #123"
    const searchText = `${title} ${content}`;
    
    // Các patterns ưu tiên từ cụ thể đến tổng quát
    const patterns = [
      /cho đơn thuê #(\d+)/i,
      /cho đơn #(\d+)/i,
      /cho booking #(\d+)/i,
      /đơn thuê #(\d+)/i,
      /đơn #(\d+)/i,
      /booking #(\d+)/i,
      // Pattern tổng quát hơn - tìm số sau dấu # (nhưng tránh số quá lớn)
      /#(\d+)/i,
    ];
    
    for (const pattern of patterns) {
      const matches = searchText.matchAll(new RegExp(pattern.source, 'gi'));
      for (const match of matches) {
        const id = parseInt(match[1]);
        // Đảm bảo là số hợp lệ (booking_id thường > 0 và < 1000000)
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
    const titleLower = title?.toLowerCase() || '';
    const contentLower = content?.toLowerCase() || '';

    // Tìm booking_id trong cả title và content
    const bookingId = extractBookingId(content, title);

    // Thông báo về phạt nguội (ưu tiên cao nhất) - bao gồm cả yêu cầu xóa phạt nguội và yêu cầu duyệt
    if (
      titleLower.includes('phạt nguội') ||
      titleLower.includes('traffic fine') ||
      titleLower.includes('yêu cầu xóa') ||
      titleLower.includes('yêu cầu phạt') ||
      titleLower.includes('yêu cầu đã được duyệt') ||
      titleLower.includes('xóa phạt') ||
      contentLower.includes('phạt nguội') ||
      contentLower.includes('traffic fine')
    ) {
      // Luôn điều hướng đến booking detail nếu có booking_id
      if (bookingId) {
        return `/owner/booking-management/detail/${bookingId}`;
      }
      // Nếu có từ khóa về phạt nguội nhưng không có booking_id, vẫn điều hướng đến booking management
      return '/owner/booking-management';
    }

    // Thông báo về booking (hủy, hết hạn, xác nhận, v.v.)
    if (
      titleLower.includes('booking') ||
      titleLower.includes('đơn') ||
      titleLower.includes('đặt xe') ||
      titleLower.includes('thuê xe') ||
      titleLower.includes('hủy') ||
      titleLower.includes('hết hạn') ||
      titleLower.includes('xác nhận') ||
      titleLower.includes('chấp nhận') ||
      type === 'rental' ||
      contentLower.includes('đơn thuê') ||
      contentLower.includes('booking') ||
      contentLower.includes('đặt xe')
    ) {
      if (bookingId) {
        return `/owner/booking-management/detail/${bookingId}`;
      }
      // Nếu không tìm thấy booking_id, điều hướng đến danh sách booking
      return '/owner/booking-management';
    }

    // Thông báo về yêu cầu duyệt phạt nguội
    if (
      titleLower.includes('yêu cầu duyệt') ||
      titleLower.includes('duyệt phạt')
    ) {
      if (bookingId) {
        return `/owner/booking-management/detail/${bookingId}`;
      }
      // Điều hướng đến trang booking management nếu không có booking_id
      return '/owner/booking-management';
    }

    // Thông báo về thanh toán
    if (
      titleLower.includes('thanh toán') ||
      titleLower.includes('payment')
    ) {
      if (bookingId) {
        return `/owner/booking-management/detail/${bookingId}`;
      }
      return '/owner/transaction-management';
    }

    // Thông báo về transaction/revenue
    if (
      titleLower.includes('giao dịch') ||
      titleLower.includes('transaction') ||
      contentLower.includes('giao dịch')
    ) {
      return '/owner/transaction-management';
    }

    // Thông báo về revenue
    if (
      titleLower.includes('doanh thu') ||
      titleLower.includes('revenue')
    ) {
      return '/owner/revenue';
    }

    // Mặc định: điều hướng đến booking management nếu có booking_id
    if (bookingId) {
      return `/owner/booking-management/detail/${bookingId}`;
    }

    // Nếu là thông báo hệ thống/alert nhưng không có booking_id, điều hướng đến booking management
    if (type === 'alert' || type === 'system') {
      return '/owner/booking-management';
    }

    // Mặc định: điều hướng đến booking management thay vì ở lại trang notifications
    return '/owner/booking-management';
  };

  // Xử lý khi click vào thông báo
  const handleNotificationClick = (notification, e) => {
    // Nếu click vào button "Đánh dấu đã đọc", chỉ đánh dấu không điều hướng
    if (e && (e.target.closest('button') || e.target.tagName === 'BUTTON')) {
      return;
    }

    // Ngăn event bubbling và default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Đánh dấu đã đọc nếu chưa đọc (không chờ async)
    if (!notification.is_read) {
      handleMarkAsRead(notification.notification_id).catch(error => {
        console.error('Error marking notification as read:', error);
      });
    }

    // Xác định route điều hướng và điều hướng ngay lập tức
    const route = getNotificationRoute(notification);
    
    // Luôn điều hướng (route luôn có giá trị vì đã có fallback)
    navigate(route || '/owner/booking-management');
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-2xl font-bold mb-2 ${themeUtils.textPrimary}`}>Thông báo</h1>
            <p className={themeUtils.textSecondary}>Quản lý và theo dõi các thông báo từ hệ thống</p>
          </div>
          
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <MdNotifications className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng thông báo</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pagination.totalItems || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <MdNotificationsActive className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Chưa đọc</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{unreadCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <MdMarkEmailRead className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Đã đọc</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(pagination.totalItems || 0) - unreadCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <MdFilterList className="text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bộ lọc:</span>
          </div>
          
          <select
            value={filters.is_read}
            onChange={(e) => handleFilterChange('is_read', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả</option>
            <option value="false">Chưa đọc</option>
            <option value="true">Đã đọc</option>
          </select>

          <select
            value={filters.limit}
            onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={5}>5 thông báo/trang</option>
            <option value={10}>10 thông báo/trang</option>
            <option value={20}>20 thông báo/trang</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-secondary-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Danh sách thông báo</h3>
        </div>

        {error && (
          <div className="px-6 py-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <MdNotifications className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Không có thông báo nào</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Chưa có thông báo nào trong hệ thống.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-secondary-700">
            {notifications.map((notification) => (
              <div 
                key={notification.notification_id} 
                className={`p-6 hover:bg-gray-50 dark:hover:bg-secondary-700 cursor-pointer transition-colors ${
                  !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400' : ''
                }`}
                onClick={(e) => handleNotificationClick(notification, e)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className={`text-sm font-medium ${
                        !notification.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {notification.title}
                      </h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        typeColors[notification.type] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        {typeLabels[notification.type] || notification.type}
                      </span>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                      )}
                    </div>
                    
                    <p
                      className={`text-sm mb-3 ${
                        !notification.is_read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-600 dark:text-gray-400'
                      }`}
                      style={{ whiteSpace: 'pre-line' }}
                    >
                      {notification.content}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(notification.created_at)}
                      </div>
                      
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.notification_id);
                          }}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          title="Chỉ đánh dấu đã đọc, không điều hướng"
                        >
                          <MdMarkEmailRead className="h-3 w-3 mr-1" />
                          Đánh dấu đã đọc
                        </button>
                      )}
                      
                      {notification.is_read && (
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
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
                Hiển thị {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} đến{' '}
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} của{' '}
                {pagination.totalItems} kết quả
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
                  disabled={pagination.currentPage <= 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Trước
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handleFilterChange('page', page)}
                    className={`px-3 py-1 text-sm border rounded-md ${
                      page === pagination.currentPage
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
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
    </div>
  );
};

export default Notifications;
