import { useState, useEffect, useCallback } from "react"; // FIX: Thêm useCallback để optimize handlers tránh re-render loop
import {
  Car,
  Fuel,
  Users,
  Factory,
  Sparkles,
  ListFilter,
  ChevronDown,
  X,
  Check,
} from "lucide-react";

const FilterBar = ({ type, brands, initialValues, onFilterChange }) => {
  const [active, setActive] = useState(null); // Change to null initially
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Local states for filters based on initialValues
  const [selectedBrand, setSelectedBrand] = useState(
    initialValues.brand_id || ""
  );
  const [selectedTransmission, setSelectedTransmission] = useState(
    initialValues.transmission || ""
  );
  const [selectedFuel, setSelectedFuel] = useState(
    initialValues.fuel_type || ""
  );
  const [selectedSeats, setSelectedSeats] = useState(
    initialValues.min_seats || ""
  ); // FIX: Đổi từ seats sang min_seats để match backend
  const [selectedBikeType, setSelectedBikeType] = useState(
    initialValues.bike_type || ""
  );
  const [selectedEngine, setSelectedEngine] = useState(
    initialValues.engine_capacity || ""
  ); // Single for menu

  // Hardcoded available seats from DB example (in real, pass from parent/Redux unique values)
  const availableSeats = [4, 5, 7]; // e.g., unique from vehicles.seats where type=car
  const availableBikeTypes = ["scooter", "manual", "clutch", "electric"];
  const availableEngineCapacities = [110, 150, 250, 300]; // e.g., unique from vehicles.engine_capacity

  // Update local states when initialValues change
  useEffect(() => {
    setSelectedBrand(initialValues.brand_id || "");
    setSelectedTransmission(initialValues.transmission || "");
    setSelectedFuel(initialValues.fuel_type || "");
    setSelectedSeats(initialValues.min_seats || ""); // FIX: Sync với min_seats
    setSelectedBikeType(initialValues.bike_type || "");
    setSelectedEngine(initialValues.engine_capacity || "");
  }, [initialValues]);

  const filters = [
    { key: "all", label: "Tất cả", icon: <Sparkles size={16} /> },
    ...(type === "car"
      ? [
          { key: "seats", label: "Số chỗ", icon: <Users size={16} /> },
          { key: "brand", label: "Hãng xe", icon: <Factory size={16} /> },
          { key: "transmission", label: "Loại xe", icon: <Car size={16} /> },
          { key: "fuel", label: "Nhiên liệu", icon: <Fuel size={16} /> },
        ]
      : [
          { key: "brand", label: "Hãng xe", icon: <Factory size={16} /> },
          { key: "bike_type", label: "Loại xe", icon: <Car size={16} /> },
          { key: "engine", label: "Dung tích", icon: <Fuel size={16} /> },
        ]),
    { key: "suggest", label: "Gợi ý", icon: <Sparkles size={16} /> },
  ];

  // FIX: Handle "Tất cả" - Clear all filters by passing explicit undefined for each filter key
  // (Giữ sort nếu có, vì sort không phải filter chính)
  const handleAllClick = useCallback(
    (event) => {
      event.stopPropagation();
      // Clear all local states
      setSelectedBrand("");
      setSelectedTransmission("");
      setSelectedFuel("");
      setSelectedSeats("");
      setSelectedBikeType("");
      setSelectedEngine("");
      setActive(null);
      // FIX: Clear all filters by setting them to undefined (parent cleanParams sẽ loại)
      const clearFilters = {
        brand_id: undefined,
        transmission: undefined,
        fuel_type: undefined,
        min_seats: undefined,
        bike_type: undefined,
        engine_capacity: undefined,
        // Không clear sort_by/sort_order để giữ UX (nếu user muốn sort sau clear)
      };
      // Call parent to clear params
      onFilterChange(clearFilters);
    },
    [onFilterChange]
  );

  // FIX: Prevent toggle loop if already active
  const handleFilterClick = useCallback(
    (key, event) => {
      event.stopPropagation();
      if (active === key) {
        setActive(null); // Toggle close
        return;
      }
      setActive(key);
    },
    [active]
  );

  const closeMenu = useCallback(() => {
    setActive(null);
  }, []);

  // FIX: Nếu value === "", pass undefined (không include key trong params)
  const handleBrandChange = useCallback(
    (brandId) => {
      const value = brandId || undefined;
      setSelectedBrand(brandId || "");
      onFilterChange({ brand_id: value }); // Parent sẽ filter out undefined
      closeMenu();
    },
    [onFilterChange, closeMenu]
  );

  const handleTransmissionChange = useCallback(
    (value) => {
      const finalValue = value === "" ? undefined : value; // FIX: "" → undefined, không pass param
      setSelectedTransmission(value);
      onFilterChange({ transmission: finalValue });
      closeMenu();
    },
    [onFilterChange, closeMenu]
  );

  const handleFuelChange = useCallback(
    (value) => {
      const finalValue = value === "" ? undefined : value; // FIX: Tương tự
      setSelectedFuel(value);
      onFilterChange({ fuel_type: finalValue });
      closeMenu();
    },
    [onFilterChange, closeMenu]
  );

  // FIX: Đổi key từ seats sang min_seats để match backend filter >=
  const handleSeatsChange = useCallback(
    (value) => {
      const finalValue = value === "" ? undefined : value;
      setSelectedSeats(value);
      onFilterChange({ min_seats: finalValue }); // Backend dùng min_seats cho gte
      closeMenu();
    },
    [onFilterChange, closeMenu]
  );

  const handleBikeTypeChange = useCallback(
    (value) => {
      const finalValue = value === "" ? undefined : value;
      setSelectedBikeType(value);
      onFilterChange({ bike_type: finalValue });
      closeMenu();
    },
    [onFilterChange, closeMenu]
  );

  const handleEngineChange = useCallback(
    (value) => {
      const finalValue = value === "" ? undefined : value;
      setSelectedEngine(value);
      onFilterChange({ engine_capacity: finalValue });
      closeMenu();
    },
    [onFilterChange, closeMenu]
  );

  const handleSortChange = useCallback(
    (sortBy, sortOrder) => {
      onFilterChange({ sort_by: sortBy, sort_order: sortOrder });
      setIsSortOpen(false);
    },
    [onFilterChange]
  );

  const renderDropdownContent = (filterKey) => {
    if (!filterKey || filterKey === "all" || filterKey === "suggest")
      return null;

    const commonClasses =
      "bg-white/95 backdrop-blur-sm border border-gray-200 rounded-3xl shadow-xl py-3 max-h-64 overflow-y-auto z-20";

    switch (filterKey) {
      case "brand":
        return (
          <div className={`${commonClasses} w-56`}>
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm">
              Chọn hãng xe
            </div>
            <div className="divide-y divide-gray-100">
              {brands.slice(0, 8).map((brand) => (
                <button
                  key={brand.brand_id}
                  onClick={() => handleBrandChange(brand.brand_id.toString())}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 transition-all duration-200 text-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Factory size={12} className="text-gray-500" />
                  </div>
                  <span className="font-medium text-gray-800">
                    {brand.name}
                  </span>
                  {selectedBrand === brand.brand_id.toString() && (
                    <Check size={18} className="ml-auto text-teal-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      case "transmission":
        return (
          <div className={`${commonClasses} w-48`}>
            <div className="divide-y divide-gray-100">
              {[
                { value: "", label: "Tất cả" }, // FIX: value="" để match selectedTransmission === ""
                { value: "manual", label: "Số sàn" },
                { value: "automatic", label: "Tự động" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleTransmissionChange(opt.value)} // FIX: Pass "" để clear
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 transition-all duration-200 text-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Car size={12} className="text-gray-500" />
                  </div>
                  <span className="font-medium text-gray-800">{opt.label}</span>
                  {selectedTransmission === opt.value && (
                    <Check size={18} className="ml-auto text-teal-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      case "fuel":
        return (
          <div className={`${commonClasses} w-48`}>
            <div className="divide-y divide-gray-100">
              {[
                { value: "", label: "Tất cả" }, // FIX: Tương tự
                { value: "petrol", label: "Xăng" },
                { value: "diesel", label: "Dầu" },
                { value: "electric", label: "Điện" },
                { value: "hybrid", label: "Hybrid" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleFuelChange(opt.value)} // FIX: Pass "" để clear
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 transition-all duration-200 text-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Fuel size={12} className="text-gray-500" />
                  </div>
                  <span className="font-medium text-gray-800">{opt.label}</span>
                  {selectedFuel === opt.value && (
                    <Check size={18} className="ml-auto text-teal-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      case "seats":
        return (
          <div className={`${commonClasses} w-48`}>
            <div className="divide-y divide-gray-100">
              {availableSeats.map((seat) => (
                <button
                  key={seat}
                  onClick={() => handleSeatsChange(seat.toString())} // FIX: Pass to min_seats
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 transition-all duration-200 text-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Users size={12} className="text-gray-500" />
                  </div>
                  <span className="font-medium text-gray-800">{seat} chỗ</span>
                  {selectedSeats === seat.toString() && (
                    <Check size={18} className="ml-auto text-teal-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      case "bike_type":
        return (
          <div className={`${commonClasses} w-48`}>
            <div className="divide-y divide-gray-100">
              {availableBikeTypes.map((bt) => {
                const labels = {
                  scooter: "Scooter",
                  manual: "Số",
                  clutch: "Côn tay",
                  electric: "Điện",
                };
                return (
                  <button
                    key={bt}
                    onClick={() => handleBikeTypeChange(bt)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 transition-all duration-200 text-sm"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Car size={12} className="text-gray-500" />
                    </div>
                    <span className="font-medium text-gray-800">
                      {labels[bt]}
                    </span>
                    {selectedBikeType === bt && (
                      <Check size={18} className="ml-auto text-teal-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      case "engine":
        return (
          <div className={`${commonClasses} w-48`}>
            <div className="divide-y divide-gray-100">
              {availableEngineCapacities.map((capacity) => (
                <button
                  key={capacity}
                  onClick={() => handleEngineChange(capacity.toString())}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 transition-all duration-200 text-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Fuel size={12} className="text-gray-500" />
                  </div>
                  <span className="font-medium text-gray-800">
                    {capacity}cc
                  </span>
                  {selectedEngine === capacity.toString() && (
                    <Check size={18} className="ml-auto text-teal-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const sortOptions = [
    { label: "Giá thấp đến cao", value: "price_per_day", order: "ASC" },
    { label: "Giá cao đến thấp", value: "price_per_day", order: "DESC" },
    { label: "Năm mới nhất", value: "year", order: "DESC" },
    { label: "Năm cũ nhất", value: "year", order: "ASC" },
  ];

  return (
    <div
      className="w-full bg-gradient-to-r from-white via-gray-50 to-white shadow-lg rounded-3xl px-6 py-4 flex items-center justify-between relative"
      onClick={closeMenu}
    >
      {/* Filter buttons */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {filters.map((f) => {
          // FIX: Special handle for "all" key
          const isAllFilter = f.key === "all";
          return (
            <div key={f.key} className="relative inline-block">
              <button
                onClick={
                  isAllFilter
                    ? handleAllClick
                    : (e) => handleFilterClick(f.key, e)
                } // FIX: Use handleAllClick for "all"
                className={`group relative px-4 py-3 rounded-2xl font-medium flex items-center gap-2 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2
                  ${
                    active === f.key
                      ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-xl"
                      : "bg-white text-gray-700 border-2 border-transparent hover:border-teal-200 hover:shadow-md"
                  } text-sm shadow-sm`}
              >
                <span
                  className={`transition-transform duration-300 ${
                    active === f.key ? "scale-110" : ""
                  }`}
                >
                  {f.icon}
                </span>
                <span className="min-w-0 truncate">{f.label}</span>
                {!isAllFilter && ( // FIX: Không show chevron cho "all"
                  <ChevronDown
                    size={14}
                    className={`ml-1 transition-transform duration-300 ${
                      active === f.key ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>
              {/* Dropdown Menu - positioned below the button */}
              {active === f.key &&
                !isAllFilter &&
                renderDropdownContent(f.key) && ( // FIX: Không render dropdown cho "all"
                  <div
                    className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 z-30 animate-in fade-in slide-in-from-top-2 duration-200"
                    style={{ minWidth: "200px" }}
                  >
                    {renderDropdownContent(f.key)}
                  </div>
                )}
            </div>
          );
        })}
      </div>

      {/* Sort dropdown */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsSortOpen(!isSortOpen);
          }}
          className="px-5 py-3 rounded-2xl font-medium flex items-center gap-2 border-2 border-teal-200 text-teal-700 hover:border-teal-400 hover:bg-gradient-to-r hover:from-teal-500 hover:to-emerald-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 text-sm"
        >
          <ListFilter size={16} />
          Sắp xếp
          <ChevronDown
            size={16}
            className={`ml-1 transition-transform duration-300 ${
              isSortOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {isSortOpen && (
          <div className="absolute right-0 mt-3 w-48 bg-white border border-gray-200 rounded-3xl shadow-xl z-20 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="divide-y divide-gray-100">
              {sortOptions.map((option) => (
                <button
                  key={option.value + option.order}
                  onClick={() => handleSortChange(option.value, option.order)}
                  className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 transition-all duration-200 text-sm font-medium text-gray-800"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
