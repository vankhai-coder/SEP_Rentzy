import { Bike, Gauge, Fuel } from "lucide-react";
import VehicleCard from "../VehicleCard";

const MotorbikeList = ({ bikes }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
