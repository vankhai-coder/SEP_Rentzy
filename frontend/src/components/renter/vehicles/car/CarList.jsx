import { Settings, Users, Fuel } from "lucide-react";
import VehicleCard from "../VehicleCard";

const CarList = ({ cars = [] }) => {
  if (!cars.length) {
    return <p className="text-gray-500">Không có xe nào được tìm thấy.</p>;
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

  // Helper function để format transmission
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
    return trans.charAt(0).toUpperCase() + trans.slice(1); // Capitalize mặc định
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch">
      {cars.map((car) => (
        <VehicleCard
          key={car.vehicle_id}
          vehicle={car}
          type="car"
          iconSpecs={[
            {
              icon: <Settings size={16} />,
              value: formatTransmission(car.transmission),
            }, // SỬA: Format transmission
            { icon: <Users size={16} />, value: `${car.seats || "N/A"} chỗ` }, // Fallback N/A
            { icon: <Fuel size={16} />, value: formatFuelType(car.fuel_type) }, // SỬA: Format fuel_type
          ]}
        />
      ))}
    </div>
  );
};

export default CarList;
