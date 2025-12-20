import { MapPin, Heart, Star, Scale } from "lucide-react"; // Thêm Scale
import { useDispatch, useSelector } from "react-redux";
import {
  addFavorite,
  removeFavorite,
} from "../../../redux/features/renter/favorite/favoriteSlice";
import {
  addToCompare,
  removeFromCompare,
} from "../../../redux/features/renter/compare/compareSlice"; // Thêm removeFromCompare
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN").format(value) + " VND";
};

const VehicleCard = ({ vehicle, iconSpecs, type }) => {
  // **Giữ nguyên 100%**: Tất cả logic (dispatch, state, handlers)
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useSelector((state) => state.userStore);
  const { favorites } = useSelector((state) => state.favoriteStore);
  const { compareList } = useSelector((state) => state.compareStore); // Mới: Lấy compare list

  const [isFavoriteLocal, setIsFavoriteLocal] = useState(
    favorites.some((fav) => fav.vehicle_id === vehicle.vehicle_id)
  );

  const handleFavorite = async (e) => {
    // Prevent event bubbling to stop navigation when clicking heart
    e.stopPropagation();

    if (!userId) {
      // create ramdom string : 
      const ramdomString = Math.random().toString(36).substring(2, 15);
      // toast.info("Vui lòng đăng nhập để thêm yêu thích!");
      navigate(`/cars?isToggleLoginDialog=${ramdomString}`);
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

  // Mới: Function handle so sánh - Toggle add/remove
  const handleCompare = async (e) => {
    e.stopPropagation(); // Ngăn bubble đến onClick card
    if (!type) {
      toast.error("Không xác định loại xe!");
      return;
    }

    const isCurrentlyInCompare = compareList.some(
      (item) => item.id === vehicle.vehicle_id
    );

    try {
      if (isCurrentlyInCompare) {
        // Xóa khỏi so sánh
        await dispatch(removeFromCompare(vehicle.vehicle_id)).unwrap();
        toast.success("Đã xóa khỏi so sánh!");
      } else {
        // Thêm vào so sánh
        await dispatch(
          addToCompare({
            id: vehicle.vehicle_id,
            type,
            model: `${vehicle.model} ${vehicle.year}`,
          })
        ).unwrap();
        toast.success("Đã thêm vào so sánh!");
      }
    } catch (error) {
      toast.error(error || "Lỗi cập nhật so sánh!");
    }
  };

  // ✨ Thêm function để navigate đến trang detail
  const handleCardClick = () => {
    const query = location.search || "";
    // Giữ nguyên các tham số tìm kiếm (start_date, end_date, start_time, end_time)
    navigate(`/detail/${vehicle.vehicle_id}${query}`);
  };

  return (
    <div
      className="bg-white rounded-xl shadow-md cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-transform duration-200 ease-out overflow-hidden border border-gray-100 flex flex-col h-full"
      onClick={handleCardClick}
    >
      <div className="relative">
        {/* **SỬA: Thêm loading="lazy" để lazy load img, giảm lag initial */}
        <img
          src={vehicle.main_image_url}
          alt={vehicle.model}
          className="w-full h-56 object-cover"
          loading="lazy" // **SỬA: Lazy load để mượt**
        />
        {vehicle.discount && (
          <span className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 text-sm rounded-full shadow">
            -{vehicle.discount}%
          </span>
        )}
        {/* Nút So Sánh - Toggle add/remove */}
        <button
          className="absolute top-3 right-12 p-2 rounded-full bg-white shadow hover:bg-blue-50 cursor-pointer"
          onClick={handleCompare}
          title={
            compareList.some((item) => item.id === vehicle.vehicle_id)
              ? "Xóa khỏi so sánh"
              : "Thêm vào so sánh"
          }
        >
          <Scale
            size={20}
            className={
              compareList.some((item) => item.id === vehicle.vehicle_id)
                ? "text-blue-500 fill-blue-500"
                : "text-gray-500 hover:text-blue-500 transition"
            }
          />
        </button>
        {/* Nút Heart Cũ: Giữ nguyên */}
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
      {/* **Giữ nguyên 100%**: Phần nội dung dưới img */}
      <div className="p-4 flex flex-col flex-grow">
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
            {vehicle.features.slice(0, 3).map(
              (
                f,
                i // SỬA: Chỉ lấy 3 features đầu tiên
              ) => (
                <span
                  key={i}
                  className="bg-gray-100 px-2 py-1 rounded-full border border-gray-200"
                >
                  {f}
                </span>
              )
            )}
          </div>
        )}
        <div className="flex-grow"></div>
        <hr className="my-3 border-gray-200" />
        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-green-700 font-bold text-base whitespace-nowrap">
              {formatCurrency(vehicle.price_per_day)} / ngày
            </p>
            {vehicle.price_per_hour && (
              <p className="text-gray-500 text-xs">
                {formatCurrency(vehicle.price_per_hour)} / giờ
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 text-gray-700 text-xs">
            <Star size={14} className="text-yellow-500" />
            <span className="whitespace-nowrap">
              {vehicle.rating ?? "5.0"} ({vehicle.rent_count ?? "3"} chuyến)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
