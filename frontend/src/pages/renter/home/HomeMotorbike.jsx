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
// **Giữ nguyên**: Import InfiniteScroll
import InfiniteScroll from "react-infinite-scroll-component";

// **MỚI: Component SkeletonCard - Tương tự HomeCar**
const SkeletonCard = () => (
  <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 animate-pulse">
    <div className="relative">
      <div className="w-full h-56 bg-gray-300 skeleton"></div>
      <div className="absolute top-3 right-3 w-5 h-5 bg-gray-300 rounded-full skeleton"></div>
      <div className="absolute top-3 right-12 w-5 h-5 bg-gray-300 rounded-full skeleton"></div>
    </div>
    <div className="p-4 space-y-3">
      <div className="flex items-center">
        <div className="w-20 h-4 bg-gray-300 rounded-full skeleton"></div>
      </div>
      <div className="h-5 bg-gray-300 rounded skeleton"></div>
      <div className="flex gap-5">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 rounded-full skeleton"></div>
          <div className="w-12 h-3 bg-gray-300 rounded skeleton"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 rounded-full skeleton"></div>
          <div className="w-12 h-3 bg-gray-300 rounded skeleton"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 rounded-full skeleton"></div>
          <div className="w-12 h-3 bg-gray-300 rounded skeleton"></div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-4 h-3 bg-gray-300 rounded skeleton"></div>
        <div className="w-20 h-3 bg-gray-300 rounded skeleton ml-1"></div>
      </div>
      <hr className="border-gray-200" />
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <div className="h-5 w-24 bg-gray-300 rounded skeleton"></div>
          <div className="h-3 w-16 bg-gray-300 rounded skeleton"></div>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gray-300 rounded-full skeleton"></div>
          <div className="w-16 h-3 bg-gray-300 rounded skeleton"></div>
        </div>
      </div>
    </div>
  </div>
);

// **Giữ nguyên**: Phần còn lại của HomeMotorbike
const HomeMotorbike = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = Object.fromEntries(searchParams.entries());

  // **Giữ nguyên**: Selector
  const {
    vehicles,
    loading: vehicleLoading,
    totalCount,
  } = useSelector((state) => state.vehicleStore);
  const {
    brands,
    loading: brandLoading,
    error: brandError,
  } = useSelector((state) => state.brandStore);
  const { userId } = useSelector((state) => state.userStore);
  const { compareList } = useSelector((state) => state.compareStore); // Mới: Lấy danh sách so sánh

  const [showModal, setShowModal] = useState(false); // Mới: State điều khiển modal
  // **Giữ nguyên**: State infinite scroll
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 12; // Fixed limit

  // **Giữ nguyên**: useEffect
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    dispatch(fetchVehicles({ type: "motorbike", page: 1, limit }));
    dispatch(fetchBrands("motorbike"));
    if (userId) {
      console.log("Fetching favorites for user:", userId);
      dispatch(fetchFavorites());
    }
  }, [dispatch, userId]);

  // **Giữ nguyên**: loadMore
  const loadMore = useCallback(async () => {
    const nextPage = page + 1;
    const actionResult = await dispatch(
      fetchVehicles({ type: "motorbike", page: nextPage, limit })
    );
    if (actionResult.payload) {
      const { vehicles: newVehicles } = actionResult.payload;
      if (newVehicles.length < limit) {
        setHasMore(false);
      }
      setPage(nextPage);
    }
  }, [dispatch, page, limit]);

  // **Giữ nguyên 100%**: handleSearch, handleOpenCompare
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

  // **SỬA: Render skeletons tương tự HomeCar**
  const renderSkeletons = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: limit }).map((_, index) => (
        <SkeletonCard key={`skeleton-${index}`} />
      ))}
    </div>
  );

  return (
    <div className="container mx-auto p-6 pt-1">
      {/* **Giữ nguyên 100%**: SearchForm, nút Compare, BrandList */}
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
          <BrandList brands={brands.slice(0, 8)} />
        )}
      </section>

      {/* **SỬA: Phần Danh Sách Xe - Tương tự HomeCar */}
      <h2 className="text-2xl font-bold mb-4">Danh Sách Xe Máy</h2>
      {vehicleLoading && page === 1 ? (
        renderSkeletons() // **SỬA: Skeletons cho initial**
      ) : (
        <InfiniteScroll
          dataLength={vehicles.length}
          next={loadMore}
          hasMore={hasMore && !vehicleLoading}
          loader={
            <div className="text-center py-4">
              <p className="text-gray-500">Đang tải thêm...</p>{" "}
              {/* **SỬA: Loader "..." ở cuối */}
            </div>
          }
          endMessage={
            <p className="text-center py-4 text-gray-500">
              Đã tải hết {totalCount} xe!
            </p>
          }
          scrollThreshold={0.9} // **SỬA: Trigger sớm hơn cho mượt**
          className="infinite-scroll-container"
          style={{ overflow: "visible" }}
        >
          <MotorbikeList bikes={vehicles} />
        </InfiniteScroll>
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
