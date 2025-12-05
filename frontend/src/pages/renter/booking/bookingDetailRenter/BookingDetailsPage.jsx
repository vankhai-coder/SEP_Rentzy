import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaInfoCircle } from "react-icons/fa";
import axiosInstance from "@/config/axiosInstance";
import HandoverImageViewer from "@/components/common/HandoverImageViewer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import "./BookingDetailsPage.scss";

const BookingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signUrl, setSignUrl] = useState("");
  const iframeRef = useRef(null);

  useEffect(() => {
    fetchBookingDetails();

    // Xử lý kết quả thanh toán PayOS
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get("payment");

    if (paymentStatus === "success") {
      // Hiển thị thông báo thành công và refresh data
      setTimeout(() => {
        alert("Xác nhận thanh toán thành công! Vui lòng chờ chủ xe xác nhận.");
        fetchBookingDetails();
      }, 1000);

      // Xóa parameter khỏi URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching booking details for ID:", id);
      const response = await axiosInstance.get(`/api/renter/booking/${id}`);

      console.log("API Response:", response.data);

      const payload = response.data.booking || response.data.data;
      if (response.data.success && payload) {
        setBooking(payload);
      } else {
        throw new Error("Không thể tải thông tin đặt xe");
      }
    } catch (error) {
      console.error("Error fetching booking details:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Có lỗi xảy ra khi tải thông tin đặt xe"
      );
    } finally {
      setLoading(false);
    }
  };

  // NEW: Refresh DocuSign status and reload booking
  const refreshContractStatus = async () => {
    try {
      const envelopeId = booking?.contract?.contract_number;
      if (!envelopeId) return fetchBookingDetails();
      await axiosInstance.get(`/api/docusign/status/${envelopeId}`);
      await fetchBookingDetails();
    } catch (err) {
      console.error("Refresh DocuSign status error:", err);
      await fetchBookingDetails();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const formatCurrency = (amount) => {
    if (!amount) return "0 VNĐ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Xử lý thanh toán PayOS
  // Tạo link PayOS cho ĐẶT CỌC (30%) khi status = confirmed
  const handlePayOSDepositPayment = async () => {
    try {
      if (booking.status !== "confirmed") return;
      const userConfirmed = window.confirm(
        "Bạn có muốn thanh toán tiền cọc (30%) để giữ lịch không?"
      );
      if (!userConfirmed) return;

      setPaymentLoading(true);
      const currentUrl = window.location.origin;
      const returnUrl = `${currentUrl}/booking-history/booking-detail/${booking.booking_id}`;
      const cancelUrl = `${currentUrl}/booking-history/booking-detail/${booking.booking_id}`;

      const response = await axiosInstance.post("/api/payment/payos/link", {
        bookingId: booking.booking_id,
        returnUrl,
        cancelUrl,
      });

      if (response.data.payUrl) {
        window.location.href = response.data.payUrl;
      } else {
        throw new Error("Không thể tạo link thanh toán đặt cọc");
      }
    } catch (error) {
      console.error("PayOS deposit payment error:", error);
      let errorMessage = "Có lỗi xảy ra khi tạo link thanh toán đặt cọc";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      alert(errorMessage);
    } finally {
      setPaymentLoading(false);
    }
  };

  // Tạo link PayOS cho PHẦN CÒN LẠI (70%) khi status = deposit_paid
  const handlePayOSRemainingPayment = async () => {
    try {
      if (booking.status !== "deposit_paid") return;
      const userConfirmed = window.confirm(
        "Bạn có muốn thanh toán phần còn lại (70%) không?"
      );
      if (!userConfirmed) return;

      setPaymentLoading(true);
      const currentUrl = window.location.origin;
      const returnUrl = `${currentUrl}/booking-history/booking-detail/${booking.booking_id}`;
      const cancelUrl = `${currentUrl}/booking-history/booking-detail/${booking.booking_id}`;

      const response = await axiosInstance.post(
        "/api/payment/payos/remaining-link",
        {
          bookingId: booking.booking_id,
          returnUrl,
          cancelUrl,
        }
      );

      if (response.data.payUrl) {
        window.location.href = response.data.payUrl;
      } else {
        throw new Error("Không thể tạo link thanh toán phần còn lại");
      }
    } catch (error) {
      console.error("PayOS remaining payment error:", error);
      let errorMessage = "Có lỗi xảy ra khi tạo link thanh toán phần còn lại";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      alert(errorMessage);
    } finally {
      setPaymentLoading(false);
    }
  };

  // Tạo URL ký hợp đồng cho người thuê (Embedded Signing DocuSign)
  const handleSignContract = async () => {
    try {
      const envelopeId = booking?.contract?.contract_number;
      if (!envelopeId) return alert("Không có thông tin hợp đồng để ký.");
      const fePublic =
        import.meta.env.VITE_FRONTEND_PUBLIC_URL || window.location.origin;
      const currentPath = window.location.pathname;
      const returnUrl = `${fePublic}${currentPath}`;
      const resp = await axiosInstance.get(`/api/docusign/sign/${envelopeId}`, {
        params: { role: "renter", returnUrl },
      });
      const url = resp.data?.url;
      if (url) {
        setSignUrl(url);
        setShowSignModal(true);
      } else {
        alert("Không thể tạo URL ký hợp đồng.");
      }
    } catch (err) {
      console.error("Error creating recipient view:", err);
      alert(err.response?.data?.error || "Không thể tạo URL ký hợp đồng.");
    }
  };

  // Detect when iframe navigates to our FE returnUrl, then close modal and refresh
  const handleIFrameLoad = () => {
    try {
      const href = iframeRef.current?.contentWindow?.location?.href;
      if (!href) return;
      if (href.startsWith(window.location.origin)) {
        // Khi DocuSign trả về cùng origin, không ràng buộc đường dẫn cụ thể
        setShowSignModal(false);
        setSignUrl("");
        refreshContractStatus().then(() => {
          window.location.reload();
        });
      }
    } catch {
      // Cross-origin while on DocuSign; ignore until it redirects to our domain
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "Chờ xác nhận";
      case "deposit_paid":
        return "Đã thanh toán cọc";
      case "in_progress":
        return "Đang thuê";
      case "fully_paid":
        return "Đã thanh toán đầy đủ";
      case "completed":
        return "Hoàn thành";
      case "canceled":
        return "Đã hủy";
      default:
        return status || "Không xác định";
    }
  };

  // Tính toán số tiền đã thanh toán và còn lại
  const calculatePaymentDetails = () => {
    if (!booking)
      return {
        totalPaid: 0,
        remaining: 0,
        showDepositButton: false,
        showRemainingButton: false,
        nextPaymentAmount: 0,
      };

    const totalPaid = parseFloat(booking.totalPaid) || 0;
    const totalAmount = parseFloat(booking.totalAmount) || 0;
    const remaining = totalAmount - totalPaid;

    const showDepositButton = booking.status === "confirmed"; // Thanh toán 30%
    const showRemainingButton =
      booking.status === "deposit_paid" && remaining > 0; // Thanh toán 70%

    return {
      totalPaid,
      remaining,
      showDepositButton,
      showRemainingButton,
      nextPaymentAmount: remaining,
    };
  };

  const {
    totalPaid,
    remaining,
    showDepositButton,
    showRemainingButton,
    nextPaymentAmount,
  } = calculatePaymentDetails();

  if (loading) {
    return (
      <div className="booking-details-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải thông tin đặt xe...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="booking-details-container">
        <div className="error-message">
          <h3>Có lỗi xảy ra</h3>
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className="back-button">
            <FaArrowLeft /> Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="booking-details-container">
        <div className="error-message">
          <h3>Không tìm thấy thông tin đặt xe</h3>
          <button onClick={() => navigate(-1)} className="back-button">
            <FaArrowLeft /> Quay lại
          </button>
        </div>
      </div>
    );
  }
  const handlePaymentRemainingByCash = async () => {
    try {
      const proceed = window.confirm(
        `Bạn xác nhận thanh toán TIỀN MẶT trực tiếp cho CHỦ XE với số tiền ${formatCurrency(
          nextPaymentAmount
        )}"`
      );
      if (!proceed) return;

      const response = await axiosInstance.patch(
        `/api/payment/byCash/${booking.booking_id}`
      );
      console.log("API Response:", response.data);

      if (!response) {
        console.log("yêu cầu thanh toán thành công");
      }

      alert("Thanh toán thành công! Thông tin đặt xe đã được cập nhật.");
      fetchBookingDetails();
    } catch (err) {
      console.log("có lỗi", err);
    }
  };

  return (
    <div className="booking-details-container">
      {/* Header với nút quay lại */}
      <div className="booking-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <FaArrowLeft /> Quay lại
        </button>
        <h1>Chi tiết đặt xe #{booking.booking_id}</h1>
      </div>

      {/* Unified content trong một div duy nhất */}
      <div className="unified-booking-content">
        {/* Thông tin tổng quan */}
        <div className="overview-section">
          <div className="status-badge">
            <span
              className={`status-indicator ${booking.status?.toLowerCase()}`}
            >
              {getStatusText(booking.status)}
            </span>
          </div>
          <div className="booking-meta">
            <span className="booking-date">
              Đặt Xe ngày: {formatDateTime(booking.created_at)}
            </span>
          </div>
        </div>

        {/* Thông tin xe và hình ảnh */}
        <div className="vehicle-section">
          <div className="vehicle-image-container">
            <img
              src={booking.vehicle?.main_image_url || "/default-car.jpg"}
              alt={booking.vehicle?.model}
              className="vehicle-main-image"
            />
          </div>
          <div className="vehicle-info-container">
            <h2 className="vehicle-title">{booking.vehicle?.model}</h2>
            <p className="vehicle-location">{booking.vehicle?.location}</p>
            <p className="vehicle-price">
              {formatCurrency(booking.vehicle?.price_per_day)}/ngày
            </p>
            <button
              className="view-vehicle-btn"
              onClick={() => navigate(`/detail/${booking.vehicle?.vehicle_id}`)}
            >
              <FaInfoCircle /> Xem chi tiết xe
            </button>
          </div>
        </div>

        {/* Pre-Rental Images Section */}
        {(booking.status === "fully_paid" ||
          booking.status === "in_progress" ||
          booking.status === "completed") &&
          booking.contract?.contract_status === "completed" && (
            <div className="pre-rental-images-section">
              <HandoverImageViewer
                bookingId={booking.booking_id}
                booking={booking}
                userRole="renter"
                imageType="pre-rental"
                onConfirmSuccess={fetchBookingDetails}
                handoverData={booking.handover || {}}
              />
            </div>
          )}

        {/* Post-Rental Images Section */}
        {(booking.status === "fully_paid" ||
          booking.status === "in_progress" ||
          booking.status === "completed") &&
          booking.contract?.contract_status === "completed" &&
          booking.handover?.owner_return_confirmed === true && (
            <div className="pre-rental-images-section">
              <HandoverImageViewer
                bookingId={booking.booking_id}
                booking={booking}
                userRole="renter"
                imageType="post-rental"
                onConfirmSuccess={fetchBookingDetails}
                handoverData={booking.handover || {}}
              />
            </div>
          )}

        {/* Thời gian và địa điểm */}
        <div className="rental-details-section">
          <div className="rental-time">
            <h3>Thời gian thuê</h3>
            <div className="time-info">
              <div className="time-item">
                <span className="label">Nhận xe:</span>
                <span className="value">
                  {formatDate(booking.startDate)} {booking.startTime}
                </span>
              </div>
              <div className="time-item">
                <span className="label">Trả xe:</span>
                <span className="value">
                  {formatDate(booking.endDate)} {booking.endTime}
                </span>
              </div>
              <div className="time-item">
                <span className="label">Tổng thời gian:</span>
                <span className="value">{booking.totalDays} ngày</span>
              </div>
            </div>
          </div>

          <div className="rental-locations">
            <h3>Địa điểm</h3>
            <div className="location-info">
              <div className="location-item">
                <span className="label">Nhận xe:</span>
                <span className="value">{booking.pickupLocation}</span>
              </div>
              <div className="location-item">
                <span className="label">Trả xe:</span>
                <span className="value">{booking.returnLocation}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Thông tin người thuê */}
        <div className="renter-section">
          <h3>Thông tin người thuê</h3>
          <div className="renter-details">
            <div className="renter-item">
              <span className="label">Họ tên:</span>
              <span className="value">{booking.renter?.full_name}</span>
            </div>
            <div className="renter-item">
              <span className="label">Số điện thoại:</span>
              <span className="value">{booking.renter?.phone_number}</span>
            </div>
            <div className="renter-item">
              <span className="label">Email:</span>
              <span className="value">{booking.renter?.email}</span>
            </div>
          </div>
        </div>

        {/* Trạng thái hợp đồng DocuSign - tách riêng */}
        {booking.contract && (
          <div className="contract-section">
            <h3>Trạng thái hợp đồng</h3>
            <div className="contract-status">
              Hợp đồng thuê xe: {booking.contract.contract_status}
            </div>
            <div className="contract-actions">
              {booking.contract.contract_status === "pending_signatures" &&
                !booking.contract.renter_signed_at && (
                  <button
                    className="payment-button"
                    onClick={handleSignContract}
                  >
                    Ký hợp đồng
                  </button>
                )}
            </div>
          </div>
        )}

        {/* Thông tin thanh toán */}
        <div className="payment-section">
          <h3>Chi tiết thanh toán</h3>
          <div className="payment-breakdown">
            <div className="payment-row">
              <span className="payment-label">
                Giá thuê ({booking.totalDays} ngày ×{" "}
                {formatCurrency(booking.pricePerDay)})
              </span>
              <span className="payment-value">
                {formatCurrency(booking.totalCost)}
              </span>
            </div>
            <div className="payment-row">
              <span className="payment-label">Phí giao xe</span>
              <span className="payment-value">
                {formatCurrency(booking.deliveryFee)}
              </span>
            </div>

            <div className="payment-row discount">
              <span className="payment-label">Giảm giá</span>
              <span className="payment-value">
                -{formatCurrency(booking.discountAmount)}
              </span>
            </div>

            <div className="payment-row points">
              <span className="payment-label">
                Điểm đã sử dụng ({booking.pointsUsed} điểm)
              </span>
              <span className="payment-value">
                -{formatCurrency(booking.pointsUsed * 1000)}
              </span>
            </div>

            <div className="payment-row total">
              <span className="payment-label">Tổng cộng</span>
              <span className="payment-value">
                {formatCurrency(booking.totalAmount)}
              </span>
            </div>
            <div className="payment-row paid">
              <span className="payment-label">Đã thanh toán</span>
              <span className="payment-value">{formatCurrency(totalPaid)}</span>
            </div>

            <div className="payment-row remaining">
              <span className="payment-label">Còn lại</span>
              <span className="payment-value">{formatCurrency(remaining)}</span>
            </div>
          </div>

          {/* Trạng thái pending: ẩn nút thanh toán */}
          {booking.status === "pending" && (
            <div className="payment-action">
              <p>Đơn đang chờ chủ xe xác nhận. Vui lòng đợi.</p>
            </div>
          )}

          {/* Trạng thái confirmed: hiển thị nút thanh toán đặt cọc 30% */}
          {showDepositButton && (
            <div className="payment-action">
              <div className="payment-actions-grid">
                <button
                  className="payment-button primary"
                  onClick={handlePayOSDepositPayment}
                  disabled={paymentLoading}
                >
                  {paymentLoading
                    ? "Đang tạo link thanh toán..."
                    : "Thanh toán cọc 30%"}
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Vui lòng thanh toán 30% để giữ lịch thuê.
              </p>
            </div>
          )}

          {/* Trạng thái deposit_paid: hiển thị nút thanh toán phần còn lại 70% */}
          {showRemainingButton &&
            booking.remaining_paid_by_cash_status === "none" && (
              <div className="payment-action">
                <div className="payment-actions-grid">
                  <button
                    className="payment-button primary"
                    onClick={handlePayOSRemainingPayment}
                    disabled={paymentLoading}
                  >
                    {paymentLoading
                      ? "Đang tạo link thanh toán..."
                      : "Thanh toán 70% còn lại"}
                  </button>
                  <button
                    className="payment-button secondary"
                    onClick={() => {
                      handlePaymentRemainingByCash();
                    }}
                    disabled={
                      booking.remaining_paid_by_cash_status === "pending" ||
                      booking.remaining_paid_by_cash_status === "approved"
                    }
                  >
                    Thanh toán tiền còn lại cho chủ xe
                  </button>
                </div>
              </div>
            )}

          {booking.remaining_paid_by_cash_status === "pending" && (
            <div className="payment-action">
              <h1>Vui lòng chờ chủ xe xác nhận thanh toán tiền mặt.</h1>
            </div>
          )}
        </div>

        {/* Modal ký DocuSign */}
        <Dialog open={showSignModal} onOpenChange={setShowSignModal}>
          <DialogContent className="sm:max-w-[900px] w-[95vw] h-[80vh] p-0">
            <DialogHeader>
              <DialogTitle>Ký hợp đồng DocuSign</DialogTitle>
            </DialogHeader>
            {signUrl ? (
              <iframe
                ref={iframeRef}
                onLoad={handleIFrameLoad}
                src={signUrl}
                title="DocuSign"
                className="w-full h-[70vh] border-0"
              />
            ) : (
              <div className="p-4">Đang tải URL ký...</div>
            )}
          </DialogContent>
        </Dialog>

        {/* Thông tin phạt nguội */}
        {booking.traffic_fine_amount > 0 && (
          <div className="traffic-fine-section">
            <h3>Phí phạt nguội</h3>
            <div className="traffic-fine-details">
              <div className="traffic-fine-row">
                <span className="traffic-fine-label">Số tiền phạt:</span>
                <span className="traffic-fine-value">
                  {formatCurrency(booking.traffic_fine_amount)}
                </span>
              </div>
              {booking.traffic_fine_paid > 0 && (
                <div className="traffic-fine-row">
                  <span className="traffic-fine-label">Đã thanh toán:</span>
                  <span className="traffic-fine-value paid">
                    {formatCurrency(booking.traffic_fine_paid)}
                  </span>
                </div>
              )}
              {booking.traffic_fine_amount - (booking.traffic_fine_paid || 0) >
                0 && (
                <div className="traffic-fine-row">
                  <span className="traffic-fine-label">Còn lại:</span>
                  <span className="traffic-fine-value remaining">
                    {formatCurrency(
                      booking.traffic_fine_amount -
                        (booking.traffic_fine_paid || 0)
                    )}
                  </span>
                </div>
              )}
              {booking.traffic_fine_description && (
                <div className="traffic-fine-description">
                  <span className="traffic-fine-label">Lý do:</span>
                  <span className="traffic-fine-value">
                    {booking.traffic_fine_description}
                  </span>
                </div>
              )}
              {booking.traffic_fine_images &&
                booking.traffic_fine_images.length > 0 && (
                  <div className="traffic-fine-images">
                    <span className="traffic-fine-label">
                      Hình ảnh phạt nguội:
                    </span>
                    <div className="traffic-fine-images-grid">
                      {booking.traffic_fine_images.map((imageUrl, index) => (
                        <img
                          key={index}
                          src={imageUrl}
                          alt={`Phạt nguội ${index + 1}`}
                          className="traffic-fine-image"
                          onClick={() => window.open(imageUrl, "_blank")}
                        />
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Lịch sử giao dịch */}
        <div className="transaction-section">
          <h3>Lịch sử giao dịch</h3>
          {booking.transactions && booking.transactions.length > 0 ? (
            <div className="transaction-list">
              {booking.transactions.map((transaction, index) => (
                <div
                  key={transaction.transaction_id || index}
                  className="transaction-card"
                >
                  <div className="transaction-header">
                    <span className="transaction-type">
                      {transaction.transaction_type === "DEPOSIT"
                        ? "Thanh toán cọc"
                        : transaction.transaction_type === "RENTAL"
                        ? "Thanh toán còn lại"
                        : transaction.transaction_type === "TRAFFIC_FINE"
                        ? "Thanh toán phí phạt nguội"
                        : transaction.transaction_type}
                    </span>
                    <span className="transaction-amount">
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                  <div className="transaction-footer">
                    <span className="transaction-date">
                      {formatDateTime(transaction.created_at)}
                    </span>
                    <span
                      className={`transaction-status ${transaction.status?.toLowerCase()}`}
                    >
                      {transaction.status === "COMPLETED"
                        ? "Thành công"
                        : transaction.status === "PENDING"
                        ? "Đang xử lý"
                        : transaction.status === "FAILED"
                        ? "Thất bại"
                        : transaction.status === "CANCELLED"
                        ? "Đã hủy"
                        : transaction.status}
                    </span>
                  </div>
                  {transaction.payment_method && (
                    <div className="transaction-method">
                      <span>Phương thức: {transaction.payment_method}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-transactions">
              <p>Chưa có giao dịch nào</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsPage;
