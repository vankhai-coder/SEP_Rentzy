import React, { useEffect, useRef, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import axiosInstance from "@/config/axiosInstance";
import "./ContractOwner.scss";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ContractOwner = () => {
  const { id } = useParams();
  const location = useLocation();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showSignModal, setShowSignModal] = useState(false);
  const [signUrl, setSignUrl] = useState("");
  const iframeRef = useRef(null);

  const [contractPdfUrl, setContractPdfUrl] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");

  const fetchBookingDetail = async () => {
    try {
      setLoading(true);
      setError("");
      const resp = await axiosInstance.get(`/api/owner/dashboard/bookings/detail/${id}`);
      if (resp.data?.success && resp.data?.data) {
        setBooking(resp.data.data);
      } else {
        setError("Không thể tải thông tin đơn thuê");
      }
    } catch (err) {
      console.error("Error fetching booking detail:", err);
      setError(err.response?.data?.message || "Có lỗi xảy ra khi tải thông tin đơn thuê");
    } finally {
      setLoading(false);
    }
  };

  const hasEnvelope = !!booking?.contract?.contract_number;
  const ownerHasSigned = Boolean(booking?.contract?.owner_signed_at) || booking?.contract?.owner_signed === true;
  const ownerNeedsSign = !!booking?.contract && hasEnvelope && !ownerHasSigned;

  const handleSignContract = async () => {
    try {
      const envelopeId = booking?.contract?.contract_number;
      if (!envelopeId) return alert("Không có thông tin hợp đồng để ký.");
      const fePublic = import.meta.env.VITE_FRONTEND_PUBLIC_URL || window.location.origin;
      const currentPath = window.location.pathname; // giữ nguyên đường dẫn hiện tại
      const returnUrl = `${fePublic}${currentPath}`;
      const resp = await axiosInstance.get(`/api/docusign/sign/${envelopeId}`, {
        params: { role: "owner", returnUrl },
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
      const resp = await axiosInstance.get(`/api/docusign/documents/${envelopeId}/combined`, {
        responseType: "blob",
      });
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
    const event = params.get("event") || params.get("source") || params.get("eventType");
    const clientUserId = params.get("client_user_id") || params.get("clientUserId");
    if (event || clientUserId) {
      handleRefreshStatus();
      setShowSignModal(false);
      setSignUrl("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  // Khi có event và đã có envelope
  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const event = params.get("event") || params.get("source") || params.get("eventType");
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

  if (loading) {
    return (
      <div className="contract-owner">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải hợp đồng...</p>
        </div>
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

  const renderActionButtons = () => {
    return (
      <div className="actions-row">
        <button
          className="btn btn-primary"
          onClick={handleSignContract}
          disabled={!hasEnvelope || !ownerNeedsSign}
          title={ownerNeedsSign ? "Mở giao diện ký DocuSign" : "Bạn đã ký hợp đồng"}
        >
          {ownerNeedsSign ? "Ký hợp đồng" : "Đã ký"}
        </button>
      </div>
    );
  };

  return (
    <div className="contract-owner">
      {/* Banner */}
      {(!hasEnvelope || ownerNeedsSign) && (
        <div className="banner">
          <div className="banner-content">
            <div className="banner-text">
              {!hasEnvelope ? (
                <>
                  <h2>Chưa có hợp đồng để hiển thị</h2>
                  <p>Vui lòng chờ người thuê thanh toán đặt cọc để khởi tạo hợp đồng.</p>
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
                  <Link to="/owner/booking-management" className="btn btn-outline">
                    Về danh sách đơn
                  </Link>
                </>
              ) : (
                <button className="btn btn-primary" onClick={handleSignContract} disabled={!ownerNeedsSign}>
                  Ký hợp đồng
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="contract-actions">
        {renderActionButtons()}
        <div className="action-hint">
          {!hasEnvelope && <span>Chưa khởi tạo hợp đồng. Hãy đợi người thuê thanh toán.</span>}
          {hasEnvelope && !ownerNeedsSign && <span>Bạn đã ký. Có thể xem PDF hợp đồng.</span>}
        </div>
      </div>

      <div className="contract-viewer">
        {pdfLoading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Đang tải hợp đồng DocuSign...</p>
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
            <iframe src={contractPdfUrl} title="Contract PDF" className="pdf-iframe" />
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
            <iframe ref={iframeRef} src={signUrl} title="DocuSign Signing" className="w-full h-[70vh] rounded" />
          ) : (
            <div className="text-gray-600">Đang chuẩn bị URL ký...</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractOwner;