import React, { useState, useEffect } from 'react';
import axiosInstance from '../../config/axiosInstance';

const HandoverImageViewer = ({ bookingId, booking, userRole, onConfirmSuccess, imageType  }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [handoverData, setHandoverData] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchImages();
  }, [bookingId]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      
      let endpoint;
      if (imageType === 'pre-rental') {
        endpoint = `/api/handover/${bookingId}/pre-rental-images`;
      } else {
        endpoint = `/api/handover/${bookingId}/post-rental-images`;
      }
      
      const response = await axiosInstance.get(endpoint);
      if (response.data.success) {
        setImages(response.data.data.images || []);
        setHandoverData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      setError('Không thể tải ảnh xe');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImages = async () => {
    try {
      setConfirming(true);
      setError('');

      let endpoint;
      if (imageType === 'pre-rental') {
        endpoint = `/api/handover/${bookingId}/confirm-pre-rental-images-by-renter`;
      } else {
        endpoint = `/api/handover/${bookingId}/confirm-post-rental-images-by-renter`;
      }

      const response = await axiosInstance.post(endpoint);
      
      if (response.data.success) {
        alert('Xác nhận ảnh xe thành công!');
        await fetchImages();
        if (onConfirmSuccess) {
          onConfirmSuccess();
        }
      } else {
        setError(response.data.message || 'Có lỗi xảy ra khi xác nhận ảnh');
      }
    } catch (error) {
      console.error('Error confirming images:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi xác nhận ảnh');
    } finally {
      setConfirming(false);
    }
  };

  const handleStartTrip = async () => {
    try {
      setConfirming(true);
      setError('');

      let endpoint;
      if (imageType === 'pre-rental') {
        endpoint = `/api/handover/${bookingId}/confirm-handover-by-owner`;
      } else {
        endpoint = `/api/handover/${bookingId}/confirm-return-by-owner`;
      }

      const response = await axiosInstance.post(endpoint);
      
      if (response.data.success) {
        const message = imageType === 'pre-rental' 
          ? 'Bàn giao xe thành công! Chuyến xe đã bắt đầu.'
          : 'Xác nhận trả xe thành công!';
        alert(message);
        await fetchImages();
        if (onConfirmSuccess) {
          onConfirmSuccess();
        }
      } else {
        setError(response.data.message || 'Có lỗi xảy ra khi bàn giao xe');
      }
    } catch (error) {
      console.error('Error starting trip:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi bàn giao xe');
    } finally {
      setConfirming(false);
    }
  };

  const openImageModal = (image, index) => {
    setSelectedImage({ ...image, index });
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {imageType === 'pre-rental' ? 'Hình ảnh xe trước khi bàn giao' : 'Hình ảnh xe sau khi trả'}
        </h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-yellow-800">
              {imageType === 'pre-rental' 
                ? 'Chủ xe chưa upload ảnh xe. Vui lòng đợi chủ xe upload ảnh trước khi bàn giao.'
                : 'Chủ xe chưa upload ảnh xe. Vui lòng đợi chủ xe upload ảnh sau khi nhận lại xe.'
              }
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {imageType === 'pre-rental' ? 'Hình ảnh xe trước khi bàn giao' : 'Hình ảnh xe sau khi trả'}
        </h3>
        <div className="text-sm text-gray-600">
          {images.length} ảnh
        </div>
      </div>

      {/* Status Information */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        {imageType === 'pre-rental' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Khách hàng xác nhận ảnh:</span>
              <div className={`mt-1 ${handoverData?.renter_handover_confirmed ? 'text-green-600' : 'text-gray-500'}`}>
                {handoverData?.renter_handover_confirmed ? '✓ Đã xác nhận' : 'Chưa xác nhận'}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Chủ xe xác nhận bàn giao:</span>
              <div className={`mt-1 ${handoverData?.owner_confirmed ? 'text-green-600' : 'text-gray-500'}`}>
                {handoverData?.owner_confirmed ? '✓ Đã xác nhận' : 'Chưa xác nhận'}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Khách hàng nhận xe:</span>
              <div className={`mt-1 ${handoverData?.renter_confirmed ? 'text-green-600' : 'text-gray-500'}`}>
                {handoverData?.renter_confirmed ? '✓ Đã nhận xe' : 'Chưa nhận xe'}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">Ảnh xe do chủ xe gửi sau khi hoàn thành chuyến đi</h4>
            <div className="text-sm">
              <div>
                <span className="font-medium text-gray-700">
                  {userRole === 'renter' ? 'Trạng thái xác nhận của bạn:' : 'Trạng thái xác nhận của khách hàng:'}
                </span>
                <div className={`mt-1 ${handoverData?.renter_return_confirmed ? 'text-green-600' : 'text-gray-500'}`}>
                  {handoverData?.renter_return_confirmed ? '✓ Đã xác nhận ảnh xe' : 'Chưa xác nhận ảnh xe'}
                </div>

               {/* chủ xe xác nhận bàn giao xe */}
                <span className="font-medium text-gray-700">
                   Trạng thái xác nhận của chủ xe:
                </span>
                 <div className={`mt-1 ${handoverData?.owner_return_confirmed ? 'text-green-600' : 'text-gray-500'}`}>
                  {handoverData?.owner_return_confirmed ? '✓ Đã xác nhận ảnh xe' : 'Chưa xác nhận ảnh xe'}
                </div>
              </div>
            </div>
            {handoverData?.return_time && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Thời gian xác nhận:</span>
                <div className="mt-1 text-gray-600">
                  {new Date(handoverData.return_time).toLocaleString('vi-VN')}
                </div>
              </div>
            )}
          </div>
        )}
        {handoverData?.handover_time && (
          <div className="mt-3 text-sm">
            <span className="font-medium text-gray-700">Thời gian bàn giao:</span>
            <span className="ml-2 text-gray-600">{formatDateTime(handoverData.handover_time)}</span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Images Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {images.map((image, index) => (
          <div 
            key={index} 
            className="relative cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => openImageModal(image, index)}
          >
            <img
              src={`${axiosInstance.defaults.baseURL}/uploads/handover/${imageType}/${image.filename}`}
              alt={`Vehicle ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg border"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg">
              {image.originalName}
            </div>
            <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
              {index + 1}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {imageType === 'pre-rental' && (
          <>
            {userRole === 'renter' && !handoverData?.renter_handover_confirmed && booking.status === 'fully_paid' && (
              <button
                onClick={handleConfirmImages}
                disabled={confirming}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  confirming
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {confirming ? 'Đang xác nhận...' : 'Xác nhận ảnh xe'}
              </button>
            )}

            {userRole === 'owner' && handoverData?.renter_handover_confirmed && !handoverData?.owner_confirmed && (
              <button
                onClick={handleStartTrip}
                disabled={confirming}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  confirming
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {confirming ? 'Đang xử lý...' : 'Xác nhận bàn giao xe'}
              </button>
            )}

            {userRole === 'renter' && handoverData?.owner_confirmed && !handoverData?.renter_confirmed && (
              <div className="space-y-3">
                <button
                  onClick={handleConfirmImages}
                  disabled={confirming}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    confirming
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  {confirming ? 'Đang xác nhận...' : 'Xác nhận nhận xe'}
                </button>
                <div className="text-sm text-gray-600">
                  Chủ xe đã bàn giao xe. Vui lòng kiểm tra xe và xác nhận nhận xe.
                </div>
              </div>
            )}

            {userRole === 'renter' && handoverData?.renter_handover_confirmed && !handoverData?.owner_confirmed && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-yellow-800">
                    Vui lòng đợi chủ xe hoàn tất bàn giao trước khi xác nhận nhận xe
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {imageType === 'post-rental' && (
          <>
            {userRole === 'renter' && !handoverData?.renter_return_confirmed && (
              <div className="space-y-3">
                <button
                  onClick={handleConfirmImages}
                  disabled={confirming}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    confirming
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {confirming ? 'Đang xác nhận...' : 'Xác nhận ảnh xe'}
                </button>
                <div className="text-sm text-gray-600">
                  Vui lòng kiểm tra ảnh xe do chủ xe gửi và xác nhận tình trạng xe.
                </div>
              </div>
            )}
            
            {userRole === 'owner' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-blue-800">
                    {handoverData?.renter_return_confirmed 
                      ? 'Khách hàng đã xác nhận ảnh xe' 
                      : 'Chờ khách hàng xác nhận ảnh xe'
                    }
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Success message when both parties have confirmed */}
        {((imageType === 'pre-rental' && handoverData?.owner_handover_confirmed && handoverData?.renter_handover_confirmed) ||
          (imageType === 'post-rental' && handoverData?.owner_return_confirmed && handoverData?.renter_return_confirmed)) && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-800 font-medium">
                {imageType === 'pre-rental' ? 'Bàn giao xe thành công! Chuyến xe đã bắt đầu.' : 'Trả xe thành công! Chuyến đi đã hoàn thành.'}
              </span>
            </div>
          </div>
        )}
      </div>
      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75"
            >
              ×
            </button>
            <img
              src={`${axiosInstance.defaults.baseURL}/uploads/handover/${imageType}/${selectedImage.filename}`}
              alt={`Vehicle ${selectedImage.index + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded">
              <div className="font-medium">{selectedImage.originalName}</div>
              <div className="text-sm opacity-75">Ảnh {selectedImage.index + 1} / {images.length}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HandoverImageViewer;