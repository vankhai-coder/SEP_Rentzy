import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import axiosInstance from "../../../config/axiosInstance.js";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Star,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpCircle,
  ArrowDownCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  X,
} from "lucide-react";
import "./PointsHistory.scss";

const PointsHistory = React.memo(() => {
  // State management
  const [pointsData, setPointsData] = useState({
    transactions: [],
    statistics: {
      current_balance: 0,
      total_earned: 0,
      total_spent: 0,
      total_transactions: 0,
    },
    pagination: {
      current_page: 1,
      total_pages: 1,
      total_items: 0,
      items_per_page: 15,
    },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    transaction_type: "all",
    reference_type: "all",
    search: "",
  });

  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search
  const searchTimeoutRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [filters.search]);

  // Fetch data
  useEffect(() => {
    fetchPointsHistory();
  }, [
    currentPage,
    filters.transaction_type,
    filters.reference_type,
    debouncedSearch,
  ]);

  const fetchPointsHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: 15,
        transaction_type: filters.transaction_type,
        reference_type: filters.reference_type,
        search: debouncedSearch,
      };

      // Remove 'all' values and empty strings
      Object.keys(params).forEach((key) => {
        if (params[key] === "all" || params[key] === "") {
          delete params[key];
        }
      });

      const response = await axiosInstance.get("/api/renter/points/history", {
        params,
      });

      if (response.data.success) {
        setPointsData(response.data.data);
      } else {
        setError("Không thể tải dữ liệu");
      }
    } catch (error) {
      console.error("Error fetching points history:", error);
      setError("Lỗi khi tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    filters.transaction_type,
    filters.reference_type,
    filters.sort_by,
    filters.sort_order,
    debouncedSearch,
  ]);

  // Event handlers
  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      transaction_type: "all",
      reference_type: "all",
      search: "",
    });
    setCurrentPage(1);
  }, []);

  // Helper functions - memoized to prevent re-creation on every render
  const getTransactionTypeIcon = useCallback((type) => {
    switch (type) {
      case "earn":
        return <ArrowUpCircle className="icon-earn" size={16} />;
      case "spend":
        return <ArrowDownCircle className="icon-spend" size={16} />;
      case "refund":
        return <RefreshCw className="icon-refund" size={16} />;
      default:
        return <CheckCircle className="icon-default" size={16} />;
    }
  }, []);

  const getTransactionTypeText = useCallback((type) => {
    const types = {
      earn: "Tích điểm",
      spend: "Tiêu điểm",
      expire: "Hết hạn",
      refund: "Hoàn điểm",
    };
    return types[type] || type;
  }, []);

  const getReferenceTypeText = useCallback((type) => {
    const types = {
      booking: "Đặt xe",
      voucher: "Voucher",
      bonus: "Thưởng",
      penalty: "Phạt",
    };
    return types[type] || type;
  }, []);

  const formatAmount = useCallback((amount) => {
    const absAmount = Math.abs(amount);
    return amount >= 0
      ? `+${absAmount.toLocaleString()}`
      : `-${absAmount.toLocaleString()}`;
  }, []);

  // Since we're using server-side filtering, we don't need client-side filtering
  // Just return the transactions directly from the API
  const filteredTransactions = useMemo(() => {
    return pointsData.transactions;
  }, [pointsData.transactions]);

  // Pagination
  const totalPages = pointsData.pagination.total_pages;
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transaction-history">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={fetchPointsHistory} className="btn-retry">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-history">
      <div className="page-header">
        <h1>
          <Star className="page-icon" />
          Lịch sử điểm thưởng
        </h1>
        <p className="page-description">
          Theo dõi tất cả giao dịch điểm thưởng của bạn
        </p>
      </div>

      {/* Statistics Cards - Compact Row Layout */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value current-balance">
            {pointsData.statistics.current_balance.toLocaleString()}
          </div>
          <div className="stat-label">Điểm hiện tại</div>
        </div>
        <div className="stat-card">
          <div className="stat-value total-earned">
            {pointsData.statistics.total_earned.toLocaleString()}
          </div>
          <div className="stat-label">Tổng tích</div>
        </div>
        <div className="stat-card">
          <div className="stat-value total-spent">
            {pointsData.statistics.total_spent.toLocaleString()}
          </div>
          <div className="stat-label">Tổng tiêu</div>
        </div>
        <div className="stat-card">
          <div className="stat-value total-transactions">
            {pointsData.statistics.total_transactions.toLocaleString()}
          </div>
          <div className="stat-label">Giao dịch</div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-header">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm giao dịch..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="filters-grid">
          <div className="filter-group">
            <label>Loại giao dịch</label>
            <select
              value={filters.transaction_type}
              onChange={(e) =>
                handleFilterChange("transaction_type", e.target.value)
              }
            >
              <option value="all">Tất cả</option>
              <option value="earn">Tích điểm</option>
              <option value="spend">Tiêu điểm</option>
              <option value="expire">Hết hạn</option>
              <option value="refund">Hoàn điểm</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Nguồn giao dịch</label>
            <select
              value={filters.reference_type}
              onChange={(e) =>
                handleFilterChange("reference_type", e.target.value)
              }
            >
              <option value="all">Tất cả</option>
              <option value="booking">Đặt xe</option>
              <option value="voucher">Voucher</option>
              <option value="bonus">Thưởng</option>
              <option value="penalty">Phạt</option>
            </select>
          </div>

          <div className="filter-actions">
            <button onClick={clearFilters} className="btn-clear">
              <X size={16} />
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="table-container">
        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <Star size={48} className="empty-icon" />
            <h3>Chưa có giao dịch nào</h3>
            <p>Bạn chưa có giao dịch điểm nào được ghi nhận.</p>
          </div>
        ) : (
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Loại giao dịch</th>
                <th>Mô tả</th>
                <th>Số điểm</th>
                <th>Số dư sau GD</th>
                <th>Nguồn</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.transaction_id}>
                  <td>
                    <div className="transaction-type">
                      {getTransactionTypeIcon(transaction.transaction_type)}
                      <span>
                        {getTransactionTypeText(transaction.transaction_type)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="description">
                      {transaction.description || "Không có mô tả"}
                    </div>
                  </td>
                  <td>
                    <div
                      className={`amount ${
                        transaction.points_amount >= 0 ? "positive" : "negative"
                      }`}
                    >
                      {formatAmount(transaction.points_amount)} điểm
                    </div>
                  </td>
                  <td>
                    <div className="balance">
                      {transaction.balance_after?.toLocaleString() || 0} điểm
                    </div>
                  </td>
                  <td>
                    <div className="reference">
                      {getReferenceTypeText(transaction.reference_type)}
                    </div>
                  </td>
                  <td>
                    <div className="date-info">
                      <div className="date">
                        {format(
                          new Date(transaction.created_at),
                          "dd/MM/yyyy",
                          { locale: vi }
                        )}
                      </div>
                      <div className="time">
                        {format(new Date(transaction.created_at), "HH:mm", {
                          locale: vi,
                        })}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
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
    </div>
  );
});

PointsHistory.displayName = "PointsHistory";

export default PointsHistory;
