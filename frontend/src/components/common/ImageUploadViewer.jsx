import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../../config/axiosInstance";

const ImageUploadViewer = ({
  bookingId,
  imageType, // 'pre-rental' or 'post-rental'
  title,
  description,
  minImages = 5,
  onUploadSuccess,
  readOnly = false,
  showConfirmButton = false,
  userRole = "owner",
  onConfirmSuccess,
  handoverData, // Nhận handover data từ props
  onHandoverUpdate, // Callback để cập nhật handover data
}) => {
  // State cho ảnh đã upload lên server
  const [uploadedImages, setUploadedImages] = useState([]);

  // State cho ảnh được chọn nhưng chưa upload (preview)
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);

  // State khác
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (handoverData) {
      // Lấy ảnh theo loại (pre-rental hoặc post-rental) từ handover data
      if (imageType === "pre-rental") {
        const images = handoverData.pre_rental_images || [];
        // Loại bỏ khoảng trắng và backticks từ URLs
        const cleanedImages = images.map((url) =>
          typeof url === "string" ? url.trim().replace(/`/g, "") : url
        );
        setUploadedImages(cleanedImages);
      } else {
        const images = handoverData.post_rental_images || [];
        // Loại bỏ khoảng trắng và backticks từ URLs
        const cleanedImages = images.map((url) =>
          typeof url === "string" ? url.trim().replace(/`/g, "") : url
        );
        setUploadedImages(cleanedImages);
      }
    }
  }, [handoverData, imageType]);

  // Xử lý khi chọn file
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    processSelectedFiles(files);
  };

  // Xử lý drag & drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    processSelectedFiles(files);
  };

  // Xử lý files được chọn
  const processSelectedFiles = (files) => {
    if (files.length === 0) return;

    // Validate file types
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const invalidFiles = files.filter(
      (file) => !validTypes.includes(file.type)
    );

    if (invalidFiles.length > 0) {
      setError("Chỉ chấp nhận file ảnh định dạng JPG, JPEG, PNG, WEBP");
      return;
    }

    // Validate file sizes (max 5MB each)
    const oversizedFiles = files.filter((file) => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError("Kích thước file không được vượt quá 5MB");
      return;
    }

    // Kiểm tra tổng số ảnh (đã upload + sẽ upload)
    const totalImages =
      uploadedImages.length + selectedFiles.length + files.length;
    if (totalImages > 10) {
      setError(
        `Chỉ được upload tối đa 10 ảnh. Hiện tại: ${uploadedImages.length} đã upload, ${selectedFiles.length} đang chọn`
      );
      return;
    }

    // Tạo preview cho các file mới
    const newPreviewImages = [];

    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = {
          id: `preview-${Date.now()}-${index}`,
          file: file,
          url: e.target.result,
          name: file.name,
          size: file.size,
          isPreview: true,
        };
        newPreviewImages.push(preview);

        // Cập nhật state khi tất cả file đã được đọc
        if (newPreviewImages.length === files.length) {
          setPreviewImages((prev) => [...prev, ...newPreviewImages]);
          setSelectedFiles((prev) => [...prev, ...files]);
          setError("");
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Xóa ảnh preview (chưa upload)
  const removePreviewImage = (previewId) => {
    setPreviewImages((prev) => prev.filter((img) => img.id !== previewId));
    const previewIndex = previewImages.findIndex((img) => img.id === previewId);
    if (previewIndex !== -1) {
      setSelectedFiles((prev) =>
        prev.filter((_, index) => index !== previewIndex)
      );
    }
  };

  // Upload tất cả ảnh đã chọn
  const uploadAllImages = async () => {
    if (selectedFiles.length === 0) {
      setError("Vui lòng chọn ảnh để upload");
      return;
    }

    // Kiểm tra số lượng ảnh tối thiểu
    const totalAfterUpload = uploadedImages.length + selectedFiles.length;
    if (totalAfterUpload < minImages) {
      setError(
        `Cần upload ít nhất ${minImages} ảnh xe. Hiện tại sẽ có ${totalAfterUpload} ảnh`
      );
      return;
    }

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      let endpoint;
      if (imageType === "pre-rental") {
        endpoint = `/api/handover/${bookingId}/upload-pre-rental-images`;
      } else {
        endpoint = `/api/handover/${bookingId}/upload-post-rental-images`;
      }

      const response = await axiosInstance.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        // Clear preview images và selected files
        setPreviewImages([]);
        setSelectedFiles([]);

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } else {
        setError(response.data.message || "Có lỗi xảy ra khi upload ảnh");
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      setError(error.response?.data?.message || "Có lỗi xảy ra khi upload ảnh");
    } finally {
      setUploading(false);
    }
  };

  // Xóa ảnh đã upload
  const handleDeleteUploadedImage = async (imageIndex) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ảnh này?")) {
      return;
    }

    try {
      const endpoint =
        imageType === "pre-rental"
          ? `/api/handover/${bookingId}/delete-image/${imageIndex}`
          : `/api/handover/${bookingId}/delete-post-rental-image/${imageIndex}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Cập nhật state cục bộ
        const updatedImages = uploadedImages.filter(
          (_, index) => index !== imageIndex
        );
        setUploadedImages(updatedImages);

        // Cập nhật handoverData
        const updatedHandoverData = {
          ...handoverData,
          [imageType === "pre-rental"
            ? "pre_rental_images"
            : "post_rental_images"]: updatedImages,
        };

        if (onHandoverUpdate) {
          onHandoverUpdate(updatedHandoverData);
        }

        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Có lỗi xảy ra khi xóa ảnh");
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      setError("Có lỗi xảy ra khi xóa ảnh");
    }
  };

  const handleConfirmImages = async () => {
    try {
      setConfirming(true);
      setError("");

      let endpoint, successMessage;
      if (imageType === "pre-rental") {
        endpoint = `/api/handover/${bookingId}/confirm-pre-rental-images-by-renter`;
        successMessage = "Xác nhận ảnh xe thành công!";
      } else {
        endpoint = `/api/handover/${bookingId}/confirm-post-rental-images-by-renter`;
        successMessage = "Xác nhận trả xe thành công!";
      }

      const response = await axiosInstance.post(endpoint);

      if (response.data.success) {
        alert(successMessage);
        if (onConfirmSuccess) {
          onConfirmSuccess();
        }
      } else {
        setError(response.data.message || "Có lỗi xảy ra khi xác nhận");
      }
    } catch (error) {
      console.error("Error confirming images:", error);
      setError(error.response?.data?.message || "Có lỗi xảy ra khi xác nhận");
    } finally {
      setConfirming(false);
    }
  };

  const handleOwnerConfirmHandover = async () => {
    try {
      setConfirming(true);
      setError("");

      let endpoint, successMessage;
      if (imageType === "pre-rental") {
        endpoint = `/api/handover/${bookingId}/confirm-handover-by-owner`;
        successMessage = "Xác nhận bàn giao xe thành công!";
      } else {
        endpoint = `/api/handover/${bookingId}/confirm-return-by-owner`;
        successMessage = "Xác nhận nhận lại xe thành công!";
      }

      const response = await axiosInstance.post(endpoint);

      if (response.data.success) {
        alert(successMessage);
        if (onConfirmSuccess) {
          onConfirmSuccess();
        }
      } else {
        setError(response.data.message || "Có lỗi xảy ra khi xác nhận");
      }
    } catch (error) {
      console.error("Error confirming handover:", error);
      setError(error.response?.data?.message || "Có lỗi xảy ra khi xác nhận");
    } finally {
      setConfirming(false);
    }
  };

  const getImageUrl = (image) => {
    // Nếu image là string (chỉ là URL), trả về trực tiếp
    if (typeof image === "string") {
      return image.trim().replace(/`/g, ""); // Loại bỏ khoảng trắng và backticks
    }

    // Kiểm tra nếu là Cloudinary URL (có url field) hoặc URL đầy đủ
    if (image.url) {
      return image.url.trim().replace(/`/g, ""); // Cloudinary URL, loại bỏ khoảng trắng và backticks
    }

    // Kiểm tra nếu path đã là URL đầy đủ (bắt đầu với http)
    if (image.path && image.path.startsWith("http")) {
      return image.path.trim().replace(/`/g, ""); // Cloudinary URL trong path, loại bỏ khoảng trắng và backticks
    }

    // Fallback cho local path cũ
    return `${axiosInstance.defaults.baseURL}${image.path}`;
  };

  const openImageModal = (image, index) => {
    setSelectedImage({ ...image, index });
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const canUpload = () => {
    if (readOnly) return false;
    if (userRole !== "owner") return false;

    if (imageType === "pre-rental") {
      return !handoverData?.owner_handover_confirmed;
    } else {
      return !handoverData?.owner_return_confirmed;
    }
  };

  const canConfirm = () => {
    if (!showConfirmButton) return false;

    if (imageType === "pre-rental") {
      if (userRole === "renter") {
        return (
          handoverData?.owner_handover_confirmed &&
          !handoverData?.renter_handover_confirmed &&
          uploadedImages.length >= minImages
        );
      } else {
        return (
          !handoverData?.owner_handover_confirmed &&
          uploadedImages.length >= minImages
        );
      }
    } else {
      if (userRole === "renter") {
        return (
          handoverData?.owner_return_confirmed &&
          !handoverData?.renter_return_confirmed &&
          uploadedImages.length >= minImages
        );
      } else {
        return (
          !handoverData?.owner_return_confirmed &&
          uploadedImages.length >= minImages
        );
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
        {description && (
          <div className="text-gray-600 text-sm">
            {typeof description === "string" ? (
              <p>{description}</p>
            ) : (
              <div>
                <p className="font-medium mb-2">{description.title}</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  {description.items?.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-600 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Status Information for pre-rental */}
      {imageType === "pre-rental" && handoverData && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-3">
            Trạng thái bàn giao xe
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Upload ảnh:</span>
              <div
                className={`mt-1 ${
                  uploadedImages.length >= minImages
                    ? "text-green-600"
                    : "text-yellow-600"
                }`}
              >
                {uploadedImages.length >= minImages
                  ? "✓ Đã đủ ảnh"
                  : `${uploadedImages.length}/${minImages} ảnh`}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700">
                Chủ xe xác nhận:
              </span>
              <div
                className={`mt-1 ${
                  handoverData.owner_handover_confirmed
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                {handoverData.owner_handover_confirmed
                  ? "✓ Đã xác nhận"
                  : "Chưa xác nhận"}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700">
                Khách hàng xác nhận:
              </span>
              <div
                className={`mt-1 ${
                  handoverData.renter_handover_confirmed
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                {handoverData.renter_handover_confirmed
                  ? "✓ Đã xác nhận"
                  : handoverData.owner_handover_confirmed
                  ? "Chờ xác nhận"
                  : "Chờ chủ xe xác nhận trước"}
              </div>
            </div>
          </div>
          {handoverData.handover_time && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <span className="font-medium text-gray-700">
                Thời gian bàn giao:
              </span>
              <div className="text-gray-600 text-sm mt-1">
                {new Date(handoverData.handover_time).toLocaleString("vi-VN")}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status Information for post-rental */}
      {imageType === "post-rental" && handoverData && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-3">Trạng thái trả xe</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Upload ảnh:</span>
              <div
                className={`mt-1 ${
                  uploadedImages.length >= minImages
                    ? "text-green-600"
                    : "text-yellow-600"
                }`}
              >
                {uploadedImages.length >= minImages
                  ? "✓ Đã đủ ảnh"
                  : `${uploadedImages.length}/${minImages} ảnh`}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700">
                Chủ xe xác nhận:
              </span>
              <div
                className={`mt-1 ${
                  handoverData.owner_return_confirmed
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                {handoverData.owner_return_confirmed
                  ? "✓ Đã xác nhận"
                  : "Chưa xác nhận"}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700">
                Khách hàng xác nhận:
              </span>
              <div
                className={`mt-1 ${
                  handoverData.renter_return_confirmed
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                {handoverData.renter_return_confirmed
                  ? "✓ Đã xác nhận"
                  : handoverData.owner_return_confirmed
                  ? "Chờ xác nhận"
                  : "Chờ chủ xe xác nhận trước"}
              </div>
            </div>
          </div>
          {handoverData.return_time && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <span className="font-medium text-gray-700">
                Thời gian trả xe:
              </span>
              <div className="text-gray-600 text-sm mt-1">
                {new Date(handoverData.return_time).toLocaleString("vi-VN")}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Section */}
      {canUpload() && (
        <div className="mb-6">
          {/* Drag & Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center">
              <svg
                className="w-12 h-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-lg font-medium text-gray-700 mb-2">
                Kéo thả ảnh vào đây hoặc
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Chọn ảnh
              </button>
              <p className="text-sm text-gray-500 mt-2">
                Hỗ trợ: JPG, JPEG, PNG, WEBP (tối đa 5MB mỗi file)
              </p>
              <p className="text-sm text-gray-500">
                Tối thiểu {minImages} ảnh, tối đa 10 ảnh
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Preview Images Section */}
      {previewImages.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-800">
              Ảnh đã chọn ({previewImages.length})
            </h4>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setPreviewImages([]);
                  setSelectedFiles([]);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
              >
                Xóa tất cả
              </button>
              <button
                onClick={uploadAllImages}
                disabled={uploading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading
                  ? "Đang upload..."
                  : `Upload ${previewImages.length} ảnh`}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previewImages.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Image Info */}
                <div className="mt-2 text-xs text-gray-600">
                  <p className="truncate" title={image.name}>
                    {image.name}
                  </p>
                  <p>{formatFileSize(image.size)}</p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removePreviewImage(image.id)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded Images Section */}
      {uploadedImages.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-800 mb-4">
            Ảnh đã upload ({uploadedImages.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedImages.map((image, index) => (
              <div
                key={typeof image === "string" ? image : image.id || index}
                className="relative group"
              >
                <div
                  className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
                  onClick={() => openImageModal(image, index)}
                >
                  <img
                    src={getImageUrl(image)}
                    alt={`${imageType} image ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>

                {/* Delete Button */}
                {canUpload() && (
                  <button
                    onClick={() => handleDeleteUploadedImage(index)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Images Message */}
      {uploadedImages.length === 0 && previewImages.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p>Chưa có ảnh nào được upload</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        {canConfirm() && userRole === "renter" && (
          <button
            onClick={handleConfirmImages}
            disabled={confirming}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {confirming ? "Đang xác nhận..." : "Xác nhận"}
          </button>
        )}

        {canConfirm() && userRole === "owner" && (
          <button
            onClick={handleOwnerConfirmHandover}
            disabled={confirming}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {confirming
              ? "Đang xác nhận..."
              : imageType === "pre-rental"
              ? "Xác nhận bàn giao"
              : "Xác nhận nhận lại xe"}
          </button>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <img
              src={getImageUrl(selectedImage)}
              alt={`Image ${selectedImage.index + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-20 text-white rounded-full flex items-center justify-center hover:bg-opacity-30"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadViewer;
