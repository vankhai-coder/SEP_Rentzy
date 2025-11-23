import React, { useState, useEffect, useMemo } from "react";
import axiosInstance from "../../../config/axiosInstance.js";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  CreditCard,
  Filter,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Wallet,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Eye,
  QrCode,
  DollarSign,
  X,
} from "lucide-react";
import { MdCheckCircle, MdCancel } from "react-icons/md";
import "./PayoutManagement.scss";

const PayoutManagement = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("DESC");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
    failed: 0,
  });

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmPayout, setConfirmPayout] = useState(null);
  const [confirmReason, setConfirmReason] = useState("");

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedQrCode, setSelectedQrCode] = useState(null);

  useEffect(() => {
    fetchPayouts();
  }, [currentPage, filter]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/admin/payouts", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          filter: filter !== "all" ? filter : undefined,
        },
      });

      if (response.data.success) {
        setPayouts(response.data.data.payouts);
        setTotalPages(response.data.data.totalPages);
        setStatistics(response.data.data.statistics);
      }
    } catch (error) {
      console.error("Error fetching payouts:", error);
      setError("Không thể tải dữ liệu thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (payoutId) => {
    try {
      const response = await axiosInstance.put(
        `/api/admin/payouts/${payoutId}/approve`
      );
      if (response.data.success) {
        fetchPayouts();
      }
    } catch (error) {
      console.error("Error approving payout:", error);
    }
  };

  const handleReject = async (payoutId, reason) => {
    try {
      const response = await axiosInstance.put(
        `/api/admin/payouts/${payoutId}/reject`,
        { reason }
      );
      if (response.data.success) {
        fetchPayouts();
      }
    } catch (error) {
      console.error("Error rejecting payout:", error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Tính toán các khoản tiền hiển thị theo yêu cầu
  const calcAmounts = (payout) => {
    const total = Number(
      payout?.booking_info?.total_amount ?? payout?.total_rental_amount ?? 0
    );
    const rate = Number(payout?.platform_commission_rate ?? 0.1);
    const cashApproved =
      payout?.booking_info?.remaining_paid_by_cash_status === "approved";
    const offlineCash = cashApproved ? total * 0.7 : 0; // 70% nếu đã xác nhận trả sau bằng tiền mặt
    const platformFee = total * rate; // 10% mặc định từ backend
    const finalToOwner = Math.max(total - offlineCash - platformFee, 0);
    return { total, offlineCash, platformFee, finalToOwner };
  };

  const openQrModal = (qrCodeUrl) => {
    setSelectedQrCode(qrCodeUrl);
    setIsQrModalOpen(true);
  };

  const closeQrModal = () => {
    setIsQrModalOpen(false);
    setSelectedQrCode(null);
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { icon: Clock, color: "#f59e0b", text: "Chờ duyệt" },
      approved: { icon: CheckCircle, color: "#10b981", text: "Đã duyệt" },
      cancelled: { icon: XCircle, color: "#ef4444", text: "Từ chối" },
      completed: { icon: MdCheckCircle, color: "#059669", text: "Hoàn thành" },
      failed: { icon: MdCancel, color: "#dc2626", text: "Thất bại" },
    };
    return (
      statusMap[status] || {
        icon: AlertCircle,
        color: "#6b7280",
        text: "Không xác định",
      }
    );
  };

  const filteredAndSortedPayouts = useMemo(() => {
    let filtered = payouts.filter((payout) => {
      const matchesSearch =
        searchTerm === "" ||
        payout.payout_id.toString().includes(searchTerm) ||
        payout.booking_info?.booking_id?.toString().includes(searchTerm) ||
        payout.owner_info?.full_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        payout.vehicle_info?.brand
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        payout.vehicle_info?.model
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      return matchesSearch;
    });

    filtered.sort((a, b) => {
      let aValue;
      let bValue;

      if (sortBy === "created_at") {
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
      } else if (sortBy === "final_amount") {
        aValue = calcAmounts(a).finalToOwner;
        bValue = calcAmounts(b).finalToOwner;
      } else if (sortBy === "total_amount") {
        aValue = Number(
          a?.booking_info?.total_amount ?? a?.total_rental_amount ?? 0
        );
        bValue = Number(
          b?.booking_info?.total_amount ?? b?.total_rental_amount ?? 0
        );
      } else {
        aValue = a[sortBy];
        bValue = b[sortBy];
      }

      if (sortOrder === "ASC") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [payouts, searchTerm, sortBy, sortOrder]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(field);
      setSortOrder("DESC");
    }
  };

  const showConfirmModal = (action, payout) => {
    setConfirmAction(action);
    setConfirmPayout(payout);
    setConfirmReason("");
    setIsConfirmModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (confirmAction === "approve") {
      await handleApprove(confirmPayout.payout_id);
    } else if (confirmAction === "reject") {
      await handleReject(confirmPayout.payout_id, confirmReason);
    }
    closeConfirmModal();
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setConfirmAction(null);
    setConfirmPayout(null);
  };

  const LoadingSkeleton = () => (
    <div className="payout-management">
      <div className="page-header">
        <div className="skeleton skeleton-text"></div>
      </div>
      <div className="stats-grid">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="stat-card">
            <div className="skeleton skeleton-text"></div>
          </div>
        ))}
      </div>
      <div className="table-card">
        <div className="skeleton skeleton-table"></div>
      </div>
    </div>
  );

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="payout-management">
        <div className="error-state">
          <XCircle size={48} />
          <h3>{error}</h3>
          <button onClick={fetchPayouts} className="btn-retry">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payout-management">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
            <Wallet size={22} className="text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Giải ngân cho chủ xe</h1>
            <p className="text-secondary-500">
              Danh sách các yêu cầu cần xử lý
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-primary px-2 py-0.5 text-xs">
            Tổng: {statistics.total || 0}
          </span>
          <span className="badge badge-warning px-2 py-0.5 text-xs">
            Chờ duyệt: {statistics.pending || 0}
          </span>
          <span className="badge badge-success px-2 py-0.5 text-xs">
            Hoàn thành: {statistics.completed || 0}
          </span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">{statistics.total || 0}</div>
            <div className="stat-label">Tổng số</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">{statistics.pending || 0}</div>
            <div className="stat-label">Chờ duyệt</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">{statistics.approved || 0}</div>
            <div className="stat-label">Đã duyệt</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">{statistics.rejected || 0}</div>
            <div className="stat-label">Từ chối</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">{statistics.completed || 0}</div>
            <div className="stat-label">Hoàn thành</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">{statistics.failed || 0}</div>
            <div className="stat-label">Thất bại</div>
          </div>
        </div>
      </div>

      <div className="controls">
        <div className="control-group">
          <Filter size={16} />
          <div className="flex items-center gap-2">
            <button
              className={`chip ${filter === "all" ? "chip-active" : ""}`}
              onClick={() => setFilter("all")}
            >
              Tất cả
            </button>
            <button
              className={`chip ${filter === "pending" ? "chip-active" : ""}`}
              onClick={() => setFilter("pending")}
            >
              Chờ duyệt
            </button>
            <button
              className={`chip ${filter === "completed" ? "chip-active" : ""}`}
              onClick={() => setFilter("completed")}
            >
              Hoàn thành
            </button>
            <button
              className={`chip ${filter === "cancelled" ? "chip-active" : ""}`}
              onClick={() => setFilter("cancelled")}
            >
              Từ chối
            </button>
          </div>
        </div>

        <div className="control-group">
          <Search size={16} />
          <input
            type="text"
            placeholder="Tìm theo payout, booking, chủ xe, xe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-card">
        {filteredAndSortedPayouts.length === 0 ? (
          <div className="empty-state">
            <CreditCard size={48} />
            <h3>Chưa có yêu cầu thanh toán</h3>
            <p>Các yêu cầu thanh toán sẽ hiển thị ở đây</p>
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table className="payout-table modern">
                <thead>
                  <tr>
                    <th
                      onClick={() => handleSort("payout_id")}
                      className="sortable"
                    >
                      <span>Mã thanh toán</span>
                      {sortBy === "payout_id" &&
                        (sortOrder === "ASC" ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        ))}
                    </th>
                    <th
                      onClick={() => handleSort("booking")}
                      className="sortable"
                    >
                      <span>Booking</span>
                      {sortBy === "booking" &&
                        (sortOrder === "ASC" ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        ))}
                    </th>
                    <th>Tên chủ xe</th>
                    <th>Email</th>
                    <th>Điện thoại</th>
                    <th>Thông tin Bank</th>
                    <th>QR Code</th>
                    <th
                      onClick={() => handleSort("total_amount")}
                      className="sortable"
                    >
                      <span>Tổng đơn</span>
                      {sortBy === "total_amount" &&
                        (sortOrder === "ASC" ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        ))}
                    </th>
                    <th>
                      <span>Tiền người thuê chuyển cho chủ xe</span>
                    </th>
                    <th>
                      <span>Phí nền tảng</span>
                    </th>
                    <th
                      onClick={() => handleSort("final_amount")}
                      className="sortable"
                    >
                      <span>Chủ xe thực nhận </span>
                      {sortBy === "final_amount" &&
                        (sortOrder === "ASC" ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        ))}
                    </th>
                    <th
                      onClick={() => handleSort("created_at")}
                      className="sortable"
                    >
                      <span>Ngày tạo</span>
                      {sortBy === "created_at" &&
                        (sortOrder === "ASC" ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        ))}
                    </th>
                    <th
                      onClick={() => handleSort("status")}
                      className="sortable"
                    >
                      <span>Trạng thái</span>
                      {sortBy === "status" &&
                        (sortOrder === "ASC" ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        ))}
                    </th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedPayouts.map((payout) => {
                    const statusInfo = getStatusInfo(payout.status);
                    const StatusIcon = statusInfo.icon;

                    const amounts = calcAmounts(payout);
                    return (
                      <tr key={payout.payout_id}>
                        <td>
                          <span className="payout-id">#{payout.payout_id}</span>
                        </td>
                        <td>
                          <div className="booking-cell">
                            <span className="booking-id">
                              BK{payout.booking_info?.booking_id}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="owner-name">
                            {payout.owner_info?.full_name}
                          </span>
                        </td>
                        <td>
                          <span className="owner-email">
                            {payout.owner_info?.email}
                          </span>
                        </td>
                        <td>
                          <span className="owner-phone">
                            {payout.owner_info?.phone_number}
                          </span>
                        </td>
                        <td>
                          <div className="bank-info">
                            {payout.owner_info?.bank_name ? (
                              <>
                                <div className="bank-name font-semibold">
                                  {payout.owner_info.bank_name}
                                </div>
                                <div className="account-number text-secondary-600">
                                  {payout.owner_info.account_number}
                                </div>
                                <div className="account-holder text-secondary-600">
                                  {payout.owner_info.account_holder_name}
                                </div>
                              </>
                            ) : (
                              <div className="no-bank text-secondary-500">
                                Chưa có thông tin bank
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="qr-code-cell">
                            {payout.owner_info?.qr_code ? (
                              <img
                                src={payout.owner_info.qr_code}
                                alt="QR Code"
                                className="qr-code-small"
                                onClick={() =>
                                  openQrModal(payout.owner_info.qr_code)
                                }
                              />
                            ) : (
                              <div className="no-qr">Chưa có QR</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="amount">
                            {formatCurrency(amounts.total)}
                          </div>
                        </td>
                        <td>
                          <div className="amount">
                            {formatCurrency(amounts.offlineCash)}
                          </div>
                        </td>
                        <td>
                          <div className="amount">
                            {formatCurrency(amounts.platformFee)}
                          </div>
                        </td>
                        <td>
                          <div className="amount font-semibold">
                            {formatCurrency(amounts.finalToOwner)}
                          </div>
                        </td>
                        <td>
                          <div className="date">
                            {format(
                              new Date(payout.created_at),
                              "dd/MM/yyyy HH:mm",
                              { locale: vi }
                            )}
                          </div>
                        </td>
                        <td>
                          <div
                            className={`status-badge ${
                              payout.status === "pending"
                                ? "badge-warning"
                                : payout.status === "completed"
                                ? "badge-success"
                                : payout.status === "cancelled"
                                ? "badge-danger"
                                : "badge-secondary"
                            }`}
                          >
                            <StatusIcon size={16} />
                            <span>{statusInfo.text}</span>
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            {payout.status === "pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    showConfirmModal("approve", payout)
                                  }
                                  className={`btn-approve`}
                                  title="Duyệt thanh toán"
                                  disabled={
                                    calcAmounts(payout).finalToOwner <= 0
                                  }
                                >
                                  Duyệt
                                </button>
                                <button
                                  onClick={() =>
                                    showConfirmModal("reject", payout)
                                  }
                                  className={`btn-reject`}
                                  title="Từ chối thanh toán"
                                >
                                  Huỷ duyệt
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <div className="pagination-info">
                Trang {currentPage} / {totalPages}
              </div>
              <div className="pagination-btns">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn-page"
                >
                  <ChevronLeft size={14} />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`btn-page ${
                        currentPage === page ? "active" : ""
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn-page"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Confirm Modal */}
      {isConfirmModalOpen && confirmPayout && (
        <div className="modal-overlay" onClick={closeConfirmModal}>
          <div
            className="modal-content confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                Xác nhận {confirmAction === "approve" ? "duyệt" : "từ chối"}{" "}
                thanh toán
              </h3>
              <button onClick={closeConfirmModal} className="btn-close">
                <XCircle size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="confirm-content">
                <div className="confirm-icon">
                  {confirmAction === "approve" ? (
                    <CheckCircle size={48} className="approve-icon" />
                  ) : (
                    <XCircle size={48} className="reject-icon" />
                  )}
                </div>
                <p>
                  Bạn có chắc chắn muốn{" "}
                  {confirmAction === "approve" ? "duyệt" : "từ chối"} thanh toán
                  <strong> #{confirmPayout.payout_id}</strong>?
                </p>
                <div className="grid grid-cols-2 gap-3 my-3">
                  <div className="flex items-center justify-between">
                    <span>Tổng đơn</span>
                    <strong>
                      {formatCurrency(calcAmounts(confirmPayout).total)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tiền mặt (renter → owner)</span>
                    <strong>
                      {formatCurrency(calcAmounts(confirmPayout).offlineCash)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Phí nền tảng</span>
                    <strong>
                      {formatCurrency(calcAmounts(confirmPayout).platformFee)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Cần chuyển cho owner</span>
                    <strong>
                      {formatCurrency(calcAmounts(confirmPayout).finalToOwner)}
                    </strong>
                  </div>
                </div>
                <div className="payout-info">
                  <p>
                    <strong>Chủ xe:</strong>{" "}
                    {confirmPayout.owner_info?.full_name}
                  </p>
                  <p>
                    <strong>Mã booking:</strong> BK
                    {confirmPayout.booking_info?.booking_id}
                  </p>
                </div>
                {confirmAction === "reject" && (
                  <div className="mt-3">
                    <label className="text-sm text-secondary-600">
                      Lý do từ chối (tuỳ chọn)
                    </label>
                    <textarea
                      className="input w-full mt-1"
                      rows={3}
                      placeholder="Nhập lý do từ chối..."
                      value={confirmReason}
                      onChange={(e) => setConfirmReason(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <div className="action-buttons">
                <button onClick={closeConfirmModal} className="btn-cancel">
                  Hủy
                </button>
                <button
                  onClick={handleConfirmAction}
                  className={`btn-confirm ${
                    confirmAction === "approve" ? "btn-approve" : "btn-reject"
                  }`}
                >
                  {confirmAction === "approve"
                    ? "Xác nhận duyệt"
                    : "Xác nhận từ chối"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {isQrModalOpen && (
        <div className="modal-overlay" onClick={closeQrModal}>
          <div
            className="qr-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="qr-modal-header">
              <h3>QR Code Thanh Toán</h3>
              <button onClick={closeQrModal} className="btn-close">
                <X size={24} />
              </button>
            </div>
            <div className="qr-modal-body">
              <img
                src={selectedQrCode}
                alt="QR Code"
                className="qr-code-large"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutManagement;
