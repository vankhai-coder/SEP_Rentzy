// import React, { useState } from "react";

const VehicleInfo = ({ vehicle }) => {
  // const [isFavorited, setIsFavorited] = useState(false);
  // const [showCopySuccess, setShowCopySuccess] = useState(false);

  if (!vehicle) return null;

  // Helpers: map enum values to Vietnamese labels
  const formatFuelType = (fuel) => {
    if (!fuel) return "N/A";
    const normalized = String(fuel).toLowerCase();
    if (normalized.includes("petrol") || normalized.includes("xăng"))
      return "Xăng";
    if (normalized.includes("diesel") || normalized.includes("dầu"))
      return "Dầu";
    if (normalized.includes("electric") || normalized.includes("điện"))
      return "Điện";
    if (normalized.includes("hybrid")) return "Hybrid";
    return fuel;
  };

  const formatTransmission = (trans) => {
    if (!trans) return "Số tự động";
    const normalized = String(trans).toLowerCase();
    if (
      normalized.includes("auto") ||
      normalized.includes("automatic") ||
      normalized.includes("at")
    )
      return "Số tự động";
    if (normalized.includes("manual") || normalized.includes("mt"))
      return "Số sàn";
    return trans;
  };

  const formatBikeType = (bikeType) => {
    if (!bikeType) return "N/A";
    const normalized = String(bikeType).toLowerCase();
    if (normalized.includes("scooter") || normalized.includes("ga"))
      return "Xe ga";
    if (normalized.includes("clutch") || normalized.includes("côn"))
      return "Xe côn";
    if (normalized.includes("manual") || normalized.includes("số"))
      return "Xe số";
    if (normalized.includes("electric") || normalized.includes("điện"))
      return "Xe điện";
    return bikeType;
  };

  const transmissionDisplay =
    vehicle.vehicle_type === "motorbike"
      ? formatBikeType(vehicle.bike_type)
      : formatTransmission(vehicle.transmission);

  const specifications = [
    {
      label: "Truyền động",
      value: transmissionDisplay,
      icon: (
        <svg
          className="w-6 h-6 text-green-600"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
        </svg>
      ),
    },
    {
      label: "Số ghế",
      value: vehicle.seats || "7 chỗ",
      icon: (
        <svg
          className="w-6 h-6 text-blue-600"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M4 18v3h3v-3h10v3h3v-3h1v-2H3v2h1zM19 10h3v8h-3v-8zM2 10h3v8H2v-8zM7 4v2h10V4H7zM6 8v2h12V8H6z" />
        </svg>
      ),
    },
    {
      label: "Nhiên liệu",
      value: formatFuelType(vehicle.fuel_type),
      icon: (
        <svg
          className="w-6 h-6 text-orange-600"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM12 13.5V19H8v-5.5h4zm0-3.5H8V5h4v5z" />
        </svg>
      ),
    },
    {
      label: "Tiêu hao",
      value: vehicle.fuel_consumption || "7L/100km",
      icon: (
        <svg
          className="w-6 h-6 text-purple-600"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
        </svg>
      ),
    },
  ].filter((spec) => spec.value);

  // const handleCopyLink = async () => {
  //   try {
  //     await navigator.clipboard.writeText(window.location.href);
  //     setShowCopySuccess(true);
  //     setTimeout(() => setShowCopySuccess(false), 2000);
  //   } catch (err) {
  //     console.error("Failed to copy link:", err);
  //   }
  // };

  // const handleToggleFavorite = () => {
  //   setIsFavorited(!isFavorited);
  //   // TODO: Implement API call to add/remove from favorites
  // };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header Section */}
      <div className="bg-white text-white p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-gray-900 text-2xl font-bold mb-2">
              {vehicle.model || "TOYOTA FORTUNER"} {vehicle.year || "2014"}
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-900 mb-3">
              <div className="flex items-center gap-1">
                <span className="text-yellow-400">★</span>
                <span>5.0</span>
              </div>
              <span>•</span>
              <span>{vehicle.rent_count ?? "0"} chuyến</span>
              <span>•</span>
              <span>{vehicle.location || "Phường Linh Đông, TP Thủ Đức"}</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-green-600 px-3 py-1 mb-1 rounded-full text-sm margin-bottom-2">
              <span className="w-2 h-2 bg-green-300 rounded-full"></span>
              <span>Miễn thế chấp </span>
          
            </div>
   
            <div>
              {/* Require Owner Confirmation */}
              {vehicle.require_owner_confirmation && (
                <div className=" inline-flex items-center gap-2 bg-yellow-600 px-3 py-1 rounded-full text-sm text-white">
                  <span className="w-2 h-2 bg-yellow-300 rounded-full"></span>
                  <span>Yêu cầu xác nhận chủ xe</span>
                </div>
              )}
              {!vehicle.require_owner_confirmation && (
                <div className="inline-flex items-center gap-2 bg-green-600 px-3 py-1 rounded-full text-sm text-white">
                  <span className="w-2 h-2 bg-green-300 rounded-full"></span>
                  <span>Không yêu cầu xác nhận chủ xe</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 ml-4">
            {/* Share Button */}
            {/* <button
              onClick={handleCopyLink}
              className="relative p-2 bg-gray-300 hover:bg-gray-600 rounded-lg transition-colors duration-200"
              title="Chia sẻ"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                />
              </svg>
              {showCopySuccess && (
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                  Đã sao chép!
                </div>
              )}
            </button> */}

            {/* Favorite Button */}
            {/* <button
              onClick={handleToggleFavorite}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                isFavorited
                  ? "bg-red-300 hover:bg-red-300"
                  : "bg-gray-300 hover:bg-gray-300"
              }`}
              title={isFavorited ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
            >
              <svg
                className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`}
                fill={isFavorited ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button> */}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        {/* Specifications */}
        {specifications.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Đặc điểm
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {specifications.map((spec, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 text-center hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex justify-center mb-2">{spec.icon}</div>
                  <div className="text-sm text-gray-600 mb-1">{spec.label}</div>
                  <div className="font-semibold text-gray-900">
                    {spec.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Mô tả</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            {vehicle.description ? (
              <p className="text-gray-700 leading-relaxed">
                {vehicle.description}
              </p>
            ) : (
              <div className="space-y-3 text-gray-700">
                <p>
                  Ngoài các ưu đãi về giá MICARRO còn hỗ trợ thêm cho Quý Khách
                  hàng các Chính sách như sau:
                </p>
                <ul className="space-y-1 ml-4">
                  <li>• Hoàn tiền đổ xăng dư</li>
                  <li>• Miễn phí vượt dưới 1h</li>
                  <li>• Miễn phí vượt dưới 10Km</li>
                  <li>
                    • Sử dụng miễn phí: Nước, Đồ ăn vặt, Khăn giấy có trong gói
                    MICAR KIT khi thuê xe
                  </li>
                </ul>
                <p>
                  Toyota Fortuner là mẫu xe SUV cỡ trung, sang trọng và khả năng
                  vận hành mạnh mẽ, sự kết hợp giữa khả năng vận hành mạnh mẽ,
                  sự thoải mái và tính năng an toàn vượt trội. Được trang bị
                  khung gầm vững chắi, Fortuner sở hữu điểm mạnh về sự linh hoạt
                  và toàn vượt trội.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Các tiện nghi khác
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {(vehicle.features && vehicle.features.length > 0
              ? vehicle.features
              : [
                  "Camera lùi",
                  "Cảm biến lốp",
                  "Cảm biến va chạm",
                  "Cảnh báo tốc độ",
                  "Định vị GPS",
                  "Khe cắm USB",
                  "Lốp dự phòng",
                  "Màn hình DVD",
                  "ETC",
                  "Túi khí an toàn",
                ]
            ).map((feature, index) => {
              const getFeatureIcon = (featureName) => {
                const name = featureName.toLowerCase();
                if (name.includes("camera") && name.includes("lùi"))
                  return "📹";
                if (name.includes("cảm biến") && name.includes("lốp"))
                  return "⚡";
                if (name.includes("cảm biến") && name.includes("va chạm"))
                  return "🛡️";
                if (name.includes("cảnh báo") && name.includes("tốc độ"))
                  return "🚨";
                if (name.includes("định vị") || name.includes("gps"))
                  return "🧭";
                if (name.includes("khe cắm") || name.includes("usb"))
                  return "🔌";
                if (name.includes("lốp dự phòng")) return "🔧";
                if (name.includes("màn hình") || name.includes("dvd"))
                  return "📺";
                if (name.includes("etc")) return "💳";
                if (name.includes("túi khí") || name.includes("an toàn"))
                  return "🛡️";
                return "✓";
              };

              return (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors duration-200"
                >
                  <span className="text-lg">{getFeatureIcon(feature)}</span>
                  <span className="text-sm text-gray-700 font-medium">
                    {feature}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleInfo;
