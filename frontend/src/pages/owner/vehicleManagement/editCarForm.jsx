import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../config/axiosInstance";
import { toast } from "react-toastify";

const EditCarForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [autoLocationEnabled, setAutoLocationEnabled] = useState(false);
  
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    license_plate: "",
    location: "",
    latitude: "",
    longitude: "",
    price_per_day: "",
    seats: "",
    year: "",
    body_type: "",
    transmission: "",
    fuel_type: "",  
    fuel_consumption: "",
    description: ""
  });


  const [mainImage, setMainImage] = useState(null);
  const [extraImages, setExtraImages] = useState([]);
  const [currentMainImage, setCurrentMainImage] = useState("");
  const [currentExtraImages, setCurrentExtraImages] = useState([]);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Load vehicle data
  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        setLoadingVehicle(true);
        const response = await axiosInstance.get(`/api/owner/vehicles/${id}`);
        const vehicle = response.data.vehicle;
        
        console.log("Vehicle data:", vehicle); // Để debug
        console.log("Vehicle body_type:", vehicle.body_type);
        console.log("Vehicle transmission:", vehicle.transmission);
        console.log("Vehicle fuel_type:", vehicle.fuel_type);
        console.log("Vehicle fuel_consumption:", vehicle.fuel_consumption);
        console.log("Form data after setting:", {
          body_type: vehicle.body_type || "",
          transmission: vehicle.transmission || "",
          fuel_type: vehicle.fuel_type || "",
          fuel_consumption: vehicle.fuel_consumption || ""
        });
        
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
          seats: vehicle.seats || "",
          body_type: vehicle.body_type || "",
          transmission: vehicle.transmission || "",
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

  // Load brands
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoadingBrands(true);
        const response = await axiosInstance.get('/api/owner/brands/category/car');
        setBrands(response.data);
      } catch (error) {
        console.error('Error fetching brands:', error);
        toast.error('Không thể tải danh sách hãng xe');
      } finally {
        setLoadingBrands(false);
      }
    };

    fetchBrands();
  }, []);

  // Get current location
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ định vị địa lý');
      return;
    }

    setGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          console.log ("tọa độ xe " ,latitude, longitude);
          
          // Sử dụng Nominatim Search API
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${latitude},${longitude}`)}&countrycodes=vn&accept-language=vi&addressdetails=1&limit=5`
          );
          
          if (!response.ok) {
            throw new Error('Không thể lấy thông tin địa chỉ');
          }
          
          const data = await response.json();
          
          if (data && data.length > 0) {
            const address = data[0].display_name;
            setFormData(prev => ({
              ...prev,
              location: address,
              latitude: latitude,
              longitude: longitude
            }));
            toast.success('Đã tự động điền địa chỉ và tọa độ hiện tại');
          } else {
            toast.warning('Không tìm thấy địa chỉ cho vị trí hiện tại');
          }
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

  // Car features options
  const carFeatures = [
    "Bản đồ", "Bluetooth", "Camera 360", "Camera cập lề", "Camera hành trình",
    "Camera lùi", "Cảm biến lốp", "Cảm biến va chạm", "Cảnh báo tốc độ",
    "Cửa sổ trời", "Định vị GPS", "Ghế trẻ em", "Khe cắm USB", "Lốp dự phòng",
    "Màn hình DVD", "Nắp thùng xe bán tải", "ETC", "Túi khí an toàn",
    "Cửa hít", "Cảnh báo điểm mù"
  ];

  // body type options
  const bodyTypes = [
    { value: "sedan", label: "Sedan" },
    { value: "suv", label: "SUV" },
    { value: "hatchback", label: "Hatchback" },
    { value: "convertible", label: "Convertible" },
    { value: "coupe", label: "Coupe" },
    { value: "minivan", label: "Minivan" },
    { value: "pickup", label: "Pickup" },
    { value: "van", label: "Van" },
    { value: "mpv", label: "MPV" }
  ];

  const fuelTypes = [
    { value: "petrol", label: "Xăng" },
    { value: "diesel", label: "Diesel" },
    { value: "electric", label: "Điện" },
    { value: "hybrid", label: "Hybrid" }
  ];

  const transmissionTypes = [
    { value: "manual", label: "Số sàn" },
    { value: "automatic", label: "Số tự động" }
  ];

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
      submitData.append('vehicle_type', 'car');
      submitData.append('brand', formData.brand);
      submitData.append('model', formData.model);
      submitData.append('license_plate', formData.license_plate);
      submitData.append('location', formData.location);
      if (formData.latitude) submitData.append('latitude', formData.latitude);
      if (formData.longitude) submitData.append('longitude', formData.longitude);
      submitData.append('price_per_day', formData.price_per_day);
      submitData.append('seats', formData.seats);
      submitData.append('year', formData.year);
      submitData.append('transmission', formData.transmission);
      submitData.append('fuel_type', formData.fuel_type);
      submitData.append('fuel_consumption', formData.fuel_consumption);
      submitData.append('description', formData.description);
      submitData.append('body_type', formData.body_type);
      submitData.append('features', JSON.stringify(selectedFeatures));

      // Add images if selected
      if (mainImage) {
        submitData.append('main_image', mainImage);
      }

      extraImages.forEach((image) => {
        submitData.append('extra_images', image);
      });

      const response = await axiosInstance.put(`/api/owner/vehicles/${id}`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success('Cập nhật xe thành công!');
        navigate('/owner/vehicle-management');
      }
    } catch (error) {
      console.error('Error updating vehicle:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Có lỗi xảy ra khi cập nhật xe');
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
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Chỉnh sửa ô tô</h1>
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
                    Tên xe *
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: Camry, Civic, Vios..."
                  />
                </div>

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
                    Năm sản xuất *
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    required
                    min="1990"
                    max={new Date().getFullYear() + 1}
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
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: 30A-12345"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số chỗ ngồi *
                  </label>
                  <input
                    type="number"
                    name="seats"
                    value={formData.seats}
                    onChange={handleInputChange}
                    required
                    min="1"
                    max="50"
                    placeholder="Nhập số chỗ ngồi"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dạng thân xe *
                  </label>
                  <select
                    name="body_type"
                    value={formData.body_type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn dạng thân xe</option>
                    {bodyTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                    
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hộp số *
                  </label>
                  <select
                    name="transmission"
                    value={formData.transmission}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn hộp số</option>
                    {transmissionTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
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
                    {fuelTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
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
                    placeholder="VD: 6.5 L/100km hoặc 15 kWh/100km"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá thuê mỗi ngày (VNĐ) *
                  </label>
                  <input
                    type="number"
                    name="price_per_day"
                    value={formData.price_per_day}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: 500000"
                  />
                </div>
              </div>
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

          {/* Features */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Tính năng</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {carFeatures.map(feature => (
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

          {/* Location */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Vị trí xe</h2> 

            <div className="space-y-4">
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
                   
              {/* Checkbox for auto location */}
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="autoLocation"
                  checked={autoLocationEnabled}
                  onChange={handleAutoLocationChange}
                  disabled={gettingLocation}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoLocation" className="ml-2 text-sm text-gray-700">
                  {gettingLocation ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Đang lấy vị trí...
                    </span>
                  ) : (
                    'Thêm địa chỉ tự động'
                  )}
                </label>
              </div>

            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Mô tả xe</h2>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Mô tả chi tiết về xe của bạn, tình trạng xe, các lưu ý đặc biệt..."
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
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => navigate('/owner/vehicle-management')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg border border-blue-600 hover:bg-blue-700 hover:border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật xe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCarForm;