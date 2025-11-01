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
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  User,
  Car,
} from "lucide-react";
import "./TransactionManagement.scss";

const TransactionManagement = () => {
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

  // Fetch transactions from API
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        type: typeFilter !== "all" ? typeFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        sortBy,
        sortOrder,
      };

      const response = await axiosInstance.get("/api/owner/dashboard/transactions", {
        params,
      });

      if (response.data.success) {
        setTransactions(response.data.data.transactions || []);
        setTotalPages(response.data.data.pagination?.totalPages || 1);
        
        // Calculate statistics
        const stats = response.data.data.transactions.reduce(
          (acc, transaction) => {
            acc.totalTransactions++;
            const amount = parseFloat(transaction.amount) || 0;
            acc.totalAmount += amount;
            
            if (amount > 0) {
              acc.moneyIn += amount;
            } else {
              acc.moneyOut += Math.abs(amount);
            }
            
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
      setError("Không thể tải danh sách giao dịch");
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.id?.toString().includes(searchTerm) ||
          transaction.bookingCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.renter?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.vehicle?.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [transactions, searchTerm]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: vi });
  };

  // Get status info
  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { icon: Clock, color: "warning", label: "Chờ xử lý" },
      completed: { icon: CheckCircle, color: "success", label: "Hoàn thành" },
      failed: { icon: XCircle, color: "error", label: "Thất bại" },
      cancelled: { icon: AlertCircle, color: "neutral", label: "Đã hủy" },
      processing: { icon: Clock, color: "info", label: "Đang xử lý" },
      success: { icon: CheckCircle, color: "success", label: "Thành công" },
    };
    return statusMap[status] || { icon: AlertCircle, color: "neutral", label: status };
  };

  // Get type info
  const getTypeInfo = (type) => {
    const typeMap = {
      income: { icon: TrendingUp, color: "success", label: "Thu nhập" },
      compensation: { icon: DollarSign, color: "warning", label: "Bồi thường" },
      payout: { icon: TrendingUp, color: "success", label: "Thanh toán" },
      deposit: { icon: Wallet, color: "info", label: "Đặt cọc" },
      rental_payment: { icon: CreditCard, color: "success", label: "Thanh toán thuê" },
      refund: { icon: TrendingDown, color: "warning", label: "Hoàn tiền" },
      cancellation_fee: { icon: XCircle, color: "error", label: "Phí hủy" },
      platform_fee: { icon: DollarSign, color: "neutral", label: "Phí nền tảng" },
      payment: { icon: CreditCard, color: "success", label: "Thanh toán" },
      booking: { icon: Car, color: "info", label: "Đặt xe" },
    };
    return typeMap[type] || { icon: DollarSign, color: "neutral", label: type };
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="transaction-history">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
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
  }

  return (
    <div className="transaction-history">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="title-section">
            <h1>
              <Wallet size={28} />
              Quản lý giao dịch
            </h1>
            <p>Theo dõi và quản lý tất cả giao dịch của bạn</p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <CreditCard size={24} />
          </div>
          <div className="stat-content">
            <h3>Tổng giao dịch</h3>
            <p className="stat-value">{statistics.totalTransactions}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3>Tổng tiền</h3>
            <p className="stat-value">{formatCurrency(statistics.totalAmount)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>Tiền vào</h3>
            <p className="stat-value income">{formatCurrency(statistics.moneyIn)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <TrendingDown size={24} />
          </div>
          <div className="stat-content">
            <h3>Tiền ra</h3>
            <p className="stat-value expense">{formatCurrency(statistics.moneyOut)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-header">
          <h3>
            <Filter size={20} />
            Bộ lọc
          </h3>
        </div>

        <div className="filters-content">
          <div className="form-group">
            <label>Tìm kiếm</label>
            <div className="search-box">
              <Search size={20} />
              <input
                type="text"
                placeholder="Tìm theo mã giao dịch, mã đơn, tên khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="controls">
            <div className="control-group">
              <label>Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả trạng thái</option>
                {Object.entries(transactionStatusLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label>Loại giao dịch</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả loại</option>
                {Object.entries(transactionTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="table-card">
        <div className="table-header">
          <h3>Danh sách giao dịch</h3>
          <p>Hiển thị {filteredAndSortedTransactions.length} giao dịch</p>
        </div>

        <div className="table-scroll">
          <table className="transaction-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("id")} className="sortable">
                  Mã GD
                  {sortBy === "id" && (
                    sortOrder === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </th>
                <th>Mã đơn</th>
                <th onClick={() => handleSort("type")} className="sortable">
                  Loại
                  {sortBy === "type" && (
                    sortOrder === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </th>
                <th onClick={() => handleSort("amount")} className="sortable">
                  Số tiền
                  {sortBy === "amount" && (
                    sortOrder === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </th>
                <th>Mô tả</th>
                <th>Khách hàng</th>
                <th>Xe</th>
                <th onClick={() => handleSort("createdAt")} className="sortable">
                  Ngày
                  {sortBy === "createdAt" && (
                    sortOrder === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </th>
                <th onClick={() => handleSort("status")} className="sortable">
                  Trạng thái
                  {sortBy === "status" && (
                    sortOrder === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedTransactions.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-state">
                    <div className="empty-content">
                      <Wallet size={48} />
                      <h3>Không có giao dịch</h3>
                      <p>Chưa có giao dịch nào được tìm thấy</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedTransactions.map((transaction) => {
                  const StatusIcon = getStatusInfo(transaction.paymentStatus).icon;
                  const TypeIcon = getTypeInfo(transaction.type).icon;
                  return (
                    <tr key={transaction.id}>
                      <td>
                        <span className="id-badge">#{transaction.id}</span>
                      </td>
                      <td>
                        <span className="booking-code">{transaction.bookingCode}</span>
                      </td>
                      <td>
                        <div className={`type-badge ${getTypeInfo(transaction.type).color}`}>
                          <TypeIcon size={16} />
                          <span>{getTypeInfo(transaction.type).label}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`amount ${transaction.amount >= 0 ? "positive" : "negative"}`}>
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td>
                        <div className="description">
                          <span>{transaction.description || "N/A"}</span>
                        </div>
                      </td>
                      <td>
                        <div className="user-info">
                          <User size={16} />
                          <div>
                            <div className="name">{transaction.renter?.name || "N/A"}</div>
                            <div className="email">{transaction.renter?.email || "N/A"}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="vehicle-info">
                          <Car size={16} />
                          <div>
                            <div className="plate">{transaction.vehicle?.licensePlate || "N/A"}</div>
                            <div className="model">{transaction.vehicle?.model || "N/A"}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="date-info">
                          <Calendar size={16} />
                          <span>{formatDate(transaction.createdAt)}</span>
                        </div>
                      </td>
                      <td>
                        <div className={`status-badge ${getStatusInfo(transaction.paymentStatus).color}`}>
                          <StatusIcon size={16} />
                          <span>{getStatusInfo(transaction.paymentStatus).label}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-button"
            >
              <ChevronLeft size={16} />
              Trước
            </button>

            <div className="pagination-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`pagination-number ${page === currentPage ? "active" : ""}`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-button"
            >
              Sau
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionManagement;