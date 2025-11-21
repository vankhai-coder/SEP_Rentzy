/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../../config/axiosInstance';
import { toast } from 'react-toastify';
import { 
  MdRefresh,
  MdCheckCircle,
  MdCancel,
  MdDirectionsCar,
  MdTwoWheeler,
  MdClose,
  MdChevronLeft,
  MdChevronRight
} from 'react-icons/md';

const ApprovalVehicle = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedVehicleId, setExpandedVehicleId] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [imageModal, setImageModal] = useState(null);
  const [checkResults, setCheckResults] = useState({});
  const [checkingId, setCheckingId] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0
  });

  // Fetch pending vehicles
  const fetchVehicles = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/admin/approval-vehicles', {
        params: {
          page,
          limit: pagination.itemsPerPage
        }
      });

      if (response.data.success) {
        setVehicles(response.data.data.vehicles);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Lỗi khi tải danh sách xe');
    } finally {
      setLoading(false);
    }
  }, [pagination.itemsPerPage]);

  // Fetch approval stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/api/admin/approval-vehicles/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    fetchVehicles(pagination.currentPage);
    fetchStats();
    setExpandedVehicleId(null);
    setSelectedVehicle(null);
    setImageModal(null);
  };

  // Handle approve vehicle
  const handleApprove = async (vehicleId, vehicleModel) => {
    if (!window.confirm(`Bạn có chắc chắn muốn chấp nhận xe ${vehicleModel}?`)) {
      return;
    }

    try {
      const response = await axiosInstance.patch(`/api/admin/approval-vehicles/${vehicleId}/approve`);
      
      if (response.data.success) {
        toast.success(`Đã chấp nhận xe ${vehicleModel}`);
        fetchVehicles(pagination.currentPage);
        fetchStats();
        if (expandedVehicleId === vehicleId) {
          setExpandedVehicleId(null);
          setSelectedVehicle(null);
        }
      }
    } catch (error) {
      console.error('Error approving vehicle:', error);
      toast.error('Lỗi khi chấp nhận xe');
    }
  };

  // Handle reject vehicle
  const handleReject = async (vehicleId, vehicleModel) => {
    if (!window.confirm(`Bạn có chắc chắn muốn từ chối xe ${vehicleModel}?`)) {
      return;
    }

    try {
      const response = await axiosInstance.patch(`/api/admin/approval-vehicles/${vehicleId}/reject`);
      
      if (response.data.success) {
        toast.success(`Đã từ chối xe ${vehicleModel}`);
        fetchVehicles(pagination.currentPage);
        fetchStats();
        if (expandedVehicleId === vehicleId) {
          setExpandedVehicleId(null);
          setSelectedVehicle(null);
        }
      }
    } catch (error) {
      console.error('Error rejecting vehicle:', error);
      toast.error('Lỗi khi từ chối xe');
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchVehicles(newPage);
      setExpandedVehicleId(null);
      setSelectedVehicle(null);
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

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      }).format(d);
    } catch {
      return String(dateStr || '');
    }
  };

  // Get approval status badge
  const getApprovalStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Chờ duyệt' },
      approved: { color: 'bg-green-100 text-green-800', text: 'Đã duyệt' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Từ chối' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
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

  useEffect(() => {
    fetchVehicles();
    fetchStats();
  }, [fetchVehicles, fetchStats]);

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
      setSelectedVehicle(null);
    } else {
      setExpandedVehicleId(vehicle.vehicle_id);
      setSelectedVehicle(vehicle);
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

  const handleCheckVehicleInfo = async (vehicle) => {
    try {
      setCheckingId(vehicle.vehicle_id);
      const res = await axiosInstance.post('/api/ai/check-vehicle-info', { vehicle_id: vehicle.vehicle_id });
      if (res.data && res.data.success) {
        setCheckResults((prev) => ({ ...prev, [vehicle.vehicle_id]: res.data.data }));
      } else {
        toast.error('Kiểm tra thất bại');
      }
    } catch (error) {
      toast.error('Lỗi khi kiểm tra thông tin xe');
    } finally {
      setCheckingId(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Duyệt xe</h1>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <MdRefresh className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Chờ duyệt</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <MdDirectionsCar className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đã duyệt</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <MdCheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Từ chối</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <MdCancel className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
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
                <th className="px-4 py-3 text-left font-medium">NGÀY TẠO</th>
                <th className="px-4 py-3 text-left font-medium">TRẠNG THÁI</th>
                <th className="px-4 py-3 text-left font-medium">DUYỆT</th>
                <th className="px-4 py-3 text-left font-medium">HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                    Đang tải...
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                    Không có xe nào
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle) => (
                  <>
                  <tr key={vehicle.vehicle_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleExpand(vehicle)}>
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
                          {vehicle.brand?.name} • {vehicle.year}
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
                      <span className="text-sm text-gray-900">{formatDate(vehicle.created_at)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {getVehicleStatusBadge(vehicle.status)}
                    </td>
                    <td className="px-4 py-3">
                      {getApprovalStatusBadge(vehicle.approvalStatus)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleApprove(vehicle.vehicle_id, vehicle.model); }}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition-colors flex items-center gap-1"
                        >
                          <MdCheckCircle className="w-4 h-4" />
                          Chấp nhận
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleReject(vehicle.vehicle_id, vehicle.model); }}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors flex items-center gap-1"
                        >
                          <MdCancel className="w-4 h-4" />
                          Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedVehicleId === vehicle.vehicle_id && (
                    <tr>
                      <td colSpan="9" className="px-4 py-4 bg-gray-50">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            {(() => { const imgs = normalizeImages(vehicle); return (
                              <div className="space-y-3">
                                {imgs.main && (
                                  <div className="w-full h-56 bg-gray-200 rounded overflow-hidden cursor-pointer" onClick={(e) => { e.stopPropagation(); openImageModal(vehicle, 0); }}>
                                    <img src={imgs.main} alt={vehicle.model} className="w-full h-full object-cover" />
                                  </div>
                                )}
                                {imgs.extras.length > 0 && (
                                  <div className="grid grid-cols-3 gap-3">
                                    {imgs.extras.map((url, idx) => (
                                      <div key={idx} className="w-full h-24 bg-gray-200 rounded overflow-hidden cursor-pointer" onClick={(e) => { e.stopPropagation(); openImageModal(vehicle, idx + (imgs.main ? 1 : 0)); }}>
                                        <img src={url} alt={`${vehicle.model}-${idx}`} className="w-full h-full object-cover" />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ); })()}
                          </div>
                          <div className="space-y-3">
                            {/* <div className="flex items-center justify-between">
                              <div className="text-lg font-semibold text-gray-900">{vehicle.brand?.name} {vehicle.model} • {vehicle.year}</div>
                              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{vehicle.license_plate}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 bg-white rounded border">
                                <div className="text-xs font-bold text-gray-500 "> Chủ xe</div>
                                <div className="text-sm font-medium text-gray-900">{vehicle.owner?.full_name}</div>
                                <div className="text-sm text-gray-600">{vehicle.owner?.email}</div>
                                <div className="text-sm text-gray-600">{vehicle.owner?.phone_number}</div>
                              </div>
                              <div className="p-3 bg-white rounded border">
                                <div className="text-xs text-gray-500">Giá/ngày</div>
                                <div className="text-lg font-bold text-green-600">{formatPrice(vehicle.price_per_day)}</div>
                                <div className="text-xs text-gray-500">Vị trí</div>
                                <div className="text-sm text-gray-900">{vehicle.location}</div>
                              </div>
                            </div> */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                              <div className="p-3 bg-white rounded border space-y-2">
                                <div className="text-sm font-semibold text-gray-700">Thông tin xe</div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-500">Năm sản xuất</span>
                                  <span className="text-gray-900">{vehicle.year}</span>
                                </div>
                                {vehicle.vehicle_type === 'car' && vehicle.seats && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Số chỗ ngồi</span>
                                    <span className="text-gray-900">{vehicle.seats}</span>
                                  </div>
                                )}
                                {vehicle.vehicle_type === 'car' && vehicle.transmission && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Hộp số</span>
                                    <span className="text-gray-900">{vehicle.transmission}</span>
                                  </div>
                                )}
                                {vehicle.vehicle_type === 'car' && vehicle.body_type && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Dáng xe</span>
                                    <span className="text-gray-900">{vehicle.body_type}</span>
                                  </div>
                                )}
                                {vehicle.engine_capacity && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Dung tích</span>
                                    <span className="text-gray-900">{vehicle.engine_capacity} cc</span>
                                  </div>
                                )}
                                {vehicle.fuel_type && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Nhiên liệu</span>
                                    <span className="text-gray-900">{vehicle.fuel_type}</span>
                                  </div>
                                )}
                                {vehicle.fuel_consumption && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Mức tiêu thụ</span>
                                    <span className="text-gray-900">{vehicle.fuel_consumption}</span>
                                  </div>
                                )}
                              </div>
                              <div className="p-3 bg-white rounded border">
                                <div className="text-sm font-semibold text-gray-700 mb-2">Tính năng</div>
                                {vehicle.features && Array.isArray(vehicle.features) && vehicle.features.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {vehicle.features.map((f, idx) => (
                                      <span key={idx} className="text-xs px-2 py-1 bg-gray-100 rounded">{String(f)}</span>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500">Không có tính năng</div>
                                )}
                              </div>
                            </div>
                            {vehicle.description && (
                              <div className="p-3 bg-white rounded border">
                                <div className="text-sm font-semibold text-gray-700 mb-1">Mô tả</div>
                                <div className="text-sm text-gray-900 whitespace-pre-line">{vehicle.description}</div>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              {/* <button
                                onClick={(e) => { e.stopPropagation(); handleApprove(vehicle.vehicle_id, vehicle.model); }}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Chấp nhận
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleReject(vehicle.vehicle_id, vehicle.model); }}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                Từ chối
                              </button> */}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCheckVehicleInfo(vehicle); }}
                                className="ml-auto px-4 py-2 border rounded bg-blue-400 text-white hover:bg-blue-500"
                              >
                                {checkingId === vehicle.vehicle_id ? 'Đang kiểm tra...' : 'Kiểm tra'}
                              </button>
                            </div>
                            {checkResults[vehicle.vehicle_id] && (
                              <div className="mt-3 p-3 rounded border bg-white">
                                <div className="text-sm font-semibold text-gray-700 mb-2">Kết quả kiểm tra</div>
                                <div className="text-sm text-gray-900 mb-2">
                                  {checkResults[vehicle.vehicle_id].brand} {checkResults[vehicle.vehicle_id].model} • {checkResults[vehicle.vehicle_id].year}
                                </div>
                                <div className="flex gap-3 text-xs mb-3">
                                  <span className="px-2 py-1 rounded bg-green-100 text-green-700">Tốt: {checkResults[vehicle.vehicle_id].summary.pass}</span>
                                  <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-700">Cảnh báo: {checkResults[vehicle.vehicle_id].summary.warn}</span>
                                  <span className="px-2 py-1 rounded bg-red-100 text-red-700">Nguy hiểm: {checkResults[vehicle.vehicle_id].summary.fail}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {(
                                    (checkResults[vehicle.vehicle_id].checks || [])
                                      .filter((c) => { const l = String(c.label || '').toLowerCase(); return !l.includes('vị trí') && !l.includes('vi tri'); })
                                      .filter((c) => vehicle.vehicle_type === 'car' ? !String(c.label || '').toLowerCase().includes('dung tích') : true)
                                  ).map((c, idx) => (
                                    <div key={idx} className={`p-2 rounded border ${c.status === 'pass' ? 'border-green-200 bg-green-50' : c.status === 'fail' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
                                      <div className="text-xs text-gray-500">{c.label}</div>
                                      <div className="text-sm text-gray-900">{c.detail}</div>
                                    </div>
                                  ))}
                                </div>
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
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Hiển thị {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} đến{' '}
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} trong tổng số{' '}
              {pagination.totalItems} xe
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              
              {[...Array(pagination.totalPages)].map((_, index) => {
                const page = index + 1;
                const isCurrentPage = page === pagination.currentPage;
                
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 text-sm border rounded ${
                      isCurrentPage
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
      {imageModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <button
            onClick={closeImageModal}
            className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75"
          >
            <MdClose className="w-5 h-5" />
          </button>
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75"
          >
            <MdChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75"
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
    </div>
  );
};

export default ApprovalVehicle;