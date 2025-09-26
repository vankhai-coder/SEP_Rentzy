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
            const iconSpecs =
              vehicle.type === "car"
                ? [
                    {
                      icon: <Settings size={16} />,
                      value: vehicle.transmission,
                    },
                    {
                      icon: <Users size={16} />,
                      value: `${vehicle.seats} chỗ`,
                    },
                    { icon: <Fuel size={16} />, value: vehicle.fuel_type },
                  ]
                : [
                    { icon: <Bike size={16} />, value: vehicle.bike_type },
                    {
                      icon: <Gauge size={16} />,
                      value: `${vehicle.engine_capacity}cc`,
                    },
                    { icon: <Fuel size={16} />, value: vehicle.fuel_type },
                  ];

            return (
              <VehicleCard
                key={fav.favorite_id}
                vehicle={vehicle}
                iconSpecs={iconSpecs}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
