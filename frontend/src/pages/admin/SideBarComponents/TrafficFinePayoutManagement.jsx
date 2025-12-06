import React, { useState, useEffect } from "react";
import axiosInstance from "@/config/axiosInstance.js";
import { toast } from "react-toastify";

const TrafficFinePayoutManagement = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    transfer_status: "pending",
    search: "",
  });

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch traffic fine requests
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search || undefined,
      };

      const response = await axiosInstance.get("/api/admin/traffic-fine-requests/payouts", { params });

      if (response.data.success) {
        setRequests(response.data.data?.payouts || []);
        setPagination({
          page: response.data.data?.pagination?.currentPage || pagination.page,
          limit: response.data.data?.pagination?.itemsPerPage || pagination.limit,
          total: response.data.data?.pagination?.totalItems || 0,
          totalPages: response.data.data?.pagination?.totalPages || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching traffic fine requests:", error);
      toast.error("Lỗi khi tải danh sách yêu cầu phạt nguội");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [pagination.page, pagination.limit]);

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Apply filters
  const applyFilters = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchRequests();
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      transfer_status: "pending",
      search: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(() => fetchRequests(), 100);
  };

  // Approve request
  const handleApprove = async (requestId) => {
    if (!window.confirm("Bạn có chắc chắn muốn duyệt yêu cầu này?")) return;

    try {
      const response = await axiosInstance.patch(
        `/api/admin/traffic-fine-requests/${requestId}/approve`
      );

      if (response.data.success) {
        toast.success("Duyệt yêu cầu thành công");
        fetchRequests();
      }
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error(
        error.response?.data?.message || "Lỗi khi duyệt yêu cầu"
      );
    }
  };

  // Reject request
  const handleReject = async (requestId) => {
    if (!rejectionReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      const response = await axiosInstance.patch(
        `/api/admin/traffic-fine-requests/${requestId}/reject`,
        { rejection_reason: rejectionReason }
      );

      if (response.data.success) {
        toast.success("Từ chối yêu cầu thành công");
        setRejectionReason("");
        setSelectedRequest(null);
        fetchRequests();
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error(
        error.response?.data?.message || "Lỗi khi từ chối yêu cầu"
      );
    }
  };

  // View detail
  const viewDetail = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleString("vi-VN");
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Chuyển Tiền Phạt Nguội</h1>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Trạng thái chuyển tiền
            </label>
            <select
              name="transfer_status"
              value={filters.transfer_status}
              onChange={handleFilterChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="pending">Đang chờ</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Đã từ chối</option>
              <option value="none">Chưa có</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Tìm kiếm
            </label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Booking ID, Owner ID..."
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={applyFilters}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Áp dụng
          </button>
          <button
            onClick={resetFilters}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Đặt lại
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Đang tải...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đơn phạt nguội</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chủ xe</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tài khoản ngân hàng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số tiền phạt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người thuê đã thanh toán</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đã chuyển</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Còn phải chuyển</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {requests.length === 0 ? (
                    <tr><td className="px-6 py-4" colSpan={10}>Không có mục cần chuyển</td></tr>
                  ) : (
                    requests.map((it) => (
                      <tr key={`${it.request_id}-${it.booking_id}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4">#{it.request_id}</td>
                        <td className="px-6 py-4">BK{it.booking_id}</td>
                        <td className="px-6 py-4">
                          <div className="font-semibold">{it.owner?.full_name}</div>
                          <div className="text-xs text-gray-500">{it.owner?.email}</div>
                          <div className="text-xs text-gray-500">{it.owner?.phone_number}</div>
                        </td>
                        <td className="px-6 py-4">
                          {it.owner_bank ? (
                            <div>
                              <div className="font-semibold">{it.owner_bank.bank_name}</div>
                              <div className="text-xs text-gray-500">STK: {it.owner_bank.account_number}</div>
                              <div className="text-xs text-gray-500">Chủ TK: {it.owner_bank.account_holder_name}</div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">Chưa có ngân hàng chính</span>
                          )}
                        </td>
                        <td className="px-6 py-4">{formatCurrency(it.traffic_fine_amount)}</td>
                        <td className="px-6 py-4">{formatCurrency(it.traffic_fine_paid)}</td>
                        <td className="px-6 py-4">{formatCurrency(it.transferred)}</td>
                        <td className="px-6 py-4 font-semibold text-green-600">{formatCurrency(it.remaining_to_transfer)}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">{it.transfer_status}</span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            disabled={it.remaining_to_transfer <= 0}
                            onClick={() => {
                              if (!window.confirm("Xác nhận đã chuyển tiền phạt nguội cho chủ xe?")) return;
                              axiosInstance.patch(`/api/admin/traffic-fine-requests/bookings/${it.booking_id}/transfer`).then((resp) => {
                                if (resp.data?.success) { toast.success("Đã xác nhận chuyển tiền"); fetchRequests(); } else { toast.error(resp.data?.message || "Không thể xác nhận chuyển tiền"); }
                              }).catch((err) => { toast.error(err.response?.data?.message || "Có lỗi khi xác nhận chuyển tiền"); });
                            }}
                            className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Xác nhận chuyển
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 flex items-center justify-between border-t">
              <div className="text-sm text-gray-700">
                Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{" "}
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )}{" "}
                / {pagination.total} yêu cầu
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: prev.page - 1,
                    }))
                  }
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <span className="px-3 py-1">
                  Trang {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: prev.page + 1,
                    }))
                  }
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals đã loại bỏ cho trang chuyển tiền */}
    </div>
  );
};

export default TrafficFinePayoutManagement;