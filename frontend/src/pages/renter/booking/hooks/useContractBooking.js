import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../config/axiosInstance';

export const useContractBooking = (bookingId) => {
  const [booking, setBooking] = useState(null);
  const [owner, setOwner] = useState(null);
  const [renter, setRenter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch booking data
  const fetchBooking = useCallback(async (showLoading = true) => {
    if (!bookingId) {
      setError('ID booking không hợp lệ');
      setLoading(false);
      return;
    }

    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      setError(null);

      console.log('🔄 Fetching booking data for ID:', bookingId);
      
      const response = await axiosInstance.get(`/api/renter/booking/${bookingId}`);
      
      // Chuẩn hóa payload từ response
      const bookingData = response?.data?.booking || response?.data?.data;

      if (response?.data?.success && bookingData) {
        setBooking(bookingData);
        
        // Extract owner and renter data từ booking (dùng optional chaining để an toàn)
        setOwner(bookingData?.vehicle?.owner || null);
        setRenter(bookingData?.renter || null);
        
        console.log('✅ Booking data loaded successfully:', bookingData);
        console.log('✅ Owner data:', bookingData?.vehicle?.owner);
        console.log('✅ Renter data:', bookingData?.renter);
        return bookingData;
      } else {
        const errorMessage = response?.data?.message || 'Không thể tải thông tin booking';
        setError(errorMessage);
        console.error('❌ Failed to load booking:', errorMessage);
        return null;
      }
    } catch (err) {
      console.error('❌ Error fetching booking:', err);
      
      let errorMessage = 'Có lỗi xảy ra khi tải thông tin booking';
      
      if (err.response) {
        // Server responded with error status
        if (err.response.status === 404) {
          errorMessage = 'Không tìm thấy booking';
        } else if (err.response.status === 403) {
          errorMessage = 'Bạn không có quyền xem booking này';
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.request) {
        // Network error
        errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bookingId]);

  // Refresh booking data
  const refreshBooking = useCallback(() => {
    return fetchBooking(false);
  }, [fetchBooking]);

  // Cancel booking
  const cancelBooking = useCallback(async () => {
    if (!booking) {
      toast.error('Không có thông tin booking để hủy');
      return false;
    }

    if (booking.status !== 'pending') {
      toast.error('Chỉ có thể hủy booking ở trạng thái chờ thanh toán');
      return false;
    }

    try {
      console.log('🔄 Canceling booking:', booking.booking_id);
      
      const response = await axiosInstance.delete(
        `/api/renter/booking/${booking.booking_id}`
      );

      if (response.data.success) {
        console.log('✅ Booking canceled successfully');
        toast.success('Hủy booking thành công!');
        
        // Update local state
        setBooking(prev => ({
          ...prev,
          status: 'cancelled'
        }));
        
        return true;
      } else {
        const errorMessage = response.data.message || 'Không thể hủy booking';
        console.error('❌ Failed to cancel booking:', errorMessage);
        toast.error(errorMessage);
        return false;
      }
    } catch (err) {
      console.error('❌ Error canceling booking:', err);
      
      let errorMessage = 'Có lỗi xảy ra khi hủy booking';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.request) {
        errorMessage = 'Lỗi kết nối mạng';
      }
      
      toast.error(errorMessage);
      return false;
    }
  }, [booking]);

  // Load booking data on mount
  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  // Utility functions
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const formatCurrency = useCallback((amount) => {
    if (!amount && amount !== 0) return '0 ₫';
    
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }, []);

  const calculateDuration = useCallback((startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, []);

  const getStatusText = useCallback((status) => {
    const statusMap = {
      'pending': 'Chờ thanh toán',
      'confirmed': 'Đã xác nhận',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy',
      'cancel_requested': 'Yêu cầu hủy'
    };
    
    return statusMap[status] || status;
  }, []);

  const canCancel = useCallback(() => {
    return booking && booking.status === 'pending';
  }, [booking]);

  return {
    // Data
    booking,
    owner,
    renter,
    loading,
    error,
    refreshing,
    
    // Actions
    refreshBooking,
    cancelBooking,
    
    // Utils
    formatDate,
    formatCurrency,
    calculateDuration,
    getStatusText,
    canCancel,
  };
};