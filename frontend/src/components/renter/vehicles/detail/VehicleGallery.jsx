import React, { useState, useEffect, useCallback, useMemo } from "react";

function VehicleGallery({ vehicle }) {

  const [selectedImage, setSelectedImage] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);
  const [modalSelectedImage, setModalSelectedImage] = useState(0);
  const [isModalImageLoading, setIsModalImageLoading] = useState(false);
  const [isMainImageLoading, setIsMainImageLoading] = useState(false);


  const images = useMemo(() => {
    if (!vehicle) return ["/api/placeholder/800/400"];
    const main = vehicle?.main_image_url ? [vehicle.main_image_url] : [];
    const extras = Array.isArray(vehicle?.extra_images) ? vehicle.extra_images : [];
    const all = [...main, ...extras].filter(Boolean);
    return all.length > 0 ? all : ["/api/placeholder/800/400"];
  }, [vehicle]);

  // Đảm bảo index luôn hợp lệ khi images thay đổi
  useEffect(() => {
    if (selectedImage >= images.length) setSelectedImage(0);
    if (modalSelectedImage >= images.length) setModalSelectedImage(0);
  }, [images, selectedImage, modalSelectedImage]);
// Thêm hàm mở modal tại ảnh chỉ định (thumbnail/indicator)
const openModalAt = useCallback((index) => {
  setModalSelectedImage(index);
  setShowAllImages(true);
}, []);

  useEffect(() => {
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [images]);


  const openModal = useCallback(() => {
    // mở modal tại ảnh chính (index 0)
    setModalSelectedImage(0);
    setShowAllImages(true);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedImage(modalSelectedImage); // Đồng bộ về gallery ngoài
    setShowAllImages(false);
    setIsModalImageLoading(false);
  }, [modalSelectedImage]);

  const changeMainImage = (nextIndex) => {
    setIsMainImageLoading(true);
    setSelectedImage(nextIndex);
  };


  const ImageModal = () => {
    if (!showAllImages) return null;

    const prev = () => {
      setIsModalImageLoading(true);
      setModalSelectedImage((p) => (p === 0 ? images.length - 1 : p - 1));
    };

    const next = () => {
      setIsModalImageLoading(true);
      setModalSelectedImage((p) => (p === images.length - 1 ? 0 : p + 1));
    };

    const handleImageLoad = () => setIsModalImageLoading(false);
    const handleImageChange = (index) => {
      setIsModalImageLoading(true);
      setModalSelectedImage(index);
    };

    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 md:p-6 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center space-x-4">
            <div className="text-white bg-white/10 px-4 py-2 rounded-full border border-white/20 backdrop-blur-sm">
              {modalSelectedImage + 1} / {images.length}
            </div>
            <div className="hidden md:block text-white/70 text-sm">
              {vehicle?.model || "Xe"} – Bộ sưu tập ảnh
            </div>
          </div>
          <button
            onClick={closeModal}
            className="text-white text-2xl hover:bg-white/10 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
          >
            ×
          </button>
        </div>

        {/* Main image */}
        <div className="flex-1 flex items-center justify-center relative">
          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-4 bg-black/50 text-white rounded-full w-12 h-12 hover:bg-black/70 transition-colors backdrop-blur-sm z-10"
              >
                ‹
              </button>
              <button
                onClick={next}
                className="absolute right-4 bg-black/50 text-white rounded-full w-12 h-12 hover:bg-black/70 transition-colors backdrop-blur-sm z-10"
              >
                ›
              </button>
            </>
          )}

          <div className="relative max-w-full max-h-full">
            {isModalImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
            )}
            <img
              key={modalSelectedImage}
              src={images[modalSelectedImage]}
              alt={`${vehicle?.model || "Xe"} - Ảnh ${modalSelectedImage + 1}`}
              className={`max-w-full max-h-[80vh] object-contain rounded-lg shadow-xl transition-opacity duration-300 ${
                isModalImageLoading ? "opacity-0" : "opacity-100"
              }`}
              onLoad={handleImageLoad}
              onError={(e) => {
                e.target.src = "/api/placeholder/800/600";
                setIsModalImageLoading(false);
              }}
            />
          </div>
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="p-4 bg-black/30 flex justify-center gap-2 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => handleImageChange(i)}
                className={`w-16 h-12 border-2 rounded overflow-hidden transition-all ${
                  modalSelectedImage === i
                    ? "border-blue-500 scale-110 ring-2 ring-blue-300"
                    : "border-gray-500 opacity-70 hover:opacity-100 hover:scale-105"
                }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => (e.target.src = "/api/placeholder/100/75")}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-4 p-4 md:p-6 min-h-[400px] lg:min-h-[500px]">
          {/* Main image - Responsive */}
          <div className="w-full lg:w-[70%]">
            <div
              className="relative w-full h-[300px] md:h-[400px] lg:h-[600px] rounded-lg overflow-hidden cursor-pointer bg-gray-100 border"
              onClick={openModal}
            >
              <img
                src={images[0]}
                alt={`${vehicle?.model || "Xe"} - Ảnh chính`}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  isMainImageLoading ? "opacity-0" : "opacity-100"
                }`}
                onLoad={() => setIsMainImageLoading(false)}
                onError={(e) => {
                  e.target.src = "/api/placeholder/800/600";
                  setIsMainImageLoading(false);
                }}
              />

              {/* Overlay cho mobile */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors lg:hidden" />
            </div>
          </div>

          {/* Thumbnails - Responsive */}
          <div className="w-full lg:w-[30%] flex lg:flex-col gap-3">
            <div className="flex lg:flex-col gap-3 flex-1">
              {Array.from({ length: Math.min(3, images.length - 1) }).map((_, i) => {
                const idx = i + 1;
                const img = images[idx];
                if (!img) return null;

                return (
                  <div
                    key={i}
                    className="relative h-[100px] md:h-[120px] lg:h-[170px] rounded-lg overflow-hidden border-2 cursor-pointer transition-all border-gray-200 hover:border-gray-400"
                    onClick={() => openModalAt(idx)}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "/api/placeholder/300/150";
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <button
              onClick={openModal}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg shadow-md transition-all hover:scale-105 active:scale-95"
            >
              Xem tất cả ({images.length})
            </button>
          </div>
        </div>

        {/* Image indicators for mobile */}
        {images.length > 1 && (
          <div className="lg:hidden flex justify-center gap-2 p-4">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => changeMainImage(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  selectedImage === index ? "bg-blue-600 w-6" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <ImageModal />
    </>
  );
}

export default VehicleGallery;