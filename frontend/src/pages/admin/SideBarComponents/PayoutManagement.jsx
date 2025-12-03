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
  FileText,
  Ban,
  CircleCheck,
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

  // Detect dark mode and apply styles
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Watch for changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

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
    <div className="payout-management bg-gray-50 dark:bg-gray-900">
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
    <div className="payout-management bg-gray-50 dark:bg-gray-900">
      <div className="error-state text-gray-700 dark:text-gray-300">
          <XCircle size={48} className="text-red-500 dark:text-red-400" />
          <h3 className="text-gray-900 dark:text-white">{error}</h3>
          <button onClick={fetchPayouts} className="btn-retry bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payout-management bg-gray-50 dark:bg-gray-900">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <Wallet size={22} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Giải ngân cho chủ xe</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Danh sách các yêu cầu cần xử lý
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="!bg-blue-50 dark:!bg-blue-900/20 p-4 rounded-lg border !border-blue-200 dark:!border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm !text-blue-600 dark:!text-blue-400">Tổng số</p>
              <p className="text-2xl font-bold !text-blue-700 dark:!text-blue-300">{statistics.total || 0}</p>
            </div>
            <div className="p-2 !bg-blue-100 dark:!bg-blue-900/40 rounded-lg">
              <FileText className="w-6 h-6 !text-blue-600 dark:!text-blue-400" />
            </div>
          </div>
        </div>

        <div className="!bg-yellow-50 dark:!bg-yellow-900/20 p-4 rounded-lg border !border-yellow-200 dark:!border-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm !text-yellow-600 dark:!text-yellow-400">Chờ duyệt</p>
              <p className="text-2xl font-bold !text-yellow-700 dark:!text-yellow-300">{statistics.pending || 0}</p>
            </div>
            <div className="p-2 !bg-yellow-100 dark:!bg-yellow-900/40 rounded-lg">
              <Clock className="w-6 h-6 !text-yellow-600 dark:!text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="!bg-green-50 dark:!bg-green-900/20 p-4 rounded-lg border !border-green-200 dark:!border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm !text-green-600 dark:!text-green-400">Đã duyệt</p>
              <p className="text-2xl font-bold !text-green-700 dark:!text-green-300">{statistics.approved || 0}</p>
            </div>
            <div className="p-2 !bg-green-100 dark:!bg-green-900/40 rounded-lg">
              <CheckCircle className="w-6 h-6 !text-green-600 dark:!text-green-400" />
            </div>
          </div>
        </div>

        <div className="!bg-red-50 dark:!bg-red-900/20 p-4 rounded-lg border !border-red-200 dark:!border-red-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm !text-red-600 dark:!text-red-400">Từ chối</p>
              <p className="text-2xl font-bold !text-red-700 dark:!text-red-300">{statistics.rejected || 0}</p>
            </div>
            <div className="p-2 !bg-red-100 dark:!bg-red-900/40 rounded-lg">
              <Ban className="w-6 h-6 !text-red-600 dark:!text-red-400" />
            </div>
          </div>
        </div>

        <div className="!bg-emerald-50 dark:!bg-emerald-900/20 p-4 rounded-lg border !border-emerald-200 dark:!border-emerald-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm !text-emerald-600 dark:!text-emerald-400">Hoàn thành</p>
              <p className="text-2xl font-bold !text-emerald-700 dark:!text-emerald-300">{statistics.completed || 0}</p>
            </div>
            <div className="p-2 !bg-emerald-100 dark:!bg-emerald-900/40 rounded-lg">
              <CircleCheck className="w-6 h-6 !text-emerald-600 dark:!text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="!bg-orange-50 dark:!bg-orange-900/20 p-4 rounded-lg border !border-orange-200 dark:!border-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm !text-orange-600 dark:!text-orange-400">Thất bại</p>
              <p className="text-2xl font-bold !text-orange-700 dark:!text-orange-300">{statistics.failed || 0}</p>
            </div>
            <div className="p-2 !bg-orange-100 dark:!bg-orange-900/40 rounded-lg">
              <XCircle className="w-6 h-6 !text-orange-600 dark:!text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex gap-4 items-center">
        <div className="flex gap-2">
          <button
            onClick={() => { setFilter("all"); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => { setFilter("pending"); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "pending"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            Chờ duyệt
          </button>
          <button
            onClick={() => { setFilter("completed"); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "completed"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            Hoàn thành
          </button>
          <button
            onClick={() => { setFilter("cancelled"); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "cancelled"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            Từ chối
          </button>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search size={16} className="text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo payout, booking, chủ xe, xe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="table-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        {filteredAndSortedPayouts.length === 0 ? (
          <div className="empty-state text-gray-500 dark:text-gray-400">
            <CreditCard size={48} className="text-gray-400 dark:text-gray-500" />
            <h3 className="text-gray-700 dark:text-white">Chưa có yêu cầu thanh toán</h3>
            <p className="text-gray-500 dark:text-gray-400">Các yêu cầu thanh toán sẽ hiển thị ở đây</p>
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table className="payout-table modern">
                <thead className="bg-gray-50 dark:bg-gray-700">
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
                <tbody className="bg-white dark:bg-gray-800">
                  {filteredAndSortedPayouts.map((payout) => {
                    const statusInfo = getStatusInfo(payout.status);
                    const StatusIcon = statusInfo.icon;

                    const amounts = calcAmounts(payout);
                    return (
                      <tr key={payout.payout_id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="text-gray-900 dark:text-white">
                          <span className="payout-id">#{payout.payout_id}</span>
                        </td>
                        <td className="text-gray-900 dark:text-white">
                          <div className="booking-cell">
                            <span className="booking-id">
                              BK{payout.booking_info?.booking_id}
                            </span>
                          </div>
                        </td>
                        <td className="text-gray-900 dark:text-white">
                          <span className="owner-name">
                            {payout.owner_info?.full_name}
                          </span>
                        </td>
                        <td className="text-gray-900 dark:text-gray-300">
                          <span className="owner-email text-gray-900 dark:text-gray-300">
                            {payout.owner_info?.email}
                          </span>
                        </td>
                        <td className="text-gray-900 dark:text-gray-300">
                          <span className="owner-phone text-gray-900 dark:text-gray-300">
                            {payout.owner_info?.phone_number}
                          </span>
                        </td>
                        <td className="text-gray-900 dark:text-white">
                          <div className="bank-info">
                            {payout.owner_info?.bank_name ? (
                              <>
                                <div className="bank-name text-gray-900 dark:text-white">
                                  {payout.owner_info.bank_name}
                                </div>
                                <div className="account-number text-gray-700 dark:text-gray-300">
                                  {payout.owner_info.account_number}
                                </div>
                                <div className="account-holder text-gray-700 dark:text-gray-300">
                                  {payout.owner_info.account_holder_name}
                                </div>
                              </>
                            ) : (
                              <div className="no-bank text-red-500 dark:text-red-400">
                                Chưa có thông tin bank
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="text-gray-900 dark:text-white">
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
                              <div className="no-qr text-gray-500 dark:text-gray-400">Chưa có QR</div>
                            )}
                          </div>
                        </td>
                        <td className="text-green-600 dark:text-green-400">
                          <div className="amount">
                            {formatCurrency(amounts.total)}
                          </div>
                        </td>
                        <td className="text-green-600 dark:text-green-400">
                          <div className="amount">
                            {formatCurrency(amounts.offlineCash)}
                          </div>
                        </td>
                        <td className="text-green-600 dark:text-green-400">
                          <div className="amount">
                            {formatCurrency(amounts.platformFee)}
                          </div>
                        </td>
                        <td className="text-green-600 dark:text-green-400">
                          <div className="amount font-semibold">
                            {formatCurrency(amounts.finalToOwner)}
                          </div>
                        </td>
                        <td className="text-gray-900 dark:text-white">
                          <div className="date">
                            <span className="text-gray-900 dark:text-white">{format(
                              new Date(payout.created_at),
                              "dd/MM/yyyy",
                              { locale: vi }
                            )}</span>
                            <small className="text-gray-600 dark:text-gray-400">{format(
                              new Date(payout.created_at),
                              "HH:mm",
                              { locale: vi }
                            )}</small>
                          </div>
                        </td>
                        <td>
                          <div
                            className={`status-badge inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                              payout.status === "pending"
                                ? "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300"
                                : payout.status === "completed"
                                ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300"
                                : payout.status === "cancelled"
                                ? "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                            }`}
                          >
                            <StatusIcon size={16} />
                            <span>{statusInfo.text}</span>
                          </div>
                        </td>
                        <td className="text-gray-900 dark:text-white">
                          <div className="action-buttons">
                            {payout.status === "pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    showConfirmModal("approve", payout)
                                  }
                                  className="btn-approve !bg-green-600 hover:!bg-green-700 dark:!bg-green-700 dark:hover:!bg-green-800 !text-white"
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
                                  className="btn-reject !bg-red-600 hover:!bg-red-700 dark:!bg-red-700 dark:hover:!bg-red-800 !text-white"
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

            <div className="pagination bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="pagination-info text-gray-700 dark:text-gray-300">
                Trang {currentPage} / {totalPages}
              </div>
              <div className="pagination-btns">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn-page border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`btn-page border ${
                        currentPage === page
                          ? "bg-blue-600 dark:bg-blue-700 text-white border-blue-600 dark:border-blue-700"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn-page border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="modal-overlay bg-black/60 dark:bg-black/80" onClick={closeConfirmModal}>
          <div
            className="modal-content confirm-modal bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="modal-header !bg-white dark:!bg-gray-800 border-b border-gray-200 dark:border-gray-700"
              style={isDarkMode ? { backgroundColor: '#1f2937' } : { backgroundColor: 'white' }}
            >
              <h3 className="text-gray-900 dark:text-white">
                Xác nhận {confirmAction === "approve" ? "duyệt" : "từ chối"}{" "}
                thanh toán
              </h3>
              <button onClick={closeConfirmModal} className="btn-close text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                <XCircle size={20} />
              </button>
            </div>

            <div className="modal-body !bg-white dark:!bg-gray-800">
              <div className="confirm-content">
                <div className="confirm-icon">
                  {confirmAction === "approve" ? (
                    <CheckCircle size={48} className="approve-icon text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle size={48} className="reject-icon text-red-600 dark:text-red-400" />
                  )}
                </div>
                <p className="text-gray-900 dark:text-white">
                  Bạn có chắc chắn muốn{" "}
                  {confirmAction === "approve" ? "duyệt" : "từ chối"} thanh toán
                  <strong> #{confirmPayout.payout_id}</strong>?
                </p>
                <div className="grid grid-cols-2 gap-3 my-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Tổng đơn</span>
                    <strong className="text-gray-900 dark:text-white">
                      {formatCurrency(calcAmounts(confirmPayout).total)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Tiền mặt (renter → owner)</span>
                    <strong className="text-gray-900 dark:text-white">
                      {formatCurrency(calcAmounts(confirmPayout).offlineCash)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Phí nền tảng</span>
                    <strong className="text-gray-900 dark:text-white">
                      {formatCurrency(calcAmounts(confirmPayout).platformFee)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Cần chuyển cho owner</span>
                    <strong className="text-gray-900 dark:text-white">
                      {formatCurrency(calcAmounts(confirmPayout).finalToOwner)}
                    </strong>
                  </div>
                </div>
                <div className="payout-info bg-gray-200 dark:bg-gray-700">
                  <p className="text-gray-900 dark:text-white">
                    <strong className="text-gray-900 dark:text-white">Chủ xe:</strong>{" "}
                    {confirmPayout.owner_info?.full_name}
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    <strong className="text-gray-900 dark:text-white">Mã booking:</strong> BK
                    {confirmPayout.booking_info?.booking_id}
                  </p>
                </div>
                {confirmAction === "reject" && (
                  <div className="mt-3">
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      Lý do từ chối (tuỳ chọn)
                    </label>
                    <textarea
                      className="input w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Nhập lý do từ chối..."
                      value={confirmReason}
                      onChange={(e) => setConfirmReason(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            <div 
              className="modal-footer !bg-white dark:!bg-gray-800 border-t border-gray-200 dark:border-gray-700"
              style={isDarkMode ? { backgroundColor: '#1f2937' } : { backgroundColor: 'white' }}
            >
              <div className="action-buttons">
                <button onClick={closeConfirmModal} className="btn-cancel border !border-gray-300 dark:!border-gray-600 !text-gray-700 dark:!text-gray-300 hover:!bg-gray-50 dark:hover:!bg-gray-700 bg-white dark:bg-gray-700">
                  Hủy
                </button>
                <button
                  onClick={handleConfirmAction}
                  className={`btn-confirm ${
                    confirmAction === "approve" ? "btn-approve !bg-green-600 hover:!bg-green-700 dark:!bg-green-700 dark:hover:!bg-green-800" : "btn-reject !bg-red-600 hover:!bg-red-700 dark:!bg-red-700 dark:hover:!bg-red-800"
                  } !text-white`}
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
        <div className="modal-overlay bg-black/60 dark:bg-black/80" onClick={closeQrModal}>
          <div
            className="qr-modal-content bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="qr-modal-header !bg-gray-50 dark:!bg-gray-700 border-b border-gray-200 dark:border-gray-700">
              <h3 className="!text-gray-900 dark:!text-white">QR Code Thanh Toán</h3>
              <button onClick={closeQrModal} className="btn-close text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                <X size={24} />
              </button>
            </div>
            <div className="qr-modal-body !bg-white dark:!bg-gray-800">
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
