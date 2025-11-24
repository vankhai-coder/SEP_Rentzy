import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchVehiclesByBrand,
  clearVehiclesByBrand,
} from "../../../redux/features/renter/brand/brandSlice";
import { toast } from "react-toastify";
import VehicleCard from "../../../components/renter/vehicles/VehicleCard";
import { Loader2 } from "lucide-react";
import Pagination from "../../../components/common/Pagination";
import { Settings, Users, Fuel, Bike, Gauge } from "lucide-react";

const BrandVehicles = () => {
  const { brand_id } = useParams();
  const [searchParams] = useSearchParams();
  const vehicleTypeQuery = searchParams.get("vehicle_type"); // car | motorbike | null

  const dispatch = useDispatch();

  const { vehiclesByBrand, brandInfo, totalCount, vehiclesLoading, error } =
    useSelector((state) => state.brandStore);

  const [currentPage, setCurrentPage] = useState(1);
  const limit = 8;
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / limit) : 1;

  useEffect(() => {
    if (!brand_id || isNaN(brand_id)) {
      toast.error("ID hãng xe không hợp lệ!");
      return;
    }

    dispatch(
      fetchVehiclesByBrand({
        brandId: brand_id,
        page: currentPage,
        limit,
        vehicle_type: vehicleTypeQuery || undefined, // chỉ gửi khi có
      })
    );

    return () => {
      dispatch(clearVehiclesByBrand());
    };
  }, [dispatch, brand_id, currentPage, vehicleTypeQuery]);

  // Helper format
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
    if (normalized.includes("auto") || normalized.includes("at"))
      return "Tự động";
    if (normalized.includes("manual") || normalized.includes("mt"))
      return "Số sàn";
    return trans.charAt(0).toUpperCase() + trans.slice(1);
  };

  const formatBikeType = (bikeType) => {
    if (!bikeType) return "N/A";
    const normalized = bikeType.toLowerCase();
    if (normalized.includes("scooter") || normalized.includes("ga"))
      return "Xe ga";
    if (normalized.includes("clutch") || normalized.includes("côn"))
      return "Xe côn";
    if (normalized.includes("manual") || normalized.includes("số"))
      return "Xe số";
    if (normalized.includes("electric") || normalized.includes("điện"))
      return "Xe điện";
    return bikeType.charAt(0).toUpperCase() + bikeType.slice(1);
  };

  const getIconSpecs = (vehicle) => {
    if (vehicle.vehicle_type === "car") {
      return [
        {
          icon: <Settings size={16} />,
          value: formatTransmission(vehicle.transmission),
        },
        { icon: <Users size={16} />, value: `${vehicle.seats || "N/A"} chỗ` },
        { icon: <Fuel size={16} />, value: formatFuelType(vehicle.fuel_type) },
      ];
    } else if (vehicle.vehicle_type === "motorbike") {
      return [
        { icon: <Bike size={16} />, value: formatBikeType(vehicle.bike_type) },
        {
          icon: <Gauge size={16} />,
          value: `${vehicle.engine_capacity || "N/A"}cc`,
        },
        { icon: <Fuel size={16} />, value: formatFuelType(vehicle.fuel_type) },
      ];
    }
    return [];
  };

  if (vehiclesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Đang tải xe...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-4">{error}</p>
        <Link to="/" className="text-blue-500 underline">
          Quay về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      {brandInfo && (
        <div className="mb-8 flex items-center space-x-4">
          <img
            src={brandInfo.logo_url || "/default-logo.png"}
            alt={brandInfo.name}
            className="w-16 h-16 rounded-full object-contain border"
            onError={(e) => (e.target.src = "/default-logo.png")}
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {brandInfo.name}
            </h1>
            <p className="text-gray-600">
              {brandInfo.country} • {totalCount} xe sẵn sàng
            </p>
          </div>
        </div>
      )}

      {/* No vehicles */}
      {totalCount === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">
            Hiện tại không có xe nào khả dụng của hãng này.
          </p>
          <Link to="/" className="text-blue-500 underline mt-4 inline-block">
            Xem các xe khác
          </Link>
        </div>
      ) : (
        <>
          {/* Danh sách xe */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vehiclesByBrand.map((vehicle) => (
              <VehicleCard
                key={vehicle.vehicle_id}
                vehicle={vehicle}
                iconSpecs={getIconSpecs(vehicle)}
                type={vehicle.vehicle_type}
              />
            ))}
          </div>

          {/* Phân trang */}
          <div className="mt-10">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default BrandVehicles;
