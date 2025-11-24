// src/pages/renter/vehicles/HomeMotorbike.jsx (hoặc tương tự)
import { useEffect, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchVehicles } from "../../../redux/features/renter/vehicles/vehicleSlice";
import { fetchBrands } from "../../../redux/features/renter/brand/brandSlice";
import { fetchFavorites } from "../../../redux/features/renter/favorite/favoriteSlice";
import MotorbikeList from "../../../components/renter/vehicles/motorbike/MotorbikeList";
import BrandList from "../../../components/renter/brand/BrandList";
import SearchForm from "../../../components/renter/search/SearchForm";
import Pagination from "../../../components/common/Pagination";
import CompareModal from "../../../components/renter/vehicles/compare/CompareModal";
import { compareVehicles } from "../../../redux/features/renter/compare/compareSlice";
import { Scale } from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate, useSearchParams } from "react-router-dom";

const HomeMotorbike = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = Object.fromEntries(searchParams.entries());

  const {
    vehicles,
    loading: vehicleLoading,
    currentPage,
    totalPages,
  } = useSelector((state) => state.vehicleStore);

  const {
    brands,
    loading: brandLoading,
    error: brandError,
  } = useSelector((state) => state.brandStore);

  const { userId } = useSelector((state) => state.userStore);
  const { compareList } = useSelector((state) => state.compareStore);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    dispatch(fetchVehicles({ type: "motorbike", page: 1, limit: 8 }));
    dispatch(fetchBrands("motorbike"));
    if (userId) dispatch(fetchFavorites());
  }, [dispatch, userId]);

  const handleSearch = useCallback(
    (formData) => {
      if (!formData.location?.trim()) {
        toast.error("Vui lòng chọn địa điểm!");
        return;
      }
      const newParams = { ...params, ...formData };
      setSearchParams(newParams);
      navigate(`/motorbikes/search?${new URLSearchParams(newParams)}`);
    },
    [params, navigate, setSearchParams]
  );

  const handlePageChange = (page) => {
    dispatch(fetchVehicles({ type: "motorbike", page, limit: 8 }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenCompare = () => {
    if (compareList.length < 2) {
      toast.warn("Chọn ít nhất 2 xe để so sánh!");
      return;
    }
    dispatch(compareVehicles());
    setShowModal(true);
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
      <section className="mb-3 sm:mb-4">
        <SearchForm
          type="motorbike"
          brands={brands}
          initialValues={params}
          onSubmit={handleSearch}
          className="bg-blue-100 p-4 sm:p-6 md:p-8 lg:p-10 rounded-lg"
        />
      </section>

      <div className="flex justify-end mb-3 sm:mb-4">
        {compareList.length > 0 && (
          <button
            onClick={handleOpenCompare}
            className="flex items-center gap-1 sm:gap-2 bg-blue-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-sm sm:text-base"
            disabled={compareList.length < 2}
          >
            <Scale size={16} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">So Sánh ({compareList.length} xe)</span>
            <span className="sm:hidden">So Sánh</span>
          </button>
        )}
      </div>

      <section className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Hãng Xe Nổi Bật</h2>
        {brandLoading ? (
          <p>Đang tải hãng xe...</p>
        ) : brandError ? (
          <p>{brandError}</p>
        ) : (
          <BrandList brands={brands.slice(0, 8)} vehicleType="motorbike" />
        )}
      </section>

      <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Danh Sách Xe Máy</h2>

      {vehicleLoading ? (
        <p className="text-center py-10">Đang tải xe máy...</p>
      ) : (
        <MotorbikeList bikes={vehicles} />
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

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

export default HomeMotorbike;
