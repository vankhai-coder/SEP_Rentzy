import { Settings, Users, Fuel } from "lucide-react";
import VehicleCard from "../VehicleCard";

const CarList = ({ cars = [] }) => {
  if (!cars.length) {
    return <p className="text-gray-500">Không có xe nào được tìm thấy.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {cars.map((car) => (
        <VehicleCard
          key={car.vehicle_id}
          vehicle={car}
          iconSpecs={[
            { icon: <Settings size={16} />, value: car.transmission },
            { icon: <Users size={16} />, value: `${car.seats} chỗ` },
            { icon: <Fuel size={16} />, value: car.fuel_type },
          ]}
        />
      ))}
    </div>
  );
};

export default CarList;
