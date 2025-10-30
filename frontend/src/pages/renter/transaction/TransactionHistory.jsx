import React, { useState, useEffect, useMemo } from "react";
import axiosInstance from "../../../config/axiosInstance.js";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  CreditCard,
  DollarSign,
  Filter,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
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
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getTransactionTypeText = (type) => {
    const typeMap = {
      DEPOSIT: "Cọc",
      RENTAL: "Thuê xe",
      REFUND: "Hoàn tiền",
      COMPENSATION: "Bồi thường",
      PAYOUT: "Thanh toán",
    };
    return typeMap[type] || type;
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      COMPLETED: { text: "Thành công", icon: CheckCircle },
      PENDING: { text: "Xử lý", icon: Clock },
      FAILED: { text: "Thất bại", icon: XCircle },
      CANCELLED: { text: "Đã hủy", icon: AlertCircle },
    };
    return statusMap[status] || { text: status, icon: AlertCircle };
  };

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.filter((transaction) => {
      const matchesFilter = filter === "all" || transaction.status === filter;
      const matchesSearch =
        transaction.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getTransactionTypeText(transaction.type)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.transaction_id?.toString().includes(searchTerm);
      return matchesFilter && matchesSearch;
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

      if (sortOrder === "ASC") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [transactions, filter, searchTerm, sortBy, sortOrder]);

  const totalPages = Math.ceil(
    filteredAndSortedTransactions.length / itemsPerPage
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredAndSortedTransactions.slice(
    startIndex,
    endIndex
  );

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

  const LoadingSkeleton = () => (
    <div className="transaction-history">
      <div className="page-header">
        <div className="skeleton skeleton-header"></div>
      </div>
      <div className="stats-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card">
            <div className="skeleton skeleton-stat"></div>
          </div>
        ))}
      </div>
      <div className="controls">
        <div className="skeleton skeleton-control"></div>
        <div className="skeleton skeleton-control"></div>
      </div>
      <div className="table-card">
        <div className="skeleton skeleton-table"></div>
      </div>
    </div>
  );

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="transaction-history">
        <div className="error-state">
          <XCircle size={48} />
          <h3>{error}</h3>
          <button onClick={fetchTransactions} className="btn-retry">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-history">
      <div className="page-header">
        <Wallet size={24} />
        <div>
          <h1>Lịch sử giao dịch</h1>
          <p>Quản lý giao dịch của bạn</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">{statistics.totalTransactions}</div>
            <div className="stat-label">Giao dịch</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">
              {formatCurrency(statistics.totalAmount)}
            </div>
            <div className="stat-label">Tổng tiền</div>
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
            <option value="PENDING">Xử lý</option>
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
                    <th
                      onClick={() => handleSort("transaction_id")}
                      className="sortable"
                    >
                      <span>Mã GD</span>
                      {sortBy === "transaction_id" &&
                        (sortOrder === "ASC" ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        ))}
                    </th>
                    <th onClick={() => handleSort("type")} className="sortable">
                      <span>Loại</span>
                      {sortBy === "type" &&
                        (sortOrder === "ASC" ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        ))}
                    </th>
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
                      onClick={() => handleSort("payment_method")}
                      className="sortable"
                    >
                      <span>Phương thức</span>
                      {sortBy === "payment_method" &&
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
                      <span>Ngày</span>
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
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTransactions.map((transaction) => {
                    const StatusIcon = getStatusInfo(transaction.status).icon;
                    return (
                      <tr key={transaction.transaction_id}>
                        <td>
                          <span className="id-badge">
                            #{transaction.transaction_id}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`type-badge ${transaction.type.toLowerCase()}`}
                          >
                            {getTransactionTypeText(transaction.type)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`amount ${
                              transaction.type === "REFUND" ||
                              transaction.type === "COMPENSATION"
                                ? "positive"
                                : ""
                            }`}
                          >
                            {formatCurrency(transaction.amount)}
                          </span>
                        </td>
                        <td>
                          <span className="method">
                            {transaction.payment_method || "N/A"}
                          </span>
                        </td>
                        <td>
                          <div className="date-time">
                            <span>
                              {format(
                                new Date(transaction.created_at),
                                "dd/MM/yyyy",
                                { locale: vi }
                              )}
                            </span>
                            <small>
                              {format(
                                new Date(transaction.created_at),
                                "HH:mm",
                                { locale: vi }
                              )}
                            </small>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${transaction.status.toLowerCase()}`}
                          >
                            <StatusIcon size={12} />
                            {getStatusInfo(transaction.status).text}
                          </span>
                        </td>
                        <td>
                          <span className="note">
                            {transaction.note || "-"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <div className="pagination-info">
                {startIndex + 1}-
                {Math.min(endIndex, filteredAndSortedTransactions.length)} /{" "}
                {filteredAndSortedTransactions.length}
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
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`btn-page ${
                        currentPage === pageNum ? "active" : ""
                      }`}
                    >
                      {pageNum}
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
    </div>
  );
};

export default TransactionHistory;
