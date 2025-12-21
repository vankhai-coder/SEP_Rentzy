import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../config/axiosInstance';
import { toast } from 'sonner';
import { 
  MdRefresh,
  MdCheckCircle,
  MdCancel,
  MdWarning,
  MdClose,
  MdChevronLeft,
  MdChevronRight,
  MdImage,
  MdErrorOutline,
  MdContentCopy,
  MdReceipt,
  MdAccessTime,
  MdCheckCircleOutline,
  MdCancelPresentation
} from 'react-icons/md';

// Component để hiển thị thumbnail hình ảnh với error handling
const ImageThumbnail = ({ imageUrl, index, onImageClick }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = React.useRef(null);

  // Đảm bảo imageUrl là string hợp lệ
  const validImageUrl = imageUrl && typeof imageUrl === 'string' ? imageUrl.trim() : '';

  useEffect(() => {
    // Reset state khi imageUrl thay đổi
    setImageError(false);
    setImageLoaded(false);
  }, [imageUrl]);

  useEffect(() => {
    // Check if image is already loaded (from cache)
    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth > 0) {
        setImageLoaded(true);
      }
    }
  }, []);

  if (!validImageUrl) {
    return (
      <div className="w-full h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <MdErrorOutline className="w-6 h-6 text-gray-400 mx-auto mb-1" />
          <p className="text-xs text-gray-500">URL không hợp lệ</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative cursor-pointer group overflow-hidden rounded-lg bg-gray-100 h-32 w-full"
      onClick={onImageClick}
    >
      {/* Loading placeholder */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse z-10">
          <MdImage className="w-8 h-8 text-gray-400" />
        </div>
      )}
      
      {/* Error state */}
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <MdErrorOutline className="w-6 h-6 text-red-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Lỗi tải ảnh</p>
          </div>
        </div>
      )}
      
      {/* Actual image */}
      {!imageError && (
        <img
          ref={imgRef}
          src={validImageUrl}
          alt={`Phạt nguội ${index + 1}`}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          loading="lazy"
        />
      )}
      
      {/* Hover overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-transparent group-hover:bg-black/20 transition-all duration-200 z-20">
        <MdImage className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>
    </div>
  );
};

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
  const [approveModal, setApproveModal] = useState({ open: false, requestId: null, processing: false });
  const [rejectReason, setRejectReason] = useState('');
  const [imageModal, setImageModal] = useState(null);

  useEffect(() => {
    fetchRequests();
    fetchStats();
    // Trigger refresh count in parent component
    window.dispatchEvent(new Event('refreshTrafficFineCount'));
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
        console.log('Raw response data:', response.data.data.requests);
        
        // Đảm bảo images được parse đúng
        const requestsWithParsedImages = response.data.data.requests.map(request => {
          // Log raw request để debug
          console.log(`Raw Request #${request.request_id}:`, {
            request_id: request.request_id,
            images_raw: request.images,
            images_type: typeof request.images,
            receipt_images_raw: request.receipt_images,
            receipt_images_type: typeof request.receipt_images,
            request_type: request.request_type
          });
          
          // Nếu backend đã trả về receipt_images riêng (đã parse), sử dụng nó trước
          let receiptImages = request.receipt_images && Array.isArray(request.receipt_images) 
            ? request.receipt_images 
            : undefined;
          
          // Backend đã parse images rồi, nhưng đảm bảo nó được xử lý đúng
          // Hỗ trợ cả format mới: {violations: [...], receipts: [...]} và format cũ: array
          if (request.images) {
            if (typeof request.images === 'string') {
              try {
                const parsed = JSON.parse(request.images);
                // Kiểm tra format mới
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                  if (parsed.violations || parsed.receipts) {
                    // Format mới
                    request.images = Array.isArray(parsed.violations) ? parsed.violations : [];
                    // Chỉ set receipt_images nếu backend chưa trả về
                    if (receiptImages === undefined) {
                      request.receipt_images = Array.isArray(parsed.receipts) ? parsed.receipts : [];
                    } else {
                      request.receipt_images = receiptImages;
                    }
                  } else {
                    // Object nhưng không phải format mới
                    request.images = Object.values(parsed).filter(v => typeof v === 'string');
                    request.receipt_images = receiptImages || [];
                  }
                } else if (Array.isArray(parsed)) {
                  // Format cũ: array đơn giản
                  request.images = parsed;
                  request.receipt_images = receiptImages || [];
                } else {
                  request.images = [];
                  request.receipt_images = receiptImages || [];
                }
              } catch (e) {
                console.error('Error parsing images string:', e, 'Raw images:', request.images);
                request.images = [];
                request.receipt_images = [];
              }
            } else if (Array.isArray(request.images)) {
              // Format cũ: array đơn giản
              request.images = request.images.filter(img => img && typeof img === 'string' && img.trim().length > 0);
              request.receipt_images = receiptImages || [];
            } else if (typeof request.images === 'object' && !Array.isArray(request.images)) {
              // Format mới: object
              if (request.images.violations || request.images.receipts) {
                request.images = Array.isArray(request.images.violations) ? request.images.violations : [];
                // Chỉ set receipt_images nếu backend chưa trả về
                if (receiptImages === undefined) {
                  request.receipt_images = Array.isArray(request.images.receipts) ? request.images.receipts : [];
                } else {
                  request.receipt_images = receiptImages;
                }
              } else {
                request.images = [];
                request.receipt_images = receiptImages || [];
              }
            } else {
              console.warn(`Request #${request.request_id}: images is not string or array:`, typeof request.images, request.images);
              request.images = [];
              request.receipt_images = receiptImages || [];
            }
          } else {
            request.images = [];
            request.receipt_images = receiptImages || [];
          }
          
          // Đảm bảo receipt_images luôn là array
          if (!Array.isArray(request.receipt_images)) {
            request.receipt_images = [];
          }
          
          // Debug: log để kiểm tra
          console.log(`Request #${request.request_id} processed:`, {
            hasImages: request.images && request.images.length > 0,
            imageCount: request.images?.length || 0,
            hasReceiptImages: request.receipt_images && request.receipt_images.length > 0,
            receiptImageCount: request.receipt_images?.length || 0,
            images: request.images,
            receipt_images: request.receipt_images,
            requestType: request.request_type,
            firstImageUrl: request.images?.[0] || 'none',
            firstReceiptUrl: request.receipt_images?.[0] || 'none',
            // Log raw data từ backend
            rawReceiptImages: request.receipt_images
          });
          
          return request;
        });
        setRequests(requestsWithParsedImages);
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

  const handleApprove = (requestId) => {
    console.log('Opening approve modal for request:', requestId);
    setApproveModal({ open: true, requestId, processing: false });
  };

  const confirmApprove = async () => {
    if (!approveModal.requestId) return;
    
    setApproveModal(prev => ({ ...prev, processing: true }));
    console.log('Approving request:', approveModal.requestId);

    try {
      const response = await axiosInstance.patch(`/api/admin/traffic-fine-requests/${approveModal.requestId}/approve`);
      console.log('Approve response:', response.data);
      
      if (response.data.success) {
        toast.success('Đã duyệt yêu cầu phạt nguội thành công');
        fetchRequests();
        fetchStats();
        // Trigger refresh count in parent component
        window.dispatchEvent(new Event('refreshTrafficFineCount'));
        setApproveModal({ open: false, requestId: null, processing: false });
      } else {
        toast.error('Không thể duyệt yêu cầu: ' + (response.data.message || 'Lỗi không xác định'));
        setApproveModal(prev => ({ ...prev, processing: false }));
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi duyệt yêu cầu');
      setApproveModal(prev => ({ ...prev, processing: false }));
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
        // Trigger refresh count in parent component
        window.dispatchEvent(new Event('refreshTrafficFineCount'));
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

  // Hàm copy biển số xe
  const copyLicensePlate = async (licensePlate) => {
    try {
      // Lấy biển số từ text (có thể có format như "30K-364.53 (Nền màu trắng...)" hoặc chỉ "30K-364.53")
      // Tách lấy phần biển số trước dấu ngoặc đơn hoặc khoảng trắng
      const plateNumber = licensePlate.split('(')[0].trim();
      
      await navigator.clipboard.writeText(plateNumber);
      toast.success(`Đã copy biển số: ${plateNumber}`);
    } catch (error) {
      console.error('Error copying license plate:', error);
      toast.error('Không thể copy biển số');
    }
  };

  // Hàm extract biển số từ description line
  const extractLicensePlate = (line) => {
    // Tìm dòng có chứa "Biển số"
    if (line.toLowerCase().includes('biển số')) {
      const parts = line.split(':');
      if (parts.length > 1) {
        const value = parts.slice(1).join(':').trim();
        // Lấy phần biển số (trước dấu ngoặc đơn nếu có)
        const plateMatch = value.match(/^([^\(]+)/);
        if (plateMatch) {
          return plateMatch[1].trim();
        }
        return value;
      }
    }
    return null;
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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tổng số</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <MdReceipt className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">Chờ duyệt</p>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.pending}</p>
            </div>
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
              <MdAccessTime className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400">Đã duyệt</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.approved}</p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
              <MdCheckCircleOutline className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 dark:text-red-400">Đã từ chối</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.rejected}</p>
            </div>
            <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
              <MdCancelPresentation className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
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
                    <MdWarning className={`w-5 h-5 ${request.request_type === 'delete' ? 'text-red-600' : 'text-orange-600'}`} />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {request.request_type === 'delete' ? 'Yêu cầu xóa phạt nguội' : 'Yêu cầu phạt nguội'} #{request.request_id}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                    {request.request_type === 'delete' && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                        Xóa
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Đơn thuê: #{request.booking?.booking_id} | 
                    Chủ xe: {request.owner?.full_name} ({request.owner?.email}) |
                    Người thuê: {request.booking?.renter?.full_name} ({request.booking?.renter?.email})
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Xe: {request.booking?.vehicle?.model} -{' '}
                    {request.booking?.vehicle?.license_plate && (
                      <span
                        onClick={() => copyLicensePlate(request.booking.vehicle.license_plate)}
                        className="inline-flex items-center gap-1 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium"
                        title="Click để copy biển số"
                      >
                        {request.booking.vehicle.license_plate}
                        <MdContentCopy className="w-3 h-3" />
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ngày tạo: {formatDate(request.created_at)}
                  </p>
                </div>
                {request.request_type !== 'delete' && request.amount && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(request.amount)}
                    </p>
                  </div>
                )}
                {request.request_type === 'delete' && (
                  <div className="text-right">
                    <p className="text-lg font-semibold text-red-600">
                      Yêu cầu xóa phạt nguội
                    </p>
                  </div>
                )}
              </div>

              {request.request_type === 'delete' && request.deletion_reason && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">Lý do xóa:</p>
                  <p className="text-sm text-red-600 dark:text-red-300">{request.deletion_reason}</p>
                </div>
              )}

              {request.request_type !== 'delete' && request.description && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-secondary-900 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Lý do:</p>
                  <div className="space-y-1">
                    {request.description.split('\n').map((line, index) => {
                      // Bỏ qua dòng trống
                      if (!line.trim()) return null;
                      
                      // Tách label và value nếu có dấu ":"
                      const parts = line.split(':');
                      const label = parts[0]?.trim();
                      const value = parts.slice(1).join(':').trim();
                      
                      // Kiểm tra xem có phải dòng biển số không
                      const isLicensePlate = label?.toLowerCase().includes('biển số');
                      const licensePlateNumber = isLicensePlate ? extractLicensePlate(line) : null;
                      
                      return (
                        <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                          {value ? (
                            <>
                              <span className="font-medium text-gray-700 dark:text-gray-300">{label}:</span>{' '}
                              {isLicensePlate && licensePlateNumber ? (
                                <span
                                  onClick={() => copyLicensePlate(value)}
                                  className="inline-flex items-center gap-1 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium group"
                                  title="Click để copy biển số"
                                >
                                  <span>{value}</span>
                                  <MdContentCopy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </span>
                              ) : (
                                <span>{value}</span>
                              )}
                            </>
                          ) : (
                            <span>{line}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {request.request_type !== 'delete' && (
                <>
                  {/* Hình ảnh phạt nguội */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hình ảnh phạt nguội:
                    </p>
                    {request.images && Array.isArray(request.images) && request.images.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {request.images
                          .filter(img => {
                            const isValid = img && typeof img === 'string' && img.trim().length > 0;
                            if (!isValid) {
                              console.warn(`Invalid image URL in request #${request.request_id}:`, img);
                            }
                            return isValid;
                          })
                          .map((imageUrl, index) => (
                            <ImageThumbnail 
                              key={index}
                              imageUrl={imageUrl.trim()}
                              index={index}
                              onImageClick={() => setImageModal(imageUrl.trim())}
                            />
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        {!request.images ? 'Không có hình ảnh' : 
                         !Array.isArray(request.images) ? `Hình ảnh không hợp lệ (type: ${typeof request.images})` :
                         'Không có hình ảnh'}
                      </p>
                    )}
                  </div>

                  {/* Hình ảnh hóa đơn nộp phạt */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hóa đơn nộp phạt:
                    </p>
                    {request.receipt_images && Array.isArray(request.receipt_images) && request.receipt_images.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {request.receipt_images
                          .filter(img => {
                            const isValid = img && typeof img === 'string' && img.trim().length > 0;
                            if (!isValid) {
                              console.warn(`Invalid receipt image URL in request #${request.request_id}:`, img);
                            }
                            return isValid;
                          })
                          .map((imageUrl, index) => (
                            <ImageThumbnail 
                              key={`receipt-${index}`}
                              imageUrl={imageUrl.trim()}
                              index={index}
                              onImageClick={() => setImageModal(imageUrl.trim())}
                            />
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        Không có hình ảnh hóa đơn
                      </p>
                    )}
                  </div>
                </>
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
        <div 
          className="fixed inset-0 bg-gray-500/30 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setRejectModal({ open: false, requestId: null })}
        >
          <div 
            className="bg-white dark:bg-secondary-800 rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
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

      {/* Approve Modal */}
      {approveModal.open && (
        <div 
          className="fixed inset-0 bg-gray-500/30 backdrop-blur-sm flex items-center justify-center z-[1000]"
          onClick={() => !approveModal.processing && setApproveModal({ open: false, requestId: null, processing: false })}
        >
          <div 
            className="bg-white dark:bg-secondary-800 rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Duyệt yêu cầu</h3>
              {!approveModal.processing && (
                <button
                  onClick={() => setApproveModal({ open: false, requestId: null, processing: false })}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <MdClose className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300">
                Bạn có chắc chắn muốn duyệt yêu cầu phạt nguội này không?
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setApproveModal({ open: false, requestId: null, processing: false })}
                disabled={approveModal.processing}
                className="px-4 py-2 bg-gray-200 dark:bg-secondary-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-secondary-600 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={confirmApprove}
                disabled={approveModal.processing}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {approveModal.processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <span>Xác nhận duyệt</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {imageModal && (
        <div
          className="fixed inset-0 bg-gray-500/30 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setImageModal(null)}
        >
          <div 
            className="max-w-4xl max-h-[90vh] mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
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

