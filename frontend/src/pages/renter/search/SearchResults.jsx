import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { searchVehicles } from "../../../redux/features/renter/vehicles/vehicleSlice";
import SearchForm from "../../../components/renter/search/SearchForm";
import FilterBar from "../../../components/renter/search/FilterSidebar";
import VehicleCard from "../../../components/renter/vehicles/VehicleCard";
import Pagination from "../../../components/common/Pagination";
import {
  Calendar,
  MapPin,
  AlertCircle,
  Settings,
  Users,
  Fuel,
  Bike,
  Gauge,
} from "lucide-react";
import CompareModal from "../../../components/renter/vehicles/compare/CompareModal";
import { compareVehicles } from "../../../redux/features/renter/compare/compareSlice";
import { Scale } from "lucide-react";
import { toast } from "react-toastify";
import { useState } from "react";

const SearchResults = ({ type }) => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { searchResults, searchLoading, searchError } = useSelector(
    (state) => state.vehicleStore
  );
  const { brands: globalBrands } = useSelector((state) => state.brandStore);
  const { compareList } = useSelector((state) => state.compareStore);
  const [showModal, setShowModal] = useState(false);
  const params = Object.fromEntries(searchParams.entries());
  const paramsKey = searchParams.toString();

  const vehicles = searchResults?.data || [];
  const pagination = searchResults?.pagination || {};
  const filterOptions = searchResults?.filterOptions || { brands: [] };

  useEffect(() => {
    console.log("➡️ Fetching search results with params:", params);
    dispatch(searchVehicles({ type, params }))
      .unwrap()
      .catch((err) => {
        console.error("Search error:", err);
      });
  }, [dispatch, type, paramsKey]);

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
      const newParams = cleanParams({ ...params, ...formData, limit: 8 }); // SỬA: Thống nhất limit=8
      setSearchParams(newParams);
    },
    [params, setSearchParams, cleanParams]
  );

  const handleFilterChange = useCallback(
    (filters) => {
      console.log("🎚️ FILTER CHANGED:", filters);
      const newParams = cleanParams({ ...params, ...filters, limit: 8 }); // SỬA: Thống nhất limit=8
      setSearchParams(newParams);
    },
    [params, setSearchParams, cleanParams]
  );

  const handlePageChange = useCallback(
    (page) => {
      const newParams = { ...params, page: page.toString(), limit: 8 }; // SỬA: Giữ limit=8
      setSearchParams(newParams);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [params, setSearchParams]
  );

  const handleOpenCompare = () => {
    if (compareList.length < 2) {
      toast.warn("Chọn ít nhất 2 xe để so sánh!");
      return;
    }
    dispatch(compareVehicles());
    setShowModal(true);
  };

  // FIX: Helper để lấy text button dựa trên count
  const getCompareButtonText = () => {
    if (compareList.length < 2) return "Chọn ít nhất 2 xe";
    return `So Sánh (${compareList.length} xe)`;
  };

  // 2026 FIX: Dynamic aria-label cho accessibility
  const getAriaLabel = () => {
    if (compareList.length < 2) return "Chọn ít nhất 2 xe để so sánh";
    return `So sánh ${compareList.length} xe đã chọn`;
  };

  const formatFuelType = (fuel) => {
    if (!fuel) return "N/A";
    const normalized = fuel.toLowerCase();
    if (normalized.includes("xăng") || normalized.includes("petrol"))
      return "Xăng";
    if (normalized.includes("điện") || normalized.includes("electric"))
      return "Điện";
    return fuel.charAt(0).toUpperCase() + fuel.slice(1);
  };

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
    return trans.charAt(0).toUpperCase() + trans.slice(1);
  };

  const formatBikeType = (bikeType) => {
    if (!bikeType) return "N/A";
    const normalized = bikeType.toLowerCase();
    if (
      normalized.includes("scooter") ||
      normalized.includes("ga") ||
      normalized.includes("dutch")
    )
      return "Xe ga";
    if (normalized.includes("clutch") || normalized.includes("côn"))
      return "Xe côn";
    if (normalized.includes("manual") || normalized.includes("số"))
      return "Xe số";
    if (normalized.includes("electric") || normalized.includes("điện"))
      return "Xe điện";
    return bikeType.charAt(0).toUpperCase() + bikeType.slice(1);
  };

  const renderVehicleList = () => {
    if (searchLoading)
      return <p className="text-center py-8">Đang tải xe...</p>;
    if (searchError)
      return (
        <div className="text-center py-8 text-red-500 flex items-center justify-center">
          <AlertCircle size={24} className="mr-2" />
          <span>Lỗi tải dữ liệu: {searchError}</span>
        </div>
      );
    if (!vehicles || vehicles.length === 0)
      return (
        <div className="text-center py-8 text-gray-600">
          <p>Không tìm thấy xe phù hợp. Hãy thử thay đổi bộ lọc.</p>
        </div>
      );

    console.log(
      "🔍 Vehicles data (motorbike example):",
      vehicles.map((v) => ({
        bike_type_raw: v.bike_type,
        bike_type_formatted: formatBikeType(v.bike_type),
        fuel_type: v.fuel_type,
        engine_capacity: v.engine_capacity,
      }))
    );
    console.log("🔍 Filter Options from DB:", filterOptions);

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mt-6 items-stretch">
        {vehicles.map((vehicle) => {
          let iconSpecs = [
            { icon: <Calendar size={16} />, value: vehicle.year || "N/A" },
            { icon: <MapPin size={16} />, value: vehicle.location || "N/A" },
          ];

          if (type === "car") {
            iconSpecs = [
              {
                icon: <Settings size={16} />,
                value: formatTransmission(vehicle.transmission),
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
                value: formatBikeType(vehicle.bike_type),
              },
              {
                icon: <Gauge size={16} />,
                value: `${vehicle.engine_capacity || "N/A"}cc`,
              },
              {
                icon: <Fuel size={16} />,
                value: formatFuelType(vehicle.fuel_type),
              },
            ];
          }

          return (
            <VehicleCard
              key={vehicle.vehicle_id}
              vehicle={vehicle}
              type={type}
              iconSpecs={iconSpecs}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
      <section className="mt-[-30px] sm:mt-[-50px]">
        <SearchForm
          type={type}
          brands={
            filterOptions.brands.length > 0
              ? filterOptions.brands
              : globalBrands
          }
          initialValues={params}
          onSubmit={handleSearch}
        />
      </section>

      {/* 💥 PHẦN ĐÃ SỬA: Nút So Sánh Tinh Tế và Responsive Hơn */}
      <div className="flex justify-end mb-4 sm:mb-6 px-2 sm:px-0">
        {compareList.length > 0 && (
          <button
            onClick={handleOpenCompare}
            aria-label={getAriaLabel()}
            role="button"
            className={`
              relative flex items-center gap-2 max-w-max // Tăng gap cho thoáng
              px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-2.5 lg:px-6 lg:py-2.5 // Tinh chỉnh padding nhỏ gọn hơn trên desktop
              rounded-full font-semibold text-sm md:text-base // Sử dụng rounded-full cho kiểu dáng pill hiện đại, text size nhỏ hơn
              transition-all duration-200 ease-in-out
              focus:outline-none focus:ring-4 focus:ring-blue-500/50 focus:ring-offset-2 // Focus ring rõ ràng hơn
              whitespace-nowrap
              ${
                compareList.length < 2
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed opacity-80 shadow-md" // Màu xám đơn giản khi disabled
                  : "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl hover:shadow-2xl hover:scale-[1.01] active:scale-98" // Gradient và shadow nổi bật khi active, micro-scale tinh tế
              }
            `}
            disabled={compareList.length < 2}
          >
            {/* Icon Tỷ Lệ */}
            <Scale
              size={18} // Kích thước icon cố định 18px (vừa phải, không quá to)
              className="flex-shrink-0"
            />
            {/* Văn bản So Sánh */}
            <span className="truncate">{getCompareButtonText()}</span>

            {/* Badge Số Lượng Xe (Chỉ hiển thị khi >= 2) */}
            {compareList.length >= 2 && (
              <span
                className={`
                  ml-1 bg-red-600 text-white text-[11px] font-extrabold
                  rounded-full h-5 w-5 // Kích thước badge vừa phải 20x20
                  flex items-center justify-center
                  shadow-lg // Shadow nhẹ cho badge
                  animate-pulse // Giữ animation pulse
                `}
              >
                {compareList.length}
              </span>
            )}

            {/* Hiệu ứng Shine (Tùy chọn: Thêm độ sâu cho button active) */}
            {compareList.length >= 2 && (
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-[120%] transition-transform duration-1000" // Tăng tốc độ transform
              />
            )}
          </button>
        )}
      </div>
      {/* 💥 KẾT THÚC PHẦN ĐÃ SỬA */}

      <section className="mt-4 sm:mt-6 px-2 sm:px-0">
        <FilterBar
          type={type}
          brands={
            filterOptions.brands.length > 0
              ? filterOptions.brands
              : globalBrands
          }
          initialValues={params}
          availableSeats={filterOptions.availableSeats || []}
          availableBodyTypes={filterOptions.availableBodyTypes || []}
          availableBikeTypes={filterOptions.availableBikeTypes || []}
          availableEngineCapacities={
            filterOptions.availableEngineCapacities || []
          }
          onFilterChange={handleFilterChange}
        />
      </section>
      <section className="mt-6 sm:mt-8 px-2 sm:px-0">
        {renderVehicleList()}
        {/* SỬA: Luôn hiển thị Pagination nếu total_pages >=1 (dù 1 trang, vẫn show "1/1") */}
        {pagination.total_pages >= 1 && (
          <div className="mt-6 sm:mt-8 flex justify-center px-2 sm:px-0">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.total_pages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </section>
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
