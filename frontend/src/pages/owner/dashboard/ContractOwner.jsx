import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link, useLocation } from "react-router-dom";
import axiosInstance from "@/config/axiosInstance";
import "./ContractOwner.scss";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getBasicUserInformation } from "@/redux/features/auth/userInformationSlice";

const ContractOwner = () => {
  const { id } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const { email: ownerEmail } = useSelector((state) => state.userInformationStore);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showSignModal, setShowSignModal] = useState(false);
  const [signUrl, setSignUrl] = useState("");
  const iframeRef = useRef(null);
  const prevOwnerNeedsSignRef = useRef(null);
  // OTP state
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");

  const [contractPdfUrl, setContractPdfUrl] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");

  const fetchBookingDetail = async () => {
    try {
      setLoading(true);
      setError("");
      const resp = await axiosInstance.get(
        `/api/owner/dashboard/bookings/detail/${id}`
      );
      if (resp.data?.success && resp.data?.data) {
        setBooking(resp.data.data);
      } else {
        setError("Không thể tải thông tin đơn thuê");
      }
    } catch (err) {
      console.error("Error fetching booking detail:", err);
      setError(
        err.response?.data?.message ||
          "Có lỗi xảy ra khi tải thông tin đơn thuê"
      );
    } finally {
      setLoading(false);
    }
  };

  // Lấy thông tin cơ bản của chủ xe (để kiểm tra email có hay không)
  useEffect(() => {
    dispatch(getBasicUserInformation());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isOwnerEmailMissing = !ownerEmail || !ownerEmail.trim();

  const hasEnvelope = !!booking?.contract?.contract_number;
  const ownerHasSigned =
    Boolean(booking?.contract?.owner_signed_at) ||
    booking?.contract?.owner_signed === true;
  const ownerNeedsSign = !!booking?.contract && hasEnvelope && !ownerHasSigned;

  const sendOtp = async () => {
    try {
      setOtpError("");
      setOtpSent(false);
      setOtpSending(true);
      const envelopeId = booking?.contract?.contract_number;
      if (!envelopeId) {
        toast.error("Không có thông tin hợp đồng để ký.");
        return;
      }
      await axiosInstance.post(`/api/docusign/sign/send-otp`, {
        envelopeId,
        role: "owner",
        email: ownerEmail,
      });
      setOtpSent(true);
      toast.info("Đã gửi OTP tới email của bạn.");
    } catch (err) {
      console.error("Error sending OTP:", err);
      toast.error(err.response?.data?.error || "Không thể gửi OTP. Vui lòng thử lại.");
      setOtpError(err.response?.data?.error || "Không thể gửi OTP. Vui lòng thử lại.");
    } finally {
      setOtpSending(false);
    }
  };

  const verifyOtpAndOpenSigning = async () => {
    try {
      setOtpError("");
      setOtpVerifying(true);
      const envelopeId = booking?.contract?.contract_number;
      if (!envelopeId) {
        toast.error("Không có thông tin hợp đồng để ký.");
        return;
      }
      // const fePublic =
      //   import.meta.env.VITE_FRONTEND_PUBLIC_URL || window.location.origin;
      // const currentPath = window.location.pathname;
      // const returnUrl = `${fePublic}${currentPath}`;
      const resp = await axiosInstance.get(`/api/docusign/sign/${envelopeId}`, {
        params: {
          role: "owner",
          // returnUrl, // Let backend default to /api/docusign/return
          otp,
          email: ownerEmail,
          clientUserId: ownerEmail || "owner",
        },
      });
      const url = resp.data?.url;
      if (url) {
        setSignUrl(url);
      } else {
        setOtpError("OTP không chính xác hoặc đã hết hạn.");
        toast.error("OTP không chính xác hoặc đã hết hạn.");
      }
    } catch (err) {
      console.error("Error verifying OTP / creating recipient view:", err);
      const data = err.response?.data || {};
      setOtpError(data.message || data.error || "OTP không chính xác hoặc đã hết hạn.");
      toast.error(data.message || data.error || "OTP không chính xác hoặc đã hết hạn.");
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleSignContract = async () => {
    if (isOwnerEmailMissing) {
      toast.error(
        "Thiếu email người ký. Vui lòng cập nhật email để nhận OTP ký DocuSign."
      );
      return;
    }
    setSignUrl("");
    setOtp("");
    setOtpError("");
    setOtpSent(false);
    setShowSignModal(true);
    await sendOtp();
  };

  const handleRefreshStatus = async () => {
    try {
      const envelopeId = booking?.contract?.contract_number;
      if (!envelopeId) return;
      await axiosInstance.get(`/api/docusign/status/${envelopeId}`);
      await fetchBookingDetail();
    } catch (err) {
      console.error("Error refreshing DocuSign status:", err);
    }
  };

  const fetchCombinedPdf = async () => {
    try {
      const envelopeId = booking?.contract?.contract_number;
      if (!envelopeId) return;
      setPdfLoading(true);
      setPdfError("");
      const resp = await axiosInstance.get(
        `/api/docusign/documents/${envelopeId}/combined`,
        {
          responseType: "blob",
        }
      );
      const blob = new Blob([resp.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      setContractPdfUrl(url);
    } catch (err) {
      console.error("Error fetching contract PDF:", err);
      setPdfError(err.response?.data?.error || "Không thể tải hợp đồng PDF.");
    } finally {
      setPdfLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingDetail();
  }, [id]);

  // Khi quay về từ DocuSign returnUrl, tự refresh trạng thái
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
      toast.success("Đã cập nhật trạng thái hợp đồng sau khi ký.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  // Listen for postMessage from backend return page (iframe/popup)
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data === 'signing_complete') {
        console.log("Received signing_complete message");
        // Force refresh regardless of current booking state closure
        // We can fetch from ID in URL if booking is stale, or use functional state updates
        // But simplest is to ensure this effect has fresh dependencies
        handleRefreshStatus();
        setShowSignModal(false);
        setSignUrl("");
        toast.success("Đã hoàn tất ký hợp đồng!");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [booking, handleRefreshStatus]);

  // Khi có event và đã có envelope
  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const event =
      params.get("event") || params.get("source") || params.get("eventType");
    if (event && booking?.contract?.contract_number) {
      handleRefreshStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.contract?.contract_number, location.search]);

  // Khi envelope xuất hiện sau khi booking load xong
  useEffect(() => {
    if (hasEnvelope) {
      handleRefreshStatus();
      fetchCombinedPdf();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasEnvelope]);

  // Toast khi trạng thái chuyển từ cần ký -> đã ký
  useEffect(() => {
    if (prevOwnerNeedsSignRef.current === true && ownerHasSigned) {
      toast.success("Ký hợp đồng thành công!");
    }
    prevOwnerNeedsSignRef.current = ownerNeedsSign;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerHasSigned, ownerNeedsSign]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="contract-owner">
        <div className="error-container">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <div className="error-text">
              <h2>Lỗi tải hợp đồng</h2>
              <p>{error}</p>
              <button onClick={fetchBookingDetail} className="retry-button">
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
      <div className="contract-owner">
        <div className="error-container">
          <div className="error-content">
            <div className="error-text">
              <h2>Không tìm thấy thông tin đơn thuê</h2>
              <p>Vui lòng quay lại và chọn đơn thuê hợp lệ.</p>
              <Link to="/owner/booking-management" className="retry-button">
                Về danh sách đơn
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Đã bỏ renderActionButtons để chỉ hiển thị một nút trong banner

  return (
    <div className="contract-owner">
      {isOwnerEmailMissing && (
        <div className="banner">
          <div className="banner-content">
            <div className="banner-text">
              <h2>Thiếu email người ký</h2>
              <p>
                Vui lòng cập nhật email để nhận OTP và ký hợp đồng DocuSign.
              </p>
            </div>
            <div className="banner-actions">
              <Link to="/account" className="btn btn-primary">
                Cập nhật email
              </Link>
            </div>
          </div>
        </div>
      )}
      {/* Thông tin hợp đồng */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
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
      {(!hasEnvelope || ownerNeedsSign) && (
        <div className="banner">
          <div className="banner-content">
            <div className="banner-text">
              {!hasEnvelope ? (
                <>
                  <h2>Chưa có hợp đồng để hiển thị</h2>
                  <p>
                    Vui lòng chờ người thuê thanh toán đặt cọc để khởi tạo hợp
                    đồng.
                  </p>
                </>
              ) : ownerNeedsSign ? (
                <>
                  <h2>Hợp đồng đang chờ bạn ký</h2>
                  <p>Nhấn "Ký hợp đồng" để hoàn tất.</p>
                </>
              ) : (
                <>
                  <h2>Bạn đã ký hợp đồng</h2>
                  <p>Chờ phía người thuê ký để hoàn tất (nếu chưa ký).</p>
                </>
              )}
            </div>
            <div className="banner-actions">
              {!hasEnvelope ? (
                <>
                  <Link
                    to="/owner/booking-management"
                    className="btn btn-outline"
                  >
                    Về danh sách đơn
                  </Link>
                </>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleSignContract}
                  disabled={!ownerNeedsSign || isOwnerEmailMissing}
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
        {pdfLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}
        {!pdfLoading && pdfError && (
          <div className="error-container">
            <div className="error-content">
              <div className="error-icon">⚠️</div>
              <div className="error-text">
                <h2>Tải hợp đồng thất bại</h2>
                <p>{pdfError}</p>
                <button onClick={fetchCombinedPdf} className="retry-button">
                  Thử lại
                </button>
              </div>
            </div>
          </div>
        )}
        {!pdfLoading && !pdfError && !contractPdfUrl && (
          <div className="error-container">
            <div className="error-content">
              <div className="error-text">
                <h2>Chưa có hợp đồng để hiển thị</h2>
                <p>Vui lòng chờ hợp đồng DocuSign được khởi tạo.</p>
              </div>
            </div>
          </div>
        )}
        {!pdfLoading && !pdfError && contractPdfUrl && (
          <div className="pdf-container">
            <iframe
              src={contractPdfUrl}
              title="Contract PDF"
              className="pdf-iframe"
            />
          </div>
        )}
      </div>

      {/* Sign Contract Modal */}
      <Dialog open={showSignModal} onOpenChange={setShowSignModal}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>Ký hợp đồng</DialogTitle>
          </DialogHeader>
          {signUrl ? (
            <iframe
              ref={iframeRef}
              src={signUrl}
              title="DocuSign Signing"
              className="w-full h-[70vh] rounded"
            />
          ) : (
            <div className="space-y-4">
              <p className="text-gray-700">Nhập mã OTP đã gửi tới email của bạn để mở trang ký.</p>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !otpVerifying && otp) {
                      verifyOtpAndOpenSigning();
                    }
                  }}
                  placeholder="Nhập mã OTP"
                  className="flex-1 border rounded px-3 py-2"
                />
                <button
                  onClick={verifyOtpAndOpenSigning}
                  disabled={otpVerifying || !otp}
                  className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
                >
                  {otpVerifying ? "Đang xác thực..." : "Xác nhận"}
                </button>
              </div>
              {otpError && <p className="text-red-600 text-sm">{otpError}</p>}
              <div className="flex items-center gap-3">
                <button
                  onClick={sendOtp}
                  disabled={otpSending}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded"
                >
                  {otpSending ? "Đang gửi OTP..." : "Gửi lại OTP"}
                </button>
                {otpSent && (
                  <span className="text-green-600 text-sm">Đã gửi OTP tới email của bạn.</span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractOwner;
