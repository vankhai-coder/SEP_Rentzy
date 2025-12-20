/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '../../../config/axiosInstance';
import { toast } from 'sonner';
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
  const [rejectModal, setRejectModal] = useState({ open: false, vehicleId: null, vehicleModel: '' });
  const [rejectReason, setRejectReason] = useState('');
  const [autoApproveEnabled, setAutoApproveEnabled] = useState(false);
  const autoProcessingRef = useRef(false);
  const processedRef = useRef(new Set());
  const [approvingId, setApprovingId] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [approveModal, setApproveModal] = useState({ open: false, vehicleId: null, vehicleModel: '' });

  const buildAutoRejectReason = (vehicleId, vehicleModel) => {
    const result = checkResults[vehicleId];
    if (!result || !Array.isArray(result.checks)) return '';
    const items = (result.checks || []).filter((c) => c && (c.status === 'fail' || c.status === 'warn'));
    if (items.length === 0) return '';
    const lines = [];
    lines.push(`Xe ${vehicleModel} có vấn đề cần chỉnh sửa.`);
    const failCount = items.filter((c) => c.status === 'fail').length;
    const warnCount = items.filter((c) => c.status === 'warn').length;
    if (failCount > 0) lines.push(`Lỗi nghiêm trọng: ${failCount}`);
    if (warnCount > 0) lines.push(`Cảnh báo: ${warnCount}`);
    items.forEach((c, idx) => {
      const label = String(c.label || '').trim();
      const detail = String(c.detail || '').trim();
      const statusText = c.status === 'fail' ? 'Lỗi' : 'Cảnh báo';
      lines.push(`- ${statusText} ${label}: ${detail}. Gợi ý: vui lòng kiểm tra và cập nhật thông tin "${label}" cho chính xác.`);
    });
    return lines.join('\n');
  };

  const buildAutoRejectReasonFromResult = (result, vehicleModel) => {
    try {
      if (!result || !Array.isArray(result.checks)) return '';
      const items = (result.checks || []).filter((c) => c && (c.status === 'fail' || c.status === 'warn'));
      if (items.length === 0) return '';
      const lines = [];
      lines.push(`Xe ${vehicleModel} có vấn đề cần chỉnh sửa.`);
      const failCount = items.filter((c) => c.status === 'fail').length;
      const warnCount = items.filter((c) => c.status === 'warn').length;
      if (failCount > 0) lines.push(`Lỗi nghiêm trọng: ${failCount}`);
      if (warnCount > 0) lines.push(`Cảnh báo: ${warnCount}`);
      items.forEach((c) => {
        const label = String(c.label || '').trim();
        const detail = String(c.detail || '').trim();
        const statusText = c.status === 'fail' ? 'Lỗi' : 'Cảnh báo';
        lines.push(`- ${statusText} ${label}: ${detail}. Gợi ý: vui lòng kiểm tra và cập nhật thông tin "${label}" cho chính xác.`);
      });
      return lines.join('\n');
    } catch {
      return '';
    }
  };

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

  const setAutoApprove = async (enabled) => {
    try {
      setAutoApproveEnabled(enabled);
      await axiosInstance.patch('/api/admin/approval-vehicles/auto-approve-flag', { enabled });
    } catch (error) {
      setAutoApproveEnabled(!enabled);
      toast.error('Không thể cập nhật trạng thái tự động duyệt');
    }
  };

  // Handle approve vehicle
  const handleApprove = (vehicleId, vehicleModel) => {
    setApproveModal({ open: true, vehicleId, vehicleModel });
  };

  const handleReject = (vehicleId, vehicleModel) => {
    setRejectModal({ open: true, vehicleId, vehicleModel });
    const autoText = buildAutoRejectReason(vehicleId, vehicleModel);
    setRejectReason(autoText);
  };

  const approveSilent = async (vehicleId, vehicleModel) => {
    try {
      const response = await axiosInstance.patch(`/api/admin/approval-vehicles/${vehicleId}/approve`);
      if (response.data.success) {
        toast.success(`Đã chấp nhận xe ${vehicleModel}`);
        if (expandedVehicleId === vehicleId) {
          setExpandedVehicleId(null);
          setSelectedVehicle(null);
        }
      }
    } catch (error) {
      toast.error('Lỗi khi chấp nhận xe');
    }
  };

  const rejectSilent = async (vehicleId, vehicleModel, reason) => {
    try {
      const response = await axiosInstance.patch(`/api/admin/approval-vehicles/${vehicleId}/reject`, { reason });
      if (response.data.success) {
        toast.error(`Đã từ chối xe ${vehicleModel}`, {
          className: 'border-l-4 border-red-500',
          icon: <MdCancel className="w-5 h-5 text-red-600" />
        });
        if (expandedVehicleId === vehicleId) {
          setExpandedVehicleId(null);
          setSelectedVehicle(null);
        }
      }
    } catch (error) {
      toast.error('Lỗi khi từ chối xe');
    }
  };

  const checkByAI = async (vehicle) => {
    try {
      const res = await axiosInstance.post('/api/ai/check-vehicle-info', { vehicle_id: vehicle.vehicle_id });
      if (res.data && res.data.success) {
        setCheckResults((prev) => ({ ...prev, [vehicle.vehicle_id]: res.data.data }));
        return res.data.data;
      }
      return null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (rejectModal.open) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prevOverflow; };
    }
  }, [rejectModal.open]);
  useEffect(() => {
    if (approveModal.open) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prevOverflow; };
    }
  }, [approveModal.open]);

  const confirmReject = async () => {
    if (!rejectModal.vehicleId) return;
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lí do từ chối');
      return;
    }

    try {
      setRejecting(true);
      const response = await axiosInstance.patch(`/api/admin/approval-vehicles/${rejectModal.vehicleId}/reject`, { reason: rejectReason.trim() });
      if (response.data.success) {
        toast.error(`Đã từ chối xe ${rejectModal.vehicleModel}`, {
          className: 'border-l-4 border-red-500',
          icon: <MdCancel className="w-5 h-5 text-red-600" />
        });
        fetchVehicles(pagination.currentPage);
        fetchStats();
        if (expandedVehicleId === rejectModal.vehicleId) {
          setExpandedVehicleId(null);
          setSelectedVehicle(null);
        }
        setRejectModal({ open: false, vehicleId: null, vehicleModel: '' });
        setRejectReason('');
      }
    } catch (error) {
      console.error('Error rejecting vehicle:', error);
      toast.error('Lỗi khi từ chối xe');
    } finally {
      setRejecting(false);
    }
  };
  const confirmApprove = async () => {
    if (!approveModal.vehicleId) return;
    try {
      setApprovingId(approveModal.vehicleId);
      const response = await axiosInstance.patch(`/api/admin/approval-vehicles/${approveModal.vehicleId}/approve`);
      if (response.data.success) {
        toast.success(`Đã chấp nhận xe ${approveModal.vehicleModel}`);
        fetchVehicles(pagination.currentPage);
        fetchStats();
        if (expandedVehicleId === approveModal.vehicleId) {
          setExpandedVehicleId(null);
          setSelectedVehicle(null);
        }
        setApproveModal({ open: false, vehicleId: null, vehicleModel: '' });
      }
    } catch (error) {
      console.error('Error approving vehicle:', error);
      toast.error('Lỗi khi chấp nhận xe');
    } finally {
      setApprovingId(null);
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
      pending: { color: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300', text: 'Chờ duyệt' },
      approved: { color: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300', text: 'Đã duyệt' },
      rejected: { color: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300', text: 'Từ chối' }
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

  useEffect(() => {
    fetchVehicles();
    fetchStats();
    (async () => {
      try {
        const res = await axiosInstance.get('/api/admin/approval-vehicles/auto-approve-flag');
        if (res.data && res.data.success) {
          setAutoApproveEnabled(!!res.data.enabled);
        }
      // eslint-disable-next-line no-empty
      } catch {}
    })();
  }, [fetchVehicles, fetchStats]);

  const autoProcessPending = useCallback(async () => {
    if (!autoApproveEnabled || autoProcessingRef.current) return;
    if (!Array.isArray(vehicles) || vehicles.length === 0) return;
    autoProcessingRef.current = true;
    for (const v of vehicles) {
      if (v.approvalStatus !== 'pending') continue;
      if (processedRef.current.has(v.vehicle_id)) continue;
      let result = checkResults[v.vehicle_id];
      if (!result) {
        result = await checkByAI(v);
      }
      const fail = Number(result?.summary?.fail || 0);
      if (fail > 0) {
        const reason = buildAutoRejectReasonFromResult(result, v.model) || 'Dữ liệu không hợp lệ theo kiểm tra AI';
        await rejectSilent(v.vehicle_id, v.model, reason);
      } else if (result) {
        await approveSilent(v.vehicle_id, v.model);
      }
      processedRef.current.add(v.vehicle_id);
      await new Promise((r) => setTimeout(r, 250));
    }
    await fetchVehicles(pagination.currentPage);
    await fetchStats();
    autoProcessingRef.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoApproveEnabled, vehicles, checkResults, pagination.currentPage, fetchVehicles, fetchStats]);

  useEffect(() => {
    autoProcessPending();
  }, [autoProcessPending]);

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
    <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Duyệt xe</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <span>Tự động duyệt</span>
            <button
              onClick={() => setAutoApprove(!autoApproveEnabled)}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${autoApproveEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`block w-4 h-4 bg-white rounded-full transition-transform ${autoApproveEnabled ? 'translate-x-6' : 'translate-x-0'}`}></span>
            </button>
          </label>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <MdRefresh className="w-4 h-4" />
            Làm mới
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Chờ duyệt</p>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.pending}</p>
            </div>
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
              <MdDirectionsCar className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Đã duyệt</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.approved}</p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
              <MdCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Từ chối</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.rejected}</p>
            </div>
            <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
              <MdCancel className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
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
                <th className="px-4 py-3 text-left font-medium">NGÀY TẠO</th>
                <th className="px-4 py-3 text-left font-medium">TRẠNG THÁI</th>
                <th className="px-4 py-3 text-left font-medium">DUYỆT</th>
                <th className="px-4 py-3 text-left font-medium">HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    Đang tải...
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
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
                          {vehicle.brand?.name} • {vehicle.year}
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
                      <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 rounded">
                        {vehicle.license_plate}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {formatPrice(vehicle.price_per_day)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900 dark:text-gray-100">{formatDate(vehicle.created_at)}</span>
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
                          onClick={(e) => { e.stopPropagation(); approvingId ? null : handleApprove(vehicle.vehicle_id, vehicle.model); }}
                          disabled={approvingId === vehicle.vehicle_id}
                          className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${
                            approvingId === vehicle.vehicle_id
                              ? 'bg-green-200 dark:bg-green-900/60 text-green-700 dark:text-green-300 cursor-not-allowed opacity-70'
                              : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60'
                          }`}
                        >
                          {approvingId === vehicle.vehicle_id ? (
                            <>
                              <span className="inline-block w-3 h-3 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></span>
                              <span>Đang duyệt...</span>
                            </>
                          ) : (
                            <>
                              <MdCheckCircle className="w-4 h-4" />
                              <span>Chấp nhận</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleReject(vehicle.vehicle_id, vehicle.model); }}
                          className="px-3 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded text-sm hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors flex items-center gap-1"
                        >
                          <MdCancel className="w-4 h-4" />
                          Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedVehicleId === vehicle.vehicle_id && (
                    <tr>
                      <td colSpan="9" className="px-4 py-4 bg-gray-50 dark:bg-gray-800/50">
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
                                {vehicle.location && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Địa chỉ</span>
                                    <span className="text-gray-900 dark:text-white">{vehicle.location}</span>
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
                                className="ml-auto px-4 py-2 border border-blue-400 dark:border-blue-600 rounded bg-blue-400 dark:bg-blue-600 text-white hover:bg-blue-500 dark:hover:bg-blue-700 transition-colors"
                              >
                                {checkingId === vehicle.vehicle_id ? 'Đang kiểm tra...' : 'Kiểm tra'}
                              </button>
                            </div>
                            {checkResults[vehicle.vehicle_id] && (
                              <div className="mt-3 p-3 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Kết quả kiểm tra</div>
                                <div className="text-sm text-gray-900 dark:text-white mb-2">
                                  {checkResults[vehicle.vehicle_id].brand} {checkResults[vehicle.vehicle_id].model} • {checkResults[vehicle.vehicle_id].year}
                                </div>
                                <div className="flex gap-3 text-xs mb-3">
                                  <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">Tốt: {checkResults[vehicle.vehicle_id].summary.pass}</span>
                                  <span className="px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300">Cảnh báo: {checkResults[vehicle.vehicle_id].summary.warn}</span>
                                  <span className="px-2 py-1 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">Nguy hiểm: {checkResults[vehicle.vehicle_id].summary.fail}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {(
                                    (checkResults[vehicle.vehicle_id].checks || [])
                                      .filter((c) => { const l = String(c.label || '').toLowerCase(); return !l.includes('vị trí') && !l.includes('vi tri'); })
                                      .filter((c) => vehicle.vehicle_type === 'car' ? !String(c.label || '').toLowerCase().includes('dung tích') : true)
                                  ).map((c, idx) => (
                                    <div key={idx} className={`p-2 rounded border ${c.status === 'pass' ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : c.status === 'fail' ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20' : 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20'}`}>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">{c.label}</div>
                                      <div className="text-sm text-gray-900 dark:text-white">{c.detail}</div>
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
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Hiển thị {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} đến{' '}
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} trong tổng số{' '}
              {pagination.totalItems} xe
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
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
                        ? 'bg-blue-600 dark:bg-blue-700 text-white border-blue-600 dark:border-blue-700'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
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
      {rejectModal.open && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-gray-800 w-full max-w-4xl min-w-[768px] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">Nhập lí do từ chối</div>
              <button onClick={() => setRejectModal({ open: false, vehicleId: null, vehicleModel: '' })} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                <MdClose className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="text-sm text-gray-700 dark:text-gray-300">Xe: {rejectModal.vehicleModel}</div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full min-h-60 p-3 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Nhập lí do từ chối gửi tới chủ xe"
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
              <button
                onClick={() => setRejectModal({ open: false, vehicleId: null, vehicleModel: '' })}
                disabled={rejecting}
                className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 ${rejecting ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                Hủy
              </button>
              <button
                onClick={confirmReject}
                disabled={rejecting}
                className={`px-5 py-2 text-white rounded ${rejecting ? 'bg-red-400 dark:bg-red-800 cursor-not-allowed' : 'bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800'}`}
              >
                {rejecting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
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
      {approveModal.open && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-gray-800 w-full max-w-xl rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">Xác nhận chấp nhận</div>
              <button onClick={() => setApproveModal({ open: false, vehicleId: null, vehicleModel: '' })} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                <MdClose className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5">
              <div className="text-sm text-gray-700 dark:text-gray-300">Bạn có chắc chắn muốn chấp nhận xe {approveModal.vehicleModel}?</div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
              <button
                onClick={() => setApproveModal({ open: false, vehicleId: null, vehicleModel: '' })}
                disabled={approvingId === approveModal.vehicleId}
                className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 ${approvingId === approveModal.vehicleId ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                Hủy
              </button>
              <button
                onClick={confirmApprove}
                disabled={approvingId === approveModal.vehicleId}
                className={`px-5 py-2 text-white rounded ${approvingId === approveModal.vehicleId ? 'bg-green-400 dark:bg-green-800 cursor-not-allowed' : 'bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800'}`}
              >
                {approvingId === approveModal.vehicleId ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
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

export default ApprovalVehicle;
