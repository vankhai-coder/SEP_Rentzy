import React, { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";

// Constants
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const PLACEHOLDER_COORDS = { lat: 16.047079, lon: 108.20623 }; // Đà Nẵng
const VEHICLE_ICON = L.divIcon({
  html: `
    <div style="
      background: #ef4444;
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      position: relative;
    ">
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(45deg);
        color: white;
        font-size: 12px;
        font-weight: bold;
      "></div>
    </div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 28],
});
const USER_ICON = L.divIcon({
  html: `
    <div style="
      background: #3b82f6;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      position: relative;
    ">
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-size: 12px;
      ">📍</div>
    </div>`,
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Utility: Reverse geocode (lat, lon → address)
const reverseGeocode = async (lat, lon) => {
  try {
    const url = `${NOMINATIM_BASE_URL}/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const response = await fetch(url, { headers: { "Accept-Language": "vi" } });
    const data = await response.json();
    if (data?.address) {
      // Ưu tiên dùng display_name từ Nominatim vì nó thường đầy đủ nhất
      if (data.display_name) {
        return data.display_name;
      }
      
      const addr = [
        data.address.house_number,
        data.address.road,
        data.address.quarter, // Tổ dân phố
        data.address.neighbourhood, // Khu vực
        data.address.hamlet, // Thôn
        data.address.suburb || data.address.village || data.address.ward, // Phường/Xã
        data.address.city_district || data.address.district, // Quận/Huyện
        data.address.city || data.address.town || data.address.municipality, // Thành phố/Thị xã
        data.address.state,
        data.address.country,
      ].filter(Boolean).join(", ");
      return addr || data.display_name || `${lat}, ${lon}`;
    }
    return data?.display_name || `${lat}, ${lon}`;
  } catch (error) {
    console.error("Reverse geocode error:", error);
    return `${lat}, ${lon}`;
  }
};

// Utility: Forward geocode (address → coords)
const forwardGeocode = async (address) => {
  if (!address?.trim()) {
    console.error("forwardGeocode - No address provided");
    return null;
  }
  try {
    const normalizedAddress = address.toLowerCase().includes("việt nam") || address.toLowerCase().includes("vietnam")
      ? address
      : `${address}, Việt Nam`;
    const url = `${NOMINATIM_BASE_URL}/search?format=json&limit=1&countrycodes=vn&q=${encodeURIComponent(normalizedAddress)}`;
    const response = await fetch(url, { headers: { "Accept-Language": "vi" } });
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      console.log("forwardGeocode - Found result:", data[0]);
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }

    console.warn("forwardGeocode - No results for address:", address);
    return null;
  } catch (error) {
    console.error("forwardGeocode - Error:", error);
    return null;
  }
};

// Utility: Fetch address suggestions
const fetchAddressSuggestions = async (query) => {
  if (!query?.trim()) return [];
  try {
    const normalizedQuery = query.toLowerCase().includes("việt nam") || query.toLowerCase().includes("vietnam")
      ? query
      : `${query}, Việt Nam`;
    const url = `${NOMINATIM_BASE_URL}/search?format=json&limit=5&countrycodes=vn&q=${encodeURIComponent(normalizedQuery)}`;
    const response = await fetch(url, { headers: { "Accept-Language": "vi" } });
    const data = await response.json();
    return data.map(item => ({
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    }));
  } catch (error) {
    console.error("fetchAddressSuggestions - Error:", error);
    return [];
  }
};

// Utility: Calculate distance between two coordinates (in km)
const calculateDistance = (coords1, coords2) => {
  if (!coords1 || !coords2) return 0;
  const R = 6371; // Earth's radius in km
  const dLat = ((coords2.lat - coords1.lat) * Math.PI) / 180;
  const dLon = ((coords2.lon - coords1.lon) * Math.PI) / 180;
  const lat1 = (coords1.lat * Math.PI) / 180;
  const lat2 = (coords2.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 100) / 100;
};

// Component: Fit map bounds based on coordinates
const FitBounds = ({ userCoords, vehicleCoords }) => {
  const map = useMap();
  useEffect(() => {
    if (userCoords && vehicleCoords) {
      const bounds = L.latLngBounds(
        [userCoords.lat, userCoords.lon],
        [vehicleCoords.lat, vehicleCoords.lon]
      );
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (userCoords) {
      map.setView([userCoords.lat, userCoords.lon], 15);
    } else if (vehicleCoords) {
      map.setView([vehicleCoords.lat, vehicleCoords.lon], 13);
    }
  }, [userCoords, vehicleCoords, map]);
  return null;
};

// Main Component: AddressSelector
const AddressSelector = ({ vehicle, onConfirm, onCancel }) => {
  // State
  const [vehicleCoords, setVehicleCoords] = useState(null);
  const [vehicleAddress, setVehicleAddress] = useState('');
  const [userCoords, setUserCoords] = useState(null);
  const [userAddress, setUserAddress] = useState("");
  const [distance, setDistance] = useState(0);
  const [addressInput, setAddressInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const lastDistanceRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Initialize vehicle position from vehicle prop
  useEffect(() => {
    const initializeVehicle = async () => {
      if (!vehicle) {
        console.log("No vehicle data provided");
        setVehicleAddress("Không xác định được vị trí");
        return;
      }

      const { latitude, longitude, location } = vehicle;

      if (latitude != null && longitude != null) {
        console.log("Vehicle latitude:", latitude, "Vehicle longitude:", longitude);
        const coords = { lat: Number(latitude), lon: Number(longitude) };
        if (coords.lat >= -90 && coords.lat <= 90 && coords.lon >= -180 && coords.lon <= 180) {
          console.log("Using vehicle coordinates:", coords);
          setVehicleCoords(coords);
          const addr = await reverseGeocode(coords.lat, coords.lon);
          setVehicleAddress(addr);
          return;
        } else {
          console.warn("Invalid vehicle coordinates:", { latitude, longitude });
        }
      }
// nếu mà ko có latitude và longitude ko có  thì sẽ geocode từ location lấy ra coordinates
      if (location) {
        console.log("Geocoding vehicle.location:", location);
        const coords = await forwardGeocode(location);
        if (coords) {
          setVehicleCoords(coords);
          const addr = await reverseGeocode(coords.lat, coords.lon);
          console.log("Geocoded address:", addr);
          setVehicleAddress(addr);
        } else {
          setVehicleAddress(location || "Không xác định được vị trí");
        }
      } else {
        setVehicleAddress("Không xác định được vị trí");
      }
    };

    initializeVehicle();
  }, [vehicle]);

  // Calculate distance when coordinates change
  useEffect(() => {
    const newDistance = calculateDistance(vehicleCoords, userCoords);
    if (
      lastDistanceRef.current == null ||
      Math.abs(newDistance - lastDistanceRef.current) >= 0.01
    ) {
      lastDistanceRef.current = newDistance;
      setDistance(newDistance);
    }
  }, [vehicleCoords, userCoords]);

  const [isLocating, setIsLocating] = useState(false);

  // Get current user location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt không hỗ trợ định vị.");
      return;
    }

    if (isLocating) return; // Prevent double click

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          console.log("User location obtained:", coords);
          setUserCoords(coords);
          
          // Reverse geocode
          const addr = await reverseGeocode(coords.lat, coords.lon);
          setUserAddress(addr);
          setAddressInput(addr);
          setSuggestions([]);
          toast.success("Đã lấy vị trí thành công!");
        } catch (error) {
          console.error("Error processing location:", error);
          toast.error("Lấy tọa độ thành công nhưng không tìm thấy tên đường.");
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setIsLocating(false);
        let msg = "Không thể lấy vị trí hiện tại.";
        if (err.code === err.PERMISSION_DENIED) msg = "Bạn đã từ chối quyền truy cập vị trí.";
        else if (err.code === err.TIMEOUT) msg = "Hết thời gian chờ lấy vị trí.";
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    );
  }, [isLocating]);

  // Debounced address suggestion fetching
  const fetchSuggestions = useCallback(async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    const results = await fetchAddressSuggestions(query);
    setSuggestions(results);
  }, []);

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(addressInput);
    }, 300);

    return () => clearTimeout(debounceTimeoutRef.current);
  }, [addressInput, fetchSuggestions]);

  // Handle selecting a suggestion
  const handleSelectSuggestion = (suggestion) => {
    setAddressInput(suggestion.display_name);
    setUserCoords({ lat: suggestion.lat, lon: suggestion.lon });
    setUserAddress(suggestion.display_name);
    setSuggestions([]);
  };

  // Handle manual address input and confirm location
  const handleManualAddress = useCallback(async () => {
    if (!addressInput.trim()) {
      toast.error("Vui lòng nhập địa chỉ cụ thể.");
      return;
    }

    setIsGeocoding(true);
    const coords = await forwardGeocode(addressInput);
    if (coords) {
      console.log("Geocoded user address:", coords);
      setUserCoords(coords);
      const addr = await reverseGeocode(coords.lat, coords.lon);
      setUserAddress(addr);
      setAddressInput(addr);
      setSuggestions([]);
    } else {
      toast.error("Không tìm thấy địa chỉ. Vui lòng thử lại với địa chỉ chi tiết hơn.");
    }
    setIsGeocoding(false);
  }, [addressInput]);

  // Handle confirm action
  const handleConfirm = useCallback(() => {
    if (!userCoords || !userAddress) {
      toast.error("Vui lòng xác định vị trí của bạn trước khi xác nhận.");
      return;
    }
    onConfirm(userAddress, userCoords, distance);
  }, [userCoords, userAddress, distance, onConfirm]);

  // Map center fallback
  const mapCenter = userCoords || vehicleCoords || PLACEHOLDER_COORDS;

  return (
    <div className="space-y-4">
      {/* Title */}
      <h3 className="text-base font-semibold text-gray-800">
        Địa chỉ giao và vị trí xe
      </h3>

      <div className="text-sm text-gray-600">
        <span className="font-medium text-gray-700">Vị trí xe: </span>
        {vehicleAddress || "Không xác định được vị trí"}
      </div>

      {/* Address Input with Suggestions */}
      <div className="space-y-2 relative">
        <label className="block text-sm font-medium text-gray-700">
          Nhập địa chỉ của bạn:
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="Ví dụ: K34/36 Lê Hữu Trác, An Hải Đông, Sơn Trà, Đà Nẵng"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              disabled={isGeocoding}
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    {suggestion.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            onClick={handleManualAddress}
            className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-green-400"
            disabled={isGeocoding}
          >
            {isGeocoding ? "Đang xử lý..." : "Xác định vị trí"}
          </button>
        </div>
      </div>

      {/* Location and Distance */}
      <div className="flex gap-3 items-center">
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={isLocating}
          className={`rounded-md px-3 py-2 text-sm font-medium text-white transition-colors ${
            isLocating 
              ? "bg-blue-400 cursor-not-allowed" 
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isLocating ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang lấy vị trí...
            </span>
          ) : (
            "Lấy vị trí hiện tại"
          )}
        </button>
        <span className="text-sm text-gray-600">Khoảng cách: {distance} km</span>
      </div>
      <div className="text-sm text-gray-600">
        <span className="font-medium text-gray-700">Vị trí của bạn: </span>
        {userAddress || "Chưa xác định"}
      </div>

      {/* Map */}
      <div className="h-64 w-full overflow-hidden rounded-md border border-gray-200">
        <MapContainer
          center={[mapCenter.lat, mapCenter.lon]}
          zoom={13}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {vehicleCoords && (
            <Marker position={[vehicleCoords.lat, vehicleCoords.lon]} icon={VEHICLE_ICON}>
              <Tooltip permanent direction="top">
                 Vị trí xe
              </Tooltip>
            </Marker>
          )}
          {userCoords && (
            <Marker position={[userCoords.lat, userCoords.lon]} icon={USER_ICON}>
              <Tooltip permanent direction="top">
                 Bạn đang ở đây
              </Tooltip>
            </Marker>
          )}
          <FitBounds userCoords={userCoords} vehicleCoords={vehicleCoords} />
        </MapContainer>
      </div>

      {/* Confirm/Cancel Buttons */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="rounded-md bg-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-400"
        >
          Hủy
        </button>
        <button
          onClick={handleConfirm}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-400"
          disabled={!userCoords}
        >
          Xác nhận
        </button>
      </div>
    </div>
  );
};

export default AddressSelector;