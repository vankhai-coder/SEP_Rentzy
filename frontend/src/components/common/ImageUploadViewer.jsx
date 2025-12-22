import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../config/axiosInstance";
// Component chỉ dành cho OWNER upload và xác nhận ảnh bàn giao/nhận xe
const ImageUploadViewer = ({
  bookingId,
  imageType,
  onConfirmSuccess,
  handoverData,
  minImages = 5,
}) => {
  const [localImages, setLocalImages] = useState([]);
  const [confirmedImages, setConfirmedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  // Trạng thái/ghi chú tình trạng xe sau khi trả
  const [damageReported, setDamageReported] = useState(
    handoverData?.damage_reported || false
  );
  const [damageDescription, setDamageDescription] = useState(
    handoverData?.damage_description || ""
  );
  const [compensationAmount, setCompensationAmount] = useState(
    handoverData?.compensation_amount || 0
  );
  // Trả xe trễ
  const [lateReturnEnabled, setLateReturnEnabled] = useState(
    handoverData?.late_return || false
  );
  const [lateReturnFee, setLateReturnFee] = useState(() => {
    const val = handoverData?.late_return_fee;
    if (val === null || val === undefined) return "";
    const num = typeof val === "string" ? parseFloat(val) : Number(val);
    return !isNaN(num) && num > 0 ? String(val) : "";
  });
  const [lateReturnReason, setLateReturnReason] = useState(
    handoverData?.late_return_fee_description || ""
  );

  useEffect(() => {
    // Kiểm tra xem đã có ảnh được xác nhận chưa
    console.log("HandoverData:", handoverData);
    console.log("ImageType:", imageType);

    if (handoverData) {
      if (imageType === "pre-rental") {
        const preRentalImages = handoverData.pre_rental_images || [];
        console.log("Pre-rental images:", preRentalImages);
        if (preRentalImages.length > 0) {
          const mappedImages = preRentalImages.map((url) => {
            console.log("Processing image URL:", url);
            return { url, id: Date.now() + Math.random() };
          });
          setConfirmedImages(mappedImages);
          setIsConfirmed(handoverData.owner_handover_confirmed || false);
        }
      } else {
        const postRentalImages = handoverData.post_rental_images || [];
        console.log("Post-rental images:", postRentalImages);
        if (postRentalImages.length > 0) {
          const mappedImages = postRentalImages.map((url) => {
            console.log("Processing image URL:", url);
            return { url, id: Date.now() + Math.random() };
          });
          setConfirmedImages(mappedImages);
          setIsConfirmed(handoverData.owner_return_confirmed || false);
        }
      }
    }
  }, [handoverData, imageType]);

  const handleFileSelect = (event) => {
    if (isConfirmed) {
      toast.error("Đã xác nhận bàn giao, không thể chỉnh sửa ảnh");
      return;
    }

    const files = Array.from(event.target.files);
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`File ${file.name} không phải là ảnh`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} quá lớn (tối đa 5MB)`);
        return false;
      }
      return true;
    });

    if (localImages.length + validFiles.length > 10) {
      toast.error("Chỉ được upload tối đa 10 ảnh");
      return;
    }

    const newImages = validFiles.map((file) => {
      const preview = URL.createObjectURL(file);
      console.log("Created preview URL:", preview, "for file:", file.name);
      return {
        id: Date.now() + Math.random(),
        file,
        preview,
        name: file.name,
      };
    });

    console.log("Adding new images:", newImages);
    setLocalImages((prev) => [...prev, ...newImages]);
  };

  const removeLocalImage = (imageId) => {
    if (isConfirmed) {
      toast.error("Đã xác nhận bàn giao, không thể chỉnh sửa ảnh");
      return;
    }

    setLocalImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter((img) => img.id !== imageId);
    });
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

  const formatCurrency = (value) => {
    if (!value) return "";
    const stringValue = String(value);
    const number = stringValue.replace(/\D/g, "");
    if (!number) return "";
    return new Intl.NumberFormat("vi-VN").format(number);
  };

  const confirmHandover = async () => {
    if (localImages.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 ảnh để xác nhận bàn giao");
      return;
    }

    if (localImages.length < minImages) {
      toast.error(`Cần ít nhất ${minImages} ảnh để xác nhận bàn giao xe`);
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      localImages.forEach((image) => {
        formData.append("images", image.file);
      });

      // Gửi kèm ghi chú tình trạng xe khi nhận lại xe (post-rental)
      if (imageType === "post-rental") {
        formData.append("damage_reported", damageReported ? "true" : "false");
        formData.append("damage_description", damageDescription || "");
        formData.append("compensation_amount", String(compensationAmount || 0));
        // Trả xe trễ
        formData.append("late_return", lateReturnEnabled ? "true" : "false");
        formData.append("late_return_fee", String(lateReturnFee || ""));
        formData.append("late_return_fee_description", lateReturnReason || "");
      }

      // Sử dụng endpoint đúng cho từng loại handover
      const endpoint =
        imageType === "pre-rental"
          ? `/api/handover/${bookingId}/confirm-owner-handover`
          : `/api/handover/${bookingId}/confirm-owner-return`;
      console.log("Endpoint:", endpoint);

      const response = await axiosInstance.post(endpoint, formData);

      const data = response.data;

      if (data.success) {
        // Cập nhật confirmed images với URLs từ server
        setConfirmedImages(data.data.uploadedImages.map((url) => ({ url })));
        setLocalImages([]); // Clear local images
        setIsConfirmed(true);

        // Đồng bộ thông tin tình trạng xe sau khi server lưu
        if (imageType === "post-rental") {
          setDamageReported(Boolean(data.data.damage_reported));
          setDamageDescription(data.data.damage_description || "");
          setCompensationAmount(Number(data.data.compensation_amount || 0));
          setLateReturnEnabled(Boolean(data.data.late_return));
          setLateReturnFee(
            data.data.late_return_fee !== undefined &&
              data.data.late_return_fee !== null
              ? String(data.data.late_return_fee)
              : lateReturnFee
          );
          setLateReturnReason(
            data.data.late_return_fee_description || lateReturnReason
          );
        }

        const successMessage =
          imageType === "pre-rental"
            ? "Xác nhận bàn giao xe thành công!"
            : "Xác nhận nhận lại xe thành công!";
        toast.success(successMessage);

        if (onConfirmSuccess) {
          onConfirmSuccess();
        }
      } else {
        toast.error(data.message || "Có lỗi xảy ra khi xác nhận bàn giao");
      }
    } catch (error) {
      console.error("Error confirming handover:", error);
      toast.error("Có lỗi xảy ra khi xác nhận bàn giao");
    } finally {
      setIsUploading(false);
    }
  };

  const allImages = [...confirmedImages, ...localImages];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {imageType === "pre-rental"
            ? "Upload ảnh xe trước khi bàn giao"
            : "Upload ảnh xe sau khi nhận lại"}
        </h3>
        <div className="text-sm text-gray-600">
          {allImages.length}/10 ảnh (tối thiểu {minImages})
        </div>
      </div>
      <div className="bg-gray-10 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg
            className="w-5 h-5 mr-2 text-blue-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Trạng thái xác nhận{" "}
          {imageType === "pre-rental" ? "bàn giao" : "nhận lại"}
        </h3>

        {imageType === "pre-rental" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Chủ xe</h4>
                  <p className="text-sm text-gray-500">Xác nhận bàn giao xe</p>
                </div>
              </div>
              <div
                className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  handoverData.owner_handover_confirmed
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {handoverData.owner_handover_confirmed ? (
                  <>
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Đã xác nhận
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Chờ xác nhận
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Người thuê</h4>
                  <p className="text-sm text-gray-500">Xác nhận nhận xe</p>
                </div>
              </div>
              <div
                className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  handoverData.renter_handover_confirmed
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {handoverData.renter_handover_confirmed ? (
                  <>
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Đã xác nhận
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Chờ xác nhận
                  </>
                )}
              </div>
            </div>
            <h3>Thời gian bàn giao</h3>
            <p className="text-sm text-gray-500">
              {handoverData.handover_time
                ? formatDateTime(handoverData.handover_time)
                : "Chưa xác nhận"}
            </p>
          </div>
        )}

        {imageType === "post-rental" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Chủ xe</h4>
                  <p className="text-sm text-gray-500">Xác nhận nhận lại xe</p>
                </div>
              </div>
              <div
                className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  handoverData.owner_return_confirmed
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {handoverData.owner_return_confirmed ? (
                  <>
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Đã xác nhận
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Chờ xác nhận
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Người thuê</h4>
                  <p className="text-sm text-gray-500">Xác nhận trả xe</p>
                </div>
              </div>
              <div
                className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  handoverData.renter_return_confirmed
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {handoverData.renter_return_confirmed ? (
                  <>
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Đã xác nhận
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Chờ xác nhận
                  </>
                )}
              </div>
            </div>

            {/* Ghi chú tình trạng xe/hư hỏng khi trả xe - chỉ hiển thị cho post-rental */}
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">
                Ghi chú tình trạng xe khi trả
              </h4>
              {!isConfirmed ? (
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={damageReported}
                      onChange={(e) => setDamageReported(e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">
                      Có hư hỏng cần ghi nhận
                    </span>
                  </label>
                  {damageReported && (
                    <>
                      <textarea
                        value={damageDescription}
                        onChange={(e) => setDamageDescription(e.target.value)}
                        placeholder="Mô tả tình trạng xe/hư hỏng, vị trí, mức độ..."
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                        rows={3}
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">
                          Bồi thường:
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={compensationAmount ? formatCurrency(compensationAmount) : ""}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/\./g, "").replace(/\D/g, "");
                            setCompensationAmount(Number(rawValue));
                          }}
                          placeholder="Ví dụ: 150.000"
                          className="border border-gray-300 rounded-lg p-2 text-sm w-40"
                        />
                        <span className="text-sm text-gray-500">VND</span>
                      </div>
                      <p className="text-xs text-gray-500">Chỉ nhập số cho bồi thường.</p>
                    </>
                  )}
                  <p className="text-xs text-gray-500">
                    Ghi chú này sẽ hiển thị cho người thuê để xác nhận tình
                    trạng xe.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Hư hỏng:</span>
                    <span
                      className={`text-sm font-medium ${
                        damageReported ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {damageReported ? "Có" : "Không"}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-700">Mô tả:</span>
                    <p className="text-sm text-gray-800 mt-1">
                      {damageDescription || "Không có"}
                    </p>
                  </div>
                  {damageReported && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">Bồi thường:</span>
                      <span className="text-sm text-gray-800">
                        {Number(compensationAmount || 0).toLocaleString(
                          "vi-VN"
                        )}{" "}
                        VND
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Trả xe trễ */}
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Trả xe trễ</h4>
              {!isConfirmed ? (
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={lateReturnEnabled}
                      onChange={(e) => setLateReturnEnabled(e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">Có trả trễ</span>
                  </label>
                  {lateReturnEnabled && (
                    <>
                      <textarea
                        value={lateReturnReason}
                        onChange={(e) => setLateReturnReason(e.target.value)}
                        placeholder="Mô tả trả xe trễ..."
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                        rows={2}
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">
                          Phí trả trễ:
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={lateReturnFee ? formatCurrency(lateReturnFee) : ""}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/\./g, "").replace(/\D/g, "");
                            setLateReturnFee(rawValue);
                          }}
                          placeholder="Ví dụ: 200.000"
                          className="border border-gray-300 rounded-lg p-2 text-sm w-40"
                        />
                        <span className="text-sm text-gray-500">VND</span>
                      </div>

                      <p className="text-xs text-gray-500">
                        Chỉ nhập số cho phí trả trễ.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Có trả trễ:</span>
                    <span
                      className={`text-sm font-medium ${
                        lateReturnEnabled ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {lateReturnEnabled ? "Có" : "Không"}
                    </span>
                  </div>
                  {lateReturnEnabled && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">
                          Phí trả trễ:
                        </span>
                        <span className="text-sm text-gray-800">
                          {Number(lateReturnFee || 0).toLocaleString("vi-VN")}{" "}
                          VND
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-700">Mô tả:</span>
                        <p className="text-sm text-gray-800 mt-1">
                          {lateReturnReason || "Không có"}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* File input */}
      {!isConfirmed && (
        <div className="mb-6">
          <label className="block w-full">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="mt-2">
                <span className="text-sm text-gray-600">
                  Nhấp để chọn ảnh hoặc kéo thả ảnh vào đây
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, GIF tối đa 5MB mỗi file. Tối thiểu {minImages} ảnh,
                  tối đa 10 ảnh.
                </p>
              </div>
            </div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Images grid */}
      {allImages.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 12,
          }}
        >
          {allImages.map((image, index) => (
            <div key={image.id || index} style={{ position: "relative" }}>
              <img
                src={image.preview || image.url || image}
                alt={`Ảnh xe ${index + 1}`}
                style={{
                  width: 240,
                  height: 160,
                  objectFit: "cover",
                  borderRadius: 8,
                  boxShadow: "0 2px 8px #e3e8ef",
                  backgroundColor: "#f3f4f6",
                  display: "block",
                  cursor: "pointer",
                }}
                onClick={() => openImageModal(image, index)}
                onError={(e) => {
                  console.error("Image load error:", e.target.src);
                  e.target.style.backgroundColor = "#f3f4f6";
                  e.target.style.border = "2px dashed #d1d5db";
                }}
                onLoad={(e) => {
                  console.log("Image loaded successfully:", e.target.src);
                }}
              />

              {/* Remove button - matching BookingDetailOwner style */}
              {!isConfirmed && image.preview && (
                <button
                  onClick={() => removeLocalImage(image.id)}
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    background: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: 22,
                    height: 22,
                    cursor: "pointer",
                    boxShadow: "0 1px 4px #e3e8ef",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    style={{ color: "#f76c6c", fontSize: 14 }}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    width="14"
                    height="14"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}

              {/* Image number */}
              <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                {index + 1}
              </div>

              {/* Confirmed indicator */}
              {image.url && (
                <div className="absolute bottom-2 left-2 bg-green-600 text-white rounded-full p-1">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {!isConfirmed && localImages.length > 0 && (
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setLocalImages([])}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Xóa tất cả
          </button>
          <button
            onClick={confirmHandover}
            disabled={isUploading || localImages.length < minImages}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isUploading || localImages.length < minImages
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isUploading
              ? "Đang xử lý..."
              : `Xác nhận ${
                  imageType === "pre-rental" ? "bàn giao xe" : "nhận lại xe"
                }`}
          </button>
        </div>
      )}

      {/* Help text */}
      {!isConfirmed && localImages.length < minImages && (
        <div className="mt-4 text-sm text-gray-600">
          <p>
            Cần ít nhất {minImages} ảnh để xác nhận{" "}
            {imageType === "pre-rental" ? "bàn giao xe" : "nhận lại xe"}.
          </p>
          <p>
            Hiện tại: {localImages.length}/{minImages} ảnh
          </p>
        </div>
      )}

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
              src={selectedImage.preview || selectedImage.url || selectedImage}
              alt={`Ảnh xe ${selectedImage.index + 1}`}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                e.target.src = "/default_avt.jpg";
                e.target.alt = "Không thể tải ảnh";
              }}
            />
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded">
              <div className="font-medium">
                {selectedImage.name || `Ảnh xe ${selectedImage.index + 1}`}
              </div>
              <div className="text-sm opacity-75">
                Ảnh {selectedImage.index + 1} / {allImages.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadViewer;
