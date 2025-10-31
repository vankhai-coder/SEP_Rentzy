/**
 * Utility functions for booking cancellation calculations
 */

/**
 * Tính toán phí hủy booking
 * @param {Object} booking - Thông tin booking
 * @param {Date} cancellationTime - Thời gian hủy (mặc định là hiện tại)
 * @returns {Object} Thông tin tính toán phí hủy
 */
export const calculateCancellationFeeLogic = (booking, cancellationTime = new Date()) => {
  // Hàm helper để convert UTC sang giờ Việt Nam
  const convertToVietnamTime = (utcDate) => {
    return new Date(utcDate.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
  };
  
  // Convert thời gian hiện tại sang giờ Việt Nam
  const now = convertToVietnamTime(cancellationTime);
  
  // Convert thời gian từ database (UTC) sang giờ Việt Nam
  const createdAtUTC = new Date(booking.created_at);
  const createdAt = convertToVietnamTime(createdAtUTC);
  
  const startDateUTC = new Date(booking.start_date);
  const startDate = convertToVietnamTime(startDateUTC);

  const hoursFromCreation = (now - createdAt) / (1000 * 60 * 60);
  const daysToStart = (startDate - now) / (1000 * 60 * 60 * 24);

  const totalAmount = parseFloat(booking.total_amount) || 0; // Tổng giá trị đơn hàng
  const totalPaid = parseFloat(booking.total_paid) || 0; // Tiền đã thanh toán
  let cancellationFeePercent = 0;
  let cancellationFee = 0;
  let feeDescription = "";

  // Calculate cancellation fee based on total booking value
  if (hoursFromCreation <= 1) {
    // Free cancellation within 1 hour
    cancellationFeePercent = 0;
    cancellationFee = 0;
    feeDescription = "Hủy miễn phí trong vòng 1 giờ sau giữ chỗ";
  } else if (daysToStart > 7) {
    // >7 days before trip - 20% fee on total booking value
    cancellationFeePercent = 20;
    cancellationFee = totalAmount * 0.2;
    feeDescription = "Trước chuyến đi >7 ngày - Phí 20% tổng giá trị hóa đơn";
  } else {
    // Within 7 days before trip - 50% fee on total booking value
    cancellationFeePercent = 50;
    cancellationFee = totalAmount * 0.5;
    feeDescription = "Trong vòng 7 ngày trước chuyến đi - Phí 50% tổng giá trị hóa đơn";
  }

  // Số tiền hoàn lại = tiền đã thanh toán - phí hủy
  const refundAmount = Math.max(0, totalPaid - cancellationFee);

  // Tính toán phí nền tảng 10% và số tiền owner nhận được
  const platformFeeRate = 0.1; // 10% phí nền tảng
  const platformFee = cancellationFee * platformFeeRate;
  const ownerRefund = cancellationFee - platformFee; // Owner nhận 90% của phí hủy

  return {
    totalAmount,
    totalPaid,
    cancellationFee,
    cancellationFeePercent,
    refundAmount,
    platformFee,
    ownerRefund,
    hoursFromCreation,
    daysToStart,
    feeDescription,
    canCancel: daysToStart >= 0, // Không thể hủy nếu đã bắt đầu chuyến đi
  };
};

/**
 * Tạo thông tin tài chính breakdown cho hiển thị
 * @param {Object} calculation - Kết quả từ calculateCancellationFeeLogic
 * @returns {Object} Thông tin breakdown
 */
export const createFinancialBreakdown = (calculation) => {
  return {
    total_paid: calculation.totalPaid,
    cancellation_fee: calculation.cancellationFee,
    cancellation_fee_percent: calculation.cancellationFeePercent,
    refund_amount: calculation.refundAmount,
    platform_fee: calculation.platformFee,
    owner_compensation: calculation.ownerRefund,
  };
};

/**
 * Tạo thông tin hủy đơn cho hiển thị
 * @param {Object} booking - Thông tin booking
 * @param {Object} calculation - Kết quả từ calculateCancellationFeeLogic
 * @param {string} cancelledBy - Người hủy ('renter' hoặc 'owner')
 * @param {string} reason - Lý do hủy
 * @returns {Object} Thông tin hủy đơn
 */
export const createCancellationInfo = (booking, calculation, cancelledBy = 'renter', reason = 'Người thuê yêu cầu hủy booking') => {
  return {
    cancellation_fee: calculation.cancellationFee,
    owner_receives: calculation.ownerRefund,
    renter_refund: calculation.refundAmount,
    cancellation_reason: reason,
    cancelled_by: cancelledBy,
    can_approve: booking.status === 'cancel_requested', // Chỉ có thể duyệt khi status là cancel_requested
  };
};