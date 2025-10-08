import React, { useState } from 'react';

const VehicleGallery = ({ vehicle }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);
  
  if (!vehicle) return null;
  
  const images = [];
  
  // Add main image if exists
  if (vehicle.main_image_url) {
    images.push(vehicle.main_image_url);
  }
  
  // Add extra images if exists
  if (vehicle.extra_images && Array.isArray(vehicle.extra_images)) {
    images.push(...vehicle.extra_images);
  }
  
  // If no images, show placeholder
  if (images.length === 0) {
    images.push('/api/placeholder/800/400');
  }

  // Modal hiển thị tất cả ảnh
  const ImageModal = () => {
    if (!showAllImages) return null;
    
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-6xl max-h-[90vh] overflow-hidden border border-gray-300">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-xl font-bold text-gray-800">Tất cả hình ảnh ({images.length})</h3>
            <button 
              onClick={() => setShowAllImages(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 p-4 max-h-[70vh] overflow-y-auto">
            {images.map((image, index) => (
              <div 
                key={index}
                className="aspect-video overflow-hidden cursor-pointer border border-gray-200"
                onClick={() => {
                  setSelectedImage(index);
                  setShowAllImages(false);
                }}
              >
                <img
                  src={image}
                  alt={`${vehicle.model} - Image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/api/placeholder/400/300';
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <>
      <div className="bg-white overflow-hidden shadow-lg border border-gray-200">
        <div className="grid grid-cols-10 gap-4 p-6 h-[500px]">
          {/* Main Image Display - Left Side (7 columns) */}
          <div className="col-span-7 relative w-full h-full overflow-hidden shadow-md border border-gray-200">
            <img 
              src={images[selectedImage]} 
              alt={`${vehicle.model} - Image ${selectedImage + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = '/api/placeholder/800/400';
              }}
            />
            {/* Image Counter */}
            <div className="absolute bottom-4 right-4 bg-black text-white px-4 py-2 text-sm font-semibold border border-gray-300">
              {selectedImage + 1} / {images.length}
            </div>
          </div>
          
          {/* Thumbnail Grid - Right Side (3 columns) */}
           <div className="col-span-3 flex flex-col gap-3 h-full">
             {/* Hiển thị 3 ảnh phụ */}
             {Array.from({ length: 3 }).map((_, index) => {
               const imageIndex = index + 1; // Bỏ qua ảnh đầu tiên (ảnh chính)
               const hasImage = images[imageIndex];
               
               return (
                 <div 
                   key={index}
                   className={`relative flex-1 overflow-hidden shadow-sm ${
                     hasImage 
                       ? `cursor-pointer ${
                           selectedImage === imageIndex 
                             ? 'border-2 border-blue-500' 
                             : 'border-2 border-gray-200'
                         }`
                       : 'border-2 border-gray-200 bg-white'
                   }`}
                   onClick={hasImage ? () => setSelectedImage(imageIndex) : undefined}
                 >
                   <div className="w-full h-full bg-white flex items-center justify-center">
                      {hasImage ? (
                        <>
                          <img
                            src={images[imageIndex]}
                            alt={`${vehicle.model} thumbnail ${imageIndex + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = '/api/placeholder/300/200';
                            }}
                          />
                          {/* Overlay cho ảnh thứ 3 nếu có nhiều hơn 3 ảnh phụ */}
                          {index === 2 && images.length > 4 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white text-sm font-semibold">+{images.length - 4}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-gray-300 text-3xl">
                          📷
                        </div>
                      )}
                    </div>
                 </div>
               );
             })}
             
             {/* Nút xem tất cả ảnh */}
             {images.length > 4 && (
               <button
                 onClick={() => setShowAllImages(true)}
                 className="mt-2 bg-blue-500 text-white px-4 py-3 font-semibold text-sm shadow-md border border-gray-200"
               >
                 Xem tất cả ({images.length})
               </button>
             )}
           </div>
        </div>
      </div>
      
      {/* Modal hiển thị tất cả ảnh */}
      <ImageModal />
    </>
  );
};

export default VehicleGallery;