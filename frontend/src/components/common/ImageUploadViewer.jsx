import React, { useState, useEffect } from 'react';
import axiosInstance from '../../config/axiosInstance';

const ImageUploadViewer = ({ 
  bookingId, 
  imageType = 'pre-rental', // 'pre-rental' or 'post-rental'
  title,
  description,
  minImages = 5,
  onUploadSuccess,
  readOnly = false,
  showConfirmButton = false,
  userRole = 'owner',
  onConfirmSuccess
}) => {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState('');
  const [handoverData, setHandoverData] = useState(null);

  useEffect(() => {
    fetchImages();
  }, [bookingId, imageType]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError('');
      
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
      setError('Không thể tải ảnh');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      setError('Chỉ chấp nhận file ảnh định dạng JPG, JPEG, PNG');
      return;
    }

    // Validate file sizes (max 5MB each)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError('Kích thước file không được vượt quá 5MB');
      return;
    }

    await uploadImages(files);
  };

  const uploadImages = async (files) => {
    try {
      setUploading(true);
      setError('');

      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });

      let endpoint;
      if (imageType === 'pre-rental') {
        endpoint = `/api/handover/${bookingId}/upload-pre-rental-images`;
      } else {
        endpoint = `/api/handover/${bookingId}/upload-post-rental-images`;
      }

      const response = await axiosInstance.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        await fetchImages();
        if (onUploadSuccess) {
          onUploadSuccess();
        }
        
        // Reset file input
        const fileInput = document.getElementById(`file-input-${imageType}`);
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        setError(response.data.message || 'Có lỗi xảy ra khi upload ảnh');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi upload ảnh');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh này?')) {
      return;
    }

    try {
      let endpoint;
      if (imageType === 'pre-rental') {
        endpoint = `/api/handover/${bookingId}/delete-image/${imageId}`;
      } else {
        endpoint = `/api/handover/${bookingId}/delete-post-rental-image/${imageId}`;
      }

      const response = await axiosInstance.delete(endpoint);
      
      if (response.data.success) {
        await fetchImages();
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } else {
        setError(response.data.message || 'Có lỗi xảy ra khi xóa ảnh');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi xóa ảnh');
    }
  };

  const handleConfirmImages = async () => {
    try {
      setConfirming(true);
      setError('');

      let endpoint, successMessage;
      if (imageType === 'pre-rental') {
        endpoint = `/api/handover/${bookingId}/confirm-pre-rental-images-by-renter`;
        successMessage = 'Xác nhận ảnh xe thành công!';
      } else {
        endpoint = `/api/handover/${bookingId}/confirm-post-rental-images-by-renter`;
        successMessage = 'Xác nhận trả xe thành công!';
      }

      const response = await axiosInstance.post(endpoint);
      
      if (response.data.success) {
        alert(successMessage);
        await fetchImages();
        if (onConfirmSuccess) {
          onConfirmSuccess();
        }
      } else {
        setError(response.data.message || 'Có lỗi xảy ra khi xác nhận');
      }
    } catch (error) {
      console.error('Error confirming images:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi xác nhận');
    } finally {
      setConfirming(false);
    }
  };

  const handleOwnerConfirmHandover = async () => {
    try {
      setConfirming(true);
      setError('');

      let endpoint, successMessage;
      if (imageType === 'pre-rental') {
        endpoint = `/api/handover/${bookingId}/confirm-handover-by-owner`;
        successMessage = 'Xác nhận bàn giao xe thành công!';
      } else {
        endpoint = `/api/handover/${bookingId}/confirm-return-by-owner`;
        successMessage = 'Xác nhận hình ảnh trả xe thành công!';
      }

      const response = await axiosInstance.post(endpoint);
      
      if (response.data.success) {
        alert(successMessage);
        await fetchImages();
        if (onConfirmSuccess) {
          onConfirmSuccess();
        }
      } else {
        setError(response.data.message || 'Có lỗi xảy ra khi xác nhận');
      }
    } catch (error) {
      console.error('Error confirming:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi xác nhận');
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

  const getImagePath = (filename) => {
    if (imageType === 'pre-rental') {
      return `${axiosInstance.defaults.baseURL}/uploads/handover/pre-rental/${filename}`;
    } else {
      return `${axiosInstance.defaults.baseURL}/uploads/handover/post-rental/${filename}`;
    }
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {title}
        </h3>
        <div className="text-sm text-gray-600">
          {images.length} ảnh {minImages > 0 && `(tối thiểu ${minImages} ảnh)`}
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-medium text-blue-800 mb-1">{description.title}</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {description.items.map((item, index) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Status Information for pre-rental */}
      {imageType === 'pre-rental' && handoverData && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-3">Trạng thái bàn giao xe</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Upload ảnh:</span>
              <div className={`mt-1 ${images.length >= minImages ? 'text-green-600' : 'text-yellow-600'}`}>
                {images.length >= minImages ? '✓ Đã đủ ảnh' : `${images.length}/${minImages} ảnh`}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Chủ xe xác nhận:</span>
              <div className={`mt-1 ${handoverData.owner_handover_confirmed ? 'text-green-600' : 'text-gray-500'}`}>
                {handoverData.owner_handover_confirmed ? '✓ Đã xác nhận' : 'Chưa xác nhận'}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Khách hàng xác nhận:</span>
              <div className={`mt-1 ${handoverData.renter_handover_confirmed ? 'text-green-600' : 'text-gray-500'}`}>
                {handoverData.renter_handover_confirmed ? '✓ Đã xác nhận' : 
                  (handoverData.owner_handover_confirmed ? 'Chờ xác nhận' : 'Chờ chủ xe xác nhận trước')}
              </div>
            </div>
          </div>
          {handoverData.handover_time && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <span className="font-medium text-gray-700">Thời gian bàn giao:</span>
              <div className="text-gray-600 text-sm mt-1">
                {new Date(handoverData.handover_time).toLocaleString('vi-VN')}
              </div>
            </div>
          )}
          {handoverData.owner_handover_confirmed && handoverData.renter_handover_confirmed && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center text-green-600">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Bàn giao xe hoàn tất</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status Information for post-rental */}
      {imageType === 'post-rental' && handoverData && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-3">Trạng thái bàn giao xe</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Upload ảnh:</span>
              <div className={`mt-1 ${images.length >= minImages ? 'text-green-600' : 'text-yellow-600'}`}>
                {images.length >= minImages ? '✓ Đã đủ ảnh' : `${images.length}/${minImages} ảnh`}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Chủ xe xác nhận:</span>
              <div className={`mt-1 ${handoverData.owner_return_confirmed ? 'text-green-600' : 'text-gray-500'}`}>
                {handoverData.owner_return_confirmed ? '✓ Đã xác nhận' : 'Chưa xác nhận'}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Khách hàng xác nhận:</span>
              <div className={`mt-1 ${handoverData.renter_return_confirmed ? 'text-green-600' : 'text-gray-500'}`}>
                {handoverData.renter_return_confirmed ? '✓ Đã xác nhận' : 
                  (handoverData.owner_return_confirmed ? 'Chờ xác nhận' : 'Chờ chủ xe xác nhận trước')}
              </div>
            </div>
          </div>
          {handoverData.return_time && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <span className="font-medium text-gray-700">Thời gian bàn giao:</span>
              <div className="text-gray-600 text-sm mt-1">
                {new Date(handoverData.return_time).toLocaleString('vi-VN')}
              </div>
            </div>
          )}
          {handoverData.owner_return_confirmed && handoverData.renter_return_confirmed && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center text-green-600">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Bàn giao xe hoàn tất</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Upload Section - Only show if owner hasn't confirmed yet */}
      {!readOnly && userRole === 'owner' && 
       ((imageType === 'pre-rental' && !handoverData?.owner_handover_confirmed) || 
        (imageType === 'post-rental' && !handoverData?.owner_return_confirmed)) && (
        <div className="mb-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              id={`file-input-${imageType}`}
              multiple
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            <label
              htmlFor={`file-input-${imageType}`}
              className={`cursor-pointer ${uploading ? 'cursor-not-allowed' : ''}`}
            >
              <div className="flex flex-col items-center">
                <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" />
                </svg>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  {uploading ? 'Đang upload...' : 'Chọn ảnh để upload'}
                </p>
                <p className="text-sm text-gray-500">
                  Chọn nhiều ảnh cùng lúc (JPG, JPEG, PNG - tối đa 5MB/ảnh)
                </p>
              </div>
            </label>
          </div>
          
          {uploading && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-blue-800 text-sm">Đang upload ảnh...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Message when owner has confirmed - no more uploads allowed */}
      {userRole === 'owner' && imageType === 'pre-rental' && handoverData?.owner_handover_confirmed && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800 font-medium">
              Bạn đã xác nhận hoàn tất upload ảnh. Không thể thêm hoặc xóa ảnh.
            </span>
          </div>
        </div>
      )}

      {/* Message when owner has confirmed return - no more uploads allowed */}
      {userRole === 'owner' && imageType === 'post-rental' && handoverData?.owner_return_confirmed && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800 font-medium">
              Bạn đã xác nhận hoàn tất upload ảnh. Không thể thêm hoặc xóa ảnh.
            </span>
          </div>
        </div>
      )}

      {/* Images Grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div 
                className="relative cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openImageModal(image, index)}
              >
                <img
                  src={getImagePath(image.filename)}
                  alt={`Image ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg">
                  {image.originalName}
                </div>
                <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                  {index + 1}
                </div>
              </div>
              
              {/* Delete button for owner - only if not confirmed */}
              {!readOnly && userRole === 'owner' && 
               ((imageType === 'pre-rental' && !handoverData?.owner_handover_confirmed) || 
                (imageType === 'post-rental' && !handoverData?.owner_return_confirmed)) && (
                <button
                  onClick={() => handleDeleteImage(image.id)}
                  className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Xóa ảnh"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-yellow-800">
              {userRole === 'owner' 
                ? (handoverData?.owner_handover_confirmed 
                    ? 'Không có ảnh nào được upload.' 
                    : 'Chưa có ảnh nào. Hãy upload ít nhất 5 ảnh.')
                : 'Chủ xe chưa upload ảnh xe. Vui lòng đợi chủ xe upload ảnh trước khi bàn giao.'
              }
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Owner workflow buttons */}
        {userRole === 'owner' && imageType === 'pre-rental' && !readOnly && (
          <>
            {/* Step 1: Confirm upload completion (when images uploaded but not confirmed yet) */}
            {images.length >= minImages && !handoverData?.owner_handover_confirmed && (
              <button
                onClick={handleOwnerConfirmHandover}
                disabled={confirming}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  confirming
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {confirming ? 'Đang xác nhận...' : 'Xác nhận hoàn tất upload ảnh'}
              </button>
            )}

            {/* Step 2: Success message when owner has confirmed */}
            {handoverData?.owner_handover_confirmed && (
              <div className="px-6 py-2 rounded-lg bg-green-100 text-green-800 border border-green-200 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Đã xác nhận hoàn tất upload ảnh</span>
              </div>
            )}
          </>
        )}

        {/* Renter confirmation button (pre-rental only) */}
        {showConfirmButton && imageType === 'pre-rental' && userRole === 'renter' && 
         handoverData?.owner_handover_confirmed && !handoverData?.renter_handover_confirmed && images.length >= minImages && (
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
        )}

        {/* Message for renter when waiting for owner confirmation */}
        {imageType === 'pre-rental' && userRole === 'renter' && !handoverData?.owner_handover_confirmed && (
          <div className="px-6 py-2 rounded-lg bg-yellow-100 text-yellow-800 border border-yellow-200 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Chờ chủ xe xác nhận ảnh</span>
          </div>
        )}

        {/* Owner workflow buttons for post-rental */}
        {userRole === 'owner' && imageType === 'post-rental' && !readOnly && (
          <>
            {/* Step 1: Confirm upload completion (when images uploaded but not confirmed yet) */}
            {images.length >= minImages && !handoverData?.owner_return_confirmed && (
              <button
                onClick={handleOwnerConfirmHandover}
                disabled={confirming}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  confirming
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {confirming ? 'Đang xác nhận...' : 'Xác nhận hoàn tất upload ảnh'}
              </button>
            )}

            {/* Step 2: Success message when owner has confirmed */}
            {handoverData?.owner_return_confirmed && (
              <div className="px-6 py-2 rounded-lg bg-green-100 text-green-800 border border-green-200 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Đã xác nhận hoàn tất upload ảnh</span>
              </div>
            )}
          </>
        )}

        {/* Renter confirmation button (post-rental only) */}
        {showConfirmButton && imageType === 'post-rental' && userRole === 'renter' && 
         handoverData?.owner_return_confirmed && !handoverData?.renter_return_confirmed && images.length >= minImages && (
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
        )}

        {/* Message for renter when waiting for owner confirmation */}
        {imageType === 'post-rental' && userRole === 'renter' && !handoverData?.owner_return_confirmed && (
          <div className="px-6 py-2 rounded-lg bg-yellow-100 text-yellow-800 border border-yellow-200 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Chờ chủ xe xác nhận ảnh</span>
          </div>
        )}

        {/* Status messages */}
        {imageType === 'pre-rental' && handoverData?.owner_handover_confirmed && handoverData?.renter_handover_confirmed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-800 font-medium">
                Bàn giao xe thành công! Chuyến xe đã bắt đầu.
              </span>
            </div>
          </div>
        )}

        {/* Post-rental success message */}
        {imageType === 'post-rental' && handoverData?.owner_return_confirmed && handoverData?.renter_return_confirmed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-800 font-medium">
                Bàn giao xe thành công! Chuyến xe đã hoàn thành.
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
              src={getImagePath(selectedImage.filename)}
              alt={`Image ${selectedImage.index + 1}`}
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

export default ImageUploadViewer;