import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../config/axiosInstance";
import { toast } from "react-toastify";

const EditMotoBikeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
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
  const [currentMainImage, setCurrentMainImage] = useState("");
  const [currentExtraImages, setCurrentExtraImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [autoLocationEnabled, setAutoLocationEnabled] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  // State cho danh sách brands
  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);

  // Fetch vehicle data
  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        setLoadingVehicle(true);
        const response = await axiosInstance.get(`/api/owner/vehicles/${id}`);
        const vehicle = response.data.vehicle;
        
        // Set form data
        setFormData({
          brand: vehicle.brand?.name || "",
          model: vehicle.model || "",
          license_plate: vehicle.license_plate || "",
          location: vehicle.location || "",
          latitude: vehicle.latitude || "",
          longitude: vehicle.longitude || "",
          price_per_day: vehicle.price_per_day || "",
          year: vehicle.year || "",
          bike_type: vehicle.bike_type || "",
          engine_capacity: vehicle.engine_capacity || "",
          fuel_type: vehicle.fuel_type || "",
          fuel_consumption: vehicle.fuel_consumption || "",
          description: vehicle.description || ""
        });

        // Set features
        setSelectedFeatures(vehicle.features || []);
        
        // Set current images
        setCurrentMainImage(vehicle.main_image_url || "");
        setCurrentExtraImages(vehicle.extra_images || []);
        
      } catch (error) {
        console.error('Error fetching vehicle:', error);
        toast.error('Không thể tải thông tin xe');
        navigate('/owner/vehicle-management');
      } finally {
        setLoadingVehicle(false);
      }
    };

    if (id) {
      fetchVehicleData();
    }
  }, [id, navigate]);

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
    const file = e.target.files[0];
    if (file) {
      setMainImage(file);
    }
  };

  const handleExtraImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setExtraImages(files);
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

      // Add images only if new ones are selected
      if (mainImage) {
        submitData.append('main_image', mainImage);
      }
      
      extraImages.forEach((image) => {
        submitData.append('extra_images', image);
      });

      const response = await axiosInstance.put(`/api/owner/vehicles/${id}`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status === 200 && response.data.success) {
        toast.success('Cập nhật xe thành công!');
        navigate('/owner/vehicle-management');
      } else {
        toast.error(response.data.message || 'Lỗi khi cập nhật xe. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error updating vehicle:', error);
      
      if (error.response) {
        const errorMessage = error.response.data?.message || 'Lỗi từ server';
        toast.error(errorMessage);
      } else if (error.request) {
        toast.error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        toast.error('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingVehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin xe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <button
            onClick={() => navigate('/owner/vehicle-management')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Quay lại
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Chỉnh sửa xe máy</h1>
          <p className="text-gray-600 mt-2">Cập nhật thông tin xe của bạn</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Thông tin cơ bản</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thương hiệu *
                  </label>
                  {loadingBrands ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100">
                      Đang tải...
                    </div>
                  ) : (
                    <select
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Chọn thương hiệu</option>
                      {brands.map(brand => (
                        <option key={brand.brand_id} value={brand.name}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model *
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    placeholder="VD: Wave, Vision, Exciter..."
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
                    placeholder="VD: 30A1-123.45"
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
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={autoLocationEnabled}
                      onChange={handleAutoLocationChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Sử dụng vị trí hiện tại {gettingLocation && "(Đang lấy...)"}
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá thuê/ngày (VNĐ) *
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
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại xe *
                  </label>
                  <select
                    name="bike_type"
                    value={formData.bike_type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn loại xe</option>
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
                    placeholder="VD: 110, 150, 175..."
                    required
                    min="50"
                    max="2000"
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
                    <option value="">Chọn loại nhiên liệu</option>
                    <option value="petrol">Xăng</option>
                    <option value="electric">Điện</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mức tiêu thụ nhiên liệu (L/100km)
                  </label>
                  <input
                    type="text"
                    name="fuel_consumption"
                    value={formData.fuel_consumption}
                    onChange={handleInputChange}
                    placeholder="VD: 2.5"
                    step="0.1"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
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
              placeholder="Mô tả chi tiết về xe, tình trạng, lưu ý khi thuê...."
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Images */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Hình ảnh</h2>
            
            <div className="space-y-6">
              {/* Current Main Image */}
              {currentMainImage && (
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-3">Ảnh chính hiện tại</h3>
                  <img 
                    src={currentMainImage} 
                    alt="Current main" 
                    className="w-48 h-32 object-cover rounded-lg border"
                  />
                </div>
              )}

              {/* Main Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ảnh chính mới (tùy chọn)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMainImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {/* Current Extra Images */}
              {currentExtraImages.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-3">Ảnh phụ hiện tại</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {currentExtraImages.map((img, index) => (
                      <img 
                        key={index}
                        src={img} 
                        alt={`Current extra ${index}`} 
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Extra Images Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ảnh phụ mới (tùy chọn)
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
          <div className="flex gap-4 justify-end">
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
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Đang cập nhật...
                </>
              ) : (
                'Cập nhật xe'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMotoBikeForm;