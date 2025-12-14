// src/pages/renter/FavoritesPage.jsx

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchFavorites,
  removeFavorite,
} from "../../../redux/features/renter/favorite/favoriteSlice";
import { compareVehicles } from "../../../redux/features/renter/compare/compareSlice";
import VehicleCard from "../../../components/renter/vehicles/VehicleCard";
import Pagination from "../../../components/common/Pagination";
import CompareModal from "../../../components/renter/vehicles/compare/CompareModal";
import { Settings, Users, Fuel, Bike, Gauge, Scale } from "lucide-react";
import { toast } from "react-toastify";

const FavoritesPage = () => {
  const dispatch = useDispatch();
  const { favorites, loading, pagination, error } = useSelector(
    (state) => state.favoriteStore
  );

  const { compareList } = useSelector((state) => state.compareStore);
  const { currentPage, totalPages } = pagination;
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    dispatch(fetchFavorites(currentPage));
  }, [dispatch, currentPage]);

  const handlePageChange = (page) => {
    dispatch(fetchFavorites(page));
  };

  const handleOpenCompare = () => {
    if (compareList.length < 2) {
      toast.warn("Chọn ít nhất 2 xe để so sánh!");
      return;
    }

    const types = compareList.map((item) => item.type);
    const uniqueTypes = [...new Set(types)];
    if (uniqueTypes.length > 1) {
      toast.error("Chỉ có thể so sánh xe cùng loại (ô tô hoặc xe máy)!");
      return;
    }

    dispatch(compareVehicles());
    setShowModal(true);
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Danh Sách Yêu Thích</h1>
        {compareList.length > 0 && (
          <button
            onClick={handleOpenCompare}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg text-sm font-medium"
            disabled={compareList.length < 2}
            title="So sánh xe đã chọn"
          >
            <Scale size={16} />
            <span>So sánh ({compareList.length})</span>
          </button>
        )}
      </div>

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
                  type={vehicle.vehicle_type}
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

      {showModal && (
        <CompareModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          compareList={compareList}
        />
      )}
    </div>
  );
};

export default FavoritesPage;
