import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { searchVehicles } from "../../../redux/features/renter/vehicles/vehicleSlice";
import SearchForm from "../../../components/renter/search/SearchForm";
import FilterBar from "../../../components/renter/search/FilterSidebar";
import VehicleCard from "../../../components/renter/vehicles/VehicleCard";
import { Calendar, MapPin, AlertCircle } from "lucide-react";

const SearchResults = ({ type }) => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    searchVehicles: vehicles,
    searchLoading,
    error,
  } = useSelector((state) => state.vehicleStore);
  const { brands } = useSelector((state) => state.brandStore);

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

  const handleSearch = useCallback(
    (formData) => {
      console.log("🔍 SEARCH FORM DATA:", formData);
      const newParams = { ...params, ...formData };
      setSearchParams(newParams);
    },
    [params, setSearchParams]
  );

  const handleFilterChange = useCallback(
    (filters) => {
      console.log("🎚️ FILTER CHANGED:", filters);
      const newParams = { ...params, ...filters };
      setSearchParams(newParams);
    },
    [params, setSearchParams]
  );

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

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
        {vehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.vehicle_id}
            vehicle={vehicle}
            iconSpecs={[
              { icon: <Calendar size={16} />, value: vehicle.year },
              {
                icon: <MapPin size={16} />,
                value: `${
                  vehicle.seats || vehicle.engine_capacity || "N/A"
                } chỗ`,
              },
            ]}
          />
        ))}
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

      {/* 🔹 Filter ngang */}
      <section className="mt-6">
        <FilterBar
          type={type}
          brands={brands}
          onFilterChange={handleFilterChange}
        />
      </section>

      {/* 🔹 Kết quả */}
      <section className="mt-8">{renderVehicleList()}</section>
    </div>
  );
};

export default SearchResults;
