import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import DateTimeSelector from './DateTimeSelector';
import AddressSelector from './AddressSelector.jsx';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Icon fix for Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

function BookingForm({ vehicle }) {
  const [bookingData, setBookingData] = useState({
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '18:00',
    deliveryOption: 'pickup',
    pickupAddress: '',
    returnAddress: '',
    useCurrentLocation: false,
    deliveryCoords: null,
  });

  const [showDateTimeSelector, setShowDateTimeSelector] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryDistanceKm, setDeliveryDistanceKm] = useState(0);

  if (!vehicle) return null;

  // ===== TÍNH SỐ NGÀY THUÊ =====
  const calculateDays = () => {
    if (!bookingData.startDate || !bookingData.endDate) return 0;
    const start = new Date(bookingData.startDate);
    const end = new Date(bookingData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };
  const totalDays = calculateDays();
  const basePrice = parseFloat(vehicle.price_per_day || 0);
  const totalPrice = totalDays * basePrice  + deliveryFee;

 
  // ===== XỬ LÝ CHỌN GIAO XE =====
  const handleDeliveryOptionChange = (option) => {
    setBookingData((prev) => ({
      ...prev,
      deliveryOption: option,
      pickupAddress: option === 'pickup' ? '' : prev.pickupAddress,
      returnAddress: option === 'pickup' ? '' : prev.returnAddress,
      useCurrentLocation: false,
      deliveryCoords: null,
    }));
    setDeliveryFee(0);
    
    // Nếu chọn giao xe tận nơi, mở modal AddressSelector
    if (option === 'delivery') {
      setShowAddressModal(true);
    }
  };

  // ===== XỬ LÝ MODAL ADDRESS SELECTOR =====
  const handleAddressConfirm = (address, coords, distance) => {
    // Lưu khoảng cách dạng số thực (double) và tính phí đúng theo km
    setDeliveryDistanceKm(distance);
    const fee = Math.round(distance * 20000 * 2); // 20k/km, 2 chiều

    setBookingData((prev) => ({
      ...prev,
      pickupAddress: address,
      returnAddress: address,
      deliveryCoords: coords,
    }));
    setDeliveryFee(fee);
    setShowAddressModal(false);
  };

  const handleAddressCancel = () => {
    setShowAddressModal(false);
    // Nếu hủy, quay lại chế độ tự lấy xe
    setBookingData((prev) => ({
      ...prev,
      deliveryOption: 'pickup',
      pickupAddress: '',
      returnAddress: '',
      deliveryCoords: null,
    }));
    setDeliveryFee(0);
  };


  const handleDateTimeChange = (data) => {
    if (data) {
      setBookingData((prev) => ({
        ...prev,
        startDate: data.startDate || '',
        endDate: data.endDate || '',
        startTime: data.pickupTime || '09:00',
        endTime: data.returnTime || '18:00',
      }));
    }
    setShowDateTimeSelector(false);
  };

  const handleBooking = () => {
    console.log('Booking data:', bookingData);
    alert('Đặt xe thành công! Dữ liệu đã được log trong console.');
  };

  const formatDateTime = () => {
    if (!bookingData.startDate || !bookingData.endDate)
      return 'Chọn thời gian thuê xe';
    const startDate = new Date(bookingData.startDate).toLocaleDateString('vi-VN');
    const endDate = new Date(bookingData.endDate).toLocaleDateString('vi-VN');
    return (
      <div>
        <div>Nhận xe: {bookingData.startTime}, {startDate}</div>
        <div>Trả xe: {bookingData.endTime}, {endDate}</div>
      </div>
    );
  };

  return (
    <div className="bg-blue-50 p-5 sticky top-5 border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-4">
        <h3 className="text-xl font-bold text-gray-800">Đặt xe</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-blue-600">
            {basePrice.toLocaleString('vi-VN')}
          </span>
          <span className="text-gray-600 text-sm">/ngày</span>
        </div>
      </div>

      {/* Ngày giờ */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Thời gian thuê</h4>
        <button
          onClick={() => setShowDateTimeSelector(true)}
          className="w-full p-4 border-2 border-gray-200 rounded-xl text-left bg-white hover:border-blue-500 hover:shadow-lg transition-all"
        >
          {formatDateTime()}
        </button>
      </div>

      {/* Địa chỉ */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Địa điểm giao nhận xe</h4>

        {/* Tự lấy */}
        <div
          className={`border-2 rounded-xl p-4 mb-3 cursor-pointer ${
            bookingData.deliveryOption === 'pickup'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-green-300'
          }`}
          onClick={() => handleDeliveryOptionChange('pickup')}
        >
          <h5 className="font-semibold text-gray-800">Nhận tại vị trí xe đậu</h5>
          {bookingData.deliveryOption === 'pickup' && (
            <p className="text-sm text-gray-600 mt-2">{vehicle.location}</p>
          )}
        </div>

        {/* Giao tận nơi */}
        <div
          className={`border-2 rounded-xl p-4 cursor-pointer ${
            bookingData.deliveryOption === 'delivery'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
          }`}
          onClick={() => handleDeliveryOptionChange('delivery')}
        >
          <h5 className="font-semibold text-gray-800">Giao & nhận xe tại</h5>

          {bookingData.deliveryOption === 'delivery' && bookingData.pickupAddress && (
            <p className="text-sm text-gray-600 mt-2">{bookingData.pickupAddress}</p>
          )}
        </div>
      </div>

      {/* Tổng tiền */}
      <div className="border-t border-gray-200 pt-4 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span>Giá thuê ({totalDays} ngày)</span>
          <span>{(totalDays * basePrice).toFixed(0)}</span>
        </div>

        {bookingData.deliveryOption === 'delivery' && (
      <div className="space-y-2">
        <div className="flex justify-between text-sm mb-2">
          <span>Khoảng cách giao xe</span>
          <span>{deliveryDistanceKm ? `${deliveryDistanceKm.toFixed(2)} km` : '-'}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span>Phí giao xe (20.000 đ/km * 2 chiều)</span>
          <span>{deliveryFee.toFixed(2)} </span>
        </div>
      </div>
    )}

        <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-3">
          <span>Tổng cộng</span>
          <span className="text-blue-600">{totalPrice.toFixed(0)}</span>
        </div>
      </div>

      <button
        onClick={handleBooking}
        disabled={!bookingData.startDate || !bookingData.endDate}
        className="w-full p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl text-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
      >
        Đặt xe ngay
      </button>

      {showDateTimeSelector && (
        <DateTimeSelector
          vehicleId={vehicle?.vehicle_id}
          onDateTimeChange={handleDateTimeChange}
          initialStartDate={bookingData.startDate}
          initialEndDate={bookingData.endDate}
          initialPickupTime={bookingData.startTime}
          initialReturnTime={bookingData.endTime}
        />
      )}

      {/* Modal Address Selector */}
     {showAddressModal && createPortal(
  <div className="fixed inset-0 z-[9999] flex items-center justify-center">
    {/* Nền mờ có hiệu ứng fade-in */}
    <div
      className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fadeIn"
      onClick={handleAddressCancel}
    ></div>

    {/* Hộp popup chính */}
    <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <h3 className="text-xl font-bold">Chọn địa chỉ giao & nhận xe</h3>
        <button
          onClick={handleAddressCancel}
          className="text-white hover:text-gray-200 transition"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="p-6 max-h-[90vh] overflow-y-auto">
        {/* Example: conditional block must also have one parent */}
        {showAddressModal && (
          <>
            <div className="mb-2">Chọn địa chỉ giao xe</div>
            <AddressSelector
              vehicle={vehicle}
              onConfirm={handleAddressConfirm}
              onCancel={handleAddressCancel}
            />
          </>
        )}
      </div>
    </div>
  </div>,
  document.body
)}

    </div>
  );
};

export default BookingForm;
