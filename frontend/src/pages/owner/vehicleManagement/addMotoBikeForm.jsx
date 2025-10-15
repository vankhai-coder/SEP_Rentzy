import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../config/axiosInstance";
import { toast } from "react-toastify";

const AddMotoBikeForm = () => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    license_plate: "",
    location: "",
    latitude: "",
    longitude: "",
    price_per_day: "",
    year: "",
    bike_type: "",
    engine_capacity: "",
    fuel_type: "",
    fuel_consumption: "",
    description: ""
  });

  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [mainImage, setMainImage] = useState(null);
  const [extraImages, setExtraImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoLocationEnabled, setAutoLocationEnabled] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  // State cho danh sách brands
  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);

  // Fetch brands khi component mount
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoadingBrands(true);
        const response = await axiosInstance.get('/api/owner/brands/category/motorbike');
        setBrands(response.data);
      } catch (error) {
        console.error('Error fetching brands:', error);
        toast.error('Không thể tải danh sách thương hiệu');
      } finally {
        setLoadingBrands(false);
      }
    };

    fetchBrands();
  }, []);

  // Motorbike features options
  const motorbikeFeatures = [
     
    "Định vị GPS", "Khe cắm USB", 
    "Đèn LED", "Phanh ABS", "Phanh đĩa", "Giảm xóc",
    "Yên da", "Yên bọc da", "Khung thép", "Khung nhôm", "Bình xăng lớn",
    "Khoá thông minh", "Chống trộm"
  ];

  // Bike type options
  const bikeTypes = [
    { value: "scooter", label: "Xe tay ga" },
    { value: "manual", label: "Xe số" },
    { value: "clutch", label: "Xe côn tay" },
    { value: "electric", label: "Xe điện" }
  ];

  // Auto location function
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ định vị địa lý');
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Gọi Nominatim API để lấy địa chỉ từ tọa độ
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=vi`
          );
          
          if (!response.ok) {
            throw new Error('Không thể lấy thông tin địa chỉ');
          }
          
          const data = await response.json();
          const address = data.display_name || `${latitude}, ${longitude}`;
          
          // Cập nhật địa chỉ và tọa độ vào form
          setFormData(prev => ({
            ...prev,
            location: address,
            latitude: latitude,
            longitude: longitude
          }));
          
          toast.success('Đã lấy địa chỉ và tọa độ hiện tại thành công!');
          
        } catch (error) {
          console.error('Error getting address:', error);
          toast.error('Lỗi khi lấy địa chỉ. Vui lòng thử lại.');
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setGettingLocation(false);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Bạn đã từ chối quyền truy cập vị trí');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Không thể xác định vị trí hiện tại');
            break;
          case error.TIMEOUT:
            toast.error('Hết thời gian chờ khi lấy vị trí');
            break;
          default:
            toast.error('Lỗi không xác định khi lấy vị trí');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleAutoLocationChange = (e) => {
    const isChecked = e.target.checked;
    setAutoLocationEnabled(isChecked);
    
    if (isChecked) {
      getCurrentLocation();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFeatureToggle = (feature) => {
    setSelectedFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const handleMainImageChange = (e) => {
    if (e.target.files[0]) {
      setMainImage(e.target.files[0]);
    }
  };

  const handleExtraImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setExtraImages(prev => [...prev, ...files]);
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      
      // Add form data
      submitData.append('vehicle_type', 'motorbike');
      submitData.append('brand', formData.brand);
      submitData.append('model', formData.model);
      submitData.append('license_plate', formData.license_plate);
      submitData.append('location', formData.location);
      if (formData.latitude) submitData.append('latitude', formData.latitude);
      if (formData.longitude) submitData.append('longitude', formData.longitude);
      submitData.append('price_per_day', formData.price_per_day);
      submitData.append('year', formData.year);
      submitData.append('bike_type', formData.bike_type);
      submitData.append('engine_capacity', formData.engine_capacity);
      submitData.append('fuel_type', formData.fuel_type);
      submitData.append('fuel_consumption', formData.fuel_consumption);
      submitData.append('description', formData.description);
      submitData.append('features', JSON.stringify(selectedFeatures));

      // Add images
      if (mainImage) {
        submitData.append('main_image', mainImage);
      }
      
      extraImages.forEach((image) => {
        submitData.append('extra_images', image);
      });


      const response = await axiosInstance.post('/api/owner/vehicles', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Kiểm tra cả status code và success field
      if (response.status === 201 && response.data.success) {
        toast.success('Đăng xe máy thành công!');
        navigate('/owner/vehicle-management');
      } else {
        // Nếu có response nhưng không thành công
        toast.error(response.data.message || 'Lỗi khi đăng xe máy. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      
      // Xử lý lỗi chi tiết hơn
      if (error.response) {
        // Server trả về response với error status
        const errorMessage = error.response.data?.message || 'Lỗi từ server';
        toast.error(errorMessage);
        console.error('Server error:', error.response.data);
      } else if (error.request) {
        // Request được gửi nhưng không nhận được response
        toast.error('Không thể kết nối đến server. Vui lòng thử lại.');
        console.error('Network error:', error.request);
      } else {
        // Lỗi khác
        toast.error('Lỗi khi đăng xe máy. Vui lòng thử lại.');
        console.error('Error:', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

    return (
        <div className="w-full">
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <p className="text-green-700 font-medium">
          Hãy vui lòng điền các thông tin chính xác của xe máy và giấy tờ xe hợp lệ.
        </p>
      </div>

      <h1 className="text-3xl font-bold text-blue-600 mb-6">🏍️ Đăng xe máy cho thuê</h1>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Vehicle Information */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Thông tin xe máy</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thương hiệu *
                </label>
                {loadingBrands ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                    Đang tải danh sách thương hiệu...
                  </div>
                ) : (
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Chọn thương hiệu --</option>
                    {brands.map((brand) => (
                      <option key={brand.brand_id} value={brand.name}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dòng xe *
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  placeholder="VD: Wave, Exciter, SH..."
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Biển số xe *
                </label>
                <input
                  type="text"
                  name="license_plate"
                  value={formData.license_plate}
                  onChange={handleInputChange}
                  placeholder="VD: 30A-123.45"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa điểm *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="VD: Hà Nội, TP.HCM, Đà Nẵng..."
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                {/* Checkbox for auto location */}
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id="autoLocationMotorbike"
                    checked={autoLocationEnabled}
                    onChange={handleAutoLocationChange}
                    disabled={gettingLocation}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="autoLocationMotorbike" className="ml-2 text-sm text-gray-700">
                    {gettingLocation ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang lấy vị trí...
                      </span>
                    ) : (
                      'Thêm địa chỉ tự động'
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá mỗi ngày (VND) *
                </label>
                <input
                  type="number"
                  name="price_per_day"
                  value={formData.price_per_day}
                  onChange={handleInputChange}
                  placeholder="VD: 100000"
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Năm sản xuất *
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  placeholder="VD: 2023"
                  required
                  min="1900"
                  max="2030"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại xe máy *
                </label>
                <select
                  name="bike_type"
                  value={formData.bike_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Chọn loại xe máy --</option>
                  {bikeTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dung tích động cơ (cc) *
                </label>
                <input
                  type="number"
                  name="engine_capacity"
                  value={formData.engine_capacity}
                  onChange={handleInputChange}
                  placeholder="VD: 110, 150, 250..."
                  required
                  min="50"
                  max="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại nhiên liệu *
                </label>
                <select
                  name="fuel_type"
                  value={formData.fuel_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Chọn loại nhiên liệu --</option>
                  <option value="petrol">Xăng</option>
                  <option value="electric">Điện</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu hao nhiên liệu
                </label>
                <input
                  type="text"
                  name="fuel_consumption"
                  value={formData.fuel_consumption}
                  onChange={handleInputChange}
                  placeholder="VD: 1.5 L/100km hoặc 2 kWh/100km"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                    </div>
                </div>
            </div>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Tính năng</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {motorbikeFeatures.map(feature => (
              <button
                key={feature}
                type="button"
                onClick={() => handleFeatureToggle(feature)}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  selectedFeatures.includes(feature)
                    ? 'bg-green-100 border-green-500 text-green-800'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {feature}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Mô tả</h2>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Mô tả chi tiết về xe máy, tình trạng, lưu ý khi thuê...."
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* File Upload Sections */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Hình ảnh và giấy tờ</h2>
          
          <div className="space-y-6">
            {/* Main Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ảnh chính *
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleMainImageChange}
                required
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {/* Extra Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ảnh phụ
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleExtraImagesChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/owner/vehicle-management')}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Đang xử lý...
              </>
            ) : (
              'Đăng xe máy cho thuê'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMotoBikeForm;