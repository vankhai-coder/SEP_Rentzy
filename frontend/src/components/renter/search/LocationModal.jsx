import { useState, useEffect } from "react";
import { X, Search as SearchIcon, Target, MapPin } from "lucide-react";
import { toast } from "react-toastify";

const quickCities = [
  { id: 1, name: "Hà Nội" },
  { id: 2, name: "Đà Nẵng" },
  { id: 3, name: "Huế" },
  { id: 4, name: "TP. Hồ Chí Minh" },
];

const LocationModal = ({
  onClose,
  onLocationSelect,
  initialLocation = "TP. Hồ Chí Minh",
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

  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt không hỗ trợ định vị.");
      return;
    }

    setIsLoadingLocation(true);
    toast.info("Đang lấy vị trí hiện tại...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=vi&zoom=10`
          );
          const data = await response.json();
          const addr = data.address || {};
          const displayName = data.display_name || "";

          // FIX: Ưu tiên ward (phường) + city/province (thành phố/tỉnh)
          const ward =
            addr.suburb || addr.village || addr.town || addr.quarter || "";
          let city =
            addr.state || addr.province || addr.city || addr.municipality || "";

          // FIX: Nếu city rỗng, extract từ display_name (lấy phần cuối: district + city)
          if (!city.trim()) {
            const nameParts = displayName.split(", ");
            if (nameParts.length >= 2) {
              city = nameParts.slice(-1)[0]; // Lấy phần cuối (thành phố, e.g., "Đà Nẵng")
              if (nameParts.length >= 3) {
                city = `${nameParts[nameParts.length - 2]}, ${city}`; // Nếu có district: "Hải Châu, Đà Nẵng"
              }
            }
          }

          // FIX: Build result: Ward + City (bỏ road nếu không cần, tập trung ward + city như yêu cầu)
          let result = [ward, city].filter(Boolean).join(", ");
          if (!result.trim()) result = displayName; // Fallback full nếu rỗng

          // FIX: Backup forward search nếu vẫn miss city
          if (!city.trim()) {
            const forwardResponse = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${latitude},${longitude}&addressdetails=1&accept-language=vi&limit=1&zoom=10`
            );
            const forwardData = await forwardResponse.json();
            if (forwardData.length > 0) {
              const forwardAddr = forwardData[0].address || {};
              city =
                forwardAddr.state ||
                forwardAddr.city ||
                forwardAddr.municipality ||
                "";
              result = [ward, city].filter(Boolean).join(", ");
            }
          }

          setSearchQuery(result);
          setSelectedLocation(result);
          toast.success("Đã lấy vị trí thành công!");
        } catch (error) {
          console.error("Reverse geocode error:", error);
          toast.warn("Không thể lấy vị trí chi tiết, đã dùng tọa độ.");
          setSelectedLocation(
            `(${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
          );
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        toast.error("Không thể lấy vị trí: " + error.message);
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleManualSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Vui lòng nhập địa điểm!");
      return;
    }

    setIsLoadingLocation(true);
    toast.info("Đang tìm địa điểm...");

    try {
      const query = normalizeSearchText(searchQuery);
      let queryWithCountry = query.includes("việt nam")
        ? query
        : `${query}, Việt Nam`;
      if (query.includes("da nang")) {
        queryWithCountry = `${query}, Đà Nẵng`;
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          queryWithCountry
        )}&format=json&addressdetails=1&accept-language=vi&limit=1`
      );
      const data = await response.json();

      if (data.length === 0) {
        toast.error("Không tìm thấy địa điểm phù hợp.");
        setIsLoadingLocation(false);
        return;
      }

      const location = data[0];
      const addr = location.address || {};
      const displayName = location.display_name || "";

      // FIX: Tương tự, ưu tiên ward + city cho manual search
      const ward =
        addr.suburb || addr.village || addr.town || addr.quarter || "";
      let city =
        addr.state || addr.province || addr.city || addr.municipality || "";

      // FIX: Fallback từ display_name nếu city rỗng
      if (!city.trim()) {
        const nameParts = displayName.split(", ");
        if (nameParts.length >= 2) {
          city = nameParts.slice(-1)[0];
          if (nameParts.length >= 3) {
            city = `${nameParts[nameParts.length - 2]}, ${city}`;
          }
        }
      }

      let result = [ward, city].filter(Boolean).join(", ");
      if (!result.trim()) result = displayName;

      setSelectedLocation(result);
      setSearchQuery(result);
      toast.success("Đã tìm thấy địa điểm!");
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tìm địa điểm.");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleCityClick = (city) => {
    setSearchQuery(city.name);
    setSelectedLocation(city.name);
    toast.success(`Đã chọn ${city.name}`);
  };

  const handleSaveLocation = () => {
    if (selectedLocation.trim() === "") {
      toast.error("Vui lòng nhập hoặc chọn địa điểm.");
      return;
    }
    onLocationSelect(selectedLocation);
    toast.success("Đã lưu địa điểm!");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.15)" }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Chọn địa điểm</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Ô nhập địa điểm */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <SearchIcon
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Nhập địa điểm (VD: 304 Phan Bội Châu, Huế)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-20 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleManualSearch}
              disabled={isLoadingLocation}
              className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-500"
              title="Tìm địa điểm"
            >
              <SearchIcon size={18} />
            </button>
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isLoadingLocation}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 disabled:opacity-50"
              title="Lấy vị trí hiện tại"
            >
              <Target size={20} />
            </button>
          </div>
          {isLoadingLocation && (
            <p className="text-xs text-gray-500 mt-1 text-right">
              Đang xử lý...
            </p>
          )}
        </div>

        {/* Thành phố phổ biến */}
        <div className="p-4">
          <h4 className="text-sm font-medium text-gray-600 mb-3">
            Địa điểm phổ biến
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {quickCities.map((city) => (
              <button
                key={city.id}
                type="button"
                onClick={() => handleCityClick(city)}
                className={`flex items-center justify-center p-3 rounded-xl border transition-colors ${
                  selectedLocation
                    .toLowerCase()
                    .includes(city.name.toLowerCase().replace("tp.", "").trim())
                    ? "bg-blue-50 border-blue-300 text-blue-600 font-medium"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <MapPin size={18} className="mr-2 text-gray-500" />
                {city.name}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleSaveLocation}
            className="w-full bg-green-500 text-white py-3 rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
            disabled={isLoadingLocation || !selectedLocation.trim()}
          >
            Lưu địa điểm
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
