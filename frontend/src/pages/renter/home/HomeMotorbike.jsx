import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchVehicles } from "../../../redux/features/renter/vehicles/vehicleSlice";
import { fetchBrands } from "../../../redux/features/renter/brand/brandSlice";
import MotorbikeList from "../../../components/renter/vehicles/motorbike/MotorbikeList";
import BrandList from "../../../components/renter/brand/BrandList";
import { fetchFavorites } from "../../../redux/features/renter/favorite/favoriteSlice";
import { useNavigate, useSearchParams } from "react-router-dom";
import SearchForm from "../../../components/renter/search/SearchForm";
import CompareModal from "../../../components/renter/vehicles/compare/CompareModal"; // Mới: Import modal
import { compareVehicles } from "../../../redux/features/renter/compare/compareSlice"; // Mới: Import action
import { Scale } from "lucide-react"; // Mới: Icon cho nút so sánh
import { toast } from "react-toastify"; // Mới: Toast cho warn
import { useState } from "react"; // Đã có, nhưng dùng cho modal

const HomeMotorbike = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = Object.fromEntries(searchParams.entries());

  const { vehicles, loading: vehicleLoading } = useSelector(
    (state) => state.vehicleStore
  );
  const {
    brands,
    loading: brandLoading,
    error: brandError,
  } = useSelector((state) => state.brandStore);
  const { userId } = useSelector((state) => state.userStore);
  const { compareList } = useSelector((state) => state.compareStore); // Mới: Lấy danh sách so sánh

  const [showModal, setShowModal] = useState(false); // Mới: State điều khiển modal

  useEffect(() => {
    dispatch(fetchVehicles("motorbike"));
    dispatch(fetchBrands("motorbike"));
    if (userId) {
      console.log("Fetching favorites for user:", userId);
      dispatch(fetchFavorites());
    }
  }, [dispatch, userId]);

  const handleSearch = useCallback(
    (formData) => {
      if (!formData.location?.trim()) {
        alert("Vui lòng chọn địa điểm!");
        return;
      }

      const newParams = { ...params, ...formData };
      const queryString = new URLSearchParams(newParams).toString();
      console.log("🔍 HOME MOTO SEARCH PARAMS:", newParams);

      setSearchParams(newParams);
      navigate(`/motorbikes/search?${queryString}`);
    },
    [params, navigate, setSearchParams]
  );

  // Mới: Function xử lý mở so sánh (tương tự HomeCar)
  const handleOpenCompare = () => {
    if (compareList.length < 2) {
      toast.warn("Chọn ít nhất 2 xe để so sánh!");
      return;
    }
    dispatch(compareVehicles());
    setShowModal(true);
  };

  return (
    <div className="container mx-auto p-6 pt-1">
      <section className="mb-4">
        <SearchForm
          type="motorbike"
          brands={brands}
          initialValues={params}
          onSubmit={handleSearch}
          className="bg-blue-100 p-10 rounded-lg"
        />
      </section>

      {/* Mới: Nút So Sánh - Đặt ở top right sau SearchForm */}
      <div className="flex justify-end mb-4">
        {compareList.length > 0 && (
          <button
            onClick={handleOpenCompare}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={compareList.length < 2}
          >
            <Scale size={20} />
            So Sánh ({compareList.length} xe)
          </button>
        )}
      </div>

      {/* Phần BrandList - Đưa lên đầu tiên (sau nút so sánh) */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Hãng Xe Nổi Bật</h2>
        {brandLoading ? (
          <p>Đang tải hãng xe...</p>
        ) : brandError ? (
          <p>{brandError}</p>
        ) : (
          <BrandList brands={brands} />
        )}
      </section>

      {/* Phần Danh Sách Xe - Đưa xuống sau BrandList */}
      <h2 className="text-2xl font-bold mb-4">Danh Sách Xe Máy</h2>
      {vehicleLoading ? (
        <p>Đang tải xe...</p>
      ) : (
        <MotorbikeList bikes={vehicles} />
      )}

      {/* Hiển thị modal so sánh khi showModal = true */}
      {showModal && (
        <CompareModal
          compareList={compareList}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default HomeMotorbike;
