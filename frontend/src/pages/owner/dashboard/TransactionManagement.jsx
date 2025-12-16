import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../../config/axiosInstance.js";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useOwnerTheme } from "@/contexts/OwnerThemeContext";
import { createThemeUtils } from "@/utils/themeUtils";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Filter,
  Search,
  TrendingDown,
  TrendingUp,
  Wallet,
  XCircle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import "./TransactionManagement.scss";

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

const statusStyles = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  success: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const statusIcons = {
  pending: Clock,
  processing: Clock,
  completed: CheckCircle,
  success: CheckCircle,
  failed: XCircle,
  cancelled: AlertCircle,
};

const TransactionManagement = () => {
  const theme = useOwnerTheme();
  const themeUtils = createThemeUtils(theme);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
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

        if (response.data.data.statistics) {
          setStatistics({
            totalTransactions:
              response.data.data.statistics.totalTransactions || 0,
            totalAmount: response.data.data.statistics.totalAmount || 0,
            moneyIn: response.data.data.statistics.moneyIn || 0,
            moneyOut: response.data.data.statistics.moneyOut || 0,
          });
        } else {
          const stats = txs.reduce(
            (acc, t) => {
              acc.totalTransactions += 1;
              const amt = Number(t.amount) || 0;
              acc.totalAmount += amt;
              if (amt >= 0) acc.moneyIn += amt;
              else acc.moneyOut += Math.abs(amt);
              return acc;
            },
            { totalTransactions: 0, totalAmount: 0, moneyIn: 0, moneyOut: 0 }
          );
          setStatistics(stats);
        }
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
  }, [
    currentPage,
    itemsPerPage,
    searchTerm,
    statusFilter,
    typeFilter,
    sortBy,
    sortOrder,
  ]);

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

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
  };

  const statusInfo = (status) => {
    const key = status?.toString().toLowerCase();
    const Icon = statusIcons[key] || AlertCircle;
    return {
      Icon,
      label: transactionStatusLabels[key] || status || "Không xác định",
      badgeClass:
        statusStyles[key] ||
        "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
    };
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleTypeChange = (value) => {
    setTypeFilter(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleLimitChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => setCurrentPage(page);

  const renderSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );

  return (
    <div
      className={`transaction-page p-4 lg:p-6 min-h-screen ${themeUtils.bgMain}`}
    >
      <div className="mb-6">
        <h1
          className={`text-2xl font-bold mb-2 flex items-center gap-2 ${themeUtils.textPrimary}`}
        >
          <Wallet size={28} /> Quản lý giao dịch
        </h1>
        <p className={themeUtils.textSecondary}>
          Theo dõi và quản lý các giao dịch của bạn
        </p>
      </div>

      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="text-gray-500 dark:text-gray-400" size={18} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Bộ lọc:
            </span>
          </div>

          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Tìm kiếm mã, khách thuê, biển số"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-md text-sm bg-white dark:bg-secondary-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            onChange={(e) => handleTypeChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả loại</option>
            {Object.keys(transactionTypeLabels).map((k) => (
              <option key={k} value={k}>
                {transactionTypeLabels[k]}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => handleSort(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="createdAt">Mới nhất</option>
            <option value="amount">Số tiền</option>
            <option value="id">ID giao dịch</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="desc">Giảm dần</option>
            <option value="asc">Tăng dần</option>
          </select>

          <select
            value={itemsPerPage}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={5}>5 giao dịch/trang</option>
            <option value={10}>10 giao dịch/trang</option>
            <option value={20}>20 giao dịch/trang</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 p-4 flex items-center">
          <div className="stat-icon bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
            <CreditCard className="h-6 w-6" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Tổng giao dịch
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {statistics.totalTransactions}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 p-4 flex items-center">
          <div className="stat-icon bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400">
            <DollarSign className="h-6 w-6" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Tổng tiền
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white stat-amount">
              {formatCurrency(statistics.totalAmount)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 p-4 flex items-center">
          <div className="stat-icon bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Tiền vào
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 stat-amount">
              {formatCurrency(statistics.moneyIn)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 p-4 flex items-center">
          <div className="stat-icon bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400">
            <TrendingDown className="h-6 w-6" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Tiền ra
            </p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 stat-amount">
              {formatCurrency(statistics.moneyOut)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-secondary-700 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Danh sách giao dịch
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Trang {currentPage}/{Math.max(totalPages, 1)}
          </span>
        </div>

        {error && (
          <div className="px-6 py-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
            <button
              onClick={fetchTransactions}
              className="ml-auto text-sm font-medium text-blue-600 hover:underline"
            >
              Thử lại
            </button>
          </div>
        )}

        {filteredTransactions.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 empty-state-icon" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Chưa có giao dịch nào
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Bạn chưa có giao dịch phù hợp với bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-secondary-700">
              <thead className="bg-gray-50 dark:bg-secondary-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort("id")}
                      className="inline-flex items-center gap-1"
                    >
                      Mã GD {renderSortIcon("id")}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Mã đặt xe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Xe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort("amount")}
                      className="inline-flex items-center gap-1"
                    >
                      Số tiền {renderSortIcon("amount")}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort("createdAt")}
                      className="inline-flex items-center gap-1"
                    >
                      Ngày {renderSortIcon("createdAt")}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-secondary-800 divide-y divide-gray-200 dark:divide-secondary-700">
                {filteredTransactions.map((tx) => {
                  const status = statusInfo(tx.paymentStatus || tx.status);
                  const typeLabel =
                    transactionTypeLabels[tx.type?.toLowerCase?.()] ||
                    transactionTypeLabels[tx.type] ||
                    tx.type;
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-gray-50 dark:hover:bg-secondary-700 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          #{tx.id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {tx.bookingCode || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {tx.renter?.name || "N/A"}
                        </div>
                        {tx.renter?.email && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {tx.renter.email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {tx.vehicle?.model || tx.vehicle?.name || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {tx.vehicle?.licensePlate || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(Number(tx.amount) || 0)}
                        </div>
                        {typeLabel && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {typeLabel}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`status-chip inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${status.badgeClass}`}
                        >
                          <status.Icon className="h-4 w-4" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatDate(tx.createdAt || tx.created_at)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-secondary-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Hiển thị trang {currentPage} trên {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-secondary-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-secondary-700"
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 text-sm border rounded-md ${
                        page === currentPage
                          ? "bg-blue-500 text-white border-blue-500"
                          : "border-gray-300 dark:border-secondary-600 hover:bg-gray-50 dark:hover:bg-secondary-700 text-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-secondary-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-secondary-700"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionManagement;
