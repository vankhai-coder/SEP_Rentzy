import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaInfoCircle } from "react-icons/fa";
import axiosInstance from "@/config/axiosInstance";
import HandoverImageViewer from "@/components/common/HandoverImageViewer";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

  const [paymentConfirmModal, setPaymentConfirmModal] = useState({
    isOpen: false,
    type: null, // 'payos_remaining' | 'cash_remaining'
    title: "",
    message: "",
    amount: 0,
  });

  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [viewImage, setViewImage] = useState(null);

  useEffect(() => {
    fetchBookingDetails();

    // Xử lý kết quả thanh toán PayOS
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get("payment");

    if (paymentStatus === "success") {
      // Hiển thị thông báo thành công và refresh data
      setTimeout(() => {
        toast.success("Xác nhận thanh toán thành công! Vui lòng chờ chủ xe xác nhận.");
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

  const parseTrafficFineImages = (raw) => {
    let violations = [];
    let receipts = [];
    if (!raw) return { violations, receipts };
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        if (parsed.violations || parsed.receipts) {
          violations = Array.isArray(parsed.violations) ? parsed.violations : [];
          receipts = Array.isArray(parsed.receipts) ? parsed.receipts : [];
        } else {
          violations = Object.values(parsed).filter((v) => typeof v === "string");
        }
      } else if (Array.isArray(parsed)) {
        violations = parsed;
      }
    } catch {
      if (Array.isArray(raw)) {
        violations = raw;
      }
    }
    return { violations, receipts };
  };

  const parseTrafficFineDescription = (desc) => {
    if (!desc || typeof desc !== "string") return [];
    const normalized = desc.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const lines = normalized.split("\n").map((l) => l.trim()).filter(Boolean);
    const items = [];
    for (const line of lines) {
      const splitIndex = line.indexOf(":");
      if (splitIndex === -1) continue;
      const label = line.slice(0, splitIndex).trim();
      const value = line.slice(splitIndex + 1).trim();
      const parts = value.split(";").map((p) => p.trim()).filter(Boolean);
      if (parts.length > 1) {
        for (const part of parts) {
          const subIndex = part.indexOf(":");
          if (subIndex !== -1) {
            const subLabel = part.slice(0, subIndex).trim();
            const subValue = part.slice(subIndex + 1).trim();
            items.push({ label: subLabel, value: subValue });
          } else {
            items.push({ label, value: part });
          }
        }
      } else {
        items.push({ label, value });
      }
    }
    return items;
  };

  const orderTrafficDescItems = (items) => {
    const priority = [
      "Ngày vi phạm",
      "Biển số (màu biển số)",
      "Hành vi vi phạm",
      "Lý do",
      "Địa điểm vi phạm",
      "Địa điểm",
    ];
    const index = (label) => {
      const i = priority.findIndex((p) => label.toLowerCase().startsWith(p.toLowerCase()));
      return i === -1 ? priority.length + 1 : i;
    };
    return items.slice().sort((a, b) => index(a.label) - index(b.label));
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
      toast.error(errorMessage);
    } finally {
      setPaymentLoading(false);
    }
  };

  const executePayOSRemainingPayment = async () => {
    try {
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
      toast.error(errorMessage);
    } finally {
      setPaymentLoading(false);
      setPaymentConfirmModal((prev) => ({ ...prev, isOpen: false }));
    }
  };

  // Tạo link PayOS cho PHẦN CÒN LẠI (70%) khi status = deposit_paid
  const handlePayOSRemainingPayment = async () => {
    if (booking.status !== "deposit_paid") return;
    const { remaining } = calculatePaymentDetails();

    setPaymentConfirmModal({
      isOpen: true,
      type: "payos_remaining",
      title: "Xác nhận thanh toán",
      message: "Bạn có muốn thanh toán phần còn lại (70%) không?",
      amount: remaining,
    });
  };

  const executePaymentRemainingByCash = async () => {
    try {
      const response = await axiosInstance.patch(
        `/api/payment/byCash/${booking.booking_id}`
      );
      console.log("API Response:", response.data);

      toast.success("Thanh toán thành công! Thông tin đặt xe đã được cập nhật.");
      fetchBookingDetails();
    } catch (err) {
      console.log("có lỗi", err);
      toast.error("Có lỗi xảy ra khi thanh toán tiền mặt");
    } finally {
      setPaymentConfirmModal((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const handlePaymentRemainingByCash = async () => {
    const { nextPaymentAmount } = calculatePaymentDetails();
    setPaymentConfirmModal({
      isOpen: true,
      type: "cash_remaining",
      title: "Xác nhận thanh toán tiền mặt",
      message: "Bạn xác nhận thanh toán TIỀN MẶT trực tiếp cho CHỦ XE?",
      amount: nextPaymentAmount,
    });
  };

  const handleConfirmPayment = () => {
    if (paymentConfirmModal.type === "payos_remaining") {
      executePayOSRemainingPayment();
    } else if (paymentConfirmModal.type === "cash_remaining") {
      executePaymentRemainingByCash();
    }
  };

  const handleReviewNavigation = () => {
    setShowReviewPrompt(false);
    navigate(`/booking-review/${booking.booking_id}`);
  };

  const handlePostRentalConfirmSuccess = async () => {
    await fetchBookingDetails();
    setShowReviewPrompt(true);
  };

  const handlePayOSTrafficFinePayment = async () => {
    try {
      const currentUrl = window.location.origin;
      const returnUrl = `${currentUrl}/booking-history/booking-detail/${booking.booking_id}`;
      const cancelUrl = `${currentUrl}/booking-history/booking-detail/${booking.booking_id}`;
      const response = await axiosInstance.post(
        "/api/payment/payos/traffic-fine-link",
        {
          bookingId: booking.booking_id,
          returnUrl,
          cancelUrl,
        }
      );
      if (response.data?.payUrl) {
        window.location.href = response.data.payUrl;
      } else {
        toast.error(
          response.data?.error || "Không thể tạo link thanh toán phí phạt nguội"
        );
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          "Có lỗi xảy ra khi tạo link thanh toán phí phạt nguội"
      );
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
                onConfirmSuccess={handlePostRentalConfirmSuccess}
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
        {/* {booking.contract && (
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
        )} */}

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
                -{formatCurrency(booking.pointsUsed)}
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
              <h1>Vui lòng chờ chủ xe xác nhận thanh toán tiền còn lại.</h1>
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
        {(() => {
          const tfAmountRaw =
            booking.traffic_fine_amount ?? booking.trafficFineAmount ?? 0;
          const tfPaidRaw =
            booking.traffic_fine_paid ?? booking.trafficFinePaid ?? 0;
          const tfImagesRaw =
            booking.traffic_fine_images ?? booking.trafficFineImages ?? [];
          const tfAmount = parseFloat(tfAmountRaw) || 0;
          const tfPaid = parseFloat(tfPaidRaw) || 0;
          const { violations, receipts } = parseTrafficFineImages(tfImagesRaw);
          const remainingFine = tfAmount - tfPaid;
          if (tfAmount <= 0) return null;
          return (
            <div className="traffic-fine-section">
              <h3>Phí phạt nguội</h3>
              <div className="traffic-fine-details">
                <div className="traffic-fine-row">
                  <span className="traffic-fine-label">Số tiền phạt:</span>
                  <span className="traffic-fine-value">
                    {formatCurrency(tfAmount)}
                  </span>
                </div>
                {tfPaid > 0 && (
                  <div className="traffic-fine-row">
                    <span className="traffic-fine-label">Đã thanh toán:</span>
                    <span className="traffic-fine-value paid">
                      {formatCurrency(tfPaid)}
                    </span>
                  </div>
                )}
                {remainingFine > 0 && (
                  <div className="traffic-fine-row">
                    <span className="traffic-fine-label">Còn lại:</span>
                    <span className="traffic-fine-value remaining">
                      {formatCurrency(remainingFine)}
                    </span>
                  </div>
                )}
                {remainingFine > 0 && (
                  <div className="traffic-fine-action">
                    <button
                      type="button"
                      className="payment-button primary"
                      onClick={handlePayOSTrafficFinePayment}
                    >
                      Thanh toán phí phạt nguội
                    </button>
                  </div>
                )}
                {(() => {
                  const tfDescRaw =
                    booking.traffic_fine_description ??
                    booking.trafficFineDescription ??
                    "";
                  if (!tfDescRaw) return null;
                  const descItems = parseTrafficFineDescription(
                    tfDescRaw
                  );
                  const ordered = orderTrafficDescItems(descItems);
                  return ordered.length ? (
                    <div className="traffic-fine-description">
                      <div className="traffic-fine-description-grid">
                        {ordered.map((item, idx) => (
                          <div className="traffic-fine-block" key={`desc-${idx}`}>
                            <div className="traffic-fine-label">{item.label}</div>
                            <div className="traffic-fine-value">{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="traffic-fine-description">
                      <span className="traffic-fine-label">Mô tả:</span>
                      <span className="traffic-fine-value">
                        {tfDescRaw}
                      </span>
                    </div>
                  );
                })()}
                {violations.length > 0 && (
                  <div className="traffic-fine-images">
                    <span className="traffic-fine-label">Hình ảnh vi phạm:</span>
                    <div className="traffic-fine-images-grid">
                      {violations.map((imageUrl, index) => (
                        <img
                          key={`violation-${index}`}
                          src={imageUrl}
                          alt={`Vi phạm ${index + 1}`}
                          className="traffic-fine-image cursor-pointer"
                          title="Hình ảnh vi phạm"
                          onClick={() => setViewImage(imageUrl)}
                          style={{ cursor: "pointer" }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {receipts.length > 0 && (
                  <div className="traffic-fine-images">
                    <span className="traffic-fine-label">Hóa đơn nộp phạt:</span>
                    <div className="traffic-fine-images-grid">
                      {receipts.map((imageUrl, index) => (
                        <img
                          key={`receipt-${index}`}
                          src={imageUrl}
                          alt={`Hóa đơn ${index + 1}`}
                          className="traffic-fine-image cursor-pointer"
                          title="Hóa đơn nộp phạt"
                          onClick={() => setViewImage(imageUrl)}
                          style={{ cursor: "pointer" }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div className="traffic-fine-note">
                  <span>
                    * Phí phạt nguội được thanh toán riêng, không nằm trong tổng tiền thuê.
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Lịch sử giao dịch */}
        <div className="transaction-section">
          <h3>Lịch sử giao dịch</h3>
          {booking.transactions && booking.transactions.length > 0 ? (
            <div className="transaction-list">
              {booking.transactions
                .filter(t => t.transaction_type !== "COMPENSATION")
                .map((transaction, index) => (
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

        {/* Payment Confirmation Modal */}
        <Dialog
          open={paymentConfirmModal.isOpen}
          onOpenChange={(open) =>
            setPaymentConfirmModal((prev) => ({ ...prev, isOpen: open }))
          }
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{paymentConfirmModal.title}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-500 mb-4">
                {paymentConfirmModal.message}
              </p>
              {paymentConfirmModal.amount > 0 && (
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <span className="font-medium text-gray-700">Số tiền:</span>
                  <span className="font-bold text-blue-600 text-lg">
                    {formatCurrency(paymentConfirmModal.amount)}
                  </span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() =>
                  setPaymentConfirmModal((prev) => ({ ...prev, isOpen: false }))
                }
              >
                Hủy bỏ
              </Button>
              <Button onClick={handleConfirmPayment}>Xác nhận</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image Viewer Modal */}
        <Dialog open={!!viewImage} onOpenChange={(open) => !open && setViewImage(null)}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden flex justify-center items-center bg-transparent border-none shadow-none">
            <div className="relative">
              <img
                src={viewImage}
                alt="Full view"
                className="max-w-full max-h-[90vh] object-contain rounded-md"
              />
              <button 
                onClick={() => setViewImage(null)}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal hỏi đánh giá */}
        <Dialog open={showReviewPrompt} onOpenChange={setShowReviewPrompt}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Đánh giá chuyến đi</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-600">
                Chuyến đi đã hoàn thành. Bạn có muốn đánh giá chuyến đi này
                không?
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowReviewPrompt(false)}
              >
                Để sau
              </Button>
              <Button onClick={handleReviewNavigation}>Đánh giá ngay</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default BookingDetailsPage;
