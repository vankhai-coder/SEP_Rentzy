import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchVehicles } from "../../../redux/features/renter/vehicles/vehicleSlice";
import { fetchBrands } from "../../../redux/features/renter/brand/brandSlice";
import CarList from "../../../components/renter/vehicles/car/CarList";
import BrandList from "../../../components/renter/brand/BrandList";
import { fetchFavorites } from "../../../redux/features/renter/favorite/favoriteSlice";
import { useNavigate, useSearchParams } from "react-router-dom";
import SearchForm from "../../../components/renter/search/SearchForm";

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
      <h2 className="text-2xl font-bold mb-4">Danh Sách Xe Ô Tô</h2>
      {vehicleLoading ? <p>Loading...</p> : <CarList cars={vehicles} />}
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

export default HomeCar;
