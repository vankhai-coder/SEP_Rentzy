import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import axiosInstance from "../../../../config/axiosInstance"; // Giả sử bạn có file cấu hình axios
import DateTimeSelector from "./DateTimeSelector";
import AddressSelector from "./AddressSelector";
import PromoCodeModal from "./PromoCodeModal";
import {
  checkIfReported,
  resetReportState,
} from "../../../../redux/features/renter/vehicleReport/vehicleReportSlice";
import VehicleReportModal from "../../../../components/renter/vehicleReport/VehicleReportModal";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import LoginWithPhoneNumber from '../../../../pages/renter/auth/LoginWithPhoneNumber.jsx'
import RegisterWithPhoneNumber from '../../../../pages/renter/auth/RegisterWithPhoneNumber.jsx'
import Register from '../../../../pages/renter/auth/Register.jsx'
import Login from '../../../../pages/renter/auth/Login.jsx'
import { Button } from "@/components/ui/button";

function BookingForm({ vehicle, prefillParams }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // State declarations
  const [bookingData, setBookingData] = useState({
    startDate: "",
    endDate: "",
    startTime: "09:00",
    endTime: "18:00",
    deliveryOption: "pickup",
    pickupAddress: "",
    returnAddress: "",
    useCurrentLocation: false,
    deliveryCoords: null,
  });

  const [showDateTimeSelector, setShowDateTimeSelector] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryDistanceKm, setDeliveryDistanceKm] = useState(0);
  const [userPoints, setUserPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { isReported } = useSelector((state) => state.vehicleReport);

  // retrieve userId from userStore
  const { userId } = useSelector((state) => state.userStore || {});

  // state for login and register with phone Dialog :
  const [isLoginWithPhoneOpen, setIsLoginWithPhoneOpen] = React.useState(false)
  const [isRegisterWithPhoneOpen, setIsRegisterWithPhoneOpen] = React.useState(false)
  // state for login and register with email Dialog :
  const [loginOpen, setLoginOpen] = React.useState(false)
  const [registerOpen, setRegisterOpen] = React.useState(false)

  // Fetch user points
  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const res = await axiosInstance.get("/api/auth/check-auth");
        const points = res?.data?.user?.points;
        if (typeof points === "number") {
          setUserPoints(points);
        }
      } catch (err) {
        console.error("Không lấy được điểm người dùng:", err);
      }
    };
    fetchPoints();
  }, []);

  // Report vehicle check
  useEffect(() => {
    if (vehicle?.vehicle_id) {
      dispatch(checkIfReported(vehicle.vehicle_id));
    }
    return () => dispatch(resetReportState());
  }, [dispatch, vehicle?.vehicle_id]);

  // Prefill từ query params (start_date, end_date, start_time, end_time)
  const hasPrefilledRef = useRef(false);
  useEffect(() => {
    if (hasPrefilledRef.current) return;
    if (!prefillParams) return;

    const { start_date, end_date, start_time, end_time } = prefillParams;
    if (!start_date || !end_date) return;

    const buildISO = (dateStr, timeStr, fallbackTime) => {
      try {
        const [y, m, d] = dateStr.split("-").map(Number);
        const [hh, mm] = (timeStr || fallbackTime || "00:00").split(":").map(Number);
        const dt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
        return dt.toISOString();
      } catch {
        return undefined;
      }
    };

    const startISO = buildISO(start_date, start_time, bookingData.startTime);
    const endISO = buildISO(end_date, end_time, bookingData.endTime);

    if (startISO && endISO) {
      setBookingData((prev) => ({
        ...prev,
        startDate: startISO,
        endDate: endISO,
        startTime: start_time || prev.startTime,
        endTime: end_time || prev.endTime,
      }));
      hasPrefilledRef.current = true;
    }
  }, [prefillParams, bookingData.startTime, bookingData.endTime]);

  // Format date and time for display
  const formatDateTime = () => {
    const { startDate, endDate, startTime, endTime } = bookingData;
    if (!startDate || !endDate) return "Chọn thời gian thuê xe";

    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      return isNaN(date) ? "Invalid Date" : date.toLocaleDateString("vi-VN");
    };

    return `${formatDate(startDate)} ${startTime} - ${formatDate(
      endDate
    )} ${endTime}`;
  };

  // Calculate rental days
  const calculateDays = () => {
    if (!bookingData.startDate || !bookingData.endDate || !bookingData.startTime || !bookingData.endTime) return 0;
    const start = new Date(bookingData.startDate);
    const end = new Date(bookingData.endDate);
    const [ph] = bookingData.startTime.split(":").map(Number);
    const [rh] = bookingData.endTime.split(":").map(Number);
    start.setHours(ph, 0, 0, 0);
    end.setHours(rh, 0, 0, 0);
    return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) || 1;
  };

  // Move calculations and useMemo to top level
  const totalDays = calculateDays();
  const basePrice = parseFloat(vehicle?.price_per_day || 0);

  // Calculate subtotal and discount with memoization
  const subtotal = useMemo(
    () => totalDays * basePrice + deliveryFee,
    [totalDays, basePrice, deliveryFee]
  );

  const discountAmount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.type === "percent") {
      const raw = (subtotal * appliedPromo.value) / 100;
      const capped = appliedPromo.maxDiscount
        ? Math.min(raw, appliedPromo.maxDiscount)
        : raw;
      return Math.max(0, Math.floor(capped));
    }
    if (appliedPromo.type === "flat") {
      return Math.max(0, Math.floor(appliedPromo.value));
    }
    return 0;
  }, [appliedPromo, subtotal]);

  // Points discount (1 point = 1 VND)
  const pointsDiscount = useMemo(() => {
    if (!usePoints || userPoints <= 0) return 0;
    const remaining = Math.max(0, subtotal - discountAmount);
    return Math.min(userPoints, remaining);
  }, [usePoints, userPoints, subtotal, discountAmount]);

  const totalPrice = Math.max(0, subtotal - discountAmount - pointsDiscount);

  // Handle delivery option change
  const handleDeliveryOptionChange = (option) => {
    setBookingData((prev) => ({
      ...prev,
      deliveryOption: option,
      pickupAddress: option === "pickup" ? "" : prev.pickupAddress,
      returnAddress: option === "pickup" ? "" : prev.returnAddress,
      useCurrentLocation: false,
      deliveryCoords: null,
    }));
    setDeliveryFee(0);
    if (option === "delivery") {
      setShowAddressModal(true);
    }
  };

  // Handle address confirmation
  const handleAddressConfirm = (address, coords, distance) => {
    setDeliveryDistanceKm(distance);

    // Tính phí giao xe (luôn tính 2 chiều)
    const fee = Math.round(distance * 20000 * 2);

    setBookingData((prev) => ({
      ...prev,
      pickupAddress: address,
      returnAddress: address, // Mặc định returnAddress giống pickupAddress
      deliveryCoords: coords,
    }));
    setDeliveryFee(fee);
    setShowAddressModal(false);
  };

  // Handle address cancellation
  const handleAddressCancel = () => {
    setShowAddressModal(false);
    setBookingData((prev) => ({
      ...prev,
      deliveryOption: "pickup",
      pickupAddress: "",
      returnAddress: "",
      deliveryCoords: null,
    }));
    setDeliveryFee(0);
  };

  // Handle date and time change
  const handleDateTimeChange = (data) => {
    if (data) {
      setBookingData((prev) => ({
        ...prev,
        startDate: data.startDate || "",
        endDate: data.endDate || "",
        startTime: data.pickupTime || "09:00",
        endTime: data.returnTime || "18:00",
      }));
    }
    setShowDateTimeSelector(false);
  };

  // Handle promo code confirmation
  const handlePromoConfirm = (promo) => {
    setAppliedPromo(promo);
    setShowPromoModal(false);
  };

  // Open promo modal
  const openPromoModal = () => {
    setShowPromoModal(true);
  };

  // Handle booking submission
  const handleBooking = async () => {
    if (isLoading) return;
    if (!bookingData.startDate || !bookingData.endDate) {
      toast.error("Vui lòng chọn thời gian thuê xe.");
      return;
    }
    if (!agreedTerms) {
      toast.error("Vui lòng tích chọn 'Tôi đồng ý với các điều khoản thuê xe' trước khi đặt.");
      return;
    }
    if (
      bookingData.deliveryOption === "delivery" &&
      !bookingData.pickupAddress
    ) {
      toast.error("Vui lòng chọn địa chỉ giao nhận xe.");
      return;
    }

    setIsLoading(true);
    const payload = {
      vehicle_id: vehicle?.vehicle_id,
      startDate: bookingData.startDate,
      endDate: bookingData.endDate,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      deliveryOption: bookingData.deliveryOption,
      pickupAddress: bookingData.pickupAddress,
      returnAddress: bookingData.returnAddress,
      deliveryCoords: bookingData.deliveryCoords,
      voucherCode: appliedPromo?.code || null,
      usePoints,
      pointsToUse: usePoints ? pointsDiscount : 0,
      // thêm deliveryFee FE đã tính khi chọn giao xe
      deliveryFee: bookingData.deliveryOption === "delivery" ? deliveryFee : 0,
    };

    try {
      // sửa endpoint đúng theo router BE
      const response = await axiosInstance.post(
        "/api/renter/booking/createBooking",
        payload
      );
      console.log("Booking payload:", payload);
      console.log("Booking response:", response.data);

      // Điều hướng theo yêu cầu xác nhận của chủ xe
      const bookingId = response.data.data?.booking_id;
      if (bookingId) {
        const requiresOwnerConfirm = Boolean(vehicle?.require_owner_confirmation);
        if (requiresOwnerConfirm) {
          // Nếu xe yêu cầu xác nhận chủ xe, chuyển sang trang chờ duyệt
          navigate(`/booking-waiting/${bookingId}`);
        } else {
          // Không yêu cầu, chuyển thẳng tới trang đặt cọc
          navigate(`/payment-deposit/${bookingId}`);
        }
      } else {
        toast.success("Đặt xe thành công!");
      }
    } catch (err) {
      console.error("Lỗi khi đặt xe:", err);
      const message =
        err?.response?.data?.message || "Đã có lỗi xảy ra, vui lòng thử lại.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Early return if no vehicle
  if (!vehicle) {
    return (
      <div className="text-center text-red-600">
        Không tìm thấy thông tin xe.
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      <style>
        {`
          .toggle-switch {
            transition: background-color 0.3s ease-in-out;
          }
          .toggle-switch-knob {
            transition: transform 0.3s ease-in-out, background-color 0.3s ease-in-out;
          }
          .toggle-switch-knob::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 8px;
            height: 8px;
            background-color: #fff;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
          }
          .peer-checked .toggle-switch-knob::after {
            opacity: 1;
          }
          .peer-checked .toggle-switch-knob {
            background-color: #fff;
          }
        `}
      </style>
      <div className="p-6 bg-blue-50 border-b border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Đặt xe</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">
              {basePrice.toLocaleString("vi-VN")}
            </span>
            <span className="text-gray-600 text-sm">/ngày</span>
          </div>
        </div>

        {/* Date and Time */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">
            Thời gian thuê
          </h4>
          <button
            type="button"
            onClick={() => {
              if (!userId) {
                setLoginOpen(true);
                return;
              } else {
                setShowDateTimeSelector(true)
              }
            }
            }
            className="w-full p-4 border-2 border-gray-200 rounded-lg text-left bg-white hover:border-blue-500 hover:shadow-md transition-all duration-200"
            aria-label="Chọn thời gian thuê xe"
          >
            {formatDateTime()}
          </button>
        </div>

        {/* Location */}
        <div className="mb-4">
          <h4 className="text-base font-semibold text-gray-800 mb-2">
            Địa điểm giao nhận xe
          </h4>
          <div className="flex flex-col gap-3">
            <div
              className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 ${bookingData.deliveryOption === "pickup"
                ? "border-green-500 bg-green-50"
                : "border-gray-200 hover:border-green-300"
                }`}
              onClick={() => handleDeliveryOptionChange("pickup")}
              onKeyDown={(e) =>
                e.key === "Enter" && handleDeliveryOptionChange("pickup")
              }
              role="button"
              tabIndex={0}
              aria-label="Nhận xe tại vị trí xe đậu"
            >
              <h5 className="font-semibold text-gray-800 text-sm">
                Giao xe tại vị trí xe đậu
              </h5>
              {bookingData.deliveryOption === "pickup" && (
                <p className="text-xs text-gray-600 mt-1 truncate" title={vehicle?.location}>
                  {vehicle?.location || "Chưa xác định"}
                </p>
              )}
            </div>
            <div
              className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 ${bookingData.deliveryOption === "delivery"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-300"
                }`}
              onClick={() => {
                if (!userId) {
                  setLoginOpen(true);
                  return;
                }
                toast.success("Chọn địa chỉ giao nhận xe");
                handleDeliveryOptionChange("delivery")
              }}
              onKeyDown={(e) =>
                e.key === "Enter" && handleDeliveryOptionChange("delivery")
              }
              role="button"
              tabIndex={0}
              aria-label="Giao và nhận xe tại địa chỉ"
            >
              <h5 className="font-semibold text-gray-800 text-sm">
                Giao xe tận nơi 
              </h5>
              {bookingData.deliveryOption === "delivery" &&
                bookingData.pickupAddress && (
                  <p className="text-xs text-gray-600 mt-1 truncate" title={bookingData.pickupAddress}>
                    {bookingData.pickupAddress}
                  </p>
                )}
            </div>
          </div>
        </div>

        {/* Total Price */}
        <div className="border-t border-gray-200 pt-3 mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Giá thuê ({totalDays} ngày)</span>
            <span>{(totalDays * basePrice).toLocaleString("vi-VN")} đ</span>
          </div>

          {bookingData.deliveryOption === "delivery" && (
            <div className="space-y-2 mb-2">
              <div className="flex justify-between text-sm">
                <span>Khoảng cách giao xe</span>
                <span>
                  {deliveryDistanceKm
                    ? `${deliveryDistanceKm.toFixed(2)} km`
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Phí giao xe (2 chiều)</span>
                <span>{deliveryFee.toLocaleString("vi-VN")} đ</span>
              </div>
            </div>
          )}

          {/* Promo Code */}
          <div
            className="flex items-center justify-between text-sm py-2 px-3 bg-gray-50 rounded-lg cursor-pointer mb-2 transition-all duration-200 hover:bg-gray-100"
            onClick={openPromoModal}
            onKeyDown={(e) => e.key === "Enter" && openPromoModal()}
            role="button"
            tabIndex={0}
            aria-label="Chọn mã khuyến mãi"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-green-500 text-white text-xs">
                %
              </span>
              <span className="font-medium">Mã khuyến mãi</span>
            </div>
            <span className="text-green-900 text-base">›</span>
          </div>

          {appliedPromo && (
            <div className="space-y-2 mb-2">
              <div className="text-xs text-gray-600 px-3">
                Đã áp dụng:{" "}
                <span className="font-medium">{appliedPromo.code}</span> —{" "}
                {appliedPromo.label}
              </div>
              <div className="flex justify-between text-sm px-3">
                <span>Giảm giá</span>
                <span className="text-green-600">
                  - {discountAmount.toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>
          )}

          {/* Points */}
          <div className="flex items-center justify-between text-sm py-2 px-3 bg-gray-50 rounded-lg mb-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-yellow-500 text-white text-xs">
                ★
              </span>
              <div>
                <div className="font-medium">Điểm của bạn</div>
                <div className="text-xs text-gray-600">
                  {userPoints.toLocaleString("vi-VN")} điểm
                </div>
              </div>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={usePoints}
                onChange={(e) => setUsePoints(e.target.checked)}
                aria-label="Dùng điểm để giảm giá"
              />
              <div className={`w-10 h-6 rounded-full toggle-switch relative transition-colors duration-300 ${usePoints ? "bg-blue-600" : "bg-gray-300"}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow toggle-switch-knob transition-transform duration-300 ${usePoints ? "translate-x-4" : ""}`}></span>
              </div>
            </label>
          </div>

          {/* Points Discount with Slide Animation */}
          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${usePoints && pointsDiscount > 0
              ? "max-h-10 opacity-100 translate-y-0"
              : "max-h-0 opacity-0 translate-y-2"
              }`}
          >
            <div className="flex justify-between text-sm px-3 mb-2">
              <span>Giảm giá bằng điểm</span>
              <span className="text-green-600">
                - {pointsDiscount.toLocaleString("vi-VN")} đ
              </span>
            </div>
          </div>

          <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-3">
            <span>Tổng cộng</span>
            <span className="text-blue-600">
              {totalPrice.toLocaleString("vi-VN")} đ
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white border-t border-gray-200">
        {/* Terms Agreement */}
        <div className="flex items-start gap-3 mb-4">
          <input
            id="agree_terms"
            type="checkbox"
            checked={agreedTerms}
            onChange={(e) => setAgreedTerms(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="agree_terms" className="text-sm text-gray-700">
            Tôi đồng ý với các điều khoản thuê xe
            {/* Optional: link to terms page if available */}
            {/* <a href="/terms" target="_blank" className="text-blue-600 underline ml-1">Xem chi tiết</a> */}
          </label>
        </div>

        <Button
          type="button"
          onClick={handleBooking}
          disabled={!bookingData.startDate || !bookingData.endDate || !agreedTerms || isLoading}
          className={`w-full py-6 text-lg font-bold rounded-xl shadow-xl transition-all duration-300 transform relative overflow-hidden group
            ${isLoading 
              ? "bg-gray-400 cursor-not-allowed opacity-80" 
              : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 text-white"
            }
          `}
          aria-label={isLoading ? "Đang xử lý đặt xe" : "Đặt xe ngay"}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="tracking-wide">Đang xử lý...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center relative z-10">
              <span className="tracking-wide">Đặt xe ngay</span>
            </div>
          )}
        </Button>

        {/* Report Vehicle */}
        <div className="border-t border-gray-200 pt-4 border-b border-black pb-2 mt-4">
          <button
            onClick={() => setShowReportModal(true)}
            disabled={isReported}
            className="w-full flex items-center justify-center gap-2 text-base font-medium text-gray-800 hover:text-black cursor-pointer transition-colors duration-200"
          >
            <span className="text-base">🚩</span>
            {isReported ? "Bạn đã báo cáo xe này" : "Báo cáo xe này"}
          </button>
        </div>
      </div>

      {showDateTimeSelector && (
        <DateTimeSelector
          vehicleId={vehicle?.vehicle_id || ""}
          onDateTimeChange={handleDateTimeChange}
          initialStartDate={bookingData.startDate}
          initialEndDate={bookingData.endDate}
          initialPickupTime={bookingData.startTime}
          initialReturnTime={bookingData.endTime}
        />
      )}

      {showAddressModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
              onClick={handleAddressCancel}
              onKeyDown={(e) => e.key === "Enter" && handleAddressCancel()}
              role="button"
              tabIndex={0}
              aria-label="Đóng modal chọn địa chỉ"
            />
            <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transition-transform duration-300 transform">
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <h3 className="text-xl font-bold">
                  Chọn địa chỉ giao & nhận xe
                </h3>
                <button
                  type="button"
                  onClick={handleAddressCancel}
                  className="text-white hover:text-gray-200 transition"
                  aria-label="Đóng modal"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 max-h-[80vh] overflow-y-auto">
                <AddressSelector
                  vehicle={vehicle}
                  onConfirm={handleAddressConfirm}
                  onCancel={handleAddressCancel}
                />
              </div>
            </div>
          </div>,
          document.body
        )}

      {showPromoModal &&
        typeof document !== "undefined" &&
        createPortal(
          <PromoCodeModal
            onConfirm={handlePromoConfirm}
            onCancel={() => setShowPromoModal(false)}
          />,
          document.body
        )}

      {showReportModal &&
        typeof document !== "undefined" &&
        createPortal(
          <VehicleReportModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            vehicleId={vehicle.vehicle_id}
          />,
          document.body
        )}

      {/* Login and Register Dialogs */}
      <div className='min-h-screen'>

        {/* Login with Phone */}
        <Dialog open={isLoginWithPhoneOpen} onOpenChange={setIsLoginWithPhoneOpen} >
          {/* <DialogTrigger asChild>
          <Button
            className={"p-6 border border-black"}
            variant={"outline"}

          >
            Đăng nhập với số điện thoại
          </Button>
        </DialogTrigger> */}
          <DialogContent>
            <DialogHeader>
              <DialogTitle></DialogTitle>
              <DialogDescription>
                <LoginWithPhoneNumber setIsRegisterWithPhoneOpen={setIsRegisterWithPhoneOpen} setIsLoginWithPhoneOpen={setIsLoginWithPhoneOpen} setLoginOpen={setLoginOpen} />
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        {/* Register with Phone */}
        <Dialog open={isRegisterWithPhoneOpen} onOpenChange={setIsRegisterWithPhoneOpen} >
          {/* <DialogTrigger asChild>
          <Button
            className={"p-6 border border-black"}
            variant={"outline"}

          >
            Đăng ký với số điện thoại
          </Button>
        </DialogTrigger> */}
          <DialogContent>
            <DialogHeader>
              <DialogTitle></DialogTitle>
              <DialogDescription>
                <RegisterWithPhoneNumber setRegisterOpen={setRegisterOpen} setIsRegisterWithPhoneOpen={setIsRegisterWithPhoneOpen} setIsLoginWithPhoneOpen={setIsLoginWithPhoneOpen} />
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        {/* Register with email button: */}
        <Dialog open={registerOpen} onOpenChange={setRegisterOpen} >
          {/* <DialogTrigger>
          <a
            className={"p-6"}
          >
            Đăng Ký
          </a>
        </DialogTrigger> */}
          <DialogContent>
            <DialogHeader>
              <DialogTitle></DialogTitle>
              <DialogDescription>
                <Register setRegisterOpen={setRegisterOpen} setLoginOpen={setLoginOpen} setIsRegisterWithPhoneOpen={setIsRegisterWithPhoneOpen} />
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        {/* Login with email Button */}
        <Dialog open={loginOpen} onOpenChange={setLoginOpen} >
          {/* <DialogTrigger asChild>
          <Button
            className={"p-6 border border-black"}
            variant={"outline"}

          >
            Đăng Nhập
          </Button>
        </DialogTrigger> */}
          <DialogContent>
            <DialogHeader>
              <DialogTitle></DialogTitle>
              <DialogDescription>
                <Login setRegisterOpen={setRegisterOpen} setLoginOpen={setLoginOpen} setIsLoginWithPhoneOpen={setIsLoginWithPhoneOpen} />
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}

BookingForm.propTypes = {
  vehicle: PropTypes.shape({
    vehicle_id: PropTypes.string.isRequired,
    price_per_day: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    location: PropTypes.string,
  }).isRequired,
};

export default BookingForm;
