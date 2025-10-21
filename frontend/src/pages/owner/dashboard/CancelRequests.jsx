import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../config/axiosInstance.js';
import { MdCancel, MdCheck, MdClose, MdPerson, MdDirectionsCar, MdCalendarToday } from 'react-icons/md';

const CancelRequests = () => {
  const [cancelRequests, setCancelRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [processingId, setProcessingId] = useState(null);

  const fetchCancelRequests = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/owner/dashboard/cancel-requests');

      if (response.data.success) {
        setCancelRequests(response.data.data.cancelRequests);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      setError('Không thể tải danh sách yêu cầu hủy');
      console.error('Error fetching cancel requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCancelRequests();
  }, []);

  const handleApproveCancel = async (bookingId) => {
    try {
      setProcessingId(bookingId);
      const response = await axiosInstance.patch(`/owner/dashboard/cancel-requests/${bookingId}/approve`);

      if (response.data.success) {
        // Remove the approved request from the list
        setCancelRequests(prev => prev.filter(req => req.booking_id !== bookingId));
        // Show success message
        alert('Đã duyệt yêu cầu hủy thành công');
      }
    } catch (error) {
      console.error('Error approving cancel request:', error);
      alert('Có lỗi xảy ra khi duyệt yêu cầu hủy');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectCancel = async (bookingId) => {
    try {
      setProcessingId(bookingId);
      const response = await axiosInstance.patch(`/owner/dashboard/cancel-requests/${bookingId}/reject`);

      if (response.data.success) {
        // Remove the rejected request from the list
        setCancelRequests(prev => prev.filter(req => req.booking_id !== bookingId));
        // Show success message
        alert('Đã từ chối yêu cầu hủy');
      }
    } catch (error) {
      console.error('Error rejecting cancel request:', error);
      alert('Có lỗi xảy ra khi từ chối yêu cầu hủy');
    } finally {
      setProcessingId(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString, timeString) => {
    const date = new Date(`${dateString}T${timeString}`);
    return date.toLocaleString('vi-VN');
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
        <p className="text-gray-600">Xem xét và duyệt các yêu cầu hủy đơn thuê từ khách hàng</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <MdCancel className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Yêu cầu hủy</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.totalItems || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <MdCheck className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Đã duyệt hôm nay</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <MdCalendarToday className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Chờ xử lý</p>
              <p className="text-2xl font-bold text-gray-900">{cancelRequests.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Requests List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Danh sách yêu cầu hủy</h3>
        </div>

        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {cancelRequests.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <MdCancel className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Không có yêu cầu hủy nào</h3>
            <p className="mt-1 text-sm text-gray-500">Hiện tại không có yêu cầu hủy nào đang chờ duyệt.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {cancelRequests.map((request) => (
              <div key={request.booking_id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      {/* Vehicle Image */}
                      {request.vehicle?.main_image_url && (
                        <img
                          className="h-16 w-24 rounded-lg object-cover"
                          src={request.vehicle.main_image_url}
                          alt={request.vehicle.model}
                        />
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">
                            Đơn #{request.booking_id}
                          </h4>
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Yêu cầu hủy
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <MdPerson className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-700">Khách hàng:</span>
                            </div>
                            <p className="text-sm text-gray-900">{request.renter?.full_name || 'N/A'}</p>
                            <p className="text-xs text-gray-500">{request.renter?.email || 'N/A'}</p>
                          </div>

                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <MdDirectionsCar className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-700">Xe:</span>
                            </div>
                            <p className="text-sm text-gray-900">{request.vehicle?.model || 'N/A'}</p>
                            <p className="text-xs text-gray-500">{request.vehicle?.license_plate || 'N/A'}</p>
                          </div>

                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <MdCalendarToday className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-700">Thời gian thuê:</span>
                            </div>
                            <p className="text-sm text-gray-900">
                              {formatDateTime(request.start_date, request.start_time)}
                            </p>
                            <p className="text-xs text-gray-500">
                              đến {formatDateTime(request.end_date, request.end_time)}
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-gray-700">Tổng tiền:</span>
                            </div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(request.total_amount)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {request.total_days} ngày
                            </p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <p className="text-xs text-gray-500">
                            Yêu cầu hủy vào: {formatDate(request.updated_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => handleApproveCancel(request.booking_id)}
                      disabled={processingId === request.booking_id}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingId === request.booking_id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <MdCheck className="h-4 w-4 mr-2" />
                      )}
                      Duyệt
                    </button>
                    
                    <button
                      onClick={() => handleRejectCancel(request.booking_id)}
                      disabled={processingId === request.booking_id}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <MdClose className="h-4 w-4 mr-2" />
                      Từ chối
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} đến{' '}
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} của{' '}
                {pagination.totalItems} kết quả
              </div>
              <div className="flex space-x-2">
                <button
                  disabled={pagination.currentPage <= 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Trước
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`px-3 py-1 text-sm border rounded-md ${
                      page === pagination.currentPage
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 hover:bg-gray-50'
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
