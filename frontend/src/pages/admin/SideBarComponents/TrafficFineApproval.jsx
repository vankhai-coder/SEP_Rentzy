import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../config/axiosInstance';
import { toast } from 'react-toastify';
import { 
  MdRefresh,
  MdCheckCircle,
  MdCancel,
  MdWarning,
  MdClose,
  MdChevronLeft,
  MdChevronRight,
  MdImage
} from 'react-icons/md';

const TrafficFineApproval = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rejectModal, setRejectModal] = useState({ open: false, requestId: null });
  const [rejectReason, setRejectReason] = useState('');
  const [imageModal, setImageModal] = useState(null);

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [currentPage, filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/admin/traffic-fine-requests', {
        params: {
          page: currentPage,
          limit: 10,
          status: filter !== 'all' ? filter : undefined,
          search: searchTerm || undefined
        }
      });

      if (response.data.success) {
        setRequests(response.data.data.requests);
        setTotalPages(response.data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching traffic fine requests:', error);
      toast.error('Lỗi khi tải danh sách yêu cầu phạt nguội');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get('/api/admin/traffic-fine-requests/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('Bạn có chắc chắn muốn duyệt yêu cầu phạt nguội này?')) {
      return;
    }

    try {
      const response = await axiosInstance.patch(`/api/admin/traffic-fine-requests/${requestId}/approve`);
      
      if (response.data.success) {
        toast.success('Đã duyệt yêu cầu phạt nguội thành công');
        fetchRequests();
        fetchStats();
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi duyệt yêu cầu');
    }
  };

  const handleReject = (requestId) => {
    setRejectModal({ open: true, requestId });
    setRejectReason('');
  };

  const confirmReject = async () => {
    if (!rejectModal.requestId) return;
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      const response = await axiosInstance.patch(`/api/admin/traffic-fine-requests/${rejectModal.requestId}/reject`, {
        rejection_reason: rejectReason.trim()
      });
      
      if (response.data.success) {
        toast.success('Đã từ chối yêu cầu phạt nguội');
        fetchRequests();
        fetchStats();
        setRejectModal({ open: false, requestId: null });
        setRejectReason('');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi từ chối yêu cầu');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Chờ duyệt';
      case 'approved':
        return 'Đã duyệt';
      case 'rejected':
        return 'Đã từ chối';
      default:
        return status;
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-secondary-900 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Duyệt Phạt Nguội
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Quản lý và duyệt các yêu cầu phạt nguội từ chủ xe
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-secondary-800 p-4 rounded-lg border border-gray-200 dark:border-secondary-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Tổng số</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">Chờ duyệt</p>
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.pending}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-600 dark:text-green-400">Đã duyệt</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.approved}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">Đã từ chối</p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.rejected}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4 items-center">
        <div className="flex gap-2">
          <button
            onClick={() => { setFilter('all'); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-secondary-700 text-gray-700 dark:text-gray-300'}`}
          >
            Tất cả
          </button>
          <button
            onClick={() => { setFilter('pending'); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg ${filter === 'pending' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-secondary-700 text-gray-700 dark:text-gray-300'}`}
          >
            Chờ duyệt
          </button>
          <button
            onClick={() => { setFilter('approved'); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg ${filter === 'approved' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-secondary-700 text-gray-700 dark:text-gray-300'}`}
          >
            Đã duyệt
          </button>
          <button
            onClick={() => { setFilter('rejected'); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg ${filter === 'rejected' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-secondary-700 text-gray-700 dark:text-gray-300'}`}
          >
            Đã từ chối
          </button>
        </div>
        <button
          onClick={() => { fetchRequests(); fetchStats(); }}
          className="ml-auto p-2 rounded-lg bg-gray-200 dark:bg-secondary-700 hover:bg-gray-300 dark:hover:bg-secondary-600"
        >
          <MdRefresh className="w-5 h-5" />
        </button>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Không có yêu cầu nào
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.request_id}
              className="bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 rounded-lg p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <MdWarning className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Yêu cầu #{request.request_id}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Đơn thuê: #{request.booking?.booking_id} | 
                    Chủ xe: {request.owner?.full_name} ({request.owner?.email}) |
                    Người thuê: {request.booking?.renter?.full_name} ({request.booking?.renter?.email})
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Xe: {request.booking?.vehicle?.model} - {request.booking?.vehicle?.license_plate}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ngày tạo: {formatDate(request.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(request.amount)}
                  </p>
                </div>
              </div>

              {request.description && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-secondary-900 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lý do:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{request.description}</p>
                </div>
              )}

              {request.images && request.images.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hình ảnh:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {request.images.map((imageUrl, index) => (
                      <div
                        key={index}
                        className="relative cursor-pointer group"
                        onClick={() => setImageModal(imageUrl)}
                      >
                        <img
                          src={imageUrl}
                          alt={`Phạt nguội ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-secondary-700 group-hover:opacity-80"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg">
                          <MdImage className="w-8 h-8 text-white opacity-0 group-hover:opacity-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {request.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(request.request_id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <MdCheckCircle className="w-5 h-5" />
                    Duyệt
                  </button>
                  <button
                    onClick={() => handleReject(request.request_id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <MdCancel className="w-5 h-5" />
                    Từ chối
                  </button>
                </div>
              )}

              {request.status === 'rejected' && request.rejection_reason && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">Lý do từ chối:</p>
                  <p className="text-sm text-red-600 dark:text-red-300">{request.rejection_reason}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-gray-200 dark:bg-secondary-700 disabled:opacity-50"
          >
            <MdChevronLeft className="w-5 h-5" />
          </button>
          <span className="px-4 py-2">
            Trang {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-gray-200 dark:bg-secondary-700 disabled:opacity-50"
          >
            <MdChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Từ chối yêu cầu</h3>
              <button
                onClick={() => setRejectModal({ open: false, requestId: null })}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-900 dark:text-white"
                rows="4"
                placeholder="Nhập lý do từ chối..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRejectModal({ open: false, requestId: null })}
                className="px-4 py-2 bg-gray-200 dark:bg-secondary-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-secondary-600"
              >
                Hủy
              </button>
              <button
                onClick={confirmReject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {imageModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setImageModal(null)}
        >
          <div className="max-w-4xl max-h-[90vh] mx-4 relative">
            <button
              onClick={() => setImageModal(null)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
            >
              <MdClose className="w-6 h-6" />
            </button>
            <img
              src={imageModal}
              alt="Phạt nguội"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TrafficFineApproval;

