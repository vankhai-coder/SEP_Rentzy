import React, { useState, useRef } from 'react';
import { MdCloudUpload, MdDelete, MdPhoto, MdZoomIn } from 'react-icons/md';
import { toast } from 'sonner'

const VehicleInspectionImages = ({
  beforeImages = [],
  afterImages = [],
  onBeforeImagesChange,
  onAfterImagesChange,
  readOnly = false,
  minImages = 5,
  title = null,
  showBeforeSection = true,
  showAfterSection = true
}) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const beforeInputRef = useRef(null);
  const afterInputRef = useRef(null);

  // Handle file upload
  const handleFileUpload = (files, type) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file =>
      file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024 // 10MB limit
    );

    if (validFiles.length !== fileArray.length) {
      toast.error('Một số file không hợp lệ. Chỉ chấp nhận file ảnh dưới 10MB.');
    }

    const newImages = validFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));

    if (type === 'before') {
      const updatedImages = [...beforeImages, ...newImages];
      onBeforeImagesChange?.(updatedImages);
    } else {
      const updatedImages = [...afterImages, ...newImages];
      onAfterImagesChange?.(updatedImages);
    }
  };

  // Remove image
  const removeImage = (imageId, type) => {
    if (type === 'before') {
      const updatedImages = beforeImages.filter(img => img.id !== imageId);
      onBeforeImagesChange?.(updatedImages);
    } else {
      const updatedImages = afterImages.filter(img => img.id !== imageId);
      onAfterImagesChange?.(updatedImages);
    }
  };

  // Open image modal
  const openImageModal = (image) => {
    setSelectedImage(image);
    setImageModalOpen(true);
  };

  // Close image modal
  const closeImageModal = () => {
    setSelectedImage(null);
    setImageModalOpen(false);
  };

  // Render upload area
  const renderUploadArea = (type, images, inputRef) => {
    const isMinimumMet = images.length >= minImages;

    return (
      <div className="space-y-4">
        {!readOnly && (
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${isMinimumMet ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-gray-400'}
            `}
            onClick={() => inputRef.current?.click()}
          >
            <MdCloudUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              Nhấp để tải lên hoặc kéo thả ảnh vào đây
            </p>
            <p className="text-xs text-gray-500">
              Tối thiểu {minImages} ảnh • PNG, JPG, JPEG • Tối đa 10MB mỗi ảnh
            </p>
            <p className={`text-xs mt-2 ${isMinimumMet ? 'text-green-600' : 'text-red-500'}`}>
              Đã tải: {images.length}/{minImages} ảnh
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files, type)}
            />
          </div>
        )}

        {/* Image Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Image overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 flex space-x-2">
                    <button
                      onClick={() => openImageModal(image)}
                      className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <MdZoomIn className="h-4 w-4" />
                    </button>
                    {!readOnly && (
                      <button
                        onClick={() => removeImage(image.id, type)}
                        className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <MdDelete className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Image name */}
                <p className="text-xs text-gray-500 mt-1 truncate">{image.name}</p>
              </div>
            ))}
          </div>
        )}

        {images.length === 0 && readOnly && (
          <div className="text-center py-8 text-gray-500">
            <MdPhoto className="mx-auto h-12 w-12 mb-2" />
            <p>Chưa có ảnh nào được tải lên</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Before Section */}
      {showBeforeSection && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              <h3 className="text-lg font-semibold text-gray-900">
                {title || "Hình ảnh trước khi nhận xe"}
              </h3>
            </div>
            <div className={`ml-auto px-3 py-1 rounded-full text-xs font-medium
              ${beforeImages.length >= minImages
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
              }`}>
              {beforeImages.length >= minImages ? 'Đủ ảnh' : `Thiếu ${minImages - beforeImages.length} ảnh`}
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Chụp ảnh xe trước khi giao cho khách thuê để ghi nhận tình trạng ban đầu
          </p>
          {renderUploadArea('before', beforeImages, beforeInputRef)}
        </div>
      )}

      {/* After Section */}
      {showAfterSection && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
              <h3 className="text-lg font-semibold text-gray-900">
                {title || "Hình ảnh sau khi nhận xe"}
              </h3>
            </div>
            <div className={`ml-auto px-3 py-1 rounded-full text-xs font-medium
              ${afterImages.length >= minImages
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
              }`}>
              {afterImages.length >= minImages ? 'Đủ ảnh' : `Thiếu ${minImages - afterImages.length} ảnh`}
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Chụp ảnh xe sau khi khách trả để so sánh và đánh giá tình trạng xe
          </p>
          {renderUploadArea('after', afterImages, afterInputRef)}
        </div>
      )}

      {/* Image Modal */}
      {imageModalOpen && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedImage.url}
              alt={selectedImage.name}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
              {selectedImage.name}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleInspectionImages;