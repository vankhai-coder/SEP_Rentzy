// TransactionHistory.jsx
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
} from "lucide-react";
import "./transaction.scss";

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("DESC");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [statistics, setStatistics] = useState({
    totalTransactions: 0,
    moneyIn: 0,
    moneyOut: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get("/api/renter/transactions");
      if (response.data.success && response.data.data) {
        setTransactions(response.data.data.transactions || []);
        if (response.data.data.statistics) {
          setStatistics(response.data.data.statistics);
        }
      } else {
        setTransactions([]);
        setError("Không thể tải lịch sử giao dịch");
      }
    } catch (err) {
      setError("Không thể tải lịch sử giao dịch");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  const getTransactionTypeText = (type) => {
    const map = {
      DEPOSIT: "Cọc",
      RENTAL: "Thuê xe",
      REFUND: "Hoàn tiền",
      COMPENSATION: "Bồi thường",
      PAYOUT: "Thanh toán",
    };
    return map[type] || type;
  };

  const getStatusInfo = (status) => {
    const map = {
      COMPLETED: { text: "Thành công", icon: CheckCircle },
      PENDING: { text: "Đang xử lý", icon: Clock },
      FAILED: { text: "Thất bại", icon: XCircle },
      CANCELLED: { text: "Đã hủy", icon: AlertCircle },
    };
    return map[status] || { text: status, icon: AlertCircle };
  };

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.filter((t) => {
      const matchFilter = filter === "all" || t.status === filter;
      const matchSearch =
        t.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getTransactionTypeText(t.type)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        t.transaction_id?.toString().includes(searchTerm);
      return matchFilter && matchSearch;
    });

    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "amount") {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      } else if (sortBy === "created_at" || sortBy === "processed_at") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      return sortOrder === "ASC"
        ? aValue > bValue
          ? 1
          : -1
        : aValue < bValue
        ? 1
        : -1;
    });

    return filtered;
  }, [transactions, filter, searchTerm, sortBy, sortOrder]);

  const totalPages = Math.ceil(
    filteredAndSortedTransactions.length / itemsPerPage
  );

  // Pagination Range Helper
  const paginationRange = useMemo(() => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots.filter(
      (item, index, arr) => arr.indexOf(item) === index
    );
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredAndSortedTransactions.slice(
    startIndex,
    endIndex
  );

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(field);
      setSortOrder("DESC");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transaction-history error-state">
        <XCircle size={48} />
        <h3>{error}</h3>
        <button onClick={fetchTransactions}>Thử lại</button>
      </div>
    );
  }

  return (
    <div className="transaction-history">
      <div className="page-header">
        <h1>
          <CreditCard className="page-icon" />
          Lịch sử giao dịch
        </h1>
        <p className="page-description">
          Theo dõi tất cả giao dịch thanh toán của bạn
        </p>
      </div>

      {/* Statistics Cards - Compact Row Layout */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">
              {formatCurrency(statistics.totalTransactions)}
            </div>
            <div className="stat-label">Tổng giao dịch</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">
              {formatCurrency(statistics.moneyIn)}
            </div>
            <div className="stat-label">Tiền vào</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">
              {formatCurrency(statistics.moneyOut)}
            </div>
            <div className="stat-label">Tiền ra</div>
          </div>
        </div>
      </div>

      <div className="controls">
        <div className="control-group">
          <Filter size={16} />
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Tất cả</option>
            <option value="COMPLETED">Thành công</option>
            <option value="PENDING">Đang xử lý</option>
            <option value="FAILED">Thất bại</option>
            <option value="CANCELLED">Đã hủy</option>
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
        {filteredAndSortedTransactions.length === 0 ? (
          <div className="empty-state">
            <CreditCard size={48} />
            <h3>Chưa có giao dịch</h3>
            <p>Giao dịch của bạn sẽ hiển thị ở đây</p>
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table className="transaction-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort("transaction_id")}>
                      Mã GD{" "}
                      {sortBy === "transaction_id" &&
                        (sortOrder === "ASC" ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        ))}
                    </th>
                    <th onClick={() => handleSort("type")}>
                      Loại{" "}
                      {sortBy === "type" &&
                        (sortOrder === "ASC" ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        ))}
                    </th>
                    <th onClick={() => handleSort("amount")}>
                      Số tiền{" "}
                      {sortBy === "amount" &&
                        (sortOrder === "ASC" ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        ))}
                    </th>
                    <th onClick={() => handleSort("payment_method")}>
                      Phương thức{" "}
                      {sortBy === "payment_method" &&
                        (sortOrder === "ASC" ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        ))}
                    </th>
                    <th onClick={() => handleSort("created_at")}>
                      Ngày{" "}
                      {sortBy === "created_at" &&
                        (sortOrder === "ASC" ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        ))}
                    </th>
                    <th onClick={() => handleSort("status")}>
                      Trạng thái{" "}
                      {sortBy === "status" &&
                        (sortOrder === "ASC" ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        ))}
                    </th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTransactions.map((t) => {
                    const statusInfo = getStatusInfo(t.status);
                    return (
                      <tr key={t.transaction_id}>
                        <td>{t.transaction_id}</td>
                        <td>{getTransactionTypeText(t.type)}</td>
                        <td>{formatCurrency(t.amount)}</td>
                        <td>{t.payment_method}</td>
                        <td>
                          {format(new Date(t.created_at), "dd/MM/yyyy HH:mm", {
                            locale: vi,
                          })}
                        </td>
                        <td>{statusInfo.text}</td>
                        <td>{t.note || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  <ChevronLeft size={16} />
                  Trước
                </button>

                <div className="pagination-numbers">
                  {paginationRange.map((page, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        typeof page === "number" && handlePageChange(page)
                      }
                      className={`pagination-number ${
                        currentPage === page ? "active" : ""
                      } ${typeof page !== "number" ? "dots" : ""}`}
                      disabled={typeof page !== "number"}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Sau
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
