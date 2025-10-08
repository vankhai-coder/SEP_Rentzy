import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchVehicles } from "../../../redux/features/renter/vehicles/vehicleSlice";
import { fetchBrands } from "../../../redux/features/renter/brand/brandSlice";
import CarList from "../../../components/renter/vehicles/car/CarList";
import BrandList from "../../../components/renter/brand/BrandList";
import { fetchFavorites } from "../../../redux/features/renter/favorite/favoriteSlice";

const HomeCar = () => {
  const dispatch = useDispatch();
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
      console.log("Fetching favorites for user:", userId); // Debug
      dispatch(fetchFavorites());
    }
  }, [dispatch, userId]);

  return (
    <div className="container mx-auto p-6">
      <section className="bg-green-100 p-10 rounded-lg text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Thuê Xe Ô Tô Chất Lượng Cao</h1>
        <p className="text-lg mb-4">
          Chọn từ hàng trăm mẫu xe hiện đại, giá cả phải chăng.
        </p>
        <button className="bg-green-500 text-white px-6 py-3 rounded">
          Tìm xe ngay
        </button>
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
