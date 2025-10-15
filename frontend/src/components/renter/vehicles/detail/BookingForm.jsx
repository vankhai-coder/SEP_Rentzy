import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import axiosInstance from "../../../../config/axiosInstance"; // Giả sử bạn có file cấu hình axios
import DateTimeSelector from "./DateTimeSelector";
import AddressSelector from "./AddressSelector";
import PromoCodeModal from "./PromoCodeModal";

function BookingForm({ vehicle }) {
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
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryDistanceKm, setDeliveryDistanceKm] = useState(0);
  const [userPoints, setUserPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(false);

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
    if (!bookingData.startDate || !bookingData.endDate) return 0;
    const start = new Date(bookingData.startDate);
    const end = new Date(bookingData.endDate);
    if (isNaN(start) || isNaN(end)) return 0;
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
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
    const fee = Math.round(distance * 20000 * 2); // 20k/km, round trip
    setBookingData((prev) => ({
      ...prev,
      pickupAddress: address,
      returnAddress: address,
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
    if (!bookingData.startDate || !bookingData.endDate) {
      alert("Vui lòng chọn thời gian thuê xe.");
      return;
    }
    if (
      bookingData.deliveryOption === "delivery" &&
      !bookingData.pickupAddress
    ) {
      alert("Vui lòng chọn địa chỉ giao nhận xe.");
      return;
    }

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
    };

    try {
      await axiosInstance.post("/api/bookings", payload);
      alert("Đặt xe thành công!");
      console.log("Booking payload:", payload);
    } catch (err) {
      console.error("Lỗi khi đặt xe:", err);
      alert("Đã có lỗi xảy ra, vui lòng thử lại.");
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
            onClick={() => setShowDateTimeSelector(true)}
            className="w-full p-4 border-2 border-gray-200 rounded-lg text-left bg-white hover:border-blue-500 hover:shadow-md transition-all duration-200"
            aria-label="Chọn thời gian thuê xe"
          >
            {formatDateTime()}
          </button>
        </div>

        {/* Location */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">
            Địa điểm giao nhận xe
          </h4>
          <div className="space-y-3">
            <div
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                bookingData.deliveryOption === "pickup"
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
              <h5 className="font-semibold text-gray-800">
                Nhận tại vị trí xe đậu
              </h5>
              {bookingData.deliveryOption === "pickup" && (
                <p className="text-sm text-gray-600 mt-2">
                  {vehicle?.location || "Vị trí không xác định"}
                </p>
              )}
            </div>
            <div
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                bookingData.deliveryOption === "delivery"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300"
              }`}
              onClick={() => handleDeliveryOptionChange("delivery")}
              onKeyDown={(e) =>
                e.key === "Enter" && handleDeliveryOptionChange("delivery")
              }
              role="button"
              tabIndex={0}
              aria-label="Giao và nhận xe tại địa chỉ"
            >
              <h5 className="font-semibold text-gray-800">
                Giao & nhận xe tại
              </h5>
              {bookingData.deliveryOption === "delivery" &&
                bookingData.pickupAddress && (
                  <p className="text-sm text-gray-600 mt-2">
                    {bookingData.pickupAddress}
                  </p>
                )}
            </div>
          </div>
        </div>

        {/* Total Price */}
        <div className="border-t border-gray-200 pt-4 mb-6">
          <div className="flex justify-between text-sm mb-3">
            <span>Giá thuê ({totalDays} ngày)</span>
            <span>{(totalDays * basePrice).toLocaleString("vi-VN")} đ</span>
          </div>

          {bookingData.deliveryOption === "delivery" && (
            <div className="space-y-3 mb-3">
              <div className="flex justify-between text-sm">
                <span>Khoảng cách giao xe</span>
                <span>
                  {deliveryDistanceKm
                    ? `${deliveryDistanceKm.toFixed(2)} km`
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Phí giao xe (20.000 đ/km * 2 chiều)</span>
                <span>{deliveryFee.toLocaleString("vi-VN")} đ</span>
              </div>
            </div>
          )}

          {/* Promo Code */}
          <div
            className="flex items-center justify-between text-sm py-3 px-4 bg-gray-50 rounded-lg cursor-pointer mb-3 transition-all duration-200 hover:bg-gray-100"
            onClick={openPromoModal}
            onKeyDown={(e) => e.key === "Enter" && openPromoModal()}
            role="button"
            tabIndex={0}
            aria-label="Chọn mã khuyến mãi"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-500 text-white text-xs">
                %
              </span>
              <span className="font-medium">Mã khuyến mãi</span>
            </div>
            <span className="text-green-900 text-lg">›</span>
          </div>

          {appliedPromo && (
            <div className="space-y-3 mb-3">
              <div className="text-xs text-gray-600 px-4">
                Đã áp dụng:{" "}
                <span className="font-medium">{appliedPromo.code}</span> —{" "}
                {appliedPromo.label}
              </div>
              <div className="flex justify-between text-sm px-4">
                <span>Giảm giá</span>
                <span className="text-green-600">
                  - {discountAmount.toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>
          )}

          {/* Points */}
          <div className="flex items-center justify-between text-sm py-3 px-4 bg-gray-50 rounded-lg mb-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-yellow-500 text-white text-xs">
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
              <div className="w-12 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 toggle-switch relative">
                <span className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow toggle-switch-knob peer-checked:translate-x-5"></span>
              </div>
            </label>
          </div>

          {/* Points Discount with Slide Animation */}
          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
              usePoints && pointsDiscount > 0
                ? "max-h-12 opacity-100 translate-y-0"
                : "max-h-0 opacity-0 translate-y-2"
            }`}
          >
            <div className="flex justify-between text-sm px-4 mb-3">
              <span>Giảm giá bằng điểm</span>
              <span className="text-green-600">
                - {pointsDiscount.toLocaleString("vi-VN")} đ
              </span>
            </div>
          </div>

          <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-4">
            <span>Tổng cộng</span>
            <span className="text-blue-600">
              {totalPrice.toLocaleString("vi-VN")} đ
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white border-t border-gray-200">
        <button
          type="button"
          onClick={handleBooking}
          disabled={!bookingData.startDate || !bookingData.endDate}
          className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Đặt xe ngay"
        >
          Đặt xe ngay
        </button>
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
