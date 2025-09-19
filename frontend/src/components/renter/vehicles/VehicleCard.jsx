import { MapPin, Heart, Star } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  addFavorite,
  removeFavorite,
} from "../../../redux/features/renter/favorite/favoriteSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useState } from "react";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN").format(value) + " VND";
};

const VehicleCard = ({ vehicle, iconSpecs }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userId } = useSelector((state) => state.userStore);
  const { favorites } = useSelector((state) => state.favoriteStore);

  const [isFavoriteLocal, setIsFavoriteLocal] = useState(
    favorites.some((fav) => fav.vehicle_id === vehicle.vehicle_id)
  );

  const handleFavorite = async () => {
    if (!userId) {
      toast.info("Vui lòng đăng nhập để thêm yêu thích!");
      navigate("/login");
      return;
    }

    const newIsFavorite = !isFavoriteLocal;
    setIsFavoriteLocal(newIsFavorite);

    try {
      if (newIsFavorite) {
        // Pass cả vehicle_id và vehicle object vào thunk
        await dispatch(
          addFavorite({ vehicle_id: vehicle.vehicle_id, vehicle })
        ).unwrap();
        toast.success("Đã thêm vào danh sách yêu thích!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } else {
        await dispatch(removeFavorite(vehicle.vehicle_id)).unwrap();
        toast.success("Đã xóa khỏi danh sách yêu thích!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    } catch (error) {
      setIsFavoriteLocal(!newIsFavorite);
      toast.error(error || "Có lỗi xảy ra khi cập nhật yêu thích!");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden border border-gray-100">
      <div className="relative">
        <img
          src={vehicle.main_image_url}
          alt={vehicle.model}
          className="w-full h-56 object-cover"
        />
        {vehicle.discount && (
          <span className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 text-sm rounded-full shadow">
            -{vehicle.discount}%
          </span>
        )}
        <button
          className="absolute top-3 right-3 p-2 rounded-full bg-white shadow hover:bg-red-50 cursor-pointer"
          onClick={handleFavorite}
        >
          <Heart
            size={20}
            className={
              isFavoriteLocal
                ? "text-red-500 fill-red-500"
                : "text-gray-500 hover:text-red-500 transition"
            }
          />
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-center mb-2">
          <span className="flex items-center text-gray-700 border border-gray-300 px-3 py-1 rounded-full text-xs">
            Miễn thế chấp
          </span>
        </div>
        <h2 className="text-base font-semibold text-gray-800 uppercase">
          {vehicle.model} {vehicle.year}
        </h2>
        <div className="flex items-center gap-5 mb-2 text-sm text-gray-600 flex-wrap">
          {iconSpecs.map((spec, index) => (
            <span key={index} className="flex items-center gap-2">
              {spec.icon} {spec.value}
            </span>
          ))}
        </div>
        <p className="flex items-center gap-1 text-sm text-gray-500">
          <MapPin size={16} /> {vehicle.location}
        </p>
        {vehicle.features && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-700">
            {vehicle.features.map((f, i) => (
              <span
                key={i}
                className="bg-gray-100 px-2 py-1 rounded-full border border-gray-200"
              >
                {f}
              </span>
            ))}
          </div>
        )}
        <hr className="my-3 border-gray-200" />
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-green-700 font-bold text-lg">
              {formatCurrency(vehicle.price_per_day)} / ngày
            </p>
            {vehicle.price_per_hour && (
              <p className="text-gray-500 text-sm">
                {formatCurrency(vehicle.price_per_hour)} / giờ
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 text-gray-700 text-sm">
            <Star size={16} className="text-yellow-500" />
            {vehicle.rating || "5.0"} ({vehicle.rent_count || "3"} chuyến)
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
