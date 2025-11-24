import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../../../config/axiosInstance";
import { toast } from "react-toastify";

/**
 * usePaymentLogic Hook
 * 
 * CHỨC NĂNG CHÍNH:
 * - Quản lý state và logic cho quy trình thanh toán booking
 * - Xử lý countdown timer cho thời gian giữ chỗ
 * - Cung cấp các hàm API call cho payment và cancel
 * - Tự động xác định step hiện tại dựa trên booking status
 * 
 * LUỒNG XỬ LÝ:
 * 1. fetchBooking() → load data từ API
 * 2. useEffect theo dõi booking.status → set step tương ứng
 * 3. useEffect quản lý countdown timer cho step 1
 * 4. Cung cấp các hàm xử lý payment/cancel cho component
 * 
 * BOOKING STATUS MAPPING:
 * - pending → step 1 (thanh toán cọc + countdown 10 phút)
 * - deposit_paid → step 2 (ký hợp đồng)
 * - contract_signed → step 3 (hoàn tất)
 * - confirmed/in_progress/fully_paid/completed → step 4 (đã hoàn thành)
 * - canceled/refunded/rejected → step 0 (đã hủy)
 */
export const usePaymentLogic = (bookingId) => {
  // ==================== STATE MANAGEMENT ====================
  
  // Booking data từ API
  const [booking, setBooking] = useState(null);
  
  // Loading states
  const [loading, setLoading] = useState(true); // Loading khi fetch booking
  const [isPaying, setIsPaying] = useState(false); // Loading khi xử lý payment/cancel
  
  // Error handling
  const [error, setError] = useState(null);
  
  // Countdown timer cho thời gian giữ chỗ (step 1)
  const [countdown, setCountdown] = useState(0); // Số giây còn lại
  const [isTimeUp, setIsTimeUp] = useState(false); // True khi hết thời gian
  
  // Payment step hiện tại (1-4)
  const [step, setStep] = useState(1);

  // ==================== API FUNCTIONS ====================
  
  /**
   * Fetch booking data từ API
   * 
   * LUỒNG XỬ LÝ:
   * 1. Set loading = true
   * 2. Call API GET /api/renter/booking/:id
   * 3. Update booking state với data từ API
   * 4. Clear error và set loading = false
   * 5. Nếu có lỗi: set error message
   * 
   * useCallback để tránh infinite loop trong useEffect
   */
  const fetchBooking = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/renter/booking/${bookingId}`);
      
      // Debug logs để theo dõi data từ API
      console.log("📊 Full API response:", res.data);
      const apiBooking = res.data?.data || res.data?.booking;
      console.log("📋 Booking data:", apiBooking);
      console.log("🔍 Booking status:", apiBooking?.status);
      console.log("⏰ Booking created_at:", apiBooking?.created_at);
      
      setBooking(apiBooking);
      setError(null);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Không thể tải thông tin đơn hàng";
      setError(errorMessage);
      console.error("❌ Fetch booking error:", err);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  /**
   * Xử lý thanh toán đặt cọc qua PayOS
   * 
   * LUỒNG XỬ LÝ:
   * 1. Set isPaying = true (hiển thị loading)
   * 2. Call API POST /api/payment/payos/link với booking data
   * 3. Redirect user đến PayOS payment page
   * 4. Set returnUrl = contract page, cancelUrl = current page với tham số cancel
   * 5. Nếu có lỗi: hiển thị toast error
   */
  const handleDepositPaymentPayOS = async () => {
    if (!booking) {
      toast.error("Không có thông tin đơn hàng!");
      return;
    }

    setIsPaying(true);
    try {
      const res = await axiosInstance.post("/api/payment/payos/link", {
        bookingId: booking.booking_id,
        returnUrl: window.location.origin + `/contract/${booking.booking_id}`,
        cancelUrl: window.location.origin + `/payment-deposit/${booking.booking_id}?payment=cancel`,
      });

      if (res.data.payUrl) {
        // Redirect đến PayOS payment page
        window.location.href = res.data.payUrl;
      } else {
        toast.error("Không lấy được link thanh toán!");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Có lỗi khi tạo link thanh toán!";
      toast.error(errorMessage);
      console.error("❌ Payment error:", err);
    } finally {
      setIsPaying(false);
    }
  };

  /**
   * Hủy booking
   * 
   * LUỒNG XỬ LÝ:
   * 1. Set isPaying = true (hiển thị loading)
   * 2. Call API DELETE /api/renter/booking/:id
   * 3. Hiển thị toast success/error
   * 4. Return true/false để component biết có thành công không
   */
  const handleCancelBooking = async () => {
    if (!booking) {
      toast.error("Không có thông tin đơn hàng!");
      return false;
    }

    setIsPaying(true);
    try {
      const res = await axiosInstance.delete(`/api/renter/booking/${booking.booking_id}`);
      
      if (res.data.success) {
        toast.success("Đã xoá đơn đặt xe!");
        return true;
      } else {
        const errorMessage = res.data.message || "Xoá đơn thất bại.";
        toast.error(errorMessage);
        return false;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Có lỗi khi xoá đơn.";
      toast.error(errorMessage);
      console.error("❌ Cancel booking error:", err);
      return false;
    } finally {
      setIsPaying(false);
    }
  };

  // ==================== UTILITY FUNCTIONS ====================
  
  /**
   * Tính toán số tiền cọc và còn lại
   * 
   * LOGIC:
   * - deposit = 30% tổng tiền (làm tròn)
   * - remaining = 70% còn lại
   * - total = tổng tiền từ booking
   */
  const getPaidAndRemaining = () => {
    if (!booking) {
      return { remaining: 0, deposit: 0, total: 0 };
    }
    
    const total = booking.totalAmount || 0;
    const deposit = Math.round(total * 0.3);
    const remaining = total - deposit;
    
    return { remaining, deposit, total };
  };

  // ==================== EFFECTS ====================
  
  /**
   * Effect: Xác định step dựa trên booking status
   * 
   * MAPPING:
   * - pending → step 0 (chờ owner chấp nhận)
   * - confirmed → step 1 + khởi tạo countdown 15 phút (sẵn sàng thanh toán đặt cọc)
   * - deposit_paid → step 2
   * - contract_signed → step 3  
   * - in_progress/fully_paid/completed → step 4
   * - canceled/refunded/rejected → step 0
   * 
   * Dependency: [booking] để chạy lại khi booking thay đổi
   */
  useEffect(() => {
    if (!booking) return;

    const status = booking.status;
    console.log("🔄 Processing booking status:", status);

    switch (status) {
       case "pending": {
         setStep(0); // Chờ owner chấp nhận
         setCountdown(0);
         setIsTimeUp(false);
         console.log("⏳ Waiting for owner to accept booking");
         break;
       }
        
      case "confirmed": {
        setStep(1);
        // Khởi tạo countdown 15 phút cho thời gian thanh toán đặt cọc
        const fifteenMinutes = 15 * 60; // 900 giây
        setCountdown(fifteenMinutes);
        setIsTimeUp(false);
        console.log("⏱️ Started countdown for confirmed booking - ready to pay deposit");
        break;
      }
        
      case "deposit_paid":
        setStep(2);
        setCountdown(0);
        setIsTimeUp(false);
        console.log("💰 Deposit paid, moved to step 2");
        break;
        
      case "contract_signed":
        setStep(3);
        setCountdown(0);
        setIsTimeUp(false);
        console.log("📝 Contract signed, moved to step 3");
        break;
        
      case "in_progress":
      case "fully_paid":
      case "completed":
        setStep(4);
        setCountdown(0);
        setIsTimeUp(false);
        console.log("✅ Booking completed, moved to step 4");
        break;
        
      case "canceled":
      case "refunded":
      case "rejected":
        setStep(0);
        setCountdown(0);
        setIsTimeUp(false);
        console.log("❌ Booking canceled/rejected, moved to step 0");
        break;
        
      default:
        console.warn("⚠️ Unknown booking status:", status);
        setStep(1); // Default fallback
        break;
    }
  }, [booking]);

  return {
    booking,
    loading,
    error,
    isTimeUp,
    isPaying,
    step,
    countdown,
    fetchBooking,
    getPaidAndRemaining,
    handleDepositPaymentPayOS,
    handleCancelBooking,
  };
};
