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

  const handleReject = async (payoutId) => {
    try {
      const response = await axiosInstance.put(
        `/api/admin/payouts/${payoutId}/reject`
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
        payout.booking_info?.booking_id
          ?.toString()
          .includes(searchTerm) ||
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
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "created_at") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
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
    setIsConfirmModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (confirmAction === "approve") {
      await handleApprove(confirmPayout.payout_id);
    } else if (confirmAction === "reject") {
      await handleReject(confirmPayout.payout_id);
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
        <Wallet size={24} />
        <div>
          <h1>Quản lý thanh toán</h1>
          <p>Quản lý các yêu cầu thanh toán cho chủ xe</p>
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
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Tất cả</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="cancelled">Từ chối</option>
            <option value="completed">Hoàn thành</option>
            <option value="failed">Thất bại</option>
            <option value="processed">Đã xử lý</option>
          </select>
        </div>

        <div className="control-group">
          <Search size={16} />
          <input
            type="text"
            placeholder="Tìm kiếm..."
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
              <table className="payout-table">
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
                    <th>Chủ xe</th>
                    <th>Xe</th>
                    <th>Thông tin Bank</th>
                    <th>QR Code</th>
                    <th
                      onClick={() => handleSort("amount")}
                      className="sortable"
                    >
                      <span>Số tiền</span>
                      {sortBy === "amount" &&
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

                    return (
                      <tr key={payout.payout_id}>
                        <td>
                          <span className="payout-id">
                            #{payout.payout_id}
                          </span>
                        </td>
                        <td>
                          <span className="booking-id">
                            BK{payout.booking_info?.booking_id}
                          </span>
                        </td>
                        <td>
                          <div className="user-info">
                            <div className="user-name">
                              {payout.owner_info?.full_name}
                            </div>
                            <div className="user-email">
                              {payout.owner_info?.email}
                            </div>
                            <div className="user-phone">
                              {payout.owner_info?.phone_number}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="vehicle-info">
                            <div className="vehicle-name">
                              {payout.vehicle_info?.brand}{" "}
                              {payout.vehicle_info?.model}
                            </div>
                            <div className="vehicle-plate">
                              {payout.vehicle_info?.license_plate}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="bank-info">
                            {payout.owner_info?.bank_name ? (
                              <>
                                <div className="bank-name">
                                  {payout.owner_info.bank_name}
                                </div>
                                <div className="account-number">
                                  {payout.owner_info.account_number}
                                </div>
                                <div className="account-holder">
                                  {payout.owner_info.account_holder_name}
                                </div>
                              </>
                            ) : (
                              <div className="no-bank">Chưa có thông tin bank</div>
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
                                onClick={() => openQrModal(payout.owner_info.qr_code)}
                              />
                            ) : (
                              <div className="no-qr">Chưa có QR</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="amount">
                            {formatCurrency(payout.total_rental_amount)}
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
                            className="status-badge"
                            style={{ color: statusInfo.color }}
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
                                  className="btn-approve"
                                  title="Duyệt thanh toán"
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button
                                  onClick={() =>
                                    showConfirmModal("reject", payout)
                                  }
                                  className="btn-reject"
                                  title="Từ chối thanh toán"
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            )}
                            <button className="btn-view" title="Xem chi tiết">
                              <Eye size={16} />
                            </button>
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
                  <strong> #{confirmPayout.payout_id}</strong> với số tiền
                  <strong>
                    {" "}
                    {formatCurrency(confirmPayout.total_rental_amount)}
                  </strong>
                  ?
                </p>
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
          <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
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
