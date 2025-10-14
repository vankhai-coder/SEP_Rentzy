import { Bike, Gauge, Fuel } from "lucide-react";
import VehicleCard from "../VehicleCard";

const MotorbikeList = ({ bikes = [] }) => {
  if (!bikes.length) {
    return <p className="text-gray-500">Không có xe máy nào được tìm thấy.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {bikes.map((bike) => (
        <VehicleCard
          key={bike.vehicle_id}
          vehicle={bike}
          iconSpecs={[
            { icon: <Bike size={16} />, value: bike.bike_type },
            { icon: <Gauge size={16} />, value: `${bike.engine_capacity}cc` },
            { icon: <Fuel size={16} />, value: bike.fuel_type },
          ]}
        />
      ))}
    </div>
  );
};

export default MotorbikeList;
