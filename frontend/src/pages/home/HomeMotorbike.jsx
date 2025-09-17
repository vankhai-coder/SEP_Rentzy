import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchVehicles } from "../../redux/features/vehicles/vehicleSlice";
import MotorbikeList from "../../components/vehicles/motorbike/MotorbikeList";

const HomeMotorbike = () => {
  const dispatch = useDispatch();
  const { vehicles, loading, error } = useSelector(
    (state) => state.vehicleStore
  );

  useEffect(() => {
    dispatch(fetchVehicles("motorbike"));
  }, [dispatch]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

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
      <MotorbikeList bikes={vehicles} />

      {/* Giới thiệu hãng xe */}
      <section className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Hãng Xe Nổi Bật</h2>
      </section>
    </div>
  );
};

export default HomeMotorbike;
