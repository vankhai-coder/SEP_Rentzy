import React, { useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useContractBooking } from "./hooks/useContractBooking";
import "./ContractBooking.scss";
import axiosInstance from "@/config/axiosInstance";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ContractBooking = () => {
  const { bookingId } = useParams();
  const autoOpenTriggeredRef = useRef(false);

  const { booking, loading, error, refreshBooking } =
    useContractBooking(bookingId);

  // DocuSign state
  const [showSignModal, setShowSignModal] = useState(false);
  const [signUrl, setSignUrl] = useState("");

  // Contract PDF state
  const [contractPdfUrl, setContractPdfUrl] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");

  const handlePrint = () => {
    if (contractPdfUrl) {
      const w = window.open(contractPdfUrl, "_blank");
      if (w) w.focus();
    } else {
      window.print();
    }
  };
  const handleDownloadPDF = () => {
    if (contractPdfUrl) {
      const a = document.createElement("a");
      a.href = contractPdfUrl;
      a.download = `contract_${booking?.contract?.contract_number || bookingId}.pdf`;
      a.click();
    } else {
      window.print();
    }
  };

  // Handle DocuSign signing (renter role)
  const handleSignContract = async () => {
    try {
      const envelopeId = booking?.contract?.contract_number;
      if (!envelopeId) return alert("Không có thông tin hợp đồng để ký.");
      const resp = await axiosInstance.get(`/api/docusign/sign/${envelopeId}`, {
        params: { role: "renter" },
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

  // View combined contract PDF (open in new tab)
  const handleViewContractPdf = async () => {
    try {
      const envelopeId = booking?.contract?.contract_number;
      if (!envelopeId) return alert("Không có hợp đồng để xem.");
      const resp = await axiosInstance.get(
        `/api/docusign/documents/${envelopeId}/combined`,
        { responseType: "blob" }
      );
      const blobUrl = URL.createObjectURL(new Blob([resp.data], { type: "application/pdf" }));
      window.open(blobUrl, "_blank");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (err) {
      console.error("Error downloading contract PDF:", err);
      alert(err.response?.data?.error || "Không thể tải hợp đồng PDF.");
    }
  };

  // Fetch and display combined contract PDF when entering the page
  useEffect(() => {
    const envelopeId = booking?.contract?.contract_number;
    if (!envelopeId) return;

    let createdUrl = "";
    setPdfError("");
    setPdfLoading(true);

    axiosInstance
      .get(`/api/docusign/documents/${envelopeId}/combined`, {
        responseType: "blob",
      })
      .then((resp) => {
        const url = URL.createObjectURL(new Blob([resp.data], { type: "application/pdf" }));
        createdUrl = url;
        setContractPdfUrl(url);
      })
      .catch((err) => {
        console.error("Error fetching combined contract:", err);
        setPdfError(err.response?.data?.error || "Không thể lấy hợp đồng từ DocuSign");
      })
      .finally(() => {
        setPdfLoading(false);
      });

    return () => {
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [booking?.contract?.contract_number]);

  // Tự động mở popup ký DocuSign sau khi thanh toán thành công
  useEffect(() => {
    if (autoOpenTriggeredRef.current) return;
    if (!booking?.contract) return;

    const shouldOpen =
      booking.contract.contract_status === "pending_signatures" &&
      !booking.contract.renter_signed_at &&
      (booking.status === "deposit_paid" || booking.status === "fully_paid");

    if (shouldOpen) {
      autoOpenTriggeredRef.current = true;
      handleSignContract();
    }
  }, [booking]);

  

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
            <div className="error-icon">ℹ️</div>
            <div className="error-text">
              <h2>Không có thông tin booking</h2>
              <button onClick={refreshBooking} className="retry-button">
                Tải lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="contract-booking">
      <div className="contract-actions">
        <button onClick={handleSignContract} disabled={!booking?.contract?.contract_number}>
          Ký hợp đồng
        </button>
        <button onClick={handleViewContractPdf} disabled={!booking?.contract?.contract_number}>
          Mở PDF trong tab mới
        </button>
        <button onClick={handleDownloadPDF} disabled={!contractPdfUrl}>
          Tải PDF
        </button>
        <button onClick={handlePrint}>In</button>
      </div>

      <div className="contract-viewer">
        {pdfLoading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Đang tải giao diện hợp đồng từ DocuSign...</p>
          </div>
        )}
        {!pdfLoading && pdfError && (
          <div className="error-container">
            <div className="error-content">
              <div className="error-icon">⚠️</div>
              <div className="error-text">
                <h2>Lỗi tải hợp đồng DocuSign</h2>
                <p>{pdfError}</p>
                <button onClick={() => booking && setContractPdfUrl("") && refreshBooking()} className="retry-button">
                  Thử lại
                </button>
              </div>
            </div>
          </div>
        )}
        {!pdfLoading && !pdfError && contractPdfUrl && (
          <iframe
            title="Contract PDF"
            src={contractPdfUrl}
            style={{ width: "100%", height: "80vh", border: "1px solid #ddd", borderRadius: 8 }}
          />
        )}
        {!pdfLoading && !pdfError && !contractPdfUrl && (
          <div className="error-container">
            <div className="error-content">
              <div className="error-icon">ℹ️</div>
              <div className="error-text">
                <h2>Chưa có hợp đồng để hiển thị</h2>
                <p>Vui lòng thanh toán và khởi tạo hợp đồng DocuSign.</p>
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
