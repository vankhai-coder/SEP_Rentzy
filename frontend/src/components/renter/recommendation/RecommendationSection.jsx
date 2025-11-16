// src/components/renter/recommendation/RecommendationSection.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchRecommendations } from "@/redux/features/renter/recommendation/recommendationSlice"; // Import slice MỚI
import VehicleCard from "../vehicles/VehicleCard"; // Adjust path
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-toastify"; // Cho error toast
import { Settings, Users, Fuel, Bike, Gauge } from "lucide-react"; // MỚI: Import icons cho specs giống VehicleCard

const RecommendationSection = ({ limit = 8 }) => {
  const dispatch = useDispatch();
  const { recommendations, loading, error } = useSelector(
    (state) => state.recommendation
  ); // Selector MỚI: state.renter.recommendation

  useEffect(() => {
    dispatch(fetchRecommendations(limit))
      .unwrap() // Unwrap để catch error
      .catch((err) => toast.error(err || "Lỗi tải gợi ý!"));
  }, [dispatch, limit]);

  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">
            Xe Dành Cho Bạn
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(limit)].map((_, i) => (
              <Skeleton key={i} className="h-80 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 bg-white">
        <div className="text-center text-red-500">Lỗi tải gợi ý: {error}</div>
      </section>
    );
  }

  if (recommendations.length === 0) return null;

  // MỚI: Helper functions format (tương tự VehicleCard/Search)
  const formatFuelType = (fuel) => {
    if (!fuel) return "N/A";
    const normalized = fuel.toLowerCase();
    if (normalized.includes("xăng") || normalized.includes("petrol"))
      return "Xăng";
    if (normalized.includes("điện") || normalized.includes("electric"))
      return "Điện";
    return fuel.charAt(0).toUpperCase() + fuel.slice(1);
  };

  const formatTransmission = (trans) => {
    if (!trans) return "N/A";
    const normalized = trans.toLowerCase();
    if (
      normalized.includes("auto") ||
      normalized.includes("automatic") ||
      normalized.includes("at")
    )
      return "Tự động";
    if (normalized.includes("manual") || normalized.includes("mt"))
      return "Số sàn";
    return trans.charAt(0).toUpperCase() + trans.slice(1);
  };

  const formatBikeType = (bikeType) => {
    if (!bikeType) return "N/A";
    const normalized = bikeType.toLowerCase();
    if (
      normalized.includes("scooter") ||
      normalized.includes("ga") ||
      normalized.includes("dutch")
    )
      return "Xe ga";
    if (normalized.includes("clutch") || normalized.includes("côn"))
      return "Xe côn";
    if (normalized.includes("manual") || normalized.includes("số"))
      return "Xe số";
    if (normalized.includes("electric") || normalized.includes("điện"))
      return "Xe điện";
    return bikeType.charAt(0).toUpperCase() + bikeType.slice(1);
  };

  // SỬA: getIconSpecs động dựa trên vehicle_type, giống VehicleCard (3 specs, format đầy đủ)
  const getIconSpecs = (vehicle) => {
    const type = vehicle.vehicle_type || "car"; // Fallback car nếu không có type
    if (type === "car") {
      return [
        {
          icon: <Settings size={16} />,
          value: formatTransmission(vehicle.transmission),
        },
        { icon: <Users size={16} />, value: `${vehicle.seats || "N/A"} chỗ` },
        { icon: <Fuel size={16} />, value: formatFuelType(vehicle.fuel_type) },
      ];
    } else if (type === "motorbike") {
      return [
        { icon: <Bike size={16} />, value: formatBikeType(vehicle.bike_type) },
        {
          icon: <Gauge size={16} />,
          value: `${vehicle.engine_capacity || "N/A"}cc`,
        },
        { icon: <Fuel size={16} />, value: formatFuelType(vehicle.fuel_type) },
      ];
    }
    // Fallback chung nếu type lạ
    return [
      { icon: <Users size={16} />, value: `${vehicle.seats || "N/A"} chỗ` },
      { icon: <Fuel size={16} />, value: formatFuelType(vehicle.fuel_type) },
      {
        icon: <Settings size={16} />,
        value: formatTransmission(vehicle.transmission),
      },
    ];
  };

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-8">Xe Dành Cho Bạn</h2>
        <p className="text-center text-gray-600 mb-8">
          Dựa trên lịch sử tìm kiếm và thuê xe của bạn
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendations.map((vehicle) => (
            <VehicleCard
              key={vehicle.vehicle_id}
              vehicle={vehicle}
              iconSpecs={getIconSpecs(vehicle)} // SỬA: Specs format đầy đủ như VehicleCard
              type={vehicle.vehicle_type} // Dùng type từ data
              showCompare={false} // Ẩn compare ở reco
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecommendationSection;
