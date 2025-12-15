import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../config/axiosInstance';
import { toast } from 'sonner';
import { 
  MdArrowBack, 
  MdEdit, 
  MdLocationOn, 
  MdCalendarToday,
  MdAttachMoney,
  MdDirectionsCar,
  MdTwoWheeler,
  MdSettings,
  MdLocalGasStation,
  MdAirlineSeatReclineNormal,
  MdSpeed,
  MdCheckCircle,
  MdCancel,
  MdPending,
  MdLock,
  MdLockOpen
} from 'react-icons/md';

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    fetchVehicleDetail();
  }, [id]);

  const fetchVehicleDetail = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/owner/vehicles/${id}`);
      
      if (response.data.success) {
        setVehicle(response.data.data);
      } else {
        setError('Không thể tải thông tin xe');
      }
    } catch (error) {
      console.error('Error fetching vehicle detail:', error);
      setError('Lỗi khi tải thông tin xe');
      toast.error('Lỗi khi tải thông tin xe');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      available: 'bg-green-100 text-green-800',
      blocked: 'bg-red-100 text-red-800',
      rented: 'bg-yellow-100 text-yellow-800'
    };
    return `px-3 py-1 rounded-full text-sm font-medium ${statusConfig[status] || 'bg-gray-100 text-gray-800'}`;
  };

  const getStatusText = (status) => {
    const statusText = {
      available: 'Có sẵn',
      blocked: 'Bị khóa',
      rented: 'Đang cho thuê'
    };
    return statusText[status] || status;
  };

  const getApprovalBadge = (approvalStatus) => {
    const approvalConfig = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      none: 'bg-gray-100 text-gray-800'
    };
    return `px-3 py-1 rounded-full text-sm font-medium ${approvalConfig[approvalStatus] || 'bg-gray-100 text-gray-800'}`;
  };

  const getApprovalText = (approvalStatus) => {
    const approvalText = {
      approved: 'Đã duyệt',
      pending: 'Chờ duyệt',
      rejected: 'Bị từ chối',
      none: 'Chưa gửi duyệt'
    };
    return approvalText[approvalStatus] || approvalStatus;
  };

  const getApprovalIcon = (approvalStatus) => {
    switch (approvalStatus) {
      case 'approved':
        return <MdCheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <MdPending className="w-5 h-5 text-yellow-600" />;
      case 'rejected':
        return <MdCancel className="w-5 h-5 text-red-600" />;
      default:
        return <MdPending className="w-5 h-5 text-gray-600" />;
    }
  };

  const normalizeApprovalStatus = (v) => {
    const raw = v?.approvalStatus ?? v?.approval_status ?? 'none';
    const s = String(raw).toLowerCase();
    if (s === 'accepted' || s === 'accept') return 'approved';
    if (s === 'deny' || s === 'denied' || s === 'refused') return 'rejected';
    return ['approved', 'pending', 'rejected', 'none'].includes(s) ? s : 'none';
  };

  // Create combined images array with main image first
  const getAllImages = () => {
    if (!vehicle) return [];
    
    const images = [];
    
    // Add main image first
    if (vehicle.main_image_url) {
      images.push(vehicle.main_image_url);
    }
    
    // Add extra images
    if (vehicle.extra_images && Array.isArray(vehicle.extra_images)) {
      images.push(...vehicle.extra_images);
    }
    
    return images;
  };

  const allImages = getAllImages();
  const currentImageIndex = selectedImage ? allImages.indexOf(selectedImage) : 0;


  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="p-6" >
        <div className="text-center py-12">
          <div className="text-red-600 text-xl font-semibold mb-4">{error || 'Không tìm thấy xe'}</div>
          <button
            onClick={() => navigate('/owner/vehicle-management')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quay lại danh sách xe
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/owner/vehicle-management')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <MdArrowBack className="w-5 h-5" />
              Quay lại
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              Chi tiết xe: {vehicle.brand?.name} {vehicle.model}
            </h1>
          </div>

          
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Images */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Hình ảnh xe</h2>
              
              {allImages.length > 0 ? (
                <div className="flex gap-4">
                  {/* Main Image - Left Side */}
                  <div className="flex-1">
                    <div className="relative">
                      <img
                        src={selectedImage || allImages[0]}
                        alt={`${vehicle.brand?.name} ${vehicle.model}`}
                        className="w-full h-96 object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => {
                          setSelectedImage(selectedImage || allImages[0]);
                          setShowImageModal(true);
                        }}
                      />
                      <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {allImages.length}
                      </div>
                    </div>
                  </div>

                  {/* Thumbnail Images - Right Side */}
                  <div className="w-48 flex flex-col gap-2">
                    {allImages.slice(0, 4).map((image, index) => (
                      <div 
                        key={index}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          (!selectedImage && index === 0) || selectedImage === image
                            ? 'border-blue-500 ring-2 ring-blue-200' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedImage(image)}
                      >
                        <img
                          src={image}
                          alt={index === 0 ? 'Ảnh chính' : `Ảnh ${index + 1}`}
                          className="w-full h-22 object-cover"
                        />
                        {index === 0 && (
                          <div className="absolute bottom-0 left-0 right-0">
                            <div className="bg-blue-600 text-white text-xs px-1 py-0.5 text-center">
                              Chính
                            </div>
                          </div>
                        )}
                        {index === 3 && allImages.length > 4 && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <div className="text-white text-sm font-medium">
                              +{allImages.length - 4}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* View All Button */}
                    {allImages.length > 1 && (
                      <button
                        onClick={() => {
                          setSelectedImage(allImages[0]);
                          setShowImageModal(true);
                        }}
                        className="w-full py-2 px-3 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Xem tất cả ({allImages.length})
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                 <div className="text-center py-12">
                   <div className="text-gray-400 text-4xl mb-4">📷</div>
                   <div className="text-gray-500 text-lg">Chưa có hình ảnh</div>
                 </div>
               )}
            </div>

            {/* Vehicle Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin xe</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {vehicle.vehicle_type === 'car' ? (
                      <MdDirectionsCar className="w-6 h-6 text-blue-600" />
                    ) : (
                      <MdTwoWheeler className="w-6 h-6 text-blue-600" />
                    )}
                    <div>
                      <div className="text-sm text-gray-500">Loại xe</div>
                      <div className="font-medium">{vehicle.vehicle_type === 'car' ? 'Ô tô' : 'Xe máy'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MdLocationOn className="w-6 h-6 text-blue-600" />
                    <div>
                      <div className="text-sm text-gray-500">Vị trí</div>
                      <div className="font-medium">{vehicle.location}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MdCalendarToday className="w-6 h-6 text-blue-600" />
                    <div>
                      <div className="text-sm text-gray-500">Năm sản xuất</div>
                      <div className="font-medium">{vehicle.year}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MdAttachMoney className="w-6 h-6 text-blue-600" />
                    <div>
                      <div className="text-sm text-gray-500">Giá thuê/ngày</div>
                      <div className="font-medium text-lg text-green-600">{formatPrice(vehicle.price_per_day)}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Biển số xe</div>
                    <div className="font-medium text-lg">{vehicle.license_plate}</div>
                  </div>

                  {/* Car specific fields */}
                  {vehicle.vehicle_type === 'car' && (
                    <>
                      {vehicle.transmission && (
                        <div className="flex items-center gap-3">
                          <MdSettings className="w-6 h-6 text-blue-600" />
                          <div>
                            <div className="text-sm text-gray-500">Hộp số</div>
                            <div className="font-medium">{vehicle.transmission === 'manual' ? 'Số sàn' : 'Số tự động'}</div>
                          </div>
                        </div>
                      )}

                      {vehicle.fuel_type && (
                        <div className="flex items-center gap-3">
                          <MdLocalGasStation className="w-6 h-6 text-blue-600" />
                          <div>
                            <div className="text-sm text-gray-500">Nhiên liệu</div>
                            <div className="font-medium">
                              {vehicle.fuel_type === 'petrol' ? 'Xăng' : 
                               vehicle.fuel_type === 'diesel' ? 'Dầu' :
                               vehicle.fuel_type === 'electric' ? 'Điện' : 'Hybrid'}
                            </div>
                          </div>
                        </div>
                      )}

                      {vehicle.seats && (
                        <div className="flex items-center gap-3">
                          <MdAirlineSeatReclineNormal className="w-6 h-6 text-blue-600" />
                          <div>
                            <div className="text-sm text-gray-500">Số chỗ ngồi</div>
                            <div className="font-medium">{vehicle.seats} chỗ</div>
                          </div>
                        </div>
                      )}

                      {vehicle.body_type && (
                        <div className="flex items-center gap-3">
                          <MdDirectionsCar className="w-6 h-6 text-blue-600" />
                          <div>
                            <div className="text-sm text-gray-500">Kiểu xe</div>
                            <div className="font-medium">
                              {vehicle.body_type === 'sedan' ? 'Sedan' :
                               vehicle.body_type === 'suv' ? 'SUV' :
                               vehicle.body_type === 'hatchback' ? 'Hatchback' :
                               vehicle.body_type === 'convertible' ? 'Convertible' :
                               vehicle.body_type === 'coupe' ? 'Coupe' :
                               vehicle.body_type === 'minivan' ? 'Minivan' :
                               vehicle.body_type === 'pickup' ? 'Pickup' :
                               vehicle.body_type === 'van' ? 'Van' : 'MPV'}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Motorbike specific fields */}
                  {vehicle.vehicle_type === 'motorbike' && (
                    <>
                      {vehicle.bike_type && (
                        <div className="flex items-center gap-3">
                          <MdTwoWheeler className="w-6 h-6 text-blue-600" />
                          <div>
                            <div className="text-sm text-gray-500">Loại xe máy</div>
                            <div className="font-medium">
                              {vehicle.bike_type === 'scooter' ? 'Xe ga' :
                               vehicle.bike_type === 'manual' ? 'Xe số' :
                               vehicle.bike_type === 'clutch' ? 'Xe côn tay' : 'Xe điện'}
                            </div>
                          </div>
                        </div>
                      )}

                      {vehicle.engine_capacity && (
                        <div className="flex items-center gap-3">
                          <MdSpeed className="w-6 h-6 text-blue-600" />
                          <div>
                            <div className="text-sm text-gray-500">Dung tích xi-lanh</div>
                            <div className="font-medium">{vehicle.engine_capacity}cc</div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              {vehicle.description && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Mô tả</h3>
                  <p className="text-gray-700 leading-relaxed">{vehicle.description}</p>
                </div>
              )}

              {/* Features */}
              {vehicle.features && Array.isArray(vehicle.features) && vehicle.features.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Tiện nghi</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {vehicle.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                        <MdCheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trạng thái xe</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Trạng thái hoạt động:</span>
                  <span className={getStatusBadge(vehicle.status)}>
                    {getStatusText(vehicle.status)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Trạng thái duyệt:</span>
                  <div className="flex items-center gap-2">
                    {getApprovalIcon(normalizeApprovalStatus(vehicle))}
                    <span className={getApprovalBadge(normalizeApprovalStatus(vehicle))}>
                      {getApprovalText(normalizeApprovalStatus(vehicle))}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Lượt thuê:</span>
                  <span className="font-medium">{vehicle.rent_count || 0} lượt</span>
                </div>
              </div>
            </div>

            {/* Brand Information */}
            {vehicle.brand && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin hãng xe</h3>
                <div className="flex items-center gap-4">
                  {vehicle.brand.logo_url && (
                    <img
                      src={vehicle.brand.logo_url}
                      alt={vehicle.brand.name}
                      className="w-12 h-12 object-contain"
                    />
                  )}
                  <div>
                    <div className="font-medium text-gray-900">{vehicle.brand.name}</div>
                    {vehicle.brand.country && (
                      <div className="text-sm text-gray-500">{vehicle.brand.country}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê nhanh</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày tạo:</span>
                  <span className="font-medium">
                    {new Date(vehicle.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cập nhật lần cuối:</span>
                  <span className="font-medium">
                    {new Date(vehicle.updated_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Image Modal */}
        {showImageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-5xl max-h-full w-full">
              {/* Close Button */}
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-4 right-4 text-gray-700 bg-white bg-opacity-90 rounded-full p-2 hover:bg-opacity-100 shadow-lg transition-all z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Navigation Buttons */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => {
                      const currentIndex = allImages.indexOf(selectedImage);
                      const prevIndex = currentIndex > 0 ? currentIndex - 1 : allImages.length - 1;
                      setSelectedImage(allImages[prevIndex]);
                    }}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-700 bg-white bg-opacity-90 rounded-full p-3 hover:bg-opacity-100 shadow-lg transition-all z-10"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      const currentIndex = allImages.indexOf(selectedImage);
                      const nextIndex = currentIndex < allImages.length - 1 ? currentIndex + 1 : 0;
                      setSelectedImage(allImages[nextIndex]);
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-700 bg-white bg-opacity-90 rounded-full p-3 hover:bg-opacity-100 shadow-lg transition-all z-10"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Main Image */}
              <div className="flex flex-col items-center">
                <div className="bg-white rounded-lg shadow-2xl p-4">
                  <img
                    src={selectedImage}
                    alt="Vehicle"
                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  />
                </div>
                
                {/* Image Counter */}
                <div className="mt-4 bg-black bg-opacity-75 text-white px-4 py-2 rounded-full text-sm shadow-lg">
                  {allImages.indexOf(selectedImage) + 1} / {allImages.length}
                </div>

                {/* Thumbnail Navigation */}
                {allImages.length > 1 && (
                  <div className="mt-4 flex gap-2 max-w-full overflow-x-auto pb-2">
                    {allImages.map((image, index) => (
                      <div
                        key={index}
                        className={`flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage === image
                            ? 'border-blue-500 ring-2 ring-blue-200'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onClick={() => setSelectedImage(image)}
                      >
                        <img
                          src={image}
                          alt={index === 0 ? 'Ảnh chính' : `Ảnh ${index + 1}`}
                          className="w-16 h-16 object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default VehicleDetail;
