// src/pages/renter/FavoritesPage.jsx

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchFavorites,
  removeFavorite,
} from "../../../redux/features/renter/favorite/favoriteSlice";
import VehicleCard from "../../../components/renter/vehicles/VehicleCard";
import Pagination from "../../../components/common/Pagination";
import { Settings, Users, Fuel, Bike, Gauge } from "lucide-react";

const FavoritesPage = () => {
  const dispatch = useDispatch();
  const { favorites, loading, pagination, error } = useSelector(
    (state) => state.favoriteStore
  );

  const { currentPage, totalPages } = pagination;

  useEffect(() => {
    dispatch(fetchFavorites(currentPage));
  }, [dispatch, currentPage]);

  const handlePageChange = (page) => {
    dispatch(fetchFavorites(page));
  };

  // Format helpers
  const formatFuelType = (fuel) => {
    if (!fuel) return "N/A";
    const normalized = fuel.toLowerCase();
    if (normalized.includes("xăng") || normalized.includes("petrol"))
      return "Xăng";
    if (normalized.includes("điện") || normalized.includes("electric"))
      return "Điện";
    if (normalized.includes("diesel")) return "Dầu";
    return fuel.charAt(0).toUpperCase() + fuel.slice(1);
  };

  const formatTransmission = (trans) => {
    if (!trans) return "N/A";
    const normalized = trans.toLowerCase();
    if (normalized.includes("auto") || normalized.includes("tự động"))
      return "Tự động";
    if (normalized.includes("manual") || normalized.includes("số sàn"))
      return "Số sàn";
    return trans.charAt(0).toUpperCase() + trans.slice(1);
  };

  const formatBikeType = (bikeType) => {
    if (!bikeType) return "N/A";
    const normalized = bikeType.toLowerCase();
    if (normalized.includes("ga") || normalized.includes("scooter"))
      return "Xe ga";
    if (normalized.includes("côn") || normalized.includes("clutch"))
      return "Xe côn";
    if (normalized.includes("số") || normalized.includes("manual"))
      return "Xe số";
    if (normalized.includes("điện")) return "Xe điện";
    return bikeType.charAt(0).toUpperCase() + bikeType.slice(1);
  };

  const getIconSpecs = (vehicle) => {
    if (vehicle.vehicle_type === "car") {
      return [
        {
          icon: <Settings size={16} />,
          value: formatTransmission(vehicle.transmission),
        },
        { icon: <Users size={16} />, value: `${vehicle.seats || "?"} chỗ` },
        { icon: <Fuel size={16} />, value: formatFuelType(vehicle.fuel_type) },
      ];
    } else {
      return [
        { icon: <Bike size={16} />, value: formatBikeType(vehicle.bike_type) },
        {
          icon: <Gauge size={16} />,
          value: `${vehicle.engine_capacity || "?"}cc`,
        },
        { icon: <Fuel size={16} />, value: formatFuelType(vehicle.fuel_type) },
      ];
    }
  };

  if (loading && favorites.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 text-center py-20 text-red-600">
        <p>Lỗi: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Danh Sách Yêu Thích</h1>

      {favorites.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-lg">
          <p className="text-xl text-gray-600">
            Bạn chưa thêm xe nào vào danh sách yêu thích
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {favorites.map((fav) => {
              const vehicle = fav.Vehicle;
              if (!vehicle) return null;

              return (
                <VehicleCard
                  key={fav.favorite_id}
                  vehicle={vehicle}
                  iconSpecs={getIconSpecs(vehicle)}
                  features={vehicle.features || []}
                  isFavorite={true}
                  onRemoveFavorite={() =>
                    dispatch(removeFavorite(vehicle.vehicle_id))
                  }
                />
              );
            })}
          </div>

          {/* Phân trang - luôn hiển thị dù chỉ có 1 trang */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages >= 1 ? totalPages : 1}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default FavoritesPage;
