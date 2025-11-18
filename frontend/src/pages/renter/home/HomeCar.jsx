import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchVehicles } from "../../../redux/features/renter/vehicles/vehicleSlice";
import { fetchBrands } from "../../../redux/features/renter/brand/brandSlice";
import CarList from "../../../components/renter/vehicles/car/CarList";
import BrandList from "../../../components/renter/brand/BrandList";
import { fetchFavorites } from "../../../redux/features/renter/favorite/favoriteSlice";
import { useNavigate, useSearchParams } from "react-router-dom";
import SearchForm from "../../../components/renter/search/SearchForm";
import CompareModal from "../../../components/renter/vehicles/compare/CompareModal"; // Mới: Import modal
import { compareVehicles } from "../../../redux/features/renter/compare/compareSlice"; // Mới: Import action
import { Scale } from "lucide-react"; // Mới: Icon cho nút so sánh
import { toast } from "react-toastify"; // Mới: Toast cho warn
import { useState } from "react"; // Đã có, nhưng dùng cho modal

const HomeCar = () => {
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
    dispatch(fetchVehicles("car"));
    dispatch(fetchBrands("car"));
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
      console.log("🔍 HOME SEARCH PARAMS:", newParams);

      setSearchParams(newParams);

      navigate(`/cars/search?${queryString}`);
    },
    [params, navigate, setSearchParams]
  );

  // Mới: Function xử lý mở so sánh
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
          type="car"
          brands={brands}
          initialValues={params}
          onSubmit={handleSearch}
          className="bg-green-100 p-10 rounded-lg"
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
          <BrandList brands={brands.slice(0, 8)} />
        )}
      </section>

      {/* Phần Danh Sách Xe - Đưa xuống sau BrandList */}
      <h2 className="text-2xl font-bold mb-4">Danh Sách Xe Ô Tô</h2>
      {vehicleLoading ? <p>Loading...</p> : <CarList cars={vehicles} />}

      {/* Mới: Modal so sánh - hiển thị khi showModal = true */}
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

export default HomeCar;
