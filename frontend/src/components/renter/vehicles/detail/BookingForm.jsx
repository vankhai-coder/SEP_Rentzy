import React, { useState } from 'react';

const BookingForm = ({ vehicle }) => {
  const [bookingData, setBookingData] = useState({
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '18:00',
    pickupAddress: '',
    returnAddress: '',
    useCurrentLocation: false
  });
  
  if (!vehicle) return null;
  
  const calculateDays = () => {
    if (!bookingData.startDate || !bookingData.endDate) return 0;
    const start = new Date(bookingData.startDate);
    const end = new Date(bookingData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };
  
  const totalDays = calculateDays();
  const totalPrice = totalDays * parseFloat(vehicle.price_per_day || 0);
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleBooking = () => {
    // TODO: Implement booking logic
    console.log('Booking data:', bookingData);
    alert('Chức năng đặt xe sẽ được triển khai sau!');
  };
  
  return (
    <div className="bg-white p-8 sticky top-5">
      <div className="flex justify-between items-center mb-6 pb-4">
        <h3 className="text-xl font-bold text-gray-800">Đặt xe</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-blue-600">{vehicle.price_per_day}</span>
          <span className="text-gray-600 text-sm">/ngày</span>
        </div>
      </div>
      
      {/* Date Selection */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Thời gian thuê</h4>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-600">Ngày bắt đầu</label>
            <input
              type="date"
              name="startDate"
              value={bookingData.startDate}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              className="p-4 text-sm bg-white focus:outline-none"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-600">Ngày kết thúc</label>
            <input
              type="date"
              name="endDate"
              value={bookingData.endDate}
              onChange={handleInputChange}
              min={bookingData.startDate || new Date().toISOString().split('T')[0]}
              className="p-4 text-sm bg-white focus:outline-none"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-600">Giờ nhận xe</label>
            <input
              type="time"
              name="startTime"
              value={bookingData.startTime}
              onChange={handleInputChange}
              className="p-4 text-sm bg-white focus:outline-none"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-600">Giờ trả xe</label>
            <input
              type="time"
              name="endTime"
              value={bookingData.endTime}
              onChange={handleInputChange}
              className="p-4 text-sm bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>
      
      {/* Address Selection */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Địa điểm</h4>
        
        <div className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            id="useCurrentLocation"
            name="useCurrentLocation"
            checked={bookingData.useCurrentLocation}
            onChange={handleInputChange}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
          <label htmlFor="useCurrentLocation" className="text-sm font-medium text-gray-700">Sử dụng vị trí hiện tại</label>
        </div>
        
        <div className="flex flex-col gap-2 mb-4">
          <label className="text-sm font-semibold text-gray-600">Địa chỉ nhận xe</label>
          <input
            type="text"
            name="pickupAddress"
            value={bookingData.pickupAddress}
            onChange={handleInputChange}
            placeholder="Nhập địa chỉ nhận xe"
            disabled={bookingData.useCurrentLocation}
            className="p-4 border-2 border-gray-200/60 rounded-xl text-sm transition-all duration-300 bg-white/80 backdrop-blur-sm focus:outline-none focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/15 focus:bg-white/95 focus:-translate-y-0.5 disabled:bg-gray-100 disabled:text-gray-500"
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-600">Địa chỉ trả xe</label>
          <input
            type="text"
            name="returnAddress"
            value={bookingData.returnAddress}
            onChange={handleInputChange}
            placeholder="Nhập địa chỉ trả xe"
            disabled={bookingData.useCurrentLocation}
            className="p-4 border-2 border-gray-200/60 rounded-xl text-sm transition-all duration-300 bg-white/80 backdrop-blur-sm focus:outline-none focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/15 focus:bg-white/95 focus:-translate-y-0.5 disabled:bg-gray-100 disabled:text-gray-500"
          />
        </div>
      </div>
      
      {/* Price Summary */}
      <div className="border-t border-gray-200 pt-6 mb-6">
        <div className="flex justify-between mb-3 text-sm">
          <span className="text-gray-600">Giá thuê ({totalDays} ngày)</span>
          <span className="font-medium text-gray-800">${(totalDays * parseFloat(vehicle.price_per_day || 0)).toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between mb-3 text-sm">
          <span className="text-gray-600">Phí dịch vụ</span>
          <span className="font-medium text-gray-800">$5.00</span>
        </div>
        
        <div className="flex justify-between font-bold text-lg text-gray-800 border-t border-gray-200 pt-3 mt-4">
          <span>Tổng cộng</span>
          <span className="text-blue-600">${(totalPrice + 5).toFixed(2)}</span>
        </div>
      </div>
      
      {/* Booking Button */}
      <button 
        className="w-full p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl text-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:-translate-y-1 hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none mb-3"
        onClick={handleBooking}
        disabled={!bookingData.startDate || !bookingData.endDate}
      >
        Đặt xe ngay
      </button>
      
      <button className="w-full p-4 bg-transparent text-blue-600 font-semibold border-2 border-blue-600 rounded-xl transition-all duration-300 hover:bg-blue-600 hover:text-white hover:-translate-y-1 hover:shadow-lg">
        Liên hệ chủ xe
      </button>
    </div>
  );
};

export default BookingForm;