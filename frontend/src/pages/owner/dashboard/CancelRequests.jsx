import React, { useState, useEffect } from "react";
import axiosInstance from "../../../config/axiosInstance.js";
import {
  MdCancel,
  MdCheck,
  MdClose,
  MdPerson,
  MdDirectionsCar,
  MdCalendarToday,
  MdAttachMoney,
  MdInfo,
} from "react-icons/md";

const CancelRequests = () => {
  const [cancelRequests, setCancelRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const [summary, setSummary] = useState({
    total_cancellation_fees: 0,
    total_platform_fees: 0,
    total_owner_refunds: 0,
    total_renter_refunds: 0,
    pending_approvals: 0,
    completed_cancellations: 0,
  });
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchCancelRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await axiosInstance.get(
        `api/owner/dashboard/cancel-requests?${params.toString()}`
      );

      if (response.data.success) {
        setCancelRequests(response.data.data.cancelRequests);
        setPagination(response.data.data.pagination);
        setSummary(
          response.data.data.summary || {
            total_cancellation_fees: 0,
            total_platform_fees: 0,
            total_owner_refunds: 0,
            total_renter_refunds: 0,
            pending_approvals: 0,
            completed_cancellations: 0,
          }
        );
      }
    } catch (error) {
      setError("Không thể tải danh sách yêu cầu hủy");
      console.error("Error fetching cancel requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCancelRequests();
  }, [statusFilter]);

  const handleApproveCancel = async (bookingId) => {
    try {
      setProcessingId(bookingId);
      const response = await axiosInstance.get(
        `/owner/dashboard/cancel-requests/${bookingId}/approve`
      );

      if (response.data.success) {
        // Remove the approved request from the list
        setCancelRequests((prev) =>
          prev.filter((req) => req.booking_id !== bookingId)
        );
        // Show success message
        alert("Đã duyệt yêu cầu hủy thành công");
      }
    } catch (error) {
      console.error("Error approving cancel request:", error);
      alert("Có lỗi xảy ra khi duyệt yêu cầu hủy");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectCancel = async (bookingId) => {
    try {
      setProcessingId(bookingId);
      const response = await axiosInstance.patch(
        `/owner/dashboard/cancel-requests/${bookingId}/reject`
      );

      if (response.data.success) {
        // Remove the rejected request from the list
        setCancelRequests((prev) =>
          prev.filter((req) => req.booking_id !== bookingId)
        );
        // Show success message
        alert("Đã từ chối yêu cầu hủy");
      }
    } catch (error) {
      console.error("Error rejecting cancel request:", error);
      alert("Có lỗi xảy ra khi từ chối yêu cầu hủy");
    } finally {
      setProcessingId(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Duyệt đơn hủy</h1>
        <p className="text-gray-600">
          Xem xét và duyệt các yêu cầu hủy đơn thuê từ khách hàng
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setStatusFilter("all")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                statusFilter === "all"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setStatusFilter("pending_approval")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                statusFilter === "pending_approval"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Chờ duyệt
            </button>
          </nav>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <MdCancel className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Chờ duyệt</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.pending_approvals}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <MdCheck className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Đã hoàn thành</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.completed_cancellations}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MdAttachMoney className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">
                Tiền hoàn cho bạn
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.total_owner_refunds)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MdAttachMoney className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Phí hủy tổng</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.total_cancellation_fees)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Requests List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Danh sách yêu cầu hủy
          </h3>
        </div>

        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {cancelRequests.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <MdCancel className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Không có yêu cầu hủy nào
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Hiện tại không có yêu cầu hủy nào đang chờ duyệt.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đơn hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Xe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian thuê
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chi tiết tiền hoàn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cancelRequests.map((request) => (
                  <tr key={request.booking_id} className="hover:bg-gray-50">
                    {/* Đơn hàng */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {request.vehicle?.main_image_url && (
                          <img
                            className="h-12 w-16 rounded-lg object-cover mr-3"
                            src={request.vehicle.main_image_url}
                            alt={request.vehicle.model}
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Đơn #{request.booking_id}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatCurrency(request.total_amount)}
                          </div>
                          <div className="text-xs text-gray-400">
                            Yêu cầu: {formatDate(request.updated_at)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Khách hàng */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {request.renter?.full_name || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.renter?.email || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.renter?.phone_number || "N/A"}
                      </div>
                    </td>

                    {/* Xe */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {request.vehicle?.model || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.vehicle?.license_plate || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.vehicle?.brand?.name || "N/A"}
                      </div>
                    </td>

                    {/* Thời gian thuê */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center mb-1">
                          <MdCalendarToday className="h-4 w-4 text-gray-400 mr-1" />
                          {formatDate(request.start_date)}
                        </div>
                        <div className="text-gray-500">
                          đến {formatDate(request.end_date)}
                        </div>
                      </div>
                    </td>

                    {/* Chi tiết tiền hoàn */}
                    <td className="px-6 py-4">
                      {request.financial_breakdown ? (
                        <div className="space-y-1">
                          <div className="text-xs">
                            <span className="text-gray-600">Phí hủy:</span>
                            <span className="font-medium text-red-600 ml-1">
                              {formatCurrency(
                                request.financial_breakdown.cancellation_fee
                              )}
                            </span>
                            <span className="text-gray-500 ml-1">
                              (
                              {
                                request.financial_breakdown
                                  .cancellation_fee_percent
                              }
                              %)
                            </span>
                          </div>
                          <div className="text-xs">
                            <span className="text-gray-600">Bạn nhận:</span>
                            <span className="font-medium text-green-600 ml-1">
                              {formatCurrency(
                                request.financial_breakdown.owner_refund
                              )}
                            </span>
                          </div>
                          <div className="text-xs">
                            <span className="text-gray-600">Khách hoàn:</span>
                            <span className="font-medium text-blue-600 ml-1">
                              {formatCurrency(
                                request.financial_breakdown.renter_refund
                              )}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>

                    {/* Trạng thái */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            request.status === "cancel_requested"
                              ? "bg-yellow-100 text-yellow-800"
                              : request.status === "canceled"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {request.status === "cancel_requested"
                            ? "Chờ duyệt"
                            : request.status === "canceled"
                            ? "Đã hủy"
                            : "Đã xử lý"}
                        </span>

                        {request.cancellation_info && (
                          <div className="text-xs text-gray-500">
                            <div>
                              Hủy bởi:{" "}
                              {request.cancellation_info.cancelled_by ===
                              "renter"
                                ? "Khách"
                                : "Chủ xe"}
                            </div>
                            {request.cancellation_info.reason && (
                              <div
                                className="truncate max-w-32"
                                title={request.cancellation_info.reason}
                              >
                                Lý do: {request.cancellation_info.reason}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Thao tác */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {request.can_approve ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              handleApproveCancel(request.booking_id)
                            }
                            disabled={processingId === request.booking_id}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingId === request.booking_id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            ) : (
                              <MdCheck className="h-3 w-3 mr-1" />
                            )}
                            Duyệt
                          </button>

                          <button
                            onClick={() =>
                              handleRejectCancel(request.booking_id)
                            }
                            disabled={processingId === request.booking_id}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <MdClose className="h-3 w-3 mr-1" />
                            Từ chối
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị{" "}
                {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} đến{" "}
                {Math.min(
                  pagination.currentPage * pagination.itemsPerPage,
                  pagination.totalItems
                )}{" "}
                của {pagination.totalItems} kết quả
              </div>
              <div className="flex space-x-2">
                <button
                  disabled={pagination.currentPage <= 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Trước
                </button>
                {Array.from(
                  { length: pagination.totalPages },
                  (_, i) => i + 1
                ).map((page) => (
                  <button
                    key={page}
                    className={`px-3 py-1 text-sm border rounded-md ${
                      page === pagination.currentPage
                        ? "bg-blue-500 text-white border-blue-500"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  disabled={pagination.currentPage >= pagination.totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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

export default CancelRequests;
