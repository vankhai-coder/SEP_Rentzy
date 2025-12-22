import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../../config/axiosInstance';
import { toast } from 'sonner';
import {
  MdRefresh,
  MdSearch,
  MdLock,
  MdLockOpen,
  MdDirectionsCar,
  MdTwoWheeler,
  MdFilterList,
  MdClose,
  MdChevronLeft,
  MdChevronRight
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
    const [expandedVehicleId, setExpandedVehicleId] = useState(null);
    const [imageModal, setImageModal] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ open: false, vehicleId: null, vehicleModel: '', nextStatus: null });
    const [confirming, setConfirming] = useState(false);

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
  const openConfirmModal = useCallback((vehicleId, vehicleModel, nextStatus) => {
    setConfirmModal({ open: true, vehicleId, vehicleModel, nextStatus });
  }, []);

  const closeConfirmModal = useCallback(() => {
    if (confirming) return;
    setConfirmModal({ open: false, vehicleId: null, vehicleModel: '', nextStatus: null });
  }, [confirming]);

  const handleConfirmChangeStatus = useCallback(async () => {
    if (!confirmModal.vehicleId || !confirmModal.nextStatus) return;
    const { vehicleId, vehicleModel, nextStatus } = confirmModal;

    try {
      setConfirming(true);
      const response = await axiosInstance.patch(`/api/admin/management-vehicles/${vehicleId}/status`, {
        status: nextStatus
      });

      if (response.data.success) {
        toast.success(nextStatus === 'blocked' ? `Đã khóa xe ${vehicleModel}` : `Đã mở khóa xe ${vehicleModel}`);
        closeConfirmModal();
        fetchVehicles(pagination.currentPage);
      }
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      toast.error(nextStatus === 'blocked' ? 'Lỗi khi khóa xe' : 'Lỗi khi mở khóa xe');
    } finally {
      setConfirming(false);
    }
  }, [closeConfirmModal, confirmModal, fetchVehicles, pagination.currentPage]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchVehicles(newPage);
      setExpandedVehicleId(null);
      setImageModal(null);
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
      available: { color: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300', text: 'Có sẵn' },
      blocked: { color: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300', text: 'Bị khóa' }
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
      none: { color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300', text: 'Chưa gửi' },
      pending: { color: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300', text: 'Chờ duyệt' },
      approved: { color: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300', text: 'Đã duyệt' },
      rejected: { color: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300', text: 'Từ chối' }
    };

    const config = statusConfig[status] || statusConfig.none;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };
  
  const normalizeImages = (vehicle) => {
    const extras = typeof vehicle?.extra_images === 'string'
      ? (() => { try { return JSON.parse(vehicle.extra_images); } catch { return []; } })()
      : Array.isArray(vehicle?.extra_images) ? vehicle.extra_images : [];
    const all = [vehicle?.main_image_url].filter(Boolean).concat(extras.filter(Boolean));
    return { main: vehicle?.main_image_url || null, extras, all };
  };

  const toggleExpand = (vehicle) => {
    if (expandedVehicleId === vehicle.vehicle_id) {
      setExpandedVehicleId(null);
    } else {
      setExpandedVehicleId(vehicle.vehicle_id);
    }
  };

  const openImageModal = (vehicle, idx) => {
    const imgs = normalizeImages(vehicle).all;
    if (imgs.length === 0) return;
    setImageModal({ images: imgs, index: Math.max(0, Math.min(idx, imgs.length - 1)) });
  };
  const closeImageModal = () => setImageModal(null);
  const prevImage = () => setImageModal((m) => (!m ? null : { images: m.images, index: (m.index - 1 + m.images.length) % m.images.length }));
  const nextImage = () => setImageModal((m) => (!m ? null : { images: m.images, index: (m.index + 1) % m.images.length }));

  useEffect(() => {
    if (!confirmModal.open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeConfirmModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmModal.open, closeConfirmModal]);

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý xe</h1>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <MdRefresh className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên , biển số ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
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
            <MdFilterList className="text-gray-500 dark:text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="available">Có sẵn</option>
              <option value="blocked">Bị khóa</option>
            </select>

            <select
              value={vehicleTypeFilter}
              onChange={(e) => setVehicleTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Tất cả loại xe</option>
              <option value="car">Ô tô</option>
              <option value="motorbike">Xe máy</option>
            </select>

            <select
              value={approvalStatusFilter}
              onChange={(e) => setApprovalStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-600 dark:bg-blue-700 text-white">
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
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    Đang tải...
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    Không có xe nào
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle) => (
                  <>
                  <tr key={vehicle.vehicle_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => toggleExpand(vehicle)}>
                    <td className="px-4 py-3">
                      <div className="w-16 h-12 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                        {vehicle.main_image_url ? (
                          <img
                            src={vehicle.main_image_url}
                            alt={vehicle.model}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {vehicle.vehicle_type === 'car' ? (
                              <MdDirectionsCar className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                            ) : (
                              <MdTwoWheeler className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{vehicle.model}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {vehicle.brand?.brand_name} • {vehicle.year}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{vehicle.owner?.full_name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{vehicle.owner?.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-black dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {vehicle.license_plate}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-green-600 dark:text-green-400">
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
                        {vehicle.approvalStatus === 'approved' && (
                          <>
                            {vehicle.status === 'available' ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); openConfirmModal(vehicle.vehicle_id, vehicle.model, 'blocked'); }}
                                className="px-3 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded text-sm hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors flex items-center gap-1"
                              >
                                <MdLock className="w-4 h-4" />
                                Khóa
                              </button>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); openConfirmModal(vehicle.vehicle_id, vehicle.model, 'available'); }}
                                className="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded text-sm hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors flex items-center gap-1"
                              >
                                <MdLockOpen className="w-4 h-4" />
                                Mở khóa
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedVehicleId === vehicle.vehicle_id && (
                    <tr>
                      <td colSpan="8" className="px-4 py-4 bg-gray-50 dark:bg-gray-800/50">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            {(() => { const imgs = normalizeImages(vehicle); return (
                              <div className="space-y-3">
                                {imgs.main && (
                                  <div className="w-full h-56 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden cursor-pointer" onClick={(e) => { e.stopPropagation(); openImageModal(vehicle, 0); }}>
                                    <img src={imgs.main} alt={vehicle.model} className="w-full h-full object-cover" />
                                  </div>
                                )}
                                {imgs.extras.length > 0 && (
                                  <div className="grid grid-cols-3 gap-3">
                                    {imgs.extras.map((url, idx) => (
                                      <div key={idx} className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden cursor-pointer" onClick={(e) => { e.stopPropagation(); openImageModal(vehicle, idx + (imgs.main ? 1 : 0)); }}>
                                        <img src={url} alt={`${vehicle.model}-${idx}`} className="w-full h-full object-cover" />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ); })()}
                          </div>
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                              <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 space-y-2">
                                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Thông tin xe</div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-500 dark:text-gray-400">Năm sản xuất</span>
                                  <span className="text-gray-900 dark:text-white">{vehicle.year}</span>
                                </div>
                                {vehicle.vehicle_type === 'car' && vehicle.seats && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Số chỗ ngồi</span>
                                    <span className="text-gray-900 dark:text-white">{vehicle.seats}</span>
                                  </div>
                                )}
                                {vehicle.vehicle_type === 'car' && vehicle.transmission && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Hộp số</span>
                                    <span className="text-gray-900 dark:text-white">{vehicle.transmission}</span>
                                  </div>
                                )}
                                {vehicle.vehicle_type === 'car' && vehicle.body_type && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Dáng xe</span>
                                    <span className="text-gray-900 dark:text-white">{vehicle.body_type}</span>
                                  </div>
                                )}
                                {vehicle.engine_capacity && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Dung tích</span>
                                    <span className="text-gray-900 dark:text-white">{vehicle.engine_capacity} cc</span>
                                  </div>
                                )}
                                {vehicle.fuel_type && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Nhiên liệu</span>
                                    <span className="text-gray-900 dark:text-white">{vehicle.fuel_type}</span>
                                  </div>
                                )}
                                {vehicle.fuel_consumption && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Mức tiêu thụ</span>
                                    <span className="text-gray-900 dark:text-white">{vehicle.fuel_consumption}</span>
                                  </div>
                                )}
                              </div>
                              <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tính năng</div>
                                {vehicle.features && Array.isArray(vehicle.features) && vehicle.features.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {vehicle.features.map((f, idx) => (
                                      <span key={idx} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded">{String(f)}</span>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500 dark:text-gray-400">Không có tính năng</div>
                                )}
                              </div>
                            </div>
                            {vehicle.description && (
                              <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Mô tả</div>
                                <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-line">{vehicle.description}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Hiển thị {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {' '}
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} {' '}
              trong tổng số {pagination.totalItems} xe
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-black dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        ? 'bg-blue-500 dark:bg-blue-600 text-white border-blue-500 dark:border-blue-600'
                        : 'border-gray-300 dark:border-gray-600 text-black dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
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
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-black dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {imageModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 dark:bg-opacity-90 flex items-center justify-center p-4">
          <button
            onClick={closeImageModal}
            className="absolute top-4 right-4 text-white bg-black bg-opacity-50 dark:bg-opacity-70 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75 dark:hover:bg-opacity-90"
          >
            <MdClose className="w-5 h-5" />
          </button>
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black bg-opacity-50 dark:bg-opacity-70 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 dark:hover:bg-opacity-90"
          >
            <MdChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black bg-opacity-50 dark:bg-opacity-70 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 dark:hover:bg-opacity-90"
          >
            <MdChevronRight className="w-6 h-6" />
          </button>
          <div className="max-w-5xl w-full max-h-[85vh]">
            <img
              src={imageModal.images[imageModal.index]}
              alt={`Ảnh ${imageModal.index + 1}`}
              className="w-full h-full object-contain"
            />
            <div className="mt-2 text-center text-white text-sm">
              Ảnh {imageModal.index + 1} / {imageModal.images.length}
            </div>
          </div>
        </div>
      )}

      {confirmModal.open && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-6" onClick={closeConfirmModal}>
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-lg shadow-lg border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {confirmModal.nextStatus === 'blocked' ? 'Xác nhận khóa xe' : 'Xác nhận mở khóa xe'}
              </div>
              <button
                onClick={closeConfirmModal}
                disabled={confirming}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {confirmModal.nextStatus === 'blocked'
                  ? `Bạn có chắc chắn muốn khóa xe ${confirmModal.vehicleModel}?`
                  : `Bạn có chắc chắn muốn mở khóa xe ${confirmModal.vehicleModel}?`}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
              <button
                onClick={closeConfirmModal}
                disabled={confirming}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmChangeStatus}
                disabled={confirming}
                className={`px-4 py-2 rounded-lg text-white disabled:opacity-50 ${confirmModal.nextStatus === 'blocked'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
                  }`}
              >
                {confirming ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Đang xử lý...</span>
                  </span>
                ) : (
                  'Xác nhận'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementVehicles;
