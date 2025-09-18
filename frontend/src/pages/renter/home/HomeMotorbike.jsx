import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchVehicles } from "../../../redux/features/renter/vehicles/vehicleSlice";
import { fetchBrands } from "../../../redux/features/renter/brand/brandSlice";
import MotorbikeList from "../../../components/renter/vehicles/motorbike/MotorbikeList";
import BrandList from "../../../components/renter/brand/BrandList";

const HomeMotorbike = () => {
  const dispatch = useDispatch();
  const { vehicles, loading: vehicleLoading } = useSelector(
    (state) => state.vehicleStore
  );
  const {
    brands,
    loading: brandLoading,
    error: brandError,
  } = useSelector((state) => state.brandStore);

  useEffect(() => {
    dispatch(fetchVehicles("motorbike"));
    dispatch(fetchBrands("motorbike"));
  }, [dispatch]);

  return (
    <div className="container mx-auto p-6">
      {/* Hero Section */}
      <section className="bg-blue-100 p-10 rounded-lg text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Thuê Xe Máy Linh Hoạt</h1>
        <p className="text-lg mb-4">
          Di chuyển dễ dàng với xe máy chất lượng từ các hãng hàng đầu.
        </p>
        <button className="bg-blue-500 text-white px-6 py-3 rounded">
          Tìm xe ngay
        </button>
      </section>

      {/* Danh sách xe */}
      <h2 className="text-2xl font-bold mb-4">Danh Sách Xe Máy</h2>
      {vehicleLoading ? <p>Loading...</p> : <MotorbikeList bikes={vehicles} />}

      {/* Giới thiệu hãng xe */}
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
