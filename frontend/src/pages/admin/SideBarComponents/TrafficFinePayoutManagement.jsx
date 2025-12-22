import React, { useState, useEffect } from "react";
import axiosInstance from "@/config/axiosInstance.js";
import { toast } from "react-toastify";
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  XCircle,
  DollarSign,
  Calendar,
  CreditCard
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

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
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    data: null, 
    processing: false 
  });

  const openConfirmModal = (item) => {
    setConfirmModal({
      isOpen: true,
      data: item,
      processing: false
    });
  };

  const closeConfirmModal = () => {
    if (confirmModal.processing) return;
    setConfirmModal({
      isOpen: false,
      data: null,
      processing: false
    });
  };

  const processTransfer = async () => {
    if (!confirmModal.data) return;
    
    setConfirmModal(prev => ({ ...prev, processing: true }));
    try {
      const response = await axiosInstance.patch(`/api/admin/traffic-fine-requests/bookings/${confirmModal.data.booking_id}/transfer`);
      
      if (response.data?.success) { 
        toast.success("Đã xác nhận chuyển tiền thành công"); 
        fetchRequests(); 
        closeConfirmModal();
      } else { 
        toast.error(response.data?.message || "Không thể xác nhận chuyển tiền");
        setConfirmModal(prev => ({ ...prev, processing: false }));
      }
    } catch (error) {
      console.error("Transfer error:", error);
      toast.error(error.response?.data?.message || "Có lỗi khi xác nhận chuyển tiền");
      setConfirmModal(prev => ({ ...prev, processing: false }));
    }
  };

  // Fetch traffic fine requests
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        transfer_status: filter // Send filter directly ('all', 'pending', 'approved')
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
  }, [pagination.page, pagination.limit, filter]);

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchRequests();
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: vi });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
        text: "Chờ chuyển"
      },
      approved: { // Backend might return 'approved' or 'completed' depending on logic, but currently seems 'none' or 'pending'? 
                 // Actually, if we transfer, what status does it become? 
                 // The 'transfer' endpoint updates 'remaining_to_transfer' via transaction, but does it update 'transfer_status' on request?
                 // Let's check transfer logic. If not, we might need to rely on 'remaining_to_transfer'.
                 // But for now let's map what we have.
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
        text: "Đã hoàn thành"
      },
      completed: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
        text: "Đã hoàn thành"
      },
      rejected: {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle,
        text: "Đã từ chối"
      },
      none: {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: AlertCircle,
        text: "Chưa xử lý"
      }
    };
    
    // Fallback if status not found
    const config = badges[status] || badges.none;
    const Icon = config.icon;
    
    return (
      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.text}
      </span>
    );
  };

  // Check if payout is completed based on remaining amount
  const isCompleted = (item) => {
    return item.remaining_to_transfer <= 0;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CreditCard className="w-8 h-8 text-blue-600" />
            Chuyển Tiền Phạt Nguội
          </h1>
          <p className="text-gray-500 mt-1">Quản lý và lịch sử chuyển tiền phạt nguội cho chủ xe</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
            <button
              onClick={() => handleFilterChange("all")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filter === "all"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => handleFilterChange("pending")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filter === "pending"
                  ? "bg-white text-yellow-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Chờ chuyển
            </button>
            <button
              onClick={() => handleFilterChange("approved")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filter === "approved"
                  ? "bg-white text-green-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Đã hoàn thành
            </button>
          </div>

          <form onSubmit={handleSearch} className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo Booking ID, tên chủ xe..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </form>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            Đang tải dữ liệu...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Thông tin Booking</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Chủ xe & Ngân hàng</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng phạt</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Đã thu</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Cần chuyển</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {requests.length === 0 ? (
                    <tr>
                      <td className="px-6 py-12 text-center text-gray-500" colSpan={8}>
                        <div className="flex flex-col items-center justify-center">
                          <Filter className="w-12 h-12 text-gray-300 mb-2" />
                          <p>Không tìm thấy yêu cầu nào</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    requests.map((it) => {
                      const completed = isCompleted(it);
                      return (
                        <tr key={`${it.request_id}-${it.booking_id}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 align-middle">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">#{it.request_id}</span>
                              <span className="text-sm text-blue-600 font-medium">BK{it.booking_id}</span>
                              <span className="text-xs text-gray-500">{it.vehicle?.model} - {it.vehicle?.license_plate}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 align-middle">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{it.owner?.full_name}</span>
                              {it.owner_bank ? (
                                <div className="mt-1 text-xs text-gray-500 bg-gray-100 p-1.5 rounded inline-block">
                                  <div className="font-semibold text-gray-700">{it.owner_bank.bank_name}</div>
                                  <div>{it.owner_bank.account_number}</div>
                                  <div className="uppercase">{it.owner_bank.account_holder_name}</div>
                                </div>
                              ) : (
                                <span className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                  <AlertCircle className="w-3 h-3" /> Chưa có NH chính
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-gray-900 align-middle">
                            {formatCurrency(it.traffic_fine_amount)}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-600 align-middle">
                            {formatCurrency(it.traffic_fine_paid)}
                          </td>
                          <td className="px-6 py-4 text-right align-middle">
                            <div className={`font-bold ${completed ? 'text-green-600' : 'text-blue-600'}`}>
                              {formatCurrency(it.remaining_to_transfer)}
                            </div>
                            {it.transferred > 0 && (
                              <div className="text-xs text-gray-400 mt-1">
                                Đã chuyển: {formatCurrency(it.transferred)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-500 align-middle">
                            {formatDate(it.created_at || it.updated_at)}
                          </td>
                          <td className="px-6 py-4 text-center align-middle">
                            {/* If remaining is 0, show completed, otherwise show status from DB */}
                            {completed ? getStatusBadge('completed') : getStatusBadge(it.transfer_status)}
                          </td>
                          <td className="px-6 py-4 text-right align-middle">
                            {!completed && (
                              <button
                                disabled={it.remaining_to_transfer <= 0}
                                onClick={() => openConfirmModal(it)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                Chuyển tiền
                              </button>
                            )}
                            {completed && (
                               <span className="text-xs text-green-600 font-medium flex items-center justify-end gap-1">
                                 <CheckCircle className="w-4 h-4" /> Hoàn tất
                               </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-500">
                Hiển thị <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> -{" "}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{" "}
                trong số <span className="font-medium">{pagination.total}</span> kết quả
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="p-2 border border-gray-300 rounded-lg bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg">
                  Trang {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 border border-gray-300 rounded-lg bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && confirmModal.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full mb-4">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                Xác nhận chuyển tiền
              </h3>
              
              <p className="text-center text-gray-500 mb-6">
                Bạn có chắc chắn muốn xác nhận đã chuyển tiền cho chủ xe <span className="font-bold text-gray-800">{confirmModal.data.owner?.full_name}</span>?
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Booking ID:</span>
                  <span className="font-medium text-gray-900">#{confirmModal.data.booking_id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ngân hàng:</span>
                  <span className="font-medium text-gray-900 text-right">
                    {confirmModal.data.owner_bank?.bank_name || "N/A"}
                    <br />
                    <span className="text-gray-600">{confirmModal.data.owner_bank?.account_number || "N/A"}</span>
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="text-gray-500 font-medium">Số tiền chuyển:</span>
                  <span className="font-bold text-blue-600 text-lg">
                    {formatCurrency(confirmModal.data.remaining_to_transfer)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeConfirmModal}
                  disabled={confirmModal.processing}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={processTransfer}
                  disabled={confirmModal.processing}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {confirmModal.processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    "Xác nhận"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrafficFinePayoutManagement;