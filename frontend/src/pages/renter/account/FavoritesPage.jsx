import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFavorites } from "../../../redux/features/renter/favorite/favoriteSlice";
import VehicleCard from "../../../components/renter/vehicles/VehicleCard";
import { Settings, Users, Fuel, Bike, Gauge } from "lucide-react";

const FavoritesPage = () => {
  const dispatch = useDispatch();
  const { favorites, loading } = useSelector((state) => state.favoriteStore);

  useEffect(() => {
    dispatch(fetchFavorites());
  }, [dispatch]);

  // Debug: Log favorites để check data
  useEffect(() => {
    console.log("Favorites data:", favorites);
  }, [favorites]);

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

  if (loading) return <p>Đang tải...</p>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Danh Sách Yêu Thích</h1>
      {favorites.length === 0 ? (
        <p>Bạn chưa có xe yêu thích nào.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((fav) => {
            const vehicle = fav.Vehicle;
            if (!vehicle) {
              console.warn("Skipping invalid favorite item:", fav);
              return null;
            }
            // Fix: Sử dụng vehicle.vehicle_type thay vì vehicle.type
            // Áp dụng format functions cho transmission, bike_type, fuel_type
            const iconSpecs =
              vehicle.vehicle_type === "car"
                ? [
                    {
                      icon: <Settings size={16} />,
                      value: formatTransmission(vehicle.transmission),
                    },
                    {
                      icon: <Users size={16} />,
                      value: `${vehicle.seats || "N/A"} chỗ`,
                    },
                    {
                      icon: <Fuel size={16} />,
                      value: formatFuelType(vehicle.fuel_type),
                    },
                  ]
                : [
                    {
                      icon: <Bike size={16} />,
                      value: formatBikeType(vehicle.bike_type),
                    },
                    {
                      icon: <Gauge size={16} />,
                      value: `${vehicle.engine_capacity || "N/A"}cc`,
                    },
                    {
                      icon: <Fuel size={16} />,
                      value: formatFuelType(vehicle.fuel_type),
                    },
                  ];

            // Truyền thêm features nếu VehicleCard dùng
            return (
              <VehicleCard
                key={fav.favorite_id}
                vehicle={vehicle}
                iconSpecs={iconSpecs}
                features={vehicle.features || []} // Handle JSON features
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
