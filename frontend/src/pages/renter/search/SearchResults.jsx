import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { searchVehicles } from "../../../redux/features/renter/vehicles/vehicleSlice";
import SearchForm from "../../../components/renter/search/SearchForm";
import FilterBar from "../../../components/renter/search/FilterSidebar"; // FIX: Đổi tên import nếu cần (trước là FilterSidebar?)
import VehicleCard from "../../../components/renter/vehicles/VehicleCard";
import {
  Calendar,
  MapPin,
  AlertCircle,
  Settings,
  Users,
  Fuel,
  Bike,
  Gauge,
} from "lucide-react"; // Thêm icons cho specs giống HomeCar
import CompareModal from "../../../components/renter/vehicles/compare/CompareModal"; // Mới: Import modal
import { compareVehicles } from "../../../redux/features/renter/compare/compareSlice"; // Mới: Import action
import { Scale } from "lucide-react"; // Mới: Icon cho nút so sánh
import { toast } from "react-toastify"; // Mới: Toast cho warn
import { useState } from "react"; // Mới: Dùng cho modal

const SearchResults = ({ type }) => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    searchVehicles: vehicles,
    searchLoading,
    error,
  } = useSelector((state) => state.vehicleStore);
  const { brands } = useSelector((state) => state.brandStore);
  const { compareList } = useSelector((state) => state.compareStore); // Mới: Lấy danh sách so sánh
  const [showModal, setShowModal] = useState(false); // Mới: State điều khiển modal
  const params = Object.fromEntries(searchParams.entries());
  const paramsKey = searchParams.toString();

  useEffect(() => {
    console.log("➡️ Fetching search results with params:", params);
    dispatch(searchVehicles({ type, params }))
      .unwrap()
      .catch((err) => {
        console.error("Search error:", err);
      });
  }, [dispatch, type, paramsKey]);

  // FIX: Helper để clean params - Loại keys với value undefined/null/empty (bao gồm khi clear explicit)
  const cleanParams = useCallback((dirtyParams) => {
    return Object.fromEntries(
      Object.entries(dirtyParams).filter(
        ([, value]) => value !== undefined && value !== null && value !== ""
      )
    );
  }, []);

  const handleSearch = useCallback(
    (formData) => {
      console.log("🔍 SEARCH FORM DATA:", formData);
      const newParams = cleanParams({ ...params, ...formData }); // FIX: Clean trước merge
      setSearchParams(newParams);
    },
    [params, setSearchParams, cleanParams]
  );

  const handleFilterChange = useCallback(
    (filters) => {
      console.log("🎚️ FILTER CHANGED:", filters);
      const newParams = cleanParams({ ...params, ...filters }); // FIX: Clean để tránh "undefined" và clear explicit (như brand_id: undefined)
      setSearchParams(newParams);
    },
    [params, setSearchParams, cleanParams]
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

  // Helper function để format fuel_type (để fix hiển thị "xe điện" nếu cần)
  const formatFuelType = (fuel) => {
    if (!fuel) return "N/A";
    const normalized = fuel.toLowerCase();
    if (normalized.includes("xăng") || normalized.includes("petrol"))
      return "Xăng";
    if (normalized.includes("điện") || normalized.includes("electric"))
      return "Điện";
    return fuel.charAt(0).toUpperCase() + fuel.slice(1); // Capitalize mặc định
  };

  // Helper function để format transmission (cho xe hơi)
  const formatTransmission = (trans) => {
    if (!trans) return "N/A";
    const normalized = trans.toLowerCase();
    if (
      normalized.includes("auto") ||
      normalized.includes("automatic") ||
      normalized.includes("at")
    )
      return "Tự động";
    if (normalized.includes("manual") || normalized.includes("mt"))
      return "Số sàn";
    return trans.charAt(0).toUpperCase() + trans.slice(1); // Capitalize mặc định
  };

  // CẬP NHẬT: Helper function để format bike_type (cho xe máy) - map tiếng Việt theo ví dụ: Xe ga, Xe côn, Xe số, Xe điện
  const formatBikeType = (bikeType) => {
    if (!bikeType) return "N/A";
    const normalized = bikeType.toLowerCase();
    if (
      normalized.includes("scooter") ||
      normalized.includes("ga") ||
      normalized.includes("dutch")
    )
      return "Xe ga"; // scooter/dutch → Xe ga
    if (normalized.includes("clutch") || normalized.includes("côn"))
      return "Xe côn"; // clutch → Xe côn
    if (normalized.includes("manual") || normalized.includes("số"))
      return "Xe số"; // manual → Xe số
    if (normalized.includes("electric") || normalized.includes("điện"))
      return "Xe điện"; // electric → Xe điện
    return bikeType.charAt(0).toUpperCase() + bikeType.slice(1); // Capitalize mặc định
  };

  const renderVehicleList = () => {
    if (searchLoading)
      return <p className="text-center py-8">Đang tải xe...</p>;
    if (error)
      return (
        <div className="text-center py-8 text-red-500 flex items-center justify-center">
          <AlertCircle size={24} className="mr-2" />
          <span>Lỗi tải dữ liệu: {error}</span>
        </div>
      );
    if (!vehicles || vehicles.length === 0)
      return (
        <div className="text-center py-8 text-gray-600">
          <p>Không tìm thấy xe phù hợp. Hãy thử thay đổi bộ lọc.</p>
        </div>
      );

    // SỬA: Log data để debug (xóa sau khi test) - in raw và formatted cho bike_type
    console.log(
      "🔍 Vehicles data (motorbike example):",
      vehicles.map((v) => ({
        bike_type_raw: v.bike_type,
        bike_type_formatted: formatBikeType(v.bike_type),
        fuel_type: v.fuel_type,
        engine_capacity: v.engine_capacity,
      }))
    );

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
        {vehicles.map((vehicle) => {
          // SỬA: Set iconSpecs riêng cho từng vehicle dựa trên type và fields của nó
          let iconSpecs = [
            { icon: <Calendar size={16} />, value: vehicle.year || "N/A" }, // Fallback mặc định (nếu cần year ở specs)
            { icon: <MapPin size={16} />, value: vehicle.location || "N/A" },
          ];

          if (type === "car") {
            iconSpecs = [
              {
                icon: <Settings size={16} />,
                value: formatTransmission(vehicle.transmission), // Format transmission
              },
              {
                icon: <Users size={16} />,
                value: `${vehicle.seats || "N/A"} chỗ`,
              },
              {
                icon: <Fuel size={16} />,
                value: formatFuelType(vehicle.fuel_type),
              },
            ];
          } else if (type === "motorbike") {
            iconSpecs = [
              {
                icon: <Bike size={16} />,
                value: formatBikeType(vehicle.bike_type), // CẬP NHẬT: Map tiếng Việt (scooter → Xe ga, clutch → Xe côn, manual → Xe số, electric → Xe điện)
              },
              {
                icon: <Gauge size={16} />,
                value: `${vehicle.engine_capacity || "N/A"}cc`, // Xử lý NULL → N/A cc
              },
              {
                icon: <Fuel size={16} />,
                value: formatFuelType(vehicle.fuel_type), // Ví dụ: electric → Điện
              },
            ];
          }

          return (
            <VehicleCard
              key={vehicle.vehicle_id}
              vehicle={vehicle}
              type={type} // Truyền type để handleCompare hoạt động
              iconSpecs={iconSpecs} // SỬA: Specs riêng cho từng xe
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6">
      {/* 🔍 Thanh tìm kiếm */}
      <section className="mt-[-50px]">
        {" "}
        {/* 👉 có thể chỉnh số px tùy ý */}
        <SearchForm
          type={type}
          brands={brands}
          initialValues={params}
          onSubmit={handleSearch}
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
      {/* 🔹 Filter ngang */}
      <section className="mt-6">
        <FilterBar
          type={type}
          brands={brands}
          initialValues={params}
          onFilterChange={handleFilterChange}
        />
      </section>
      {/* 🔹 Kết quả */}
      <section className="mt-8">{renderVehicleList()}</section>
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

export default SearchResults;
