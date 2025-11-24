import React, { useState, useEffect, useMemo } from "react";
import axiosInstance from "../../../config/axiosInstance.js";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import "./TransactionManagement.scss";
import { useOwnerTheme } from "@/contexts/OwnerThemeContext";
import { createThemeUtils } from "@/utils/themeUtils";
import {
  CreditCard,
  Wallet,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  Car,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./TransactionManagement.scss";

const TransactionManagement = () => {
  const theme = useOwnerTheme();
  const themeUtils = createThemeUtils(theme);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [statistics, setStatistics] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    moneyIn: 0,
    moneyOut: 0,
  });

  const transactionTypeLabels = {
    income: "Thu nhập",
    compensation: "Bồi thường",
    payout: "Thanh toán",
    deposit: "Đặt cọc",
    rental_payment: "Thanh toán thuê",
    refund: "Hoàn tiền",
    cancellation_fee: "Phí hủy",
    platform_fee: "Phí nền tảng",
    payment: "Thanh toán",
    booking: "Đặt xe",
  };

  const transactionStatusLabels = {
    pending: "Chờ xử lý",
    completed: "Hoàn thành",
    processing: "Đang xử lý",
    failed: "Thất bại",
    cancelled: "Đã hủy",
    success: "Thành công",
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        sortBy,
        sortOrder,
      };

      const response = await axiosInstance.get(
        "/api/owner/dashboard/transactions",
        { params }
      );

      if (response.data.success) {
        const txs = response.data.data.transactions || [];
        setTransactions(txs);
        setTotalPages(response.data.data.pagination?.totalPages || 1);

        // Tính toán thống kê
        const stats = txs.reduce(
          (acc, t) => {
            acc.totalTransactions++;
            const amt = parseFloat(t.amount) || 0;
            acc.totalAmount += amt;
            if (amt > 0) acc.moneyIn += amt;
            else acc.moneyOut += Math.abs(amt);
            return acc;
          },
          { totalTransactions: 0, totalAmount: 0, moneyIn: 0, moneyOut: 0 }
        );
        setStatistics(stats);
      } else {
        setTransactions([]);
        setError("Không thể tải danh sách giao dịch");
      }
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách giao dịch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return transactions;
    return transactions.filter((t) =>
      [t.id, t.bookingCode, t.renter?.name, t.vehicle?.licensePlate].some(
        (val) =>
          val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [transactions, searchTerm]);

  const formatCurrency = (amt) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amt);

  const formatDate = (dateStr) =>
    format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });

  const statusInfo = (status) => {
    const map = {
      pending: { icon: Clock, color: "pending", label: "Chờ xử lý" },
      completed: { icon: CheckCircle, color: "completed", label: "Hoàn thành" },
      failed: { icon: XCircle, color: "failed", label: "Thất bại" },
      cancelled: { icon: AlertCircle, color: "cancelled", label: "Đã hủy" },
      processing: { icon: Clock, color: "pending", label: "Đang xử lý" },
      success: { icon: CheckCircle, color: "completed", label: "Thành công" },
    };
    return (
      map[status] || { icon: AlertCircle, color: "neutral", label: status }
    );
  };

  // const typeInfo = (type) => {
  //   const map = {
  //     income: { icon: TrendingUp, color: "income", label: "Thu nhập" },
  //     compensation: {
  //       icon: DollarSign,
  //       color: "compensation",
  //       label: "Bồi thường",
  //     },
  //     payout: { icon: TrendingUp, color: "payout", label: "Thanh toán" },
  //     deposit: { icon: Wallet, color: "deposit", label: "Đặt cọc" },
  //     rental_payment: {
  //       icon: CreditCard,
  //       color: "income",
  //       label: "Thanh toán thuê",
  //     },
  //     refund: { icon: TrendingDown, color: "refund", label: "Hoàn tiền" },
  //     cancellation_fee: { icon: XCircle, color: "failed", label: "Phí hủy" },
  //     platform_fee: {
  //       icon: DollarSign,
  //       color: "neutral",
  //       label: "Phí nền tảng",
  //     },
  //     payment: { icon: CreditCard, color: "income", label: "Thanh toán" },
  //     booking: { icon: Car, color: "deposit", label: "Đặt xe" },
  //   };
  //   return map[type] || { icon: DollarSign, color: "neutral", label: type };
  // };

  const handleSort = (field) => {
    if (sortBy === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handlePageChange = (page) => setCurrentPage(page);

  if (loading)
    return (
      <div className="transaction-history">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="transaction-history">
        <div className="error-container">
          <XCircle size={48} />
          <h3>Có lỗi xảy ra</h3>
          <p>{error}</p>
          <button onClick={fetchTransactions} className="retry-button">
            Thử lại
          </button>
        </div>
      </div>
    );

  return (
    <div className={`transaction-history min-h-screen ${themeUtils.bgMain}`}>
      {/* Header */}
      <div className={`page-header ${themeUtils.textPrimary}`}>
        <h1 className={themeUtils.textPrimary}>
          <Wallet size={28} /> Quản lý giao dịch
        </h1>
        <p className={themeUtils.textSecondary}>Theo dõi và quản lý tất cả giao dịch của bạn</p>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card dark:bg-secondary-800 dark:border-secondary-700">
          <CreditCard size={24} className="dark:text-white" />
          <div>
            <h3 className="dark:text-gray-300">Tổng giao dịch</h3>
            <p className="dark:text-white">{statistics.totalTransactions}</p>
          </div>
        </div>
        <div className="stat-card dark:bg-secondary-800 dark:border-secondary-700">
          <DollarSign size={24} className="dark:text-white" />
          <div>
            <h3 className="dark:text-gray-300">Tổng tiền</h3>
            <p className="dark:text-white">{formatCurrency(statistics.totalAmount)}</p>
          </div>
        </div>
        <div className="stat-card dark:bg-secondary-800 dark:border-secondary-700">
          <TrendingUp size={24} className="dark:text-green-400" />
          <div>
            <h3 className="dark:text-gray-300">Tiền vào</h3>
            <p className="income dark:text-green-400">{formatCurrency(statistics.moneyIn)}</p>
          </div>
        </div>
        <div className="stat-card dark:bg-secondary-800 dark:border-secondary-700">
          <TrendingDown size={24} className="dark:text-red-400" />
          <div>
            <h3 className="dark:text-gray-300">Tiền ra</h3>
            <p className="expense dark:text-red-400">{formatCurrency(statistics.moneyOut)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section dark:bg-secondary-800 dark:border-secondary-700">
        <div className="filters-header dark:text-white">
          <Filter size={20} /> Bộ lọc
        </div>
        <div className="filters-content">
          <div className="search-box">
            <Search size={18} className="dark:text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="dark:bg-secondary-700 dark:text-white dark:border-secondary-600"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="dark:bg-secondary-700 dark:text-white dark:border-secondary-600"
          >
            <option value="all">Tất cả trạng thái</option>
            {Object.keys(transactionStatusLabels).map((k) => (
              <option key={k} value={k}>
                {transactionStatusLabels[k]}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="dark:bg-secondary-700 dark:text-white dark:border-secondary-600"
          >
            <option value="all">Tất cả loại</option>
            {Object.keys(transactionTypeLabels).map((k) => (
              <option key={k} value={k}>
                {transactionTypeLabels[k]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-scroll dark:bg-secondary-800">
        <table className="dark:text-white">
          <thead className="dark:bg-secondary-900">
            <tr>
              <th onClick={() => handleSort("id")} className="dark:text-gray-300">
                ID{" "}
                {sortBy === "id" ? (
                  sortOrder === "asc" ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )
                ) : null}
              </th>
              <th className="dark:text-gray-300">Mã đặt xe</th>
              <th className="dark:text-gray-300">Người thuê</th>
              <th className="dark:text-gray-300">Xe</th>
              <th onClick={() => handleSort("amount")} className="dark:text-gray-300">
                Số tiền{" "}
                {sortBy === "amount" ? (
                  sortOrder === "asc" ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )
                ) : null}
              </th>
              {/* <th>Loại</th> */}
              <th className="dark:text-gray-300">Trạng thái</th>
              <th onClick={() => handleSort("createdAt")} className="dark:text-gray-300">
                Ngày{" "}
                {sortBy === "createdAt" ? (
                  sortOrder === "asc" ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )
                ) : null}
              </th>
            </tr>
          </thead>
          <tbody className="dark:bg-secondary-800">
            {filteredTransactions.map((tx) => {
              const status = statusInfo(tx.paymentStatus);
              // const type = typeInfo(tx.type);
              return (
                <tr key={tx.id} className="dark:hover:bg-secondary-700">
                  <td className="dark:text-white">{tx.id}</td>
                  <td className="dark:text-white">{tx.bookingCode}</td>
                  <td className="dark:text-white">{tx.renter?.name || "-"}</td>
                  <td>{tx.vehicle?.licensePlate || "-"}</td>
                  <td>{formatCurrency(tx.amount)}</td>
                  {/* <td className={`type-badge ${type.color}`}>
                    <type.icon size={16} /> {type.label}
                  </td> */}
                  <td className={`status-badge ${status.color}`}>
                    <status.icon size={16} /> {status.label}
                  </td>
                  <td>{formatDate(tx.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          <ChevronLeft />
        </button>
        {[...Array(totalPages)].map((_, i) => {
          const page = i + 1;
          return (
            <button
              key={page}
              className={page === currentPage ? "active" : ""}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          );
        })}
        <button
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
};

export default TransactionManagement;
