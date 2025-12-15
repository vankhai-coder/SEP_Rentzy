import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axiosInstance from '../../../../config/axiosInstance';

export const useBookingAutoCancel = (booking) => {
  const navigate = useNavigate();

  // Hàm tự động hủy booking
  const handleAutoCancel = useCallback(async () => {
    if (!booking || booking.status !== 'pending') {
      console.log('⚠️ Booking không ở trạng thái pending, bỏ qua auto-cancel');
      return false;
    }

    console.log('🔄 Bắt đầu auto-cancel booking:', booking.booking_id);

    try {
      const response = await axiosInstance.delete(
        `/api/renter/booking/${booking.booking_id}`
      );

      if (response.data.success) {
        console.log('✅ Auto-cancel thành công');
        
        // Hiển thị thông báo
        toast.error('Booking đã bị hủy tự động do quá thời gian thanh toán!', {
          position: 'top-center',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        // Chuyển hướng về trang chủ hoặc trang booking history
        setTimeout(() => {
          navigate('/booking-history', { 
            replace: true,
            state: { 
              message: 'Booking đã bị hủy tự động do quá thời gian thanh toán',
              type: 'auto-cancel'
            }
          });
        }, 2000);

        return true;
      } else {
        console.error(' Auto-cancel thất bại:', response.data.message);
        toast.error('Có lỗi khi hủy booking tự động');
        return false;
      }
    } catch (error) {
      console.error(' Lỗi khi auto-cancel booking:', error);
      
      // Kiểm tra nếu booking đã bị hủy rồi
      if (error.response?.status === 404 || error.response?.status === 400) {
        console.log('ℹ️ Booking có thể đã bị hủy hoặc không tồn tại');
        toast.info('Booking đã được xử lý');
        
        setTimeout(() => {
          navigate('/booking-history', { replace: true });
        }, 1000);
        
        return true;
      }
      
      toast.error('Có lỗi khi hủy booking tự động');
      return false;
    }
  }, [booking, navigate]);

  // Kiểm tra xem booking có thể bị auto-cancel không
  const canAutoCancel = useCallback(() => {
    if (!booking) return false;
    
    // Chỉ auto-cancel booking ở trạng thái pending
    return booking.status === 'pending';
  }, [booking]);

  // Tính toán thời gian đã trôi qua từ khi tạo booking
  const getElapsedTime = useCallback(() => {
    if (!booking?.updated_at) return 0;
    
    const now = new Date().getTime();
    const updated = new Date(booking.updated_at).getTime();
    return now - updated;
  }, [booking]);

  // Kiểm tra xem có nên hiển thị countdown timer không
  const shouldShowCountdown = useCallback(() => {
    const canCancel = canAutoCancel();
    const elapsed = getElapsedTime();
    const shouldShow = canCancel && elapsed < (15 * 60 * 1000); // 15 phút
    
    // Debug log
    console.log('🔍 shouldShowCountdown check:', {
      booking: booking ? {
        id: booking.booking_id,
        status: booking.status,
        updated_at: booking.updated_at
      } : null,
      canCancel,
      elapsed: Math.floor(elapsed / 1000) + 's',
      shouldShow
    });
    
    return shouldShow;
  }, [canAutoCancel, getElapsedTime, booking]);

  return {
    handleAutoCancel,
    canAutoCancel,
    shouldShowCountdown,
    getElapsedTime,
  };
};