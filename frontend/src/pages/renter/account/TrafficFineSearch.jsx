import React, { useState, useEffect } from 'react';
import { MdReceipt, MdSearch, MdWarning, MdInfo, MdLocationOn, MdBuild, MdAccessTime, MdRefresh } from 'react-icons/md';
import axiosInstance from '../../../config/axiosInstance.js';

const TrafficFineSearch = () => {
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleType, setVehicleType] = useState('1'); // 1 = Ô tô, 2 = Xe máy
  const [captcha, setCaptcha] = useState('');
  const [captchaImage, setCaptchaImage] = useState(null);
  const [captchaSessionId, setCaptchaSessionId] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);
  const [error, setError] = useState(null);

  // Lấy captcha khi component mount hoặc khi user click refresh
  const fetchCaptcha = async () => {
    setLoadingCaptcha(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/api/traffic-fine-search/captcha`);
      if (response.data?.success && response.data?.image) {
        setCaptchaImage(response.data.image);
        setCaptchaSessionId(response.data.captchaSessionId || null);
      } else {
        throw new Error('Invalid captcha response');
      }
      setCaptcha(''); // Clear captcha input khi refresh
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          (err.response?.data?.errorCode === 'SSL_CONNECTION_ERROR' 
                            ? 'Server tra cứu phạt nguội (csgt.vn) đang gặp sự cố về kết nối bảo mật. Vui lòng thử lại sau.'
                            : 'Không thể tải mã bảo mật. Vui lòng thử lại.');
      setError(errorMessage);
      console.error('Error fetching captcha:', err);
    } finally {
      setLoadingCaptcha(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
    
    // Cleanup URL object khi component unmount
    return () => {
      if (captchaImage) {
        URL.revokeObjectURL(captchaImage);
      }
    };
  }, []);

  const handleRefreshCaptcha = () => {
    fetchCaptcha();
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!licensePlate.trim()) {
      setError('Vui lòng nhập biển số xe');
      return;
    }

    if (!captcha.trim()) {
      setError('Vui lòng nhập mã bảo mật');
      return;
    }

    setLoading(true);
    setError(null);
    setSearchResults(null);

    try {
      const response = await axiosInstance.post(`/api/traffic-fine-search`, {
        licensePlate: licensePlate.trim(),
        captcha: captcha.trim(),
        vehicleType: vehicleType,
        captchaSessionId: captchaSessionId,
      });

      if (response.data.success) {
        setSearchResults(response.data.data);
        // Refresh captcha sau khi search thành công
        handleRefreshCaptcha();
      } else {
        setError(response.data.message || 'Không thể tra cứu phạt nguội. Vui lòng thử lại sau.');
        // Refresh captcha nếu có lỗi
        handleRefreshCaptcha();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tra cứu phạt nguội. Vui lòng thử lại sau.';
      setError(errorMessage);
      console.error('Error searching fines:', err);
      // Refresh captcha khi có lỗi
      handleRefreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 bg-gray-50 min-h-screen overflow-x-hidden max-w-full">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Tra Cứu Phạt Nguội</h1>
        <p className="text-sm sm:text-base text-gray-600">Tra cứu các vi phạm giao thông (phạt nguội) theo biển số xe</p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 mb-6 w-full max-w-full overflow-hidden">
        <form onSubmit={handleSearch} className="w-full max-w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 w-full max-w-full">
            {/* Biển kiểm soát */}
            <div className="w-full min-w-0">
              <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700 mb-2">
                Biển kiểm soát
              </label>
              <input
                type="text"
                id="licensePlate"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                placeholder="VD: 30A12345"
                className="w-full min-w-0 px-2.5 sm:px-3 md:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={15}
              />
            </div>

            {/* Loại phương tiện */}
            <div className="w-full min-w-0">
              <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700 mb-2">
                Loại phương tiện
              </label>
              <select
                id="vehicleType"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full min-w-0 px-2.5 sm:px-3 md:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1">Ô tô</option>
                <option value="2">Xe máy</option>
              </select>
            </div>

            {/* Mã bảo mật */}
            <div className="w-full sm:col-span-2 lg:col-span-1 min-w-0 max-w-full">
              <label htmlFor="captcha" className="block text-sm font-medium text-gray-700 mb-2">
                Mã bảo mật
              </label>
              <div className="flex gap-2 items-center w-full min-w-0 max-w-full">
                <div className="flex gap-4 sm:gap-5 md:gap-6 items-center flex-shrink-0">
                  {loadingCaptcha ? (
                    <div className="h-8 sm:h-9 md:h-10 w-14 sm:w-16 md:w-20 lg:w-22 border border-gray-300 rounded flex items-center justify-center flex-shrink-0">
                      <div className="animate-spin rounded-full h-3 sm:h-3.5 md:h-4 w-3 sm:w-3.5 md:w-4 border-b-2 border-blue-500"></div>
                    </div>
                  ) : captchaImage ? (
                    <div className="flex-shrink-0">
                      <img 
                        src={captchaImage} 
                        alt="Captcha" 
                        className="h-8 sm:h-9 md:h-10 w-auto max-w-[70px] sm:max-w-[85px] md:max-w-[100px] lg:max-w-[110px] border border-gray-300 rounded object-contain"
                      />
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleRefreshCaptcha}
                    className="p-1 sm:p-1.5 md:p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors flex-shrink-0"
                    title="Làm mới mã bảo mật"
                    disabled={loadingCaptcha}
                  >
                    <MdRefresh className="text-base sm:text-lg md:text-xl" />
                  </button>
                </div>
                <input
                  type="text"
                  id="captcha"
                  value={captcha}
                  onChange={(e) => setCaptcha(e.target.value)}
                  placeholder="Nhập mã"
                  className="flex-1 min-w-0 w-24 sm:w-28 md:w-32 lg:w-36 px-2 sm:px-2.5 md:px-3 lg:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={10}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || loadingCaptcha}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Đang tìm kiếm...
                </>
              ) : (
                <>
                  <MdSearch className="text-xl" />
                  Tra cứu
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3">
          <MdWarning className="text-red-600 text-xl flex-shrink-0 mt-0.5" />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Search Results */}
      {searchResults && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <MdReceipt className="text-2xl text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">
              Kết quả tra cứu: {searchResults.licensePlate}
            </h2>
          </div>

          {/* Summary Card */}
          <div className="grid grid-cols-1 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm font-medium text-blue-700 mb-1">Tổng số vi phạm</p>
              <p className="text-3xl font-bold text-blue-900">
                {searchResults.totalFines || 0}
              </p>
            </div>
          </div>

          {/* Violations List */}
          {searchResults.violations && searchResults.violations.length > 0 ? (
            <div className="space-y-4">
              {searchResults.violations.map((violation, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div className="flex items-start gap-2">
                      <MdAccessTime className="text-blue-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-500">Thời gian vi phạm</p>
                        <p className="text-sm text-gray-900">{violation.violationTime || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MdLocationOn className="text-red-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-500">Địa điểm vi phạm</p>
                        <p className="text-sm text-gray-900">{violation.violationLocation || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MdBuild className="text-orange-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-500">Hành vi vi phạm</p>
                        <p className="text-sm text-gray-900">{violation.violationBehavior || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Đơn vị phát hiện</p>
                      <p className="text-sm text-gray-900">{violation.detectionUnit || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Trạng thái</p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          violation.status?.includes('đã') || violation.status?.includes('Đã')
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {violation.status || 'Chưa xác định'}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-gray-500">Loại phương tiện</p>
                        <p className="text-sm text-gray-900">{violation.vehicleType || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {violation.resolutionPlaces && violation.resolutionPlaces.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-500 mb-2">Địa điểm giải quyết:</p>
                      <div className="space-y-2">
                        {violation.resolutionPlaces.map((place, placeIndex) => (
                          <div key={placeIndex} className="bg-gray-50 rounded p-2 text-sm">
                            <p className="font-medium text-gray-700">{place.name}</p>
                            {place.address && (
                              <p className="text-gray-600 text-xs mt-1">{place.address}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <MdInfo className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Không tìm thấy vi phạm
              </h3>
              <p className="text-sm text-gray-500">
                Biển số {searchResults.licensePlate} không có vi phạm giao thông nào trong hệ thống.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      {!searchResults && !loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <MdInfo className="text-blue-600 text-xl flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Thông tin tra cứu phạt nguội</p>
            <ul className="list-disc list-inside space-y-1 text-blue-600">
              <li>Nhập đúng định dạng biển số xe (VD: 30A12345)</li>
              <li>Chọn đúng loại phương tiện (Ô tô hoặc Xe máy)</li>
              <li>Nhập mã bảo mật hiển thị trên hình ảnh</li>
              <li>Kết quả tra cứu sẽ hiển thị tất cả các vi phạm giao thông của xe</li>
              <li>Dữ liệu được cập nhật từ hệ thống CSGT</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrafficFineSearch;

