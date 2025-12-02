import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../../config/axiosInstance";
import { toast } from "react-toastify";
import { MdRefresh } from "react-icons/md";
import { FileText, Clock, DollarSign } from "lucide-react";

const RefundManagement = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [activeTab, setActiveTab] = useState("renter"); // 'renter' hoặc 'owner'
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'pending', 'approved'
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const itemsPerPage = 10;

  // Fetch refund data
  const fetchRefunds = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);

        const response = await axiosInstance.get(
          "/api/admin/refund-management",
          {
            params: {
              page,
              limit: itemsPerPage,
              status: statusFilter === "all" ? undefined : statusFilter,
            },
          }
        );

        if (response.data.success) {
          setRefunds(response.data.data.refunds || []);
          setCurrentPage(response.data.data.pagination?.currentPage || 1);
          setTotalPages(response.data.data.pagination?.totalPages || 1);
          setTotalItems(response.data.data.pagination?.totalItems || 0);
        } else {
          toast.error("Không thể tải dữ liệu hoàn tiền");
        }
      } catch (error) {
        console.error("Error fetching refunds:", error);
        toast.error("Lỗi khi tải danh sách hoàn tiền");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    fetchRefunds(1);
  }, [fetchRefunds]);

  useEffect(() => {
    fetchRefunds(currentPage);
  }, [statusFilter]);

  // Fetch refunds when page changes
  useEffect(() => {
    fetchRefunds(currentPage);
  }, [currentPage]);

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Chưa có";
    try {
      return new Date(dateString).toLocaleString("vi-VN");
    } catch {
      return "Ngày không hợp lệ";
    }
  };

  // Handle approve refund
  const handleApproveRefund = async (cancellationId, refundType) => {
    try {
      const response = await axiosInstance.post(
        `/api/admin/refund-management/${cancellationId}/approve`,
        {
          refund_type: refundType,
        }
      );

      if (response.data.success) {
        toast.success(
          `Đã duyệt hoàn tiền cho ${
            refundType === "renter" ? "người thuê" : "chủ xe"
          }`
        );
        fetchRefunds(currentPage);
      }
    } catch (error) {
      console.error("Error approving refund:", error);
      toast.error("Lỗi khi duyệt hoàn tiền");
    }
  };

  // Handle reject refund
  const handleRejectRefund = async (cancellationId, refundType) => {
    try {
      const response = await axiosInstance.post(
        `/api/admin/refund-management/${cancellationId}/reject`,
        {
          refund_type: refundType,
          reason: "Từ chối bởi admin",
        }
      );

      if (response.data.success) {
        toast.success(
          `Đã từ chối hoàn tiền cho ${
            refundType === "renter" ? "người thuê" : "chủ xe"
          }`
        );
        fetchRefunds(currentPage);
      }
    } catch (error) {
      console.error("Error rejecting refund:", error);
      toast.error("Lỗi khi từ chối hoàn tiền");
    }
  };

  // Handle show confirm modal
  const showConfirmAction = (action, bookingId, refundType) => {
    setConfirmAction({
      type: action, // 'approve' hoặc 'reject'
      bookingId,
      refundType,
    });
    setShowConfirmModal(true);
  };

  // Handle confirm action
  const handleConfirmAction = () => {
    if (confirmAction) {
      const refund = refunds.find((r) => r.booking_id === confirmAction.bookingId);
      if (refund) {
        if (confirmAction.type === 'approve') {
          handleApproveRefund(refund.cancellation_id, confirmAction.refundType);
        } else if (confirmAction.type === 'reject') {
          handleRejectRefund(refund.cancellation_id, confirmAction.refundType);
        }
      }
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  // Handle cancel action
  const handleCancelAction = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  // Handle approve
  const handleApprove = (bookingId, refundType) => {
    showConfirmAction('approve', bookingId, refundType);
  };

  // Handle reject
  const handleReject = (bookingId, refundType) => {
    showConfirmAction('reject', bookingId, refundType);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Filter refunds based on active tab
  const getFilteredRefunds = useCallback(() => {
    if (!refunds || !Array.isArray(refunds)) {
      return [];
    }

    return refunds.filter((refund) => {
      // Filter by tab (renter/owner)
      let tabMatch = false;
      if (activeTab === "renter") {
        tabMatch =
          refund.renter_refund && refund.renter_refund.refund_amount > 0;
      } else {
        tabMatch = refund.owner_refund && refund.owner_refund.refund_amount > 0;
      }

      if (!tabMatch) return false;

      // Filter by status
      if (statusFilter === "all") return true;

      const currentRefundData =
        activeTab === "renter" ? refund.renter_refund : refund.owner_refund;
      if (statusFilter === "pending") {
        return currentRefundData?.refund_status === "pending";
      } else if (statusFilter === "approved") {
        return currentRefundData?.refund_status === "approved";
      }

      return true;
    });
  }, [refunds, activeTab, statusFilter]);

  const filteredRefunds = getFilteredRefunds();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Quản lý hoàn tiền
            </h1>
            <p className="text-gray-600 mt-2">
              Quản lý các yêu cầu hoàn tiền từ việc hủy booking
            </p>
          </div>
          <button
            onClick={() => fetchRefunds(currentPage)}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <MdRefresh className={`mr-2 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          <button
            onClick={() => setActiveTab("renter")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "renter"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
            }`}
          >
            Hoàn tiền người thuê (
            {refunds
              ? refunds.filter((r) => r.renter_refund?.refund_amount > 0).length
              : 0}
            )
          </button>
          <button
            onClick={() => setActiveTab("owner")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "owner"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
            }`}
          >
            Bồi thường chủ xe (
            {refunds
              ? refunds.filter((r) => r.owner_refund?.refund_amount > 0).length
              : 0}
            )
          </button>
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <span className="text-sm font-medium text-gray-700">
              Lọc theo trạng thái:
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                statusFilter === "all"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 hover:border-gray-400"
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                statusFilter === "pending"
                  ? "bg-yellow-500 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-yellow-50 hover:border-yellow-400"
              }`}
            >
              Chờ duyệt
            </button>
            <button
              onClick={() => setStatusFilter("approved")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                statusFilter === "approved"
                  ? "bg-green-500 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-green-50 hover:border-green-400"
              }`}
            >
              Đã duyệt
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Tổng số yêu cầu
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredRefunds?.length || 0}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chờ xử lý</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredRefunds?.filter((r) =>
                    activeTab === "renter"
                      ? r.renter_refund?.refund_status === "pending"
                      : r.owner_refund?.refund_status === "pending"
                  ).length || 0}
                </p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Tổng tiền hoàn
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    filteredRefunds?.reduce((sum, refund) => {
                      const amount =
                        activeTab === "renter"
                          ? refund.renter_refund?.refund_amount || 0
                          : refund.owner_refund?.refund_amount || 0;
                      return sum + amount;
                    }, 0) || 0
                  )}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Refund Table */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
          </div>
        ) : filteredRefunds?.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">
              <MdRefresh className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không có dữ liệu
            </h3>
            <p className="text-gray-500">
              Chưa có yêu cầu hoàn tiền nào trong hệ thống.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow-md">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đã thanh toán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phí hủy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bồi thường chủ xe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phí nền tảng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % phí admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số tiền hoàn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thông tin ngân hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã QR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRefunds?.map((refund) => {
                  const refundData =
                    activeTab === "renter"
                      ? refund.renter_refund
                      : refund.owner_refund;
                  const bankInfo = refundData?.bank_info;
                  const summary = refund.financial_summary || {};
                  const totalAmount = summary.total_amount ?? refund.booking_info?.total_amount ?? 0;
                  const totalPaid = summary.total_paid ?? refund.booking_info?.total_paid ?? 0;
                  const cancellationFee = summary.cancellation_fee ?? refund.cancellation_fee ?? 0;
                  const ownerCompensation = summary.owner_compensation_amount ?? refund.owner_refund?.refund_amount ?? 0;
                  const platformFee = summary.platform_fee_amount ?? Math.max(0, cancellationFee - ownerCompensation);
                  const adminPercent = summary.platform_fee_percent ?? undefined;

                  return (
                    <tr
                      key={refund.booking_info?.booking_id || refund.booking_id}
                      className="hover:bg-gray-50"
                    >
                      {/* Booking ID */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              #
                              {refund.booking_info?.booking_id ||
                                refund.booking_id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Tổng tiền */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(totalAmount)}
                        </div>
                      </td>

                      {/* Đã thanh toán */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(totalPaid)}
                        </div>
                      </td>

                      {/* Phí hủy */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(cancellationFee)}
                        </div>
                      </td>

                      {/* Bồi thường chủ xe */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(ownerCompensation)}
                        </div>
                      </td>

                      {/* Phí nền tảng */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(platformFee)}
                        </div>
                      </td>

                      {/* % phí admin */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {adminPercent !== undefined ? `${adminPercent}%` : "-"}
                        </div>
                      </td>

                      {/* Số tiền hoàn */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-green-600">
                          {formatCurrency(refundData?.refund_amount || 0)}
                        </div>
                      </td>

                      {/* Thông tin ngân hàng */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {bankInfo ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {bankInfo.bank_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {bankInfo.account_number}
                            </div>
                            <div className="text-xs text-gray-400">
                              {bankInfo.account_holder_name}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-red-600">
                            Chưa có thông tin
                          </span>
                        )}
                      </td>

                      {/* Mã QR */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {bankInfo?.qr_code_url ? (
                          <img
                            src={bankInfo.qr_code_url}
                            alt="QR Code"
                            className="h-16 w-16 object-contain"
                          />
                        ) : (
                          <span className="text-gray-400">Không có QR</span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            refundData?.refund_status === "approved"
                              ? "bg-green-100 text-green-800"
                              : refundData?.refund_status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {refundData?.refund_status === "approved"
                            ? "Đã duyệt"
                            : refundData?.refund_status === "rejected"
                            ? "Đã từ chối"
                            : "Chờ duyệt"}
                        </span>
                      </td>

                      {/* Ngày tạo */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(
                            refund.booking_info?.created_at || refund.created_at
                          )}
                        </div>
                      </td>

                      {/* Thao tác */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {refundData?.refund_status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleApprove(
                                    refund.booking_info?.booking_id ||
                                      refund.booking_id,
                                    activeTab
                                  )
                                }
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                              >
                                Duyệt
                              </button>
                              <button
                                onClick={() =>
                                  handleReject(
                                    refund.booking_info?.booking_id ||
                                      refund.booking_id,
                                    activeTab
                                  )
                                }
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                              >
                                Từ chối
                              </button>
                            </>
                          )}
                          {refundData?.refund_status === "approved" && (
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm font-medium">
                              Đã duyệt
                            </span>
                          )}
                          {refundData?.refund_status === "rejected" && (
                            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-md text-sm font-medium">
                              Đã từ chối
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow mt-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Trước
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Hiển thị{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  đến{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, totalItems)}
                  </span>{" "}
                  trong tổng số{" "}
                  <span className="font-medium">{totalItems}</span> kết quả
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Trước
                  </button>
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span
                          key={page}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Sau
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal xác nhận */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-transparent overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Xác nhận thao tác
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Bạn có chắc chắn muốn{" "}
                <span className={`font-medium ${confirmAction?.type === 'approve' ? 'text-green-600' : 'text-red-600'}`}>
                  {confirmAction?.type === 'approve' ? 'duyệt' : 'từ chối'}
                </span>{" "}
                yêu cầu hoàn tiền cho{" "}
                {confirmAction?.refundType === 'renter' ? 'người thuê' : 'chủ xe'} này?
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleCancelAction}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmAction}
                  className={`px-4 py-2 text-white rounded-md transition-colors ${
                    confirmAction?.type === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {confirmAction?.type === 'approve' ? 'Duyệt' : 'Từ chối'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundManagement;
