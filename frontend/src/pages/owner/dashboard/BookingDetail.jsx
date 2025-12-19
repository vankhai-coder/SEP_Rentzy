import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../../config/axiosInstance.js";
import ImageUploadViewer from "../../../components/common/ImageUploadViewer.jsx";
import {
  MdArrowBack,
  MdCalendarToday,
  MdPerson,
  MdDirectionsCar,
  MdLocationOn,
  MdAttachMoney,
  MdWarning,
  MdAdd,
  MdEdit,
  MdDelete,
  MdClose,
} from "react-icons/md";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../../components/ui/dialog.jsx";
import { Button } from "../../../components/ui/button.jsx";
import { toast } from "sonner";

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signUrl, setSignUrl] = useState("");
  const [showTrafficFineModal, setShowTrafficFineModal] = useState(false);
  const [trafficFineAmount, setTrafficFineAmount] = useState("");
  const [trafficFineViolationDate, setTrafficFineViolationDate] = useState("");
  const [trafficFineLicensePlate, setTrafficFineLicensePlate] = useState("");
  const [trafficFineViolation, setTrafficFineViolation] = useState("");
  const [trafficFineReason, setTrafficFineReason] = useState("");
  const [trafficFineLocation, setTrafficFineLocation] = useState("");
  const [trafficFineImages, setTrafficFineImages] = useState([]);
  const [trafficFineReceiptImages, setTrafficFineReceiptImages] = useState([]);
  const [submittingTrafficFine, setSubmittingTrafficFine] = useState(false);
  const [showDeleteTrafficFineModal, setShowDeleteTrafficFineModal] = useState(false);
  const [deleteTrafficFineReason, setDeleteTrafficFineReason] = useState("");
  const [submittingDeleteTrafficFine, setSubmittingDeleteTrafficFine] = useState(false);
  const [extractingInfo, setExtractingInfo] = useState(false);
  const [imageModal, setImageModal] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: null, // "APPROVE_REMAINING" | "ACCEPT_BOOKING"
    title: "",
    message: "",
  });

  useEffect(() => {
    fetchBookingDetail();
  }, [id]);

  const fetchBookingDetail = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/api/owner/dashboard/bookings/detail/${id}`
      );
      console.log("dữ liệu detail booking", response.data);
      if (response.data.success) {
        setBooking(response.data.data);
      } else {
        setError("Không thể tải thông tin đơn thuê");
      }
    } catch (error) {
      console.error("Error fetching booking detail:", error);
      setError("Có lỗi xảy ra khi tải thông tin đơn thuê");
    } finally {
      setLoading(false);
    }
  };
  // owner xác nhận tiền mà renter đã trả
  const approveRemainingByOwner = () => {
    setConfirmDialog({
      isOpen: true,
      type: "APPROVE_REMAINING",
      title: "Xác nhận thanh toán",
      message:
        "Bạn có chắc chắn muốn xác nhận rằng người thuê đã chuyển khoản phần còn lại (70%) không?",
    });
  };
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const parseTrafficFineAmount = (value) => {
    const digitsOnly = (value || "").toString().replace(/[^\d]/g, "");
    const trimmed = digitsOnly.replace(/^0+/, "");
    return trimmed ? parseInt(trimmed, 10) : 0;
  };

  const formatTrafficFineAmountInput = (value) => {
    const digitsOnly = (value || "").toString().replace(/[^\d]/g, "");
    const trimmed = digitsOnly.replace(/^0+/, "");
    if (!trimmed) return "";
    return trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const formatDateTime = (date, time) => {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString("vi-VN");
    return `${formattedDate} ${time}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "confirmed":
        return "text-purple-600 bg-purple-100";
      case "canceled":
        return "text-red-600 bg-red-100";
      case "deposit_paid":
        return "text-blue-600 bg-blue-100";
      case "fully_paid":
        return "text-blue-600 bg-blue-100";
      case "in_progress":
        return "text-blue-600 bg-blue-100";
      case "completed":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "confirmed":
        return "Đã xác nhận đặt xe";
      case "deposit_paid":
        return "Đã thanh toán đặt cọc";
      case "fully_paid":
        return "Đã thanh toán toàn bộ";
      case "in_progress":
        return "Đang thuê";
      case "cancel_requested":
        return "Yêu cầu huỷ";
      case "canceled":
        return "Đã hủy";
      case "completed":
        return "Hoàn thành";
      default:
        return status;
    }
  };

  // Owner accept booking (chuyển từ pending -> confirmed)
  const handleAcceptBooking = () => {
    setConfirmDialog({
      isOpen: true,
      type: "ACCEPT_BOOKING",
      title: "Chấp nhận đơn đặt xe",
      message:
        "Bạn có chắc chắn muốn chấp nhận đơn đặt xe này? Sau khi chấp nhận, người thuê sẽ có thể tiếp tục thanh toán đặt cọc 30%.",
    });
  };

  const handleConfirm = async () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));

    if (confirmDialog.type === "APPROVE_REMAINING") {
      try {
        setLoading(true);
        const response = await axiosInstance.patch(
          `/api/payment/approveRemainingByOwner/${id}`
        );

        if (response.status === 200) {
          toast.success("Xác nhận thanh toán thành công!");
          await fetchBookingDetail();
        } else {
          toast.error("Không thể xác nhận thanh toán. Vui lòng thử lại!");
        }
      } catch (err) {
        console.error("Error approving remaining payment:", err);
        toast.error("Có lỗi xảy ra khi xác nhận thanh toán!");
      } finally {
        setLoading(false);
      }
    } else if (confirmDialog.type === "ACCEPT_BOOKING") {
      try {
        setLoading(true);
        const response = await axiosInstance.patch(
          `/api/owner/dashboard/bookings/${id}/accept`
        );

        if (response.data.success) {
          toast.success("Đã chấp nhận đơn đặt xe thành công!");
          await fetchBookingDetail();
        } else {
          toast.error(
            response.data.message || "Không thể chấp nhận đơn đặt xe"
          );
        }
      } catch (err) {
        console.error("Error accepting booking:", err);
        toast.error(
          err.response?.data?.message ||
            "Có lỗi xảy ra khi chấp nhận đơn đặt xe"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSignContractOwner = async () => {
    try {
      const envelopeId = booking?.contract?.contract_number;
      if (!envelopeId) return toast.error("Không có thông tin hợp đồng để ký.");
      const resp = await axiosInstance.get(`/api/docusign/sign/${envelopeId}`, {
        params: { role: "owner" },
      });
      const url = resp.data?.url;
      if (url) {
        setSignUrl(url);
        setShowSignModal(true);
      } else {
        toast.error("Không thể tạo URL ký hợp đồng.");
      }
    } catch (err) {
      console.error("Error creating recipient view:", err);
      toast.error(err.response?.data?.error || "Không thể tạo URL ký hợp đồng.");
    }
  };

  const handleViewContractPdf = () => {
    try {
      if (!booking?.booking_id) return toast.error("Không có hợp đồng để xem.");
      navigate(`/owner/contract/${booking.booking_id}`);
    } catch (err) {
      console.error("Error navigating to contract page:", err);
      toast.error("Không thể mở trang hợp đồng.");
    }
  };

  const handleAddTrafficFine = async () => {
    const normalizedTrafficFineAmount = parseTrafficFineAmount(trafficFineAmount);

    if (normalizedTrafficFineAmount <= 0) {
      toast.error("Vui lòng nhập số tiền phạt nguội hợp lệ");
      return;
    }

    if (trafficFineImages.length === 0) {
      toast.error("Vui lòng thêm ít nhất một hình ảnh phạt nguội");
      return;
    }

    if (trafficFineReceiptImages.length === 0) {
      toast.error("Vui lòng thêm ít nhất một hình ảnh hóa đơn nộp phạt");
      return;
    }

    try {
      setSubmittingTrafficFine(true);
      const formData = new FormData();
      formData.append("amount", normalizedTrafficFineAmount);
      
      // Tạo description từ các trường riêng biệt
      let description = "";
      if (trafficFineViolationDate) {
        description += `Ngày vi phạm: ${trafficFineViolationDate}`;
      }
      if (trafficFineLicensePlate) {
        if (description) description += "\n";
        description += `Biển số (màu biển số): ${trafficFineLicensePlate}`;
      }
      if (trafficFineViolation) {
        if (description) description += "\n";
        description += `Hành vi vi phạm: ${trafficFineViolation}`;
      }
      if (trafficFineReason) {
        if (description) description += "\n";
        description += `Lý do: ${trafficFineReason}`;
      }
      if (trafficFineLocation) {
        if (description) description += "\n";
        description += `Địa điểm vi phạm: ${trafficFineLocation}`;
      }
      
      if (description) {
        formData.append("description", description);
      }
      trafficFineImages.forEach((image) => {
        formData.append("images", image.file);
      });
      
      // Thêm ảnh hóa đơn nộp phạt
      trafficFineReceiptImages.forEach((image) => {
        formData.append("receipt_images", image.file);
      });

      const response = await axiosInstance.post(
        `/api/owner/dashboard/bookings/${id}/traffic-fine`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success("Đã thêm phí phạt nguội thành công");
        setShowTrafficFineModal(false);
        setTrafficFineAmount("");
        setTrafficFineViolationDate("");
        setTrafficFineLicensePlate("");
        setTrafficFineViolation("");
        setTrafficFineReason("");
        setTrafficFineLocation("");
        setTrafficFineImages([]);
        setTrafficFineReceiptImages([]);
        await fetchBookingDetail();
      } else {
        toast.error(response.data.message || "Không thể thêm phí phạt nguội");
      }
    } catch (error) {
      console.error("Error adding traffic fine:", error);
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi thêm phí phạt nguội"
      );
    } finally {
      setSubmittingTrafficFine(false);
    }
  };

  const handleDeleteTrafficFine = async () => {
    if (!deleteTrafficFineReason || deleteTrafficFineReason.trim().length === 0) {
      toast.error("Vui lòng nhập lý do xóa phạt nguội");
      return;
    }

    if (deleteTrafficFineReason.trim().length < 10) {
      toast.error("Lý do xóa phải có ít nhất 10 ký tự");
      return;
    }

    try {
      setSubmittingDeleteTrafficFine(true);
      const response = await axiosInstance.post(
        `/api/owner/dashboard/bookings/${id}/traffic-fine/delete-request`,
        {
          deletion_reason: deleteTrafficFineReason.trim(),
        }
      );

      if (response.data.success) {
        toast.success("Đã gửi yêu cầu xóa phạt nguội. Vui lòng chờ admin duyệt.");
        setShowDeleteTrafficFineModal(false);
        setDeleteTrafficFineReason("");
        await fetchBookingDetail();
      } else {
        toast.error(response.data.message || "Không thể gửi yêu cầu xóa phạt nguội");
      }
    } catch (error) {
      console.error("Error requesting traffic fine deletion:", error);
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi gửi yêu cầu xóa phạt nguội"
      );
    } finally {
      setSubmittingDeleteTrafficFine(false);
    }
  };

  const handleTrafficFineImageSelect = (event) => {
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

    if (trafficFineImages.length + validFiles.length > 10) {
      toast.error("Chỉ được upload tối đa 10 ảnh");
      return;
    }

    const newImages = validFiles.map((file) => {
      const preview = URL.createObjectURL(file);
      return {
        id: Date.now() + Math.random(),
        file,
        preview,
        name: file.name,
      };
    });

    setTrafficFineImages((prev) => [...prev, ...newImages]);
  };

  const removeTrafficFineImage = (imageId) => {
    setTrafficFineImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter((img) => img.id !== imageId);
    });
  };

  const handleTrafficFineReceiptImageSelect = (event) => {
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

    if (trafficFineReceiptImages.length + validFiles.length > 5) {
      toast.error("Chỉ được upload tối đa 5 ảnh hóa đơn");
      return;
    }

    const newImages = validFiles.map((file) => {
      const preview = URL.createObjectURL(file);
      return {
        id: Date.now() + Math.random(),
        file,
        preview,
        name: file.name,
      };
    });

    setTrafficFineReceiptImages((prev) => [...prev, ...newImages]);
  };

  const removeTrafficFineReceiptImage = (imageId) => {
    setTrafficFineReceiptImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter((img) => img.id !== imageId);
    });
  };

  // Hàm trích xuất thông tin từ ảnh phạt nguội bằng AI
  const handleExtractTrafficFineInfo = async () => {
    if (trafficFineImages.length === 0) {
      toast.error("Vui lòng chọn ít nhất một ảnh để đọc thông tin");
      return;
    }

    // Lấy ảnh đầu tiên để xử lý
    const firstImage = trafficFineImages[0];
    
    try {
      setExtractingInfo(true);
      const formData = new FormData();
      formData.append("image", firstImage.file);

      const response = await axiosInstance.post(
        `/api/owner/dashboard/extract-traffic-fine-info`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        const extractedData = response.data.data;
        console.log("[ExtractTrafficFine] Received data:", extractedData);
        
        // Điền thông tin vào form
        if (extractedData.fineAmount) {
          setTrafficFineAmount(extractedData.fineAmount.toString());
          console.log("[ExtractTrafficFine] Set fine amount:", extractedData.fineAmount);
        }
        
        // Điền thông tin vào các trường riêng biệt
        if (extractedData.violationDate) {
          setTrafficFineViolationDate(extractedData.violationDate);
        }
        
        // Biển số xe và màu
        if (extractedData.licensePlate) {
          let licensePlateText = extractedData.licensePlate;
          if (extractedData.licensePlateColor) {
            licensePlateText += ` (${extractedData.licensePlateColor})`;
          }
          setTrafficFineLicensePlate(licensePlateText);
        }
        
        // Hành vi vi phạm
        if (extractedData.violationBehavior) {
          setTrafficFineViolation(extractedData.violationBehavior);
        }
        
        // Lý do vi phạm
        if (extractedData.violationReason) {
          setTrafficFineReason(extractedData.violationReason);
        }
        
        // Địa điểm vi phạm
        if (extractedData.violationLocation) {
          setTrafficFineLocation(extractedData.violationLocation);
        }
        
        console.log("[ExtractTrafficFine] Set individual fields to form");

        toast.success("Đã đọc thông tin từ ảnh thành công! Vui lòng kiểm tra và chỉnh sửa nếu cần.");
      } else {
        toast.error(response.data.message || "Không thể đọc thông tin từ ảnh");
      }
    } catch (error) {
      console.error("Error extracting traffic fine info:", error);
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi đọc thông tin từ ảnh"
      );
    } finally {
      setExtractingInfo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <button
          onClick={() => navigate("/owner/booking-management")}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500 text-xl">
          Không tìm thấy thông tin đơn thuê
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/owner/booking-management")}
            className="flex border border-gray-600 px-4 py-2 rounded items-center text-black-600 hover:text-gray-800 mb-4"
          >
            <MdArrowBack className="mr-2" />
            Quay lại danh sách đơn thuê
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Chi tiết đơn thuê #{booking.booking_id}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Booking Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MdCalendarToday className="mr-2 text-blue-600" />
                Thông tin đơn thuê
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã đơn:</span>
                  <span className="font-medium">#{booking.booking_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày bắt đầu:</span>
                  <span className="font-medium">
                    {formatDateTime(booking.start_date, booking.start_time)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày kết thúc:</span>
                  <span className="font-medium">
                    {formatDateTime(booking.end_date, booking.end_time)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Số ngày thuê:</span>
                  <span className="font-medium">{booking.total_days} ngày</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Địa điểm nhận xe:</span>
                  <span className="font-medium text-sm">
                    {booking.pickup_location}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Địa điểm trả xe:</span>
                  <span className="font-medium text-sm">
                    {booking.return_location}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trạng thái:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      booking.status
                    )}`}
                  >
                    {getStatusText(booking.status)}
                  </span>
                </div>
                {/* Nút chấp nhận booking khi status là pending */}
                {booking.status === "pending" && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleAcceptBooking}
                      disabled={loading}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {loading ? "Đang xử lý..." : "Chấp nhận đơn đặt xe"}
                    </button>
                    <p className="mt-2 text-xs text-gray-500 text-center">
                      Sau khi chấp nhận, người thuê sẽ có thể tiếp tục thanh toán đặt cọc 30%
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MdAttachMoney className="mr-2 text-green-600" />
                Thông tin thanh toán
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Chi phí thuê xe:</span>
                  <span className="font-medium">
                    {formatCurrency(booking.total_cost)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Giảm giá:</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(booking.discount_amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phí giao xe:</span>
                  <span className="font-medium">
                    {formatCurrency(booking.delivery_fee)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Điểm sử dụng:</span>
                  <span className="font-medium">
                    {booking.points_used} điểm
                  </span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between">
                  <span className="text-gray-600 font-semibold">
                    Tổng thanh toán:
                  </span>
                  <span className="font-bold text-green-600 text-lg">
                    {formatCurrency(booking.total_amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Đã thanh toán:</span>
                  <span className="font-medium text-blue-600">
                    {formatCurrency(booking.total_paid)}
                  </span>
                </div>
                {booking.voucher_code && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã voucher:</span>
                    <span className="font-medium">{booking.voucher_code}</span>
                  </div>
                )}
              </div>
            </div>
            {/* Traffic Fine Section - Riêng biệt với thanh toán */}
            {(() => {
              const pendingAddRequest = booking.trafficFineRequests?.find(
                (r) => r.status === "pending" && r.request_type === "add"
              );
              const pendingDeleteRequest = booking.trafficFineRequests?.find(
                (r) => r.status === "pending" && r.request_type === "delete"
              );

              const hasActualFine = booking.traffic_fine_amount > 0;
              const hasPending = !!pendingAddRequest;
              const canInteract =
                booking.status === "in_progress" || booking.status === "completed";

              // Show if: has fine OR has pending request OR can add fine
              if (!hasActualFine && !hasPending && !canInteract) return null;

              // Data normalization
              const displayData = hasPending ? pendingAddRequest : booking;
              const displayAmount = hasPending
                ? parseFloat(displayData.amount)
                : displayData.traffic_fine_amount;
              const displayDescription = hasPending
                ? displayData.description
                : displayData.traffic_fine_description;
              const displayImages = hasPending
                ? displayData.images
                : displayData.traffic_fine_images;
              const paidAmount = hasPending ? 0 : booking.traffic_fine_paid || 0;

              return (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-2">
                      <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                        <MdWarning className="mr-2 text-orange-600" />
                        Phí phạt nguội
                      </h2>
                      {pendingAddRequest && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium border border-yellow-200 w-fit">
                          Đang chờ duyệt
                        </span>
                      )}
                      {pendingDeleteRequest && (
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium border border-red-200 w-fit">
                          Đang chờ duyệt xóa
                        </span>
                      )}
                    </div>

                    {canInteract && !pendingAddRequest && !pendingDeleteRequest && !hasActualFine && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setTrafficFineAmount(
                              booking.traffic_fine_amount || ""
                            );
                            // Reset các trường khi mở modal edit
                            setTrafficFineViolationDate("");
                            setTrafficFineLicensePlate("");
                            setTrafficFineViolation("");
                            setTrafficFineReason("");
                            setTrafficFineLocation("");
                            setTrafficFineImages([]);
                            setTrafficFineReceiptImages([]);
                            setShowTrafficFineModal(true);
                          }}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                          title="Thêm phí phạt nguội"
                        >
                          <MdAdd className="mr-1" />
                          Thêm phí phạt
                        </button>
                      </div>
                    )}
                  </div>

                  {hasActualFine || hasPending ? (
                    <div className="space-y-3">
                      {hasPending && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm italic">
                          Yêu cầu này đang được admin xem xét. Thông báo sẽ được
                          gửi khi có kết quả.
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">
                          Tổng phí phạt nguội:
                        </span>
                        <span className="font-bold text-lg text-orange-600">
                          {formatCurrency(displayAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Đã thanh toán:</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(paidAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Còn lại:</span>
                        <span className="font-medium text-red-600">
                          {formatCurrency((displayAmount || 0) - paidAmount)}
                        </span>
                      </div>
                      {displayDescription &&
                        (() => {
                          // Parse description thành các trường riêng
                          const description = displayDescription;
                          const fields = {
                            violationDate: "",
                            licensePlate: "",
                            violation: "",
                            reason: "",
                            location: "",
                          };

                          // Parse từ format: "Ngày vi phạm: ...\nBiển số: ..."
                          const lines = description.split("\n");
                          lines.forEach((line) => {
                            if (line.includes("Ngày vi phạm:")) {
                              fields.violationDate = line
                                .replace("Ngày vi phạm:", "")
                                .trim();
                            } else if (line.includes("Biển số")) {
                              fields.licensePlate = line
                                .replace(/Biển số.*?:/, "")
                                .trim();
                            } else if (line.includes("Hành vi vi phạm:")) {
                              fields.violation = line
                                .replace("Hành vi vi phạm:", "")
                                .trim();
                            } else if (line.includes("Lý do:")) {
                              fields.reason = line.replace("Lý do:", "").trim();
                            } else if (line.includes("Địa điểm vi phạm:")) {
                              fields.location = line
                                .replace("Địa điểm vi phạm:", "")
                                .trim();
                            }
                          });

                          return (
                            <div className="mt-3 p-3 bg-white rounded border border-orange-200 space-y-2">
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                Lý do phạt nguội:
                              </p>
                              {fields.violationDate && (
                                <div>
                                  <span className="text-sm font-medium text-gray-600">
                                    Ngày vi phạm:{" "}
                                  </span>
                                  <span className="text-sm text-gray-700">
                                    {fields.violationDate}
                                  </span>
                                </div>
                              )}
                              {fields.licensePlate && (
                                <div>
                                  <span className="text-sm font-medium text-gray-600">
                                    Biển số (màu biển số):{" "}
                                  </span>
                                  <span className="text-sm text-gray-700">
                                    {fields.licensePlate}
                                  </span>
                                </div>
                              )}
                              {fields.violation && (
                                <div>
                                  <span className="text-sm font-medium text-gray-600">
                                    Hành vi vi phạm:{" "}
                                  </span>
                                  <span className="text-sm text-gray-700">
                                    {fields.violation}
                                  </span>
                                </div>
                              )}
                              {fields.reason && (
                                <div>
                                  <span className="text-sm font-medium text-gray-600">
                                    Lý do:{" "}
                                  </span>
                                  <span className="text-sm text-gray-700">
                                    {fields.reason}
                                  </span>
                                </div>
                              )}
                              {fields.location && (
                                <div>
                                  <span className="text-sm font-medium text-gray-600">
                                    Địa điểm vi phạm:{" "}
                                  </span>
                                  <span className="text-sm text-gray-700">
                                    {fields.location}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      {(() => {
                        // Parse images từ format mới hoặc cũ
                        let violationImages = [];
                        let receiptImages = [];

                        if (displayImages) {
                          try {
                            // Kiểm tra xem có phải là string JSON không
                            let parsed;
                            if (
                              typeof displayImages === "string"
                            ) {
                              parsed = JSON.parse(displayImages);
                            } else {
                              parsed = displayImages;
                            }

                            // Kiểm tra format mới: {violations: [...], receipts: [...]}
                            if (
                              parsed &&
                              typeof parsed === "object" &&
                              !Array.isArray(parsed)
                            ) {
                              if (parsed.violations || parsed.receipts) {
                                violationImages = Array.isArray(
                                  parsed.violations
                                )
                                  ? parsed.violations
                                  : [];
                                receiptImages = Array.isArray(parsed.receipts)
                                  ? parsed.receipts
                                  : [];
                              } else {
                                // Object nhưng không phải format mới, thử convert thành array
                                violationImages = Object.values(parsed).filter(
                                  (v) => typeof v === "string"
                                );
                              }
                            } else if (Array.isArray(parsed)) {
                              // Format cũ: array đơn giản
                              violationImages = parsed;
                            }
                          } catch (e) {
                            console.error(
                              "Error parsing traffic fine images:",
                              e
                            );
                            // Fallback: nếu parse lỗi, thử dùng trực tiếp nếu là array
                            if (
                              Array.isArray(displayImages)
                            ) {
                              violationImages = displayImages;
                            }
                          }
                        }

                        return (
                          <>
                            {violationImages.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                  Hình ảnh phạt nguội:
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {violationImages.map((imageUrl, index) => (
                                    <div key={index} className="relative group">
                                      <img
                                        src={imageUrl}
                                        alt={`Phạt nguội ${index + 1}`}
                                        className="w-full h-32 object-cover rounded border border-orange-200 cursor-pointer hover:opacity-80"
                                        onClick={() => setImageModal(imageUrl)}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {receiptImages.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                  Hóa đơn nộp phạt:
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {receiptImages.map((imageUrl, index) => (
                                    <div
                                      key={`receipt-${index}`}
                                      className="relative group"
                                    >
                                      <img
                                        src={imageUrl}
                                        alt={`Hóa đơn ${index + 1}`}
                                        className="w-full h-32 object-cover rounded border border-orange-200 cursor-pointer hover:opacity-80"
                                        onClick={() => setImageModal(imageUrl)}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                      <div className="mt-3 pt-3 border-t border-orange-200">
                        <p className="text-xs text-gray-500 italic">
                          * Phí phạt nguội được thanh toán riêng biệt, không ảnh
                          hưởng đến tổng tiền thuê xe.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-2">
                        Chưa có phí phạt nguội
                      </p>
                      <p className="text-xs text-gray-500 italic">
                        * Phí phạt nguội được thanh toán riêng biệt, không ảnh
                        hưởng đến tổng tiền thuê xe.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Booking Timeline */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Thời gian tạo đơn
              </h2>

              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Ngày tạo</p>
                  <p className="font-medium">
                    {new Date(booking.created_at).toLocaleDateString("vi-VN")}{" "}
                    {new Date(booking.created_at).toLocaleTimeString("vi-VN")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cập nhật lần cuối</p>
                  <p className="font-medium">
                    {new Date(booking.updated_at).toLocaleDateString("vi-VN")}{" "}
                    {new Date(booking.updated_at).toLocaleTimeString("vi-VN")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Vehicle Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MdDirectionsCar className="mr-2 text-blue-600" />
                Thông tin xe
              </h2>

              <div className="space-y-4">
                <div>
                  <img
                    src={booking.vehicle.main_image_url}
                    alt={booking.vehicle.model}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Model</p>
                    <p className="font-medium">{booking.vehicle.model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Biển số</p>
                    <p className="font-medium">
                      {booking.vehicle.license_plate}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Giá thuê/ngày</p>
                    <p className="font-medium text-green-600">
                      {formatCurrency(booking.vehicle.price_per_day)}
                    </p>
                  </div>
                  <div className="flex items-start">
                    <MdLocationOn className="mr-2 text-gray-600 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Vị trí xe</p>
                      <p className="text-sm">{booking.vehicle.location}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Renter Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MdPerson className="mr-2 text-blue-600" />
                Thông tin người thuê
              </h2>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Họ tên</p>
                  <p className="font-medium">{booking.renter.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{booking.renter.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Số điện thoại</p>
                  <p className="font-medium">{booking.renter.phone_number}</p>
                </div>
              </div>
            </div>
            {/* Tiền mặt trả sau (70%) - tách riêng và rõ ràng */}
            {(booking.remaining_paid_by_cash_status === "pending" ||
              booking.remaining_paid_by_cash_status === "approved" ||
              booking.remaining_paid_by_cash_status === "rejected") && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Thông tin chuyển tiền trả sau (70%)
                </h2>
                <div className="mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      booking.remaining_paid_by_cash_status === "approved"
                        ? "bg-green-100 text-green-700"
                        : booking.remaining_paid_by_cash_status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {booking.remaining_paid_by_cash_status === "approved"
                      ? "Chủ xe đã xác nhận khoản tiền"
                      : booking.remaining_paid_by_cash_status === "pending"
                      ? "Đang chờ chủ xe xác nhận"
                      : "Chủ xe đã từ chối khoản tiền"}
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    {booking.remaining_paid_by_cash_status === "approved"
                      ? "Số tiền đã xác nhận"
                      : "Số tiền cần xác nhận"}
                  </p>
                  <p className="text-2xl font-extrabold text-gray-900">
                    {formatCurrency(
                      booking.remaining_paid_by_cash_status === "approved"
                        ? booking.total_amount * 0.7
                        : booking.total_amount - booking.total_paid
                    )}
                  </p>
                </div>
                {booking.remaining_paid_by_cash_status === "pending" && (
                  <>
                    <div className="mt-4">
                      <button
                        onClick={approveRemainingByOwner}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      >
                        Xác nhận
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            {/* Contract Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Hợp đồng thuê xe
              </h2>
              {booking.contract ? (
                <div className="space-y-3">
                  {(() => {
                    const statusValue =
                      booking.contract.contract_status ||
                      booking.contract.status;
                    const badgeClass =
                      statusValue === "completed"
                        ? "bg-green-100 text-green-700"
                        : statusValue === "pending_signatures"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700";
                    return (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Trạng thái:</span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}
                        >
                          {statusValue}
                        </span>
                      </div>
                    );
                  })()}

                  <div className="flex gap-3">
                    {(booking.contract.contract_status ||
                      booking.contract.status) === "pending_signatures" &&
                      booking.contract.renter_signed === true &&
                      booking.contract.owner_signed === false && (
                        <button
                          onClick={handleSignContractOwner}
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                          Ký hợp đồng
                        </button>
                      )}
                    {(booking.contract.contract_status ||
                      booking.contract.status) === "completed" && (
                      <button
                        onClick={handleViewContractPdf}
                        className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
                      >
                        Xem hợp đồng
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">Chưa có hợp đồng cho đơn này.</p>
              )}
            </div>
          </div>
        </div>

        {/* Quản lý hình ảnh xe */}
        <div className="mt-8 space-y-8">
          {(booking.status === "fully_paid" ||
            booking.status === "in_progress" ||
            booking.status === "completed") &&
            (booking.contract?.contract_status === "completed" ||
              booking.contract?.status === "completed") && (
              <>
                <div className="flex items-center mb-4">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                    1
                  </span>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Hình ảnh xe trước khi bàn giao
                  </h2>
                </div>
                <ImageUploadViewer
                  bookingId={booking.booking_id}
                  imageType="pre-rental"
                  minImages={5}
                  onUploadSuccess={fetchBookingDetail}
                  userRole="owner"
                  onConfirmSuccess={fetchBookingDetail}
                  handoverData={booking.handover || {}}
                />
              </>
            )}

          {(booking.status === "in_progress" ||
            booking.status === "completed") &&
            (booking.contract?.contract_status === "completed" ||
              booking.contract?.status === "completed") &&
            booking.handover?.renter_handover_confirmed === true && (
              <>
                <div className="flex items-center mb-4">
                  <span className="bg-red-100 text-red-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                    2
                  </span>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Hình ảnh khi nhận xe trả lại
                  </h2>
                </div>
                <ImageUploadViewer
                  bookingId={booking.booking_id}
                  imageType="post-rental"
                  minImages={5}
                  onUploadSuccess={fetchBookingDetail}
                  userRole="owner"
                  handoverData={booking.handover || {}}
                />
              </>
            )}
        </div>
        {/* Sign Contract Modal */}
        <Dialog open={showSignModal} onOpenChange={setShowSignModal}>
          <DialogContent className="max-w-4xl w-full">
            <DialogHeader>
              <DialogTitle>Ký hợp đồng</DialogTitle>
            </DialogHeader>
            {signUrl ? (
              <iframe
                src={signUrl}
                title="DocuSign Signing"
                className="w-full h-[70vh] rounded"
              />
            ) : (
              <div className="text-gray-600">Đang chuẩn bị URL ký...</div>
            )}
          </DialogContent>
        </Dialog>

        {/* Traffic Fine Modal */}
        <Dialog open={showTrafficFineModal} onOpenChange={setShowTrafficFineModal}>
          <DialogContent className="max-w-2xl w-full max-h-[90vh] flex flex-col p-0">
            <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
              <DialogTitle className="flex items-center gap-2">
                <MdWarning className="text-orange-600" />
                {booking?.traffic_fine_amount > 0 ? "Cập nhật phí phạt nguội" : "Thêm phí phạt nguội"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 px-6 overflow-y-auto flex-1 min-h-0">
              {/* Hình ảnh - Đầu tiên */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hình ảnh phạt nguội <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  {trafficFineImages.length > 0 ? (
                    <div className="space-y-4">
                      {/* Grid hiển thị ảnh đã upload */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {trafficFineImages.map((image) => (
                          <div key={image.id} className="relative group">
                            <img
                              src={image.preview}
                              alt={image.name}
                              className="w-full h-32 object-cover rounded border border-gray-300"
                            />
                            <button
                              onClick={() => removeTrafficFineImage(image.id)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Xóa ảnh"
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
                      
                      {/* Nút thêm ảnh */}
                      <label className="block cursor-pointer">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-gray-400 transition-colors">
                          <svg
                            className="mx-auto h-6 w-6 text-gray-400"
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
                          <p className="mt-1 text-xs text-gray-600">
                            Thêm ảnh
                          </p>
                        </div>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleTrafficFineImageSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <div className="text-center">
                        <svg
                          className="mx-auto h-10 w-10 text-gray-400"
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
                        <p className="mt-2 text-sm text-gray-600">
                          Nhấp để chọn ảnh hoặc kéo thả ảnh vào đây
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF tối đa 5MB mỗi file. Tối đa 10 ảnh.
                        </p>
                      </div>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleTrafficFineImageSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {trafficFineImages.length > 0 && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleExtractTrafficFineInfo}
                      disabled={extractingInfo}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {extractingInfo ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Đọc thông tin từ ảnh (AI)
                        </>
                      )}
                    </button>
                  </div>
                )}
                {trafficFineImages.length === 0 && (
                  <p className="mt-2 text-xs text-red-500">
                    * Vui lòng thêm ít nhất một hình ảnh phạt nguội
                  </p>
                )}
              </div>

              {/* Thông tin chi tiết phạt nguội */}
              <div className="space-y-4">
                {/* Ngày vi phạm */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày vi phạm
                  </label>
                  <input
                    type="text"
                    value={trafficFineViolationDate}
                    onChange={(e) => setTrafficFineViolationDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ví dụ: 24/04/2023"
                  />
                </div>

                {/* Biển số xe */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Biển số xe (màu biển số)
                  </label>
                  <input
                    type="text"
                    value={trafficFineLicensePlate}
                    onChange={(e) => setTrafficFineLicensePlate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ví dụ: 98B3-797.30 (Trắng)"
                  />
                </div>

                {/* Hành vi vi phạm */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hành vi vi phạm
                  </label>
                  <input
                    type="text"
                    value={trafficFineViolation}
                    onChange={(e) => setTrafficFineViolation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ví dụ: Không chấp hành hiệu lệnh của đèn tín hiệu giao thông"
                  />
                </div>

                {/* Lý do */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lý do
                  </label>
                  <textarea
                    value={trafficFineReason}
                    onChange={(e) => setTrafficFineReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    placeholder="Mô tả lý do vi phạm..."
                  />
                </div>

                {/* Địa điểm */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa điểm vi phạm
                  </label>
                  <input
                    type="text"
                    value={trafficFineLocation}
                    onChange={(e) => setTrafficFineLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ví dụ: Đường ABC, Quận XYZ, TP.HCM"
                  />
                </div>
              </div>

              {/* Số tiền */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số tiền phạt nguội (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9.]*"
                  value={formatTrafficFineAmountInput(trafficFineAmount)}
                  onChange={(e) => {
                    const rawDigits = e.target.value.replace(/[^\d]/g, "");
                    const trimmed = rawDigits.replace(/^0+/, "");
                    setTrafficFineAmount(trimmed);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập số tiền phạt nguội"
                />
                {parseTrafficFineAmount(trafficFineAmount) > 0 && (
                  <p className="mt-1 text-sm text-gray-600">
                    {formatCurrency(parseTrafficFineAmount(trafficFineAmount))}
                  </p>
                )}
              </div>

              {/* Hóa đơn nộp phạt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hóa đơn nộp phạt <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  {trafficFineReceiptImages.length > 0 ? (
                    <div className="space-y-4">
                      {/* Grid hiển thị ảnh đã upload */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {trafficFineReceiptImages.map((image) => (
                          <div key={image.id} className="relative group">
                            <img
                              src={image.preview}
                              alt={image.name}
                              className="w-full h-32 object-cover rounded border border-gray-300"
                            />
                            <button
                              onClick={() => removeTrafficFineReceiptImage(image.id)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Xóa ảnh"
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
                      
                      {/* Nút thêm ảnh */}
                      <label className="block cursor-pointer">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-gray-400 transition-colors">
                          <svg
                            className="mx-auto h-6 w-6 text-gray-400"
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
                          <p className="mt-1 text-xs text-gray-600">
                            Thêm ảnh hóa đơn
                          </p>
                        </div>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleTrafficFineReceiptImageSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <div className="text-center">
                        <svg
                          className="mx-auto h-10 w-10 text-gray-400"
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
                        <p className="mt-2 text-sm text-gray-600">
                          Nhấp để chọn ảnh hóa đơn hoặc kéo thả ảnh vào đây
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF tối đa 5MB mỗi file. Tối đa 5 ảnh.
                        </p>
                      </div>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleTrafficFineReceiptImageSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {trafficFineReceiptImages.length === 0 && (
                  <p className="mt-2 text-xs text-red-500">
                    * Vui lòng thêm ít nhất một hình ảnh hóa đơn nộp phạt
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>Lưu ý:</strong> Phí phạt nguội được thanh toán riêng biệt, không ảnh hưởng đến tổng tiền thuê xe.
                  {booking?.traffic_fine_paid > 0 && (
                    <span className="block mt-1">
                      Người thuê đã thanh toán: {formatCurrency(booking.traffic_fine_paid)}
                    </span>
                  )}
                </p>
              </div>

            </div>
            <div className="flex justify-end gap-3 pt-4 pb-6 px-6 border-t mt-4 flex-shrink-0">
              <button
                onClick={() => {
                  setShowTrafficFineModal(false);
                  setTrafficFineAmount("");
                  setTrafficFineViolationDate("");
                  setTrafficFineLicensePlate("");
                  setTrafficFineViolation("");
                  setTrafficFineReason("");
                  setTrafficFineLocation("");
                  setTrafficFineImages([]);
                  setTrafficFineReceiptImages([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={submittingTrafficFine}
              >
                Hủy
              </button>
              <button
                onClick={handleAddTrafficFine}
                disabled={submittingTrafficFine || parseTrafficFineAmount(trafficFineAmount) <= 0 || trafficFineImages.length === 0 || trafficFineReceiptImages.length === 0}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submittingTrafficFine ? "Đang xử lý..." : booking?.traffic_fine_amount > 0 ? "Cập nhật" : "Thêm phí phạt"}
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Traffic Fine Modal */}
        <Dialog open={showDeleteTrafficFineModal} onOpenChange={setShowDeleteTrafficFineModal}>
          <DialogContent className="max-w-2xl w-full">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MdDelete className="text-red-600" />
                Xóa phí phạt nguội
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Lưu ý:</strong> Yêu cầu xóa phạt nguội của bạn sẽ được gửi đến admin để duyệt. 
                  Phạt nguội chỉ được xóa sau khi admin chấp thuận.
                </p>
              </div>

              {booking?.traffic_fine_paid > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-800">
                    <strong>Cảnh báo:</strong> Người thuê đã thanh toán {formatCurrency(booking.traffic_fine_paid)} 
                    cho phí phạt nguội này. Việc xóa có thể ảnh hưởng đến thanh toán.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do xóa phạt nguội <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={deleteTrafficFineReason}
                  onChange={(e) => setDeleteTrafficFineReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows="6"
                  placeholder="Vui lòng giải thích chi tiết lý do muốn xóa phạt nguội này (tối thiểu 10 ký tự)..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Lý do xóa sẽ được gửi đến admin để xem xét và duyệt
                </p>
                {deleteTrafficFineReason.length > 0 && deleteTrafficFineReason.trim().length < 10 && (
                  <p className="mt-1 text-xs text-red-500">
                    Lý do xóa phải có ít nhất 10 ký tự (hiện tại: {deleteTrafficFineReason.trim().length})
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowDeleteTrafficFineModal(false);
                    setDeleteTrafficFineReason("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={submittingDeleteTrafficFine}
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteTrafficFine}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={submittingDeleteTrafficFine || !deleteTrafficFineReason.trim() || deleteTrafficFineReason.trim().length < 10}
                >
                  {submittingDeleteTrafficFine ? "Đang gửi..." : "Gửi yêu cầu xóa"}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirmDialog.title}</DialogTitle>
              <DialogDescription>
                {confirmDialog.message}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}>
                Hủy
              </Button>
              <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">
                Xác nhận
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 z-10"
              >
                <MdClose className="w-6 h-6" />
              </button>
              <img
                src={imageModal}
                alt="Xem ảnh"
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingDetail;
