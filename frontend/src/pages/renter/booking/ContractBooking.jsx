import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { useContractBooking } from "./hooks/useContractBooking";
import "./ContractBooking.scss";
import axiosInstance from "@/config/axiosInstance";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


const ContractBooking = () => {
  const { bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { booking, loading, error, refreshBooking } =
    useContractBooking(bookingId);

  // DocuSign state
  const [showSignModal, setShowSignModal] = useState(false);
  const [signUrl, setSignUrl] = useState("");
  const iframeRef = useRef(null);

  // Contract PDF state
  const [contractPdfUrl, setContractPdfUrl] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");

  // Hỗ trợ khởi tạo hợp đồng nếu chưa có
  const [initLoading, setInitLoading] = useState(false);
  const [initError, setInitError] = useState("");

  // ===== Derived states for UI flow =====
  const isPaidEnough =
    !!booking &&
    (booking.status === "deposit_paid" ||
      booking.status === "fully_paid" ||
      booking.status === "completed");
  const hasEnvelope = !!booking?.contract?.contract_number;
  const renterHasSigned = Boolean(booking?.contract?.renter_signed_at);
  const renterNeedsSign =
    !!booking?.contract && hasEnvelope && !renterHasSigned;

  // ===== Actions =====
  // handlePrint removed (unused after removing buttons)

  const handleRefreshStatus = async () => {
    try {
      const envelopeId = booking?.contract?.contract_number;
      if (!envelopeId) return refreshBooking();
      await axiosInstance.get(`/api/docusign/status/${envelopeId}`);
      await refreshBooking();
    } catch (err) {
      console.error("Refresh status error:", err);
      await refreshBooking();
    }
  };

  const handleSignContract = async () => {
    try {
      const envelopeId = booking?.contract?.contract_number;
      if (!envelopeId) return alert("Không có thông tin hợp đồng để ký.");
      const fePublic =
        import.meta.env.VITE_FRONTEND_PUBLIC_URL || window.location.origin;
      const returnUrl = `${fePublic}/contract/${booking.booking_id}`;
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

  const initContractIfNeeded = async () => {
    if (!booking) return;
    const shouldInit =
      (booking.status === "deposit_paid" || booking.status === "fully_paid") &&
      (!booking.contract || !booking.contract.contract_number);

    if (!shouldInit) return;

    try {
      setInitLoading(true);
      setInitError("");
      const resp = await axiosInstance.post(
        `/api/docusign/booking/${booking.booking_id}/send`
      );
      if (resp.data?.success) {
        await refreshBooking();
      } else {
        setInitError(
          resp.data?.error || "Không thể khởi tạo hợp đồng DocuSign"
        );
      }
    } catch (err) {
      console.error("Init DocuSign contract error:", err);
      setInitError(
        err.response?.data?.error || "Không thể khởi tạo hợp đồng DocuSign"
      );
    } finally {
      setInitLoading(false);
    }
  };

  const fetchCombinedPdf = async () => {
    const envelopeId = booking?.contract?.contract_number;
    if (!envelopeId) return;

    let createdUrl = "";
    setPdfError("");
    setPdfLoading(true);

    try {
      const resp = await axiosInstance.get(
        `/api/docusign/documents/${envelopeId}/combined`,
        {
          responseType: "blob",
        }
      );
      const url = URL.createObjectURL(
        new Blob([resp.data], { type: "application/pdf" })
      );
      createdUrl = url;
      setContractPdfUrl(url);
    } catch (err) {
      console.error("Error fetching combined contract:", err);
      setPdfError(
        err.response?.data?.error || "Không thể lấy hợp đồng từ DocuSign"
      );
    } finally {
      setPdfLoading(false);
    }

    return () => {
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  };

  useEffect(() => {
    initContractIfNeeded().then(() => {
      fetchCombinedPdf();
    });
  }, [booking?.status, booking?.contract?.contract_number]);

  // Auto refresh DB status when arriving from DocuSign returnUrl (no auto-open)
  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const event =
      params.get("event") || params.get("source") || params.get("eventType");
    const clientUserId =
      params.get("client_user_id") || params.get("clientUserId");

    if (event || clientUserId) {
      handleRefreshStatus();
      setShowSignModal(false);
      setSignUrl("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  // Khi có event trong URL và booking đã tải xong, đảm bảo gọi getStatus
  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const event =
      params.get("event") || params.get("source") || params.get("eventType");
    if (event && booking?.contract?.contract_number) {
      handleRefreshStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.contract?.contract_number, location.search]);

  // NEW: Khi envelope xuất hiện sau khi booking load xong, tự động gọi getStatus để đồng bộ DB
  useEffect(() => {
    if (hasEnvelope) {
      handleRefreshStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasEnvelope]);

  if (loading) {
    return (
      <div className="contract-booking">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải hợp đồng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="contract-booking">
        <div className="error-container">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <div className="error-text">
              <h2>Lỗi tải hợp đồng</h2>
              <p>{error}</p>
              <button onClick={refreshBooking} className="retry-button">
                Thử lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="contract-booking">
        <div className="error-container">
          <div className="error-content">
            <div className="error-text">
              <h2>Không tìm thấy thông tin đặt xe</h2>
              <p>Vui lòng quay lại và chọn đơn đặt xe hợp lệ.</p>
              <Link to="/bookings" className="retry-button">
                Về danh sách đặt xe
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Đã bỏ renderActionButtons để tránh trùng nút, chỉ hiển thị nút trong banner

  const handleIFrameLoad = () => {
    try {
      const href = iframeRef.current?.contentWindow?.location?.href;
      if (!href) return;
      if (href.startsWith(window.location.origin)) {
        // Không ràng buộc đường dẫn cụ thể, miễn là đã quay về cùng origin
        setShowSignModal(false);
        setSignUrl("");
        handleRefreshStatus();
      }
    } catch {
      // ignore cross-origin while on DocuSign
    }
  };

  return (
    <div className="contract-booking">
      {/* Header + Back button */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-900">
          Hợp đồng thuê xe
        </h1>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          Quay về
        </button>
      </div>

      {/* Thông tin hợp đồng */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Thông tin hợp đồng
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Mã hợp đồng DocuSign</p>
            <p className="font-medium">
              {booking.contract?.contract_number || "Chưa có"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Trạng thái hợp đồng</p>
            <p className="font-medium">
              {(() => {
                const raw =
                  booking.contract?.contract_status ||
                  booking.contract?.status ||
                  "unknown";
                const map = {
                  pending_signatures: "Đang chờ ký",
                  completed: "Hoàn tất",
                  sent: "Đã gửi",
                  created: "Đã tạo",
                  unknown: "Không xác định",
                };
                return map[raw] || raw;
              })()}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Chủ xe đã ký</p>
            <p className="font-medium">
              {booking.contract?.owner_signed ||
              booking.contract?.owner_signed_at
                ? "Đã ký"
                : "Chưa ký"}
            </p>
            {booking.contract?.owner_signed_at && (
              <p className="text-sm text-gray-500">
                Thời gian ký:{" "}
                {new Date(booking.contract.owner_signed_at).toLocaleString(
                  "vi-VN"
                )}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600">Người thuê đã ký</p>
            <p className="font-medium">
              {booking.contract?.renter_signed ||
              booking.contract?.renter_signed_at
                ? "Đã ký"
                : "Chưa ký"}
            </p>
            {booking.contract?.renter_signed_at && (
              <p className="text-sm text-gray-500">
                Thời gian ký:{" "}
                {new Date(booking.contract.renter_signed_at).toLocaleString(
                  "vi-VN"
                )}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600">Trạng thái đơn thuê</p>
            <p className="font-medium">
              {(() => {
                const raw = booking.status || "unknown";
                const map = {
                  pending: "Chờ xác nhận",
                  deposit_paid: "Đã đặt cọc",
                  fully_paid: "Đã thanh toán toàn bộ",
                  in_progress: "Đang thuê",
                  completed: "Hoàn thành",
                  cancel_requested: "Yêu cầu hủy",
                  canceled: "Đã hủy",
                  unknown: "Không xác định",
                };
                return map[raw] || raw;
              })()}
            </p>
          </div>
        </div>
      </div>
      {/* Banner */}
      {(!hasEnvelope || renterNeedsSign) && (
        <div className="banner">
          <div className="banner-content">
            <div className="banner-text">
              {!hasEnvelope ? (
                <>
                  <h2>Chưa có hợp đồng để hiển thị</h2>
                  <p>
                    Vui lòng thanh toán đặt cọc để khởi tạo hợp đồng DocuSign.
                  </p>
                </>
              ) : renterNeedsSign ? (
                <>
                  <h2>Hợp đồng đang chờ bạn ký</h2>
                  <p>Nhấn "Ký hợp đồng" để hoàn tất.</p>
                </>
              ) : (
                <>
                  <h2>Bạn đã ký hợp đồng</h2>
                  <p>Chờ phía chủ xe ký để hoàn tất.</p>
                </>
              )}
            </div>
            <div className="banner-actions">
              {!hasEnvelope ? (
                <>
                  <Link
                    to={`/payment-deposit/${booking.booking_id}`}
                    className="btn btn-primary"
                  >
                    Thanh toán đặt cọc
                  </Link>
                  <Link
                    to={`/order-confirmation/${booking.booking_id}`}
                    className="btn btn-outline"
                  >
                    Xem lại đơn
                  </Link>
                </>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleSignContract}
                  disabled={!renterNeedsSign}
                >
                  Ký hợp đồng
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bỏ khu vực contract-actions để tránh hiển thị trùng nút ký */}

      <div className="contract-viewer">
        {initLoading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Đang khởi tạo hợp đồng DocuSign...</p>
          </div>
        )}
        {!initLoading && initError && (
          <div className="error-container">
            <div className="error-content">
              <div className="error-icon">⚠️</div>
              <div className="error-text">
                <h2>Khởi tạo hợp đồng thất bại</h2>
                <p>{initError}</p>
                {isPaidEnough ? (
                  <button
                    onClick={initContractIfNeeded}
                    className="retry-button"
                  >
                    Khởi tạo hợp đồng
                  </button>
                ) : (
                  <Link
                    to={`/payment-deposit/${booking.booking_id}`}
                    className="retry-button"
                  >
                    Thanh toán để khởi tạo
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {pdfLoading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Đang tải giao diện hợp đồng từ DocuSign...</p>
          </div>
        )}
        {!pdfLoading && !pdfError && contractPdfUrl && (
          <iframe
            title="Contract PDF"
            src={contractPdfUrl}
            style={{
              width: "100%",
              height: "80vh",
              border: "1px solid #ddd",
              borderRadius: 8,
            }}
          />
        )}
        {!pdfLoading && pdfError && (
          <div className="error-container">
            <div className="error-content">
              <div className="error-icon">⚠️</div>
              <div className="error-text">
                <h2>Lỗi tải hợp đồng DocuSign</h2>
                <p>{pdfError}</p>
                <button
                  onClick={() =>
                    booking && setContractPdfUrl("") && refreshBooking()
                  }
                  className="retry-button"
                >
                  Thử lại
                </button>
              </div>
            </div>
          </div>
        )}
        {!initLoading && !pdfLoading && !pdfError && !contractPdfUrl && (
          <div className="error-container">
            <div className="error-content">
              <div className="error-text">
                <h2>Chưa có hợp đồng để hiển thị</h2>
                <p>Vui lòng thanh toán và khởi tạo hợp đồng DocuSign.</p>
                {isPaidEnough ? (
                  <button
                    onClick={initContractIfNeeded}
                    className="retry-button"
                  >
                    Khởi tạo hợp đồng
                  </button>
                ) : (
                  <Link
                    to={`/payment-deposit/${booking.booking_id}`}
                    className="retry-button"
                  >
                    Thanh toán đặt cọc
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showSignModal} onOpenChange={setShowSignModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Ký hợp đồng DocuSign</DialogTitle>
          </DialogHeader>
          {signUrl ? (
            <iframe
              ref={iframeRef}
              onLoad={handleIFrameLoad}
              title="DocuSign"
              src={signUrl}
              style={{ width: "100%", height: "80vh", border: "none" }}
            />
          ) : (
            <div style={{ padding: 16 }}>Đang chuẩn bị URL ký...</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractBooking;
