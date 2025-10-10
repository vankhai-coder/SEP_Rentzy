import React, { useState, useEffect } from 'react';

/**
 * Component hiển thị gallery ảnh của xe với giao diện đẹp
 * @param {Object} vehicle - Thông tin xe chứa main_image_url và extra_images
 */
const VehicleGallery = ({ vehicle }) => {
  // State quản lý ảnh đang được chọn (index trong mảng images)
  const [selectedImage, setSelectedImage] = useState(0);
  
  // State quản lý việc hiển thị modal xem tất cả ảnh
  const [showAllImages, setShowAllImages] = useState(false);
  
  // State riêng cho modal để tránh conflict
  const [modalSelectedImage, setModalSelectedImage] = useState(0);
  
  // Chuẩn bị mảng ảnh từ dữ liệu xe
  const prepareImages = () => {
    const images = [];
    
    // Thêm ảnh chính vào đầu mảng
    if (vehicle?.main_image_url) {
      images.push(vehicle.main_image_url);
    }
    
    // Thêm các ảnh phụ vào mảng
    if (vehicle?.extra_images && Array.isArray(vehicle.extra_images)) {
      images.push(...vehicle.extra_images);
    }
    
    // Nếu không có ảnh nào, sử dụng ảnh placeholder
    if (images.length === 0) {
      images.push('/api/placeholder/800/400');
    }
    
    return images;
  };
  
  const images = prepareImages();
  
  // Xử lý điều hướng bằng phím cho gallery chính
  useEffect(() => {
    if (!vehicle || showAllImages) return;
    
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        setSelectedImage(prev => prev > 0 ? prev - 1 : images.length - 1);
      } else if (e.key === 'ArrowRight') {
        setSelectedImage(prev => prev < images.length - 1 ? prev + 1 : 0);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [vehicle, showAllImages, images.length]);
  
  // Không render gì nếu không có dữ liệu xe
  if (!vehicle) return null;

  /**
   * Component Modal hiển thị ảnh theo kiểu carousel
   */
  const ImageModal = () => {
    // Xử lý phím tắt cho modal
    useEffect(() => {
      if (!showAllImages) return;
      
      const handleKeyPress = (e) => {
        switch (e.key) {
          case 'ArrowLeft':
            setModalSelectedImage(prev => prev === 0 ? images.length - 1 : prev - 1);
            break;
          case 'ArrowRight':
            setModalSelectedImage(prev => prev === images.length - 1 ? 0 : prev + 1);
            break;
          case 'Escape':
            setShowAllImages(false);
            break;
        }
      };
      
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }, [showAllImages, images.length]);
    
    // Sync modal image với selected image khi mở modal
    useEffect(() => {
      if (showAllImages) {
        setModalSelectedImage(selectedImage);
      }
    }, [showAllImages, selectedImage]);
    
    if (!showAllImages) return null;
    
    const goToPrevious = () => {
      setModalSelectedImage(prev => prev === 0 ? images.length - 1 : prev - 1);
    };
    
    const goToNext = () => {
      setModalSelectedImage(prev => prev === images.length - 1 ? 0 : prev + 1);
    };
    
    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
        {/* Header với bộ đếm và nút đóng */}
        <div className="flex justify-between items-center p-4 md:p-6 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div className="text-white text-lg font-medium bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/20">
              {modalSelectedImage + 1} / {images.length}
            </div>
            <div className="hidden md:block text-white/70 text-sm">
              {vehicle.model} - Bộ sưu tập ảnh
            </div>
          </div>
          <button 
            onClick={() => setShowAllImages(false)}
            className="text-white hover:text-gray-300 text-2xl transition-all duration-200 hover:bg-white/10 rounded-full w-10 h-10 flex items-center justify-center"
          >
            ×
          </button>
        </div>
        
        {/* Container chính cho ảnh và điều hướng - chiếm không gian còn lại */}
        <div className="flex-1 flex items-center justify-center relative px-4 md:px-8 min-h-0">
          {/* Nút điều hướng trái */}
          {images.length > 1 && (
            <button
              onClick={goToPrevious}
              className="absolute left-4 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200 hover:scale-110"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          {/* Container ảnh chính với kích thước được kiểm soát */}
          <div className="w-full h-full flex items-center justify-center">
            <img
              src={images[modalSelectedImage]}
              alt={`${vehicle.model} - Image ${modalSelectedImage + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onError={(e) => {
                e.target.src = '/api/placeholder/800/600';
              }}
            />
          </div>
          
          {/* Nút điều hướng phải */}
          {images.length > 1 && (
            <button
              onClick={goToNext}
              className="absolute right-4 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200 hover:scale-110"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Dải thumbnail ở dưới - cố định ở bottom */}
        {images.length > 1 && (
          <div className="flex-shrink-0 p-4 md:p-6 bg-gradient-to-t from-black/20 to-transparent">
            <div className="flex justify-center gap-2 overflow-x-auto max-w-full pb-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setModalSelectedImage(index)}
                  className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    modalSelectedImage === index
                      ? 'border-blue-500 scale-110 shadow-lg'
                      : 'border-gray-500 hover:border-gray-300 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/api/placeholder/100/75';
                    }}
                  />
                </button>
              ))}
            </div>
            
            {/* Hướng dẫn sử dụng */}
            <div className="text-center mt-4 text-white/60 text-sm">
              <div className="flex justify-center items-center space-x-4">
                <span className="flex items-center space-x-1">
                  <kbd className="px-2 py-1 bg-white/10 rounded text-xs">←</kbd>
                  <kbd className="px-2 py-1 bg-white/10 rounded text-xs">→</kbd>
                  <span className="hidden sm:inline">Điều hướng</span>
                </span>
                <span className="flex items-center space-x-1">
                  <kbd className="px-2 py-1 bg-white/10 rounded text-xs">ESC</kbd>
                  <span className="hidden sm:inline">Đóng</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <>
      {/* Container chính của gallery với layout cố định */}
      <div className="bg-white overflow-hidden shadow-lg border border-gray-200 rounded-lg">
        {/* Layout cố định không responsive */}
        <div className="flex gap-4 p-6 min-h-[500px]">
          
          {/* Phần hiển thị ảnh chính - Bên trái (cố định 70%) */}
          <div className="w-[70%]">
            {/* Container với chiều cao cố định */}
            <div className="relative w-full h-[600px] overflow-hidden shadow-md border border-gray-200 rounded-lg bg-gray-50 cursor-pointer" onClick={() => setShowAllImages(true)}>
              {/* Ảnh chính */}
              <img 
                src={images[selectedImage]} 
                alt={`${vehicle.model} - Image ${selectedImage + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/api/placeholder/800/600';
                }}
              />
            </div>
          </div>
          
          {/* Phần thumbnail - Bên phải (cố định 30%) */}
          <div className="w-[30%] flex flex-col gap-3">
            
            {/* Container cho 3 ảnh phụ với chiều cao cố định */}
            <div className="flex flex-col gap-3 flex-1">
              {Array.from({ length: 3 }).map((_, index) => {
                const thumbnailIndex = index + 1;
                const hasImage = images[thumbnailIndex];
                
                return (
                  <div 
                    key={index}
                    className={`relative h-[170px] overflow-hidden shadow-sm rounded-lg transition-all duration-200 ${
                      hasImage 
                        ? `cursor-pointer ${
                            selectedImage === thumbnailIndex 
                              ? 'border-2 border-blue-500 shadow-blue-200 ring-2 ring-blue-200'
                              : 'border-2 border-gray-200'
                        }`
                      : 'border-2 border-gray-200 bg-gray-50'
                    }`}
                    onClick={hasImage ? () => setShowAllImages(true) : undefined}
                  >
                    <div className="w-full h-full bg-white flex items-center justify-center">
                       {hasImage ? (
                         <img
                           src={images[thumbnailIndex]}
                           alt={`${vehicle.model} thumbnail ${thumbnailIndex + 1}`}
                           className="w-full h-full object-cover"
                           onError={(e) => {
                             e.target.src = '/api/placeholder/300/150';
                           }}
                         />
                       ) : (
                         <div className="text-gray-400 text-xl">
                           📷
                         </div>
                       )}
                     </div>
                  </div>
                );
              })}
            </div>
            
            {/* Nút xem tất cả ảnh */}
            <button
              onClick={() => setShowAllImages(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 font-medium text-sm rounded-lg shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                </svg>
                <span>Xem tất cả ({images.length})</span>
              </div>
            </button>
          </div>
        </div>
      </div>
      
      {/* Render modal */}
      <ImageModal />
    </>
  );
};

export default VehicleGallery;