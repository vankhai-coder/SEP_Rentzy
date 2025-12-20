import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../config/axiosInstance.js';
import { Link } from 'react-router-dom';

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Parse booking_id từ notification content
  const extractBookingId = (content) => {
    const match = content.match(/đơn thuê #(\d+)/);
    return match ? match[1] : null;
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/renter/notifications', {
        params: { limit: 5, page: 1 }
      });
      if (response.data.success) {
        setNotifications(response.data.data.notifications || []);
        setUnreadCount(response.data.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate button position for mobile
  useEffect(() => {
    const updateButtonPosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setButtonPosition({
          top: rect.bottom + window.scrollY,
          right: window.innerWidth - rect.right
        });
      }
    };

    if (isOpen) {
      updateButtonPosition();
      window.addEventListener('resize', updateButtonPosition);
      window.addEventListener('scroll', updateButtonPosition);
    }

    return () => {
      window.removeEventListener('resize', updateButtonPosition);
      window.removeEventListener('scroll', updateButtonPosition);
    };
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        buttonRef.current && 
        !buttonRef.current.contains(event.target) &&
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await axiosInstance.patch(`/api/renter/notifications/${notificationId}/read`);
      if (response.data.success) {
        setNotifications(prev =>
          prev.map(n =>
            n.notification_id === notificationId ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
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

  const getTypeIcon = (type) => {
    switch (type) {
      case 'rental':
        return '🚗';
      case 'promotion':
        return '🎁';
      case 'alert':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const dropdownContent = (
    <>
      {/* Backdrop - chỉ hiện trên mobile */}
      {isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Dropdown - Fixed on mobile, absolute on desktop */}
      <div 
        ref={dropdownRef}
        className={`${isMobile ? 'fixed top-[60px] right-2 left-2' : 'absolute top-full right-0 mt-2'} ${isMobile ? 'w-[calc(100vw-1rem)]' : 'w-80 md:w-96'} bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[calc(100vh-100px)] sm:max-h-[500px] overflow-hidden flex flex-col`}
      >
            {/* Header */}
            <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="text-xs text-gray-500 whitespace-nowrap">({unreadCount} mới)</span>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-3 sm:px-4 py-6 sm:py-8 text-center">
                  <Bell className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-2" />
                  <p className="text-xs sm:text-sm text-gray-500">Không có thông báo nào</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => {
                    const isTrafficFine = notification.title === "Phí phạt nguội";
                    const bookingId = isTrafficFine ? extractBookingId(notification.content) : null;
                    
                    const handleClick = async (e) => {
                      e.preventDefault();
                      setIsOpen(false);
                      
                      // Đánh dấu đã đọc nếu chưa đọc
                      if (!notification.is_read) {
                        try {
                          await axiosInstance.patch(`/api/renter/notifications/${notification.notification_id}/read`);
                          setNotifications(prev =>
                            prev.map(n =>
                              n.notification_id === notification.notification_id ? { ...n, is_read: true } : n
                            )
                          );
                          setUnreadCount(prev => Math.max(0, prev - 1));
                        } catch (err) {
                          console.error('Error marking notification as read:', err);
                        }
                      }
                      
                      if (isTrafficFine && bookingId) {
                        // Navigate đến booking detail
                        navigate(`/booking-history/booking-detail/${bookingId}`);
                      } else {
                        // Navigate đến trang notifications
                        navigate('/notifications');
                      }
                    };

                    return (
                      <div
                        key={notification.notification_id}
                        onClick={handleClick}
                        className={`block px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                          !notification.is_read ? 'bg-blue-50/50' : ''
                        }`}
                      >
                      <div className="flex items-start gap-2 sm:gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                              <h4 className={`text-xs sm:text-sm font-semibold break-words ${
                                !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </h4>
                              {!notification.is_read && (
                                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-gray-900 whitespace-nowrap flex-shrink-0">
                                  Mới
                                </span>
                              )}
                            </div>
                          </div>
                          <p className={`text-xs sm:text-sm mb-2 leading-relaxed break-words ${
                            !notification.is_read ? 'text-gray-700' : 'text-gray-600'
                          }`}>
                            {notification.content}
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {formatDate(notification.created_at)}
                            </span>
                            {!notification.is_read && (
                              <span className="flex-shrink-0 w-2 h-2 bg-gray-900 rounded-full"></span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-t border-gray-200 bg-gray-50">
                <Link
                  to="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="block text-center text-xs sm:text-sm font-medium text-gray-900 hover:text-gray-700"
                >
                  Xem tất cả thông báo
                </Link>
              </div>
            )}
          </div>
    </>
  );

  return (
    <div className="relative" ref={buttonRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            fetchNotifications();
          }
        }}
        className="relative p-2 text-gray-600 hover:text-green-500 transition-colors cursor-pointer"
        aria-label="Thông báo"
        title="Thông báo"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Render dropdown: Portal on mobile, inline on desktop */}
      {isOpen && (
        typeof window !== 'undefined' && isMobile
          ? createPortal(dropdownContent, document.body)
          : dropdownContent
      )}
    </div>
  );
};

export default NotificationDropdown;

