import React, { useState, useEffect } from "react";
import axiosInstance from "../../config/axiosInstance";
import { toast } from "sonner";

const HandoverImageViewer = ({
  bookingId,
  onConfirmSuccess,
  imageType,
  handoverData,
}) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (handoverData) {
      // Lấy ảnh từ handover data được truyền vào
      if (imageType === "pre-rental") {
        const preRentalImages = handoverData.pre_rental_images || [];
        // Xử lý URLs từ Cloudinary (loại bỏ khoảng trắng và backticks nếu có)
        const cleanImages = preRentalImages.map((url, index) => ({
          id: index,
          url: url.trim().replace(/`/g, ""), // Loại bỏ backticks và khoảng trắng
          originalName: `Ảnh xe ${index + 1}`,
        }));
        setImages(cleanImages);
      } else if (imageType === "post-rental") {
        const postRentalImages = handoverData.post_rental_images || [];
        const cleanImages = postRentalImages.map((url, index) => ({
          id: index,
          url: url.trim().replace(/`/g, ""),
          originalName: `Ảnh xe sau trả ${index + 1}`,
        }));
        setImages(cleanImages);
      }
      setLoading(false);
    }
  }, [handoverData, imageType]);

  const handleConfirmImages = async () => {
    try {
      setConfirming(true);
      setError("");

      let endpoint;
      if (imageType === "pre-rental") {
        endpoint = `/api/handover/${bookingId}/confirm-renter-handover`;
      } else {
        endpoint = `/api/handover/${bookingId}/confirm-renter-return`;
      }

      const response = await axiosInstance.post(endpoint);

      if (response.data.success) {
        const message =
          imageType === "pre-rental"
            ? "Xác nhận ảnh xe trước bàn giao thành công!"
            : "Xác nhận ảnh xe sau trả xe thành công!";
        toast.success(message);
        if (onConfirmSuccess) {
          onConfirmSuccess();
        }
      } else {
        setError(response.data.message || "Có lỗi xảy ra khi xác nhận ảnh");
      }
    } catch (error) {
      console.error("Error confirming images:", error);
      setError(
        error.response?.data?.message || "Có lỗi xảy ra khi xác nhận ảnh"
      );
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
    if (!dateString) return "Chưa có";
    return new Date(dateString).toLocaleString("vi-VN");
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
          {imageType === "pre-rental"
            ? "Hình ảnh xe trước khi bàn giao"
            : "Hình ảnh xe sau khi trả"}
        </h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-yellow-600 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-yellow-800">
              {imageType === "pre-rental"
                ? "Chủ xe chưa upload ảnh xe. Vui lòng đợi chủ xe upload ảnh trước khi bàn giao."
                : "Chủ xe chưa upload ảnh xe. Vui lòng đợi chủ xe upload ảnh sau khi nhận lại xe."}
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
          {imageType === "pre-rental"
            ? "Hình ảnh xe trước khi bàn giao"
            : "Hình ảnh xe sau khi trả"}
        </h3>
        <div className="text-sm text-gray-600">{images.length} ảnh</div>
      </div>

      {/* Status Information */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        {imageType === "pre-rental" ? (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">
              Ảnh xe do chủ xe gửi trước khi bàn giao
            </h4>
            <div className="text-sm">
              <span className="font-medium text-gray-700">
                Trạng thái xác nhận của bạn:
              </span>
              <div
                className={`mt-1 ${
                  handoverData?.renter_handover_confirmed
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                {handoverData?.renter_handover_confirmed
                  ? "✓ Đã xác nhận ảnh xe"
                  : "Chưa xác nhận ảnh xe"}
              </div>
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-700">
                Trạng thái xác nhận của chủ xe:
              </span>
              <div
                className={`mt-1 ${
                  handoverData?.owner_handover_confirmed
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                {handoverData?.owner_handover_confirmed
                  ? "✓ Đã xác nhận bàn giao"
                  : "Chưa xác nhận bàn giao"}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">
              Ảnh xe do chủ xe gửi sau khi hoàn thành chuyến đi
            </h4>
            <div className="text-sm">
              <span className="font-medium text-gray-700">
                Trạng thái xác nhận của bạn:
              </span>
              <div
                className={`mt-1 ${
                  handoverData?.renter_return_confirmed
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                {handoverData?.renter_return_confirmed
                  ? "✓ Đã xác nhận ảnh xe"
                  : "Chưa xác nhận ảnh xe"}
              </div>
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-700">
                Trạng thái xác nhận của chủ xe:
              </span>
              <div
                className={`mt-1 ${
                  handoverData?.owner_return_confirmed
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                {handoverData?.owner_return_confirmed
                  ? "✓ Đã xác nhận nhận lại xe"
                  : "Chưa xác nhận nhận lại xe"}
              </div>
            </div>
            {handoverData?.return_time && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">
                  Thời gian xác nhận:
                </span>
                <div className="mt-1 text-gray-600">
                  {new Date(handoverData.return_time).toLocaleString("vi-VN")}
                </div>
              </div>
            )}
          </div>
        )}
        {handoverData?.handover_time && (
          <div className="mt-3 text-sm">
            <span className="font-medium text-gray-700">
              Thời gian bàn giao:
            </span>
            <span className="ml-2 text-gray-600">
              {formatDateTime(handoverData.handover_time)}
            </span>
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
            key={image.id || index}
            className="relative cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => openImageModal(image, index)}
          >
            <img
              src={image.url}
              alt={`Vehicle ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg border"
              onError={(e) => {
                e.target.src = "/default_avt.jpg"; // Fallback image
                e.target.alt = "Không thể tải ảnh";
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg">
              {image.originalName}
            </div>
            <div className="absolute top-1 left-1 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
              {index + 1}
            </div>
          </div>
        ))}
      </div>

      {/* Action & Post-rental Info */}
      <div className={imageType === "post-rental" ? "space-y-0" : "space-y-4"}>
        {imageType === "pre-rental" && (
          <>
            {!handoverData?.renter_handover_confirmed && (
              <div className="space-y-3">
                <button
                  onClick={handleConfirmImages}
                  disabled={confirming}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    confirming
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {confirming ? "Đang xác nhận..." : "Xác nhận ảnh xe"}
                </button>
                <div className="text-sm text-gray-600">
                  Vui lòng kiểm tra ảnh xe do chủ xe gửi và xác nhận tình trạng
                  xe trước khi bàn giao.
                </div>
              </div>
            )}

            {handoverData?.renter_handover_confirmed &&
              !handoverData?.owner_handover_confirmed && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-yellow-600 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-yellow-800">
                      Bạn đã xác nhận ảnh xe. Vui lòng đợi chủ xe hoàn tất bàn
                      giao.
                    </span>
                  </div>
                </div>
              )}
          </>
        )}

        {imageType === "post-rental" && (
          <div className="flex flex-col gap-0 items-stretch">
            {/* Tình trạng xe khi trả (từ chủ xe) */}
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">
                Tình trạng xe khi trả (từ chủ xe)
              </h4>
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  Hư hỏng: <span className={`ml-1 font-medium ${handoverData?.damage_reported ? "text-red-600" : "text-green-600"}`}>{handoverData?.damage_reported ? "Có" : "Không"}</span>
                </p>
                <p className="text-sm text-gray-700">
                  Mô tả: <span className="ml-1 text-gray-800">{handoverData?.damage_description || "Không có"}</span>
                </p>
                {handoverData?.damage_reported && (
                  <p className="text-sm text-gray-700">
                    Bồi thường ước tính: <span className="ml-1 text-gray-800">{Number(handoverData?.compensation_amount || 0) > 0 ? `${Number(handoverData?.compensation_amount).toLocaleString("vi-VN")} VND` : "Không có"}</span>
                  </p>
                )}
              </div>
              {!handoverData?.renter_return_confirmed && (
                <p className="text-xs text-gray-500 mt-2">
                  Vui lòng kiểm tra và xác nhận nếu thông tin tình trạng xe chính xác.
                </p>
              )}
            </div>

            {/* Trả xe trễ (từ chủ xe) */}
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Trả xe trễ (từ chủ xe)</h4>
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  Có trả trễ: <span className={`ml-1 font-medium ${handoverData?.late_return ? "text-red-600" : "text-green-600"}`}>{handoverData?.late_return ? "Có" : "Không"}</span>
                </p>

                {handoverData?.late_return && (
                  <>
                    <p className="text-sm text-gray-700">
                      Mô tả: <span className="ml-1 text-gray-800">{(() => {
                        const v = (handoverData?.late_return_fee_description ?? "").toString().trim();
                        const isZeroNumeric = /^0*(?:\.0+)?$/.test(v);
                        return v && !isZeroNumeric ? v : "Không có";
                      })()}</span>
                    </p>
                    <p className="text-sm text-gray-700">
                      Phí trả trễ: <span className="ml-1 text-gray-800">{Number(handoverData?.late_return_fee || 0) > 0 ? `${Number(handoverData?.late_return_fee).toLocaleString("vi-VN")} VND` : "Không có"}</span>
                    </p>
                  </>
                )}
              </div>

              {!handoverData?.renter_return_confirmed && (
                <p className="text-xs text-gray-500 mt-2">
                  Vui lòng kiểm tra và xác nhận nếu thông tin trả trễ chính xác.
                </p>
              )}
            </div>

            {/* Nút xác nhận ảnh xe đặt cuối cùng */}
            {!handoverData?.renter_return_confirmed && (
              <div className="space-y-3 flex flex-col items-center">
                <button
                  onClick={handleConfirmImages}
                  disabled={confirming}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    confirming
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {confirming ? "Đang xác nhận..." : "Xác nhận ảnh xe"}
                </button>
                <div className="text-sm text-gray-600 text-center">
                  Vui lòng kiểm tra ảnh xe do chủ xe gửi và xác nhận tình trạng
                  xe sau khi trả.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Success message when both parties have confirmed */}
        {((imageType === "pre-rental" &&
          handoverData?.owner_handover_confirmed &&
          handoverData?.renter_handover_confirmed) ||
          (imageType === "post-rental" &&
            handoverData?.owner_return_confirmed &&
            handoverData?.renter_return_confirmed)) && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-green-600 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-green-800 font-medium">
                {imageType === "pre-rental"
                  ? "Bàn giao xe thành công! Chuyến xe đã bắt đầu."
                  : "Trả xe thành công! Chuyến đi đã hoàn thành."}
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
              src={selectedImage.url}
              alt={`Vehicle ${selectedImage.index + 1}`}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                e.target.src = "/default_avt.jpg";
                e.target.alt = "Không thể tải ảnh";
              }}
            />
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded">
              <div className="font-medium">{selectedImage.originalName}</div>
              <div className="text-sm opacity-75">
                Ảnh {selectedImage.index + 1} / {images.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HandoverImageViewer;
