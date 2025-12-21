import React, { useState, useEffect } from "react";
import {
  FaTimes,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
  FaClock,
} from "react-icons/fa";
import axiosInstance from "@/config/axiosInstance";
import "./CancelBookingModal.scss";
import { toast } from "sonner";

const CancelBookingModal = ({
  isOpen,
  onClose,
  bookingId,
  onCancelSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [cancellationInfo, setCancellationInfo] = useState(null);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchCancellationInfo();
    }
  }, [isOpen, bookingId]);



  const fetchCancellationInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.get(
        `/api/renter/booking/${bookingId}/cancellation-fee`
      );

      if (response.data.success) {
        const bookingData = response.data.data;
        setCancellationInfo(bookingData);
      } else {
        throw new Error(
          response.data.message || "Không thể tải thông tin phí hủy"
        );
      }
    } catch (error) {
      let errorMessage = "Có lỗi xảy ra khi tải thông tin phí hủy";

      if (error.response?.status === 404) {
        errorMessage = "Không tìm thấy đơn thuê này";
      } else if (error.response?.status === 400) {
        errorMessage =
          error.response?.data?.message ||
          "Không thể tính phí hủy cho đơn thuê này";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    try {
      setConfirming(true);

      let response;

      if (cancellationInfo?.booking_status === "pending") {
        response = await axiosInstance.delete(
          `/api/renter/booking/${bookingId}`
        );
      } else {
        response = await axiosInstance.post(
          `/api/renter/booking/${bookingId}/cancel`
        );
      }

      if (response.data.success) {
        toast.success("Hủy booking thành công!");
        onCancelSuccess();
        onClose();
      } else {
        throw new Error(response.data.message || "Không thể hủy booking");
      }
    } catch (error) {
      let errorMessage = "Có lỗi xảy ra khi hủy booking";

      if (error.response?.status === 404) {
        errorMessage = "Không tìm thấy đơn thuê này";
      } else if (error.response?.status === 400) {
        errorMessage =
          error.response?.data?.message || "Không thể hủy đơn thuê này";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
    } finally {
      setConfirming(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "0 VNĐ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="cancel-modal-overlay">
      <div className="cancel-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="header-content">
            <FaExclamationTriangle className="header-icon" />
            <h2>Hủy đặt xe</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Đang tính toán phí hủy...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <FaExclamationTriangle className="error-icon" />
              <p>{error}</p>
              <button className="retry-btn" onClick={fetchCancellationInfo}>
                Thử lại
              </button>
            </div>
          ) : cancellationInfo ? (
            <div className="cancellation-content">
              {/* Cancellation Details */}
              <div className={`fee-card ${cancellationInfo.cancellation_fee_percent === 0 ? 'free-cancellation' : ''}`}>
                <div className="card-header">
                  {cancellationInfo.cancellation_fee_percent === 0 ? (
                    <>
                      <FaCheckCircle className="success-icon" />
                      <h3>Hủy miễn phí</h3>
                    </>
                  ) : (
                    <h3>Chi tiết phí hủy</h3>
                  )}
                </div>
                <div className="card-content">
                  <div className="notice">
                    <FaInfoCircle className="notice-icon" />
                    <p>{cancellationInfo.fee_description}</p>
                  </div>

                  <div className="fee-breakdown">
                     <div className="fee-row">
                       <span>Tổng giá trị đơn hàng:</span>
                       <span className="amount">
                         {formatCurrency(cancellationInfo.total_amount)}
                       </span>
                     </div>
                     <div className="fee-row">
                       <span>Tiền đã thanh toán:</span>
                       <span className="amount">
                         {formatCurrency(cancellationInfo.total_paid)}
                       </span>
                     </div>
                     {cancellationInfo.cancellation_fee > 0 && (
                       <div className="fee-row">
                         <span>Phí hủy ({cancellationInfo.cancellation_fee_percent}% tổng giá trị):</span>
                         <span className="fee-amount">
                           -{formatCurrency(cancellationInfo.cancellation_fee)}
                         </span>
                       </div>
                     )}
                     <div className="fee-row refund">
                       <span>Số tiền hoàn lại:</span>
                       <span className={`refund-amount ${cancellationInfo.cancellation_fee === 0 ? 'free' : ''}`}>
                         {formatCurrency(cancellationInfo.refund_amount)}
                       </span>
                     </div>
                   </div>
                </div>
              </div>

              {/* Time Info */}
              <div className="timing-info">
                <div className="timing-row">
                  <span>Thời gian từ lúc đặt:</span>
                  <span>
                    {cancellationInfo.timing_info?.hours_from_creation} giờ
                  </span>
                </div>
                <div className="timing-row">
                  <span>Thời gian đến ngày bắt đầu:</span>
                  <span>
                    {cancellationInfo.timing_info?.hours_to_start} giờ
                  </span>
                </div>
                <div className="timing-row">
                  <span>Ngày bắt đầu:</span>
                  <span>
                    {new Date(cancellationInfo.start_date).toLocaleDateString(
                      "vi-VN"
                    )}
                  </span>
                </div>
                <div className="timing-row">
                  <span>Ngày kết thúc:</span>
                  <span>
                    {new Date(cancellationInfo.end_date).toLocaleDateString(
                      "vi-VN"
                    )}
                  </span>
                </div>
              </div>

              {/* Warning */}
              <div className="warning-notice">
                <FaExclamationTriangle className="warning-icon" />
                <p>
                  Bạn có chắc chắn muốn hủy đặt xe này không? Hành động này
                  không thể hoàn tác.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={confirming}
          >
            Không hủy
          </button>
          <button
            className="btn btn-danger"
            onClick={handleConfirmCancel}
            disabled={loading || error || confirming || !cancellationInfo}
          >
            {confirming ? "Đang hủy..." : "Xác nhận hủy"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelBookingModal;
