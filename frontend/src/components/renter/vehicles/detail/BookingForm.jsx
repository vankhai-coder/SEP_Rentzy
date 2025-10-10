import React, { useState } from 'react';
import DateTimeSelector from './DateTimeSelector';

const BookingForm = ({ vehicle }) => {
  const [bookingData, setBookingData] = useState({
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '18:00',
    deliveryOption: 'pickup', // 'pickup' hoặc 'delivery'
    pickupAddress: '',
    returnAddress: '',
    useCurrentLocation: false
  });
  
  const [showDateTimeSelector, setShowDateTimeSelector] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
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

  const handleDeliveryOptionChange = (option) => {
    setBookingData(prev => ({
      ...prev,
      deliveryOption: option,
      pickupAddress: option === 'pickup' ? '' : prev.pickupAddress,
      returnAddress: option === 'pickup' ? '' : prev.returnAddress,
      useCurrentLocation: false
    }));
  };

  // Hàm lấy vị trí hiện tại sử dụng Nominatim API (miễn phí)
  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Sử dụng Nominatim Reverse Geocoding API 
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=vi&addressdetails=1`
            );
            const data = await response.json();
            
            if (data && data.display_name) {
              setBookingData(prev => ({
                ...prev,
                pickupAddress: data.display_name
              }));
            }
          } catch (error) {
            console.error('Lỗi khi lấy địa chỉ:', error);
            alert('Không thể lấy địa chỉ hiện tại. Vui lòng nhập thủ công.');
          } finally {
            setIsGettingLocation(false);
          }
        },
        (error) => {
          console.error('Lỗi khi lấy vị trí:', error);
          alert('Không thể truy cập vị trí. Vui lòng cho phép truy cập vị trí hoặc nhập địa chỉ thủ công.');
          setIsGettingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      alert('Trình duyệt không hỗ trợ định vị.');
      setIsGettingLocation(false);
    }
  };

  // Hàm tìm kiếm gợi ý địa chỉ sử dụng Nominatim API (miễn phí)
  const searchAddressSuggestions = async (query) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      // Sử dụng Nominatim Search API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=vn&accept-language=vi&addressdetails=1&limit=5`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        setAddressSuggestions(data.map(item => ({
          id: item.place_id,
          address: item.display_name,
          coordinates: [parseFloat(item.lon), parseFloat(item.lat)]
        })));
        setShowSuggestions(true);
      } else {
        setAddressSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm địa chỉ:', error);
    }
  };

  // Xử lý thay đổi input địa chỉ
  const handleAddressInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Tìm kiếm gợi ý khi nhập địa chỉ
    if (name === 'pickupAddress') {
      searchAddressSuggestions(value);
    }
  };

  // Chọn địa chỉ từ gợi ý
  const selectAddressSuggestion = (suggestion) => {
    setBookingData(prev => ({
      ...prev,
      pickupAddress: suggestion.address
    }));
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  // Xử lý checkbox vị trí hiện tại
  const handleCurrentLocationChange = (e) => {
    const { checked } = e.target;
    setBookingData(prev => ({
      ...prev,
      useCurrentLocation: checked,
      pickupAddress: checked ? '' : prev.pickupAddress
    }));
    
    if (checked) {
      getCurrentLocation();
    }
  };

  // Sửa lại hàm handleDateTimeChange để xử lý đúng dữ liệu từ DateTimeSelector
  const handleDateTimeChange = (dateTimeData) => {
    if (dateTimeData) {
      setBookingData(prev => ({
        ...prev,
        startDate: dateTimeData.startDate || '',
        endDate: dateTimeData.endDate || '',
        startTime: dateTimeData.pickupTime || '09:00',
        endTime: dateTimeData.returnTime || '18:00'
      }));
      
      console.log('Dữ liệu nhận từ DateTimeSelector:', dateTimeData);
    }
    setShowDateTimeSelector(false);
  };

  const handleBooking = () => {
    console.log('Booking data:', bookingData);
    alert('Chức năng đặt xe sẽ được triển khai sau!');
  };
  
  // Cải thiện hàm formatDateTime để hiển thị đẹp hơn
  const formatDateTime = () => {
    if (!bookingData.startDate || !bookingData.endDate) {
      return 'Chọn thời gian thuê xe';
    }
    
    const startDate = new Date(bookingData.startDate).toLocaleDateString('vi-VN');
    const endDate = new Date(bookingData.endDate).toLocaleDateString('vi-VN');
    
    return (
      <div>
        <div>Nhận xe: {bookingData.startTime}, {startDate}</div>
        <div>Trả xe:  {bookingData.endTime}, {endDate}</div>
      </div>
    );
  };

  return (
    <div className="bg-blue-50 p-5 sticky top-5 border border-gray-200 rounded-lg">
      <div className="flex justify-between items-center mb-6 pb-4">
        <h3 className="text-xl font-bold text-gray-800">Đặt xe</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-blue-600">{Number(vehicle.price_per_day).toLocaleString('vi-VN', {maximumFractionDigits: 0})}</span>
          <span className="text-gray-600 text-sm">/ngày</span>
        </div>
      </div>
      
      {/* Date Selection */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Thời gian thuê</h4>
        
        <button
          onClick={() => setShowDateTimeSelector(true)}
          className="w-full p-4 border-2 border-gray-200 rounded-xl text-left transition-all duration-300 bg-white hover:border-blue-500 hover:shadow-lg focus:outline-none focus:border-blue-500 focus:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className={`text-sm font-medium ${
                bookingData.startDate && bookingData.endDate ? 'text-gray-800' : 'text-gray-500'
              }`}>
                {formatDateTime()}
              </span>
              {bookingData.startDate && bookingData.endDate && (
                <span className="text-xs text-gray-500 mt-1">
                  Thời gian thuê: {calculateDays()} ngày
                </span>
              )}
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </button>
      </div>
      
      {/* Address Selection - Cải thiện */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Địa điểm giao nhận xe</h4>
        
        {/* Delivery Options */}
        <div className="mb-6">
          {/* Option 1: Tự lấy xe miễn phí */}
          <div 
            className={`border-2 rounded-xl p-4 mb-3 cursor-pointer transition-all duration-300 ${
              bookingData.deliveryOption === 'pickup' 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 hover:border-green-300'
            }`}
            onClick={() => handleDeliveryOptionChange('pickup')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  bookingData.deliveryOption === 'pickup' 
                    ? 'border-green-500 bg-green-500' 
                    : 'border-gray-300'
                }`}>
                  {bookingData.deliveryOption === 'pickup' && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <h5 className="font-semibold text-gray-800">Khách nhận tại vị trí xe đậu</h5>
                  <div className="flex items-center gap-2 mt-1">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                    </svg>
                    <span className="text-sm text-green-600 font-medium">Miễn phí</span>
                  </div>
                </div>
              </div>
            </div>
            
            {bookingData.deliveryOption === 'pickup' && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-sm text-gray-600">
                  <svg className="w-4 h-4 inline mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                  </svg>
                  {vehicle.location}
                </p>
              </div>
            )}
          </div>
          
          {/* Option 2: Giao xe tận nơi */}
          <div 
            className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 ${
              bookingData.deliveryOption === 'delivery' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => handleDeliveryOptionChange('delivery')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  bookingData.deliveryOption === 'delivery' 
                    ? 'border-blue-500 bg-blue-500' 
                    : 'border-gray-300'
                }`}>
                  {bookingData.deliveryOption === 'delivery' && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <h5 className="font-semibold text-gray-800">Rentzy giao & nhận xe tại</h5>
                </div>
              </div>
            </div>
            
            {bookingData.deliveryOption === 'delivery' && (
              <div className="mt-4 pt-3 border-t border-blue-200">
                {/* Current Location Option */}
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="useCurrentLocation"
                    name="useCurrentLocation"
                    checked={bookingData.useCurrentLocation}
                    onChange={handleCurrentLocationChange}
                    disabled={isGettingLocation}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="useCurrentLocation" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    {isGettingLocation ? (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                      </svg>
                    )}
                    {isGettingLocation ? 'Đang lấy vị trí...' : 'Địa điểm hiện tại'}
                  </label>
                </div>
                
                {/* Address Input with Suggestions */}
                <div className="relative">
                  <label className="text-sm font-semibold text-gray-600 mb-2 block">Địa chỉ giao xe</label>
                  <input
                    type="text"
                    name="pickupAddress"
                    value={bookingData.pickupAddress}
                    onChange={handleAddressInputChange}
                    onFocus={() => {
                      if (addressSuggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    placeholder="Nhập địa chỉ giao xe"
                    disabled={bookingData.useCurrentLocation || isGettingLocation}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg text-sm transition-all duration-300 focus:outline-none focus:border-blue-500 focus:shadow-lg disabled:bg-gray-100 disabled:text-gray-500"
                  />
                  
                  {/* Address Suggestions Dropdown */}
                  {showSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {addressSuggestions.map((suggestion) => (
                        <div
                          key={suggestion.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => selectAddressSuggestion(suggestion)}
                        >
                          <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                            </svg>
                            <span className="text-sm text-gray-700">{suggestion.address}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
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
      
      {/* DateTime Selector Modal */}
      {showDateTimeSelector && (
        <DateTimeSelector
          bookedDates={[]} // Thay thế bằng dữ liệu thực tế từ props hoặc API
          onDateTimeChange={handleDateTimeChange}
          initialStartDate={bookingData.startDate}
          initialEndDate={bookingData.endDate}
          initialPickupTime={bookingData.startTime}
          initialReturnTime={bookingData.endTime}
        />
      )}
    </div>
  );
};

export default BookingForm;