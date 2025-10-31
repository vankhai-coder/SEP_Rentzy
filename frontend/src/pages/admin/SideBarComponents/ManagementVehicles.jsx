import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../../config/axiosInstance';
import { toast } from 'react-toastify';
import {
  MdRefresh,
  MdSearch,
  MdLock,
  MdLockOpen,
  MdDirectionsCar,
  MdTwoWheeler,
  MdFilterList
} from 'react-icons/md';

const ManagementVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('');
  const [approvalStatusFilter, setApprovalStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  // Fetch all vehicles
  const fetchVehicles = useCallback(async (page = 1, isSearch = false) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.itemsPerPage
      };

      // Add search and filter parameters
      if (searchQuery.trim()) {
        params.query = searchQuery.trim();
      }
      if (statusFilter) {
        params.status = statusFilter;
      }
      if (vehicleTypeFilter) {
        params.vehicle_type = vehicleTypeFilter;
      }
      if (approvalStatusFilter) {
        params.approvalStatus = approvalStatusFilter;
      }

      const endpoint = isSearch || searchQuery.trim() || statusFilter || vehicleTypeFilter || approvalStatusFilter
        ? '/api/admin/management-vehicles/search'
        : '/api/admin/management-vehicles';

      const response = await axiosInstance.get(endpoint, { params });

      if (response.data.success) {
        setVehicles(response.data.data.vehicles);
        setPagination({
          currentPage: response.data.data.currentPage,
          totalPages: response.data.data.totalPages,
          totalItems: response.data.data.totalCount,
          itemsPerPage: pagination.itemsPerPage
        });
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Lỗi khi tải danh sách xe');
    } finally {
      setLoading(false);
    }
  }, [pagination.itemsPerPage, searchQuery, statusFilter, vehicleTypeFilter, approvalStatusFilter]);

  // Initial load
  useEffect(() => {
    fetchVehicles(1);
  }, [fetchVehicles]);

  // Auto-trigger when filters change
  useEffect(() => {
    // Skip the initial render to avoid double loading
    if (vehicles.length > 0) {
      fetchVehicles(1, true);
    }
  }, [statusFilter, vehicleTypeFilter, approvalStatusFilter, searchQuery, fetchVehicles, vehicles.length]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchVehicles(1, true);
  };

  // Handle refresh
  const handleRefresh = () => {
    setSearchQuery('');
    setStatusFilter('');
    setVehicleTypeFilter('');
    setApprovalStatusFilter('');
    fetchVehicles(1);
  };

  // Handle lock vehicle
  const handleLockVehicle = async (vehicleId, vehicleModel) => {
    if (!window.confirm(`Bạn có chắc chắn muốn khóa xe ${vehicleModel}?`)) {
      return;
    }

    try {
      const response = await axiosInstance.patch(`/api/admin/management-vehicles/${vehicleId}/status`, {
        status: 'blocked'
      });

      if (response.data.success) {
        toast.success(`Đã khóa xe ${vehicleModel}`);
        fetchVehicles(pagination.currentPage);
      }
    } catch (error) {
      console.error('Error locking vehicle:', error);
      toast.error('Lỗi khi khóa xe');
    }
  };

  // Handle unlock vehicle
  const handleUnlockVehicle = async (vehicleId, vehicleModel) => {
    if (!window.confirm(`Bạn có chắc chắn muốn mở khóa xe ${vehicleModel}?`)) {
      return;
    }

    try {
      const response = await axiosInstance.patch(`/api/admin/management-vehicles/${vehicleId}/status`, {
        status: 'available'
      });

      if (response.data.success) {
        toast.success(`Đã mở khóa xe ${vehicleModel}`);
        fetchVehicles(pagination.currentPage);
      }
    } catch (error) {
      console.error('Error unlocking vehicle:', error);
      toast.error('Lỗi khi mở khóa xe');
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchVehicles(newPage);
    }
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  // Get vehicle status badge
  const getVehicleStatusBadge = (status) => {
    const statusConfig = {
      available: { color: 'bg-green-100 text-green-800', text: 'Có sẵn' },
      blocked: { color: 'bg-red-100 text-red-800', text: 'Bị khóa' }
    };

    const config = statusConfig[status] || statusConfig.available;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  // Get approval status badge
  const getApprovalStatusBadge = (status) => {
    const statusConfig = {
      none: { color: 'bg-gray-100 text-gray-800', text: 'Chưa gửi' },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Chờ duyệt' },
      approved: { color: 'bg-green-100 text-green-800', text: 'Đã duyệt' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Từ chối' }
    };

    const config = statusConfig[status] || statusConfig.none;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quản lí xe</h1>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <MdRefresh className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên , biển số ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <MdSearch className="w-4 h-4" />
              Tìm kiếm
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-4 items-center">
            <MdFilterList className="text-gray-500 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="available">Có sẵn</option>
              <option value="blocked">Bị khóa</option>
            </select>

            <select
              value={vehicleTypeFilter}
              onChange={(e) => setVehicleTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả loại xe</option>
              <option value="car">Ô tô</option>
              <option value="motorbike">Xe máy</option>
            </select>

            <select
              value={approvalStatusFilter}
              onChange={(e) => setApprovalStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả trạng thái duyệt</option>
              <option value="none">Chưa gửi</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Từ chối</option>
            </select>
          </div>
        </form>
      </div>

      {/* Vehicles Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left font-medium">ẢNH</th>
                <th className="px-4 py-3 text-left font-medium">XE</th>
                <th className="px-4 py-3 text-left font-medium">CHỦ XE</th>
                <th className="px-4 py-3 text-left font-medium">BIỂN SỐ</th>
                <th className="px-4 py-3 text-left font-medium">GIÁ/NGÀY</th>
                <th className="px-4 py-3 text-left font-medium">TRẠNG THÁI</th>
                <th className="px-4 py-3 text-left font-medium">DUYỆT</th>
                <th className="px-4 py-3 text-left font-medium">HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    Đang tải...
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    Không có xe nào
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle) => (
                  <tr key={vehicle.vehicle_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden">
                        {vehicle.main_image_url ? (
                          <img
                            src={vehicle.main_image_url}
                            alt={vehicle.model}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {vehicle.vehicle_type === 'car' ? (
                              <MdDirectionsCar className="w-6 h-6 text-gray-400" />
                            ) : (
                              <MdTwoWheeler className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{vehicle.model}</div>
                        <div className="text-sm text-gray-500">
                          {vehicle.brand?.brand_name} • {vehicle.year}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{vehicle.owner?.full_name}</div>
                        <div className="text-sm text-gray-500">{vehicle.owner?.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {vehicle.license_plate}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-green-600">
                        {formatPrice(vehicle.price_per_day)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {getVehicleStatusBadge(vehicle.status)}
                    </td>
                    <td className="px-4 py-3">
                      {getApprovalStatusBadge(vehicle.approvalStatus)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {vehicle.status === 'available' ? (
                          <button
                            onClick={() => handleLockVehicle(vehicle.vehicle_id, vehicle.model)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors flex items-center gap-1"
                          >
                            <MdLock className="w-4 h-4" />
                            Khóa
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnlockVehicle(vehicle.vehicle_id, vehicle.model)}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition-colors flex items-center gap-1"
                          >
                            <MdLockOpen className="w-4 h-4" />
                            Mở khóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Hiển thị {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {' '}
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} {' '}
              trong tổng số {pagination.totalItems} xe
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>

              {/* Page numbers */}
              {(() => {
                const pages = [];
                const maxVisiblePages = 5;
                let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
                let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

                if (endPage - startPage + 1 < maxVisiblePages) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }

                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => handlePageChange(i)}
                      className={`px-3 py-1 text-sm border rounded ${i === pagination.currentPage
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {i}
                    </button>
                  );
                }
                return pages;
              })()}

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default ManagementVehicles;