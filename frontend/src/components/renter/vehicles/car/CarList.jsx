import { Settings, Users, Fuel } from "lucide-react";
import VehicleCard from "../VehicleCard";

const CarList = ({ cars }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
