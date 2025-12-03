import { Bike, Gauge, Fuel } from "lucide-react";
import VehicleCard from "../VehicleCard";

const MotorbikeList = ({ bikes = [] }) => {
  if (!bikes.length) {
    return <p className="text-gray-500">Không có xe máy nào được tìm thấy.</p>;
  }

  // Helper function để format fuel_type
  const formatFuelType = (fuel) => {
    if (!fuel) return "N/A";
    const normalized = fuel.toLowerCase();
    if (normalized.includes("xăng") || normalized.includes("petrol"))
      return "Xăng";
    if (normalized.includes("điện") || normalized.includes("electric"))
      return "Điện";
    return fuel.charAt(0).toUpperCase() + fuel.slice(1); // Capitalize mặc định
  };

  // Helper function để format bike_type (map tiếng Việt: Xe ga, Xe côn, Xe số, Xe điện)
  const formatBikeType = (bikeType) => {
    if (!bikeType) return "N/A";
    const normalized = bikeType.toLowerCase();
    if (
      normalized.includes("scooter") ||
      normalized.includes("ga") ||
      normalized.includes("dutch")
    )
      return "Xe ga"; // scooter/dutch → Xe ga
    if (normalized.includes("clutch") || normalized.includes("côn"))
      return "Xe côn"; // clutch → Xe côn
    if (normalized.includes("manual") || normalized.includes("số"))
      return "Xe số"; // manual → Xe số
    if (normalized.includes("electric") || normalized.includes("điện"))
      return "Xe điện"; // electric → Xe điện
    return bikeType.charAt(0).toUpperCase() + bikeType.slice(1); // Capitalize mặc định
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch">
      {bikes.map((bike) => (
        <VehicleCard
          key={bike.vehicle_id}
          vehicle={bike}
          type="motorbike"
          iconSpecs={[
            { icon: <Bike size={16} />, value: formatBikeType(bike.bike_type) }, // SỬA: Format bike_type
            {
              icon: <Gauge size={16} />,
              value: `${bike.engine_capacity || "N/A"}cc`,
            }, // Fallback N/A cc
            { icon: <Fuel size={16} />, value: formatFuelType(bike.fuel_type) }, // SỬA: Format fuel_type
          ]}
        />
      ))}
    </div>
  );
};

export default MotorbikeList;
