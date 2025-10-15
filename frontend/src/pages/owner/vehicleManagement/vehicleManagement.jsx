import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../config/axiosInstance';
import { toast } from 'react-toastify';
import { 
  MdSearch, 
  MdAdd, 
  MdVisibility, 
  MdEdit, 
  MdLock, 
  MdLockOpen,
  MdDelete,
  MdRefresh,
  MdDirectionsCar,
  MdTwoWheeler
} from 'react-icons/md';
import SidebarOwner from '@/components/SidebarOwner/SidebarOwner';


const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
});
const [stats, setStats] = useState({
    totalVehicles: 0,
    totalRentals: 0
});
const [showVehicleTypeModal, setShowVehicleTypeModal] = useState(false);

const navigate = useNavigate();

  // Fetch vehicles data
const fetchVehicles = useCallback(async () => {
    try {
    setLoading(true);
    const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm })
    });

    const response = await axiosInstance.get(`/api/owner/vehicles?${params}`);
    
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
}, [pagination.currentPage, pagination.itemsPerPage, sortBy, sortOrder, searchTerm]);

  // Fetch vehicle stats
  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get('/api/owner/vehicles/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchStats();
  }, [fetchVehicles]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchVehicles();
  };

  // Handle status toggle
  const handleStatusToggle = async (vehicleId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'available' ? 'blocked' : 'available';
      
      const response = await axiosInstance.patch(`/owner/vehicles/${vehicleId}/status`, {
        status: newStatus
      });

      if (response.data.success) {
        toast.success(response.data.message);
        fetchVehicles();
      }
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      toast.error('Lỗi khi cập nhật trạng thái xe');
    }
  };

  // Handle delete vehicle
  // const handleDelete = async (vehicleId, vehicleName) => {
  //   if (window.confirm(`Bạn có chắc chắn muốn xóa xe "${vehicleName}"?`)) {
  //     try {
  //       const response = await axiosInstance.delete(`/owner/vehicles/${vehicleId}`);
        
  //       if (response.data.success) {
  //         toast.success('Xóa xe thành công');
  //         fetchVehicles();
  //         fetchStats();
  //       }
  //     } catch (error) {
  //       console.error('Error deleting vehicle:', error);
  //       toast.error('Lỗi khi xóa xe');
  //     }
  //   }
  // };

  // Handle vehicle type selection
  const handleAddCar = () => {
    setShowVehicleTypeModal(false);
    navigate('/owner/add-car');
  };

  const handleAddMotorbike = () => {
    setShowVehicleTypeModal(false);
    navigate('/owner/add-motorbike');
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'available':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'blocked':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  // Get approval badge
  const getApprovalBadge = (approvalStatus) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    
    switch (approvalStatus) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  // Get status text in Vietnamese
  const getStatusText = (status) => {
    switch (status) {
      case 'available':
        return 'CÓ SẴN';
      case 'blocked':
        return 'BỊ KHÓA';
      default:
        return status;
    }
  };

  // Get approval text in Vietnamese
  const getApprovalText = (approvalStatus) => {
    switch (approvalStatus) {
      case 'approved':
        return 'ĐÃ DUYỆT';
      case 'pending':
        return 'CHỜ DUYỆT';
      case 'rejected':
        return 'TỪ CHỐI';
      default:
        return approvalStatus;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
        {/* Header */}
        <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Quản lý xe của bạn
        </h1>
        <p className="text-gray-600">
          Tổng số xe: <span className="font-semibold text-blue-600">{stats.totalVehicles}</span>
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên xe, biển số"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tìm kiếm
            </button>
          </form>

          <div className="flex gap-2">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="created_at-DESC">Mới nhất</option>
              <option value="created_at-ASC">Cũ nhất</option>
              <option value="model-ASC">Tên A-Z</option>
              <option value="model-DESC">Tên Z-A</option>
              <option value="price_per_day-ASC">Giá thấp đến cao</option>
              <option value="price_per_day-DESC">Giá cao đến thấp</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setPagination(prev => ({ ...prev, currentPage: 1 }));
                fetchVehicles();
              }}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <MdRefresh className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowVehicleTypeModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <MdAdd className="w-5 h-5" />
              Thêm xe mới
            </button>
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
                <th className="px-4 py-3 text-left font-medium">BIỂN SỐ</th>
                <th className="px-4 py-3 text-left font-medium">GIÁ/NGÀY</th>
                <th className="px-4 py-3 text-left font-medium">LƯỢT THUÊ</th>
                <th className="px-4 py-3 text-left font-medium">TRẠNG THÁI</th>
                <th className="px-4 py-3 text-left font-medium">DUYỆT</th>
                <th className="px-4 py-3 text-left font-medium">HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    Chưa có xe nào. Hãy thêm xe đầu tiên của bạn!
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle) => (
                  <tr key={vehicle.vehicle_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <img
                        src={vehicle.main_image_url || '/default_avt.jpg'}
                        alt={vehicle.model}
                        className="w-16 h-12 object-cover rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">
                          {vehicle.brand?.name} {vehicle.model}
                        </div>
                        <div className="text-sm text-gray-500">
                          {vehicle.year} • {vehicle.vehicle_type}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {vehicle.license_plate}
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {formatPrice(vehicle.price_per_day)}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {vehicle.rent_count} lượt
                    </td>
                    <td className="px-4 py-3">
                      <span className={getStatusBadge(vehicle.status)}>
                        {getStatusText(vehicle.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={getApprovalBadge(vehicle.approvalStatus)}>
                        {getApprovalText(vehicle.approvalStatus)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/owner/vehicles/${vehicle.vehicle_id}`)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors flex items-center gap-1"
                        >
                          <MdVisibility className="w-4 h-4" />
                          Chi tiết
                        </button>
                        <button
                          onClick={() => navigate(`/owner/vehicles/${vehicle.vehicle_id}/edit`)}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition-colors flex items-center gap-1"
                        >
                          <MdEdit className="w-4 h-4" />
                          Sửa
                        </button>
                        <button
                          onClick={() => handleStatusToggle(vehicle.vehicle_id, vehicle.status)}
                          className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${
                            vehicle.status === 'available'
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {vehicle.status === 'available' ? (
                            <>
                              <MdLock className="w-4 h-4" />
                              Khóa
                            </>
                          ) : (
                            <>
                              <MdLockOpen className="w-4 h-4" />
                              Mở khóa
                            </>
                          )}
                        </button>
                        {/* <button
                          onClick={() => handleDelete(vehicle.vehicle_id, vehicle.model)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors flex items-center gap-1"
                        >
                          <MdDelete className="w-4 h-4" />
                          Xóa
                        </button> */}
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
              Hiển thị {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} đến{' '}
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} trong tổng số{' '}
              {pagination.totalItems} xe
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Trước
              </button>
              <span className="px-3 py-1 text-sm">
                {pagination.currentPage} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Vehicle Type Selection Modal */}
      {showVehicleTypeModal && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 ">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Chọn loại xe mà bạn muốn thêm
              </h2>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleAddCar}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <MdDirectionsCar className="w-5 h-5" />
                  Thêm ô tô
                </button>
                
                <button
                  onClick={handleAddMotorbike}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <MdTwoWheeler className="w-5 h-5" />
                  Thêm xe máy
                </button>
              </div>
              
              <button
                onClick={() => setShowVehicleTypeModal(false)}
                className="mt-4 w-full px-4 py-2 text-gray-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors "
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleManagement;
