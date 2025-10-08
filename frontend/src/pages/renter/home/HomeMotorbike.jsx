import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchVehicles } from "../../../redux/features/renter/vehicles/vehicleSlice";
import { fetchBrands } from "../../../redux/features/renter/brand/brandSlice";
import MotorbikeList from "../../../components/renter/vehicles/motorbike/MotorbikeList";
import BrandList from "../../../components/renter/brand/BrandList";
import { fetchFavorites } from "../../../redux/features/renter/favorite/favoriteSlice";
import { useNavigate, useSearchParams } from "react-router-dom";
import SearchForm from "../../../components/renter/search/SearchForm";

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

  return (
    <div className="container mx-auto p-6">
      <section className="mb-8">
        <SearchForm
          type="motorbike"
          brands={brands}
          initialValues={params}
          onSubmit={handleSearch}
          className="bg-blue-100 p-10 rounded-lg"
        />
      </section>

      <h2 className="text-2xl font-bold mb-4">Danh Sách Xe Máy</h2>
      {vehicleLoading ? (
        <p>Đang tải xe...</p>
      ) : (
        <MotorbikeList bikes={vehicles} />
      )}

      <section className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Hãng Xe Nổi Bật</h2>
        {brandLoading ? (
          <p>Đang tải hãng xe...</p>
        ) : brandError ? (
          <p>{brandError}</p>
        ) : (
          <BrandList brands={brands} />
        )}
      </section>
    </div>
  );
};

export default HomeMotorbike;
