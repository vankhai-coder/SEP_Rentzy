import { useState, useEffect } from "react";
import { X, Search as SearchIcon, MapPin } from "lucide-react";
import { toast } from "react-toastify";

const quickCities = [
  { id: 1, name: "Hà Nội" },
  { id: 2, name: "Đà Nẵng" },
  { id: 3, name: "Huế" },
  { id: 4, name: "Hồ Chí Minh" },
];

const LocationModal = ({
  onClose,
  onLocationSelect,
  initialLocation = "Hồ Chí Minh",
}) => {
  const [searchQuery, setSearchQuery] = useState(initialLocation);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    setSelectedLocation(initialLocation);
    setSearchQuery(initialLocation);
  }, [initialLocation]);

  const normalizeSearchText = (text) =>
    text
      ?.toLowerCase()
      .replace(/tp\.?|thành phố|tỉnh|city|province|vn|vietnam/gi, "")
      .trim();

  const handleManualSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Vui lòng nhập địa điểm!");
      return;
    }

    setIsLoadingLocation(true);

    try {
      const query = normalizeSearchText(searchQuery);
      let queryWithCountry = query.includes("việt nam")
        ? query
        : `${query}, Việt Nam`;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          queryWithCountry
        )}&format=json&addressdetails=1&accept-language=vi&limit=1`
      );
      const data = await response.json();

      if (data.length === 0) {
        toast.error("Không tìm thấy địa điểm");
        setIsLoadingLocation(false);
        return;
      }

      const location = data[0];
      const addr = location.address || {};
      const displayName = location.display_name || "";

      const ward =
        addr.suburb || addr.village || addr.town || addr.quarter || "";
      let city =
        addr.state || addr.province || addr.city || addr.municipality || "";

      if (!city.trim()) {
        const parts = displayName.split(", ");
        if (parts.length >= 2) {
          city = parts.slice(-2).join(", ");
        }
      }

      let result = [ward, city].filter(Boolean).join(", ");
      if (!result.trim())
        result = displayName.split(", ").slice(0, 2).join(", ");

      setSelectedLocation(result);
      setSearchQuery(result);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tìm địa điểm");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleCityClick = (city) => {
    const name = city.name;
    setSearchQuery(name);
    setSelectedLocation(name);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedLocation(value);
  };

  // ✅ Xử lý khi nhấn Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Nếu đang nhập địa điểm thì tìm kiếm, nếu đã có địa điểm thì lưu luôn
      if (selectedLocation.trim()) {
        handleSaveLocation();
      } else {
        handleManualSearch();
      }
    }
  };

  const handleSaveLocation = () => {
    if (!selectedLocation.trim()) {
      toast.error("Vui lòng chọn địa điểm");
      return;
    }
    onLocationSelect(selectedLocation.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl 
                   animate-in fade-in slide-in-from-top-4 duration-300 
                   sm:animate-none motion-reduce:animate-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            Chọn địa điểm
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Đóng modal"
          >
            <X size={20} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 sm:p-5 border-b border-gray-200">
          <div className="relative">
            <SearchIcon
              size={18}
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Nhập địa điểm ( vd: Đà Nẵng)"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3.5 sm:py-4 text-sm sm:text-base border border-gray-300 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button
              onClick={handleManualSearch}
              disabled={isLoadingLocation}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-lg hover:bg-blue-50 
                         disabled:opacity-50 transition-colors"
              aria-label="Tìm kiếm"
            >
              <SearchIcon
                size={18}
                className={isLoadingLocation ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {/* Quick Cities */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-48 sm:max-h-60">
          <h4 className="text-xs sm:text-sm font-medium text-gray-600 mb-3 sm:mb-4">
            Địa điểm phổ biến
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {quickCities.map((city) => {
              const isActive = selectedLocation
                .toLowerCase()
                .includes(city.name.toLowerCase().replace("tp.", "").trim());

              return (
                <button
                  key={city.id}
                  onClick={() => handleCityClick(city)}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 py-3 sm:py-4 px-3 sm:px-4 rounded-xl border text-xs sm:text-sm font-medium transition-all min-h-[44px]
                    ${
                      isActive
                        ? "bg-blue-50 border-blue-400 text-blue-700 shadow-sm"
                        : "border-gray-200 hover:bg-gray-50 text-gray-700"
                    }`}
                >
                  <MapPin size={16} className="sm:w-4.5 sm:h-4.5" />
                  {city.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-200">
          <button
            onClick={handleSaveLocation}
            disabled={isLoadingLocation || !selectedLocation.trim()}
            className="w-full py-3.5 sm:py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 
                       text-white font-medium rounded-xl transition-colors shadow-md text-sm sm:text-base min-h-[44px]"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
