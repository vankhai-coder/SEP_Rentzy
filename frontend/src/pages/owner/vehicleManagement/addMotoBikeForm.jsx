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
    description: "",
    require_owner_confirmation: false
  });

  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [mainImage, setMainImage] = useState(null);
  const [extraImages, setExtraImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoLocationEnabled, setAutoLocationEnabled] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  
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

  const handlePriceChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    const formatted = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setFormData(prev => ({
      ...prev,
      price_per_day: formatted
    }));
  };

  // AI create description for motorbike
  const generateDescription = async () => {
    try {
      setGeneratingDescription(true);
      const payload = {
        brand: formData.brand,
        model: formData.model,
        year: formData.year,
      };

      const response = await axiosInstance.post('/api/ai/generate-motorbike-description', payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      const data = response?.data;
      if (data?.success && data?.description) {
        setFormData({ ...formData, description: data.description });
        toast.success('Đã tạo mô tả tự động');
      } else {
        toast.warning(data?.message || 'Không nhận được mô tả từ AI');
      }
    } catch (error) {
      console.error('generateDescription motorbike error', error);
      const msg = error?.response?.data?.message || error?.message || 'Lỗi khi gọi AI tạo mô tả';
      toast.error(msg);
    } finally {
      setGeneratingDescription(false);
    }
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
      const compressImage = (file, maxWidth = 1600, quality = 0.75) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          const reader = new FileReader();
          reader.onload = (ev) => {
            img.onload = () => {
              const scale = Math.min(1, maxWidth / img.width);
              const canvas = document.createElement("canvas");
              canvas.width = Math.round(img.width * scale);
              canvas.height = Math.round(img.height * scale);
              const ctx = canvas.getContext("2d");
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              canvas.toBlob(
                (blob) => {
                  if (!blob) return reject(new Error("Compress failed"));
                  const name =
                    file.name.replace(/\.[^/.]+$/, "") + ".jpg";
                  resolve(new File([blob], name, { type: "image/jpeg" }));
                },
                "image/jpeg",
                quality
              );
            };
            img.onerror = reject;
            img.src = ev.target.result;
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

      const submitData = new FormData();
      
      
      // Add form data
      submitData.append('vehicle_type', 'motorbike');
      submitData.append('brand', formData.brand);
      submitData.append('model', formData.model);
      submitData.append('license_plate', formData.license_plate);
      submitData.append('location', formData.location);
      if (formData.latitude) submitData.append('latitude', formData.latitude);
      if (formData.longitude) submitData.append('longitude', formData.longitude);
      submitData.append('price_per_day', String(formData.price_per_day).replace(/\./g, ''));
      submitData.append('year', formData.year);
      submitData.append('bike_type', formData.bike_type);
      submitData.append('engine_capacity', formData.engine_capacity);
      submitData.append('fuel_type', formData.fuel_type);
      submitData.append('fuel_consumption', formData.fuel_consumption);
      submitData.append('description', formData.description);
      submitData.append('features', JSON.stringify(selectedFeatures));
      // Owner confirmation requirement
      submitData.append('require_owner_confirmation', formData.require_owner_confirmation ? 'true' : 'false');

      // Add images - required for new vehicle
      if (mainImage) {
        let cMain = mainImage;
        try { cMain = await compressImage(mainImage); } catch { /* empty */ }
        submitData.append('main_image', cMain);
      }
      
      const compressedExtras = await Promise.all(
        extraImages.map(async (image) => {
          try { return await compressImage(image); } catch { return image; }
        })
      );
      compressedExtras.forEach((image) => submitData.append('extra_images', image));

      const response = await axiosInstance.post('/api/owner/vehicles', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status === 201 && response.data.success) {
        toast.success('Thêm xe thành công!');
        navigate('/owner/vehicle-management');
      } else {
        toast.error(response.data.message || 'Lỗi khi thêm xe. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error adding vehicle:', error);
      
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

  return (
    <div className="w-full">
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <p className="text-green-700 font-medium">
          Hãy vui lòng điền các thông tin chính xác của xe và giấy tờ xe hợp lệ.
        </p>
      </div>

      <div className="mb-8">
        <button
            type="button"
            onClick={() => navigate("/owner/vehicle-management")}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
          Quay lại quản lý xe
        </button>
      </div>
      
      <h1 className="text-3xl font-bold text-blue-600 mb-6">
        🏍️ Thêm xe máy mới
      </h1>

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
                    Dòng xe *
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
                    placeholder="VD: 36A-12345"
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
                    type="text"
                    name="price_per_day"
                    value={formData.price_per_day}
                    onChange={handlePriceChange}
                    placeholder="VD: 100000"
                    required
                    inputMode="numeric"
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
                {/* Require Owner Confirmation Toggle */}
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.require_owner_confirmation}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          require_owner_confirmation: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Yêu cầu xác nhận của chủ xe trước khi duyệt đơn
                    </span>
                  </label>
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Mô tả</h2>
              <button
                type="button"
                onClick={generateDescription}
                disabled={generatingDescription}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {generatingDescription ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Đang tạo...
                  </>
                ) : (
                  'Tạo mô tả tự động'
                )}
              </button>
            </div>
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
              {/* Main Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hình ảnh chính *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMainImageChange}
                  required
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {mainImage && (
                  <div className="mt-2">
                    <img
                      src={URL.createObjectURL(mainImage)}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* Extra Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hình ảnh bổ sung (tối thiểu 5 ảnh)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleExtraImagesChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {extraImages.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {extraImages.map((image, index) => (
                      <img
                        key={index}
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/owner/vehicle-management')}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Đang thêm...' : 'Thêm xe máy'}
            </button>
          </div>
        </form>
    </div>
  );
};

export default AddMotoBikeForm;
