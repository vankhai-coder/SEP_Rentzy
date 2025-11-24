import { useState, useEffect, useCallback } from "react";
import {
  Car,
  Fuel,
  Users,
  Factory,
  Sparkles,
  ListFilter,
  ChevronDown,
  Check,
} from "lucide-react";

const FilterBar = ({
  type,
  brands,
  initialValues,
  onFilterChange,
  availableSeats = [],
  availableBodyTypes = [],
  availableBikeTypes = [],
  availableEngineCapacities = [],
}) => {
  // NEW: activeFilter object để lưu key + rect (vị trí button)
  const [activeFilter, setActiveFilter] = useState({ key: null, rect: null });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Local states for filters
  const [selectedBrand, setSelectedBrand] = useState(
    initialValues.brand_id || ""
  );
  const [selectedTransmission, setSelectedTransmission] = useState(
    initialValues.transmission || ""
  );
  const [selectedFuel, setSelectedFuel] = useState(
    initialValues.fuel_type || ""
  );
  const [selectedSeats, setSelectedSeats] = useState(initialValues.seats || "");
  const [selectedBikeType, setSelectedBikeType] = useState(
    initialValues.bike_type || ""
  );
  const [selectedEngine, setSelectedEngine] = useState(
    initialValues.engine_capacity || ""
  );
  const [selectedBodyType, setSelectedBodyType] = useState(
    initialValues.body_type || ""
  );

  // Sync states with initialValues
  useEffect(() => {
    setSelectedBrand(initialValues.brand_id || "");
    setSelectedTransmission(initialValues.transmission || "");
    setSelectedFuel(initialValues.fuel_type || "");
    setSelectedSeats(initialValues.seats || "");
    setSelectedBikeType(initialValues.bike_type || "");
    setSelectedEngine(initialValues.engine_capacity || "");
    setSelectedBodyType(initialValues.body_type || "");
  }, [initialValues]);

  // Detect mobile on resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeFilter.key && !event.target.closest(".filter-dropdown")) {
        setActiveFilter({ key: null, rect: null });
      }
    };
    if (activeFilter.key) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [activeFilter.key]);

  const filters = [
    { key: "all", label: "Tất cả", icon: <Sparkles size={16} /> },
    ...(type === "car"
      ? [
          { key: "seats", label: "Số chỗ", icon: <Users size={16} /> },
          { key: "brand", label: "Hãng xe", icon: <Factory size={16} /> },
          { key: "transmission", label: "Hộp số", icon: <Car size={16} /> },
          { key: "body_type", label: "Kiểu xe", icon: <Car size={16} /> },
          { key: "fuel", label: "Nhiên liệu", icon: <Fuel size={16} /> },
        ]
      : [
          { key: "brand", label: "Hãng xe", icon: <Factory size={16} /> },
          { key: "bike_type", label: "Loại xe", icon: <Car size={16} /> },
          { key: "engine", label: "Dung tích", icon: <Fuel size={16} /> },
        ]),
    { key: "sort", label: "Sắp xếp", icon: <ListFilter size={16} /> },
  ];

  const sortOptions = [
    { label: "Giá thấp đến cao", value: "price_per_day", order: "ASC" },
    { label: "Giá cao đến thấp", value: "price_per_day", order: "DESC" },
    { label: "Năm mới nhất", value: "year", order: "DESC" },
    { label: "Năm cũ nhất", value: "year", order: "ASC" },
  ];

  const handleAllClick = useCallback(
    (event) => {
      event.stopPropagation();
      setSelectedBrand("");
      setSelectedTransmission("");
      setSelectedFuel("");
      setSelectedSeats("");
      setSelectedBikeType("");
      setSelectedEngine("");
      setSelectedBodyType("");
      setActiveFilter({ key: null, rect: null });
      const clearFilters = {
        brand_id: undefined,
        transmission: undefined,
        fuel_type: undefined,
        seats: undefined,
        bike_type: undefined,
        engine_capacity: undefined,
        body_type: undefined,
      };
      onFilterChange(clearFilters);
    },
    [onFilterChange]
  );

  // Handle filter click - Lưu rect để fixed position
  const handleFilterClick = useCallback(
    (key, event) => {
      event.stopPropagation();
      const buttonRect = event.currentTarget.getBoundingClientRect();
      if (activeFilter.key === key) {
        setActiveFilter({ key: null, rect: null });
        return;
      }
      setActiveFilter({ key, rect: buttonRect });
    },
    [activeFilter.key]
  );

  const closeMenu = useCallback(() => {
    setActiveFilter({ key: null, rect: null });
  }, []);

  const handleBrandChange = useCallback(
    (brandId) => {
      const value = brandId || undefined;
      setSelectedBrand(brandId || "");
      onFilterChange({ brand_id: value });
      closeMenu();
    },
    [onFilterChange, closeMenu]
  );

  const handleTransmissionChange = useCallback(
    (value) => {
      const finalValue = value === "" ? undefined : value;
      setSelectedTransmission(value);
      onFilterChange({ transmission: finalValue });
      closeMenu();
    },
    [onFilterChange, closeMenu]
  );

  const handleFuelChange = useCallback(
    (value) => {
      const finalValue = value === "" ? undefined : value;
      setSelectedFuel(value);
      onFilterChange({ fuel_type: finalValue });
      closeMenu();
    },
    [onFilterChange, closeMenu]
  );

  const handleSeatsChange = useCallback(
    (value) => {
      const finalValue = value === "" ? undefined : value;
      setSelectedSeats(value);
      onFilterChange({ seats: finalValue });
      closeMenu();
    },
    [onFilterChange, closeMenu]
  );

  const handleBodyTypeChange = useCallback(
    (value) => {
      const finalValue = value === "" ? undefined : value;
      setSelectedBodyType(value);
      onFilterChange({ body_type: finalValue });
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
      closeMenu();
    },
    [onFilterChange, closeMenu]
  );

  // NEW: Tính style fixed position + offset góc (20% width button)
  const getDropdownStyle = useCallback(() => {
    if (!activeFilter.rect) return {};
    const { left, bottom, width } = activeFilter.rect;
    const offsetX = width * 0.2; // 20% từ left button (như "2/5 góc")
    let dropdownLeft = left + offsetX;
    const estimatedWidth = 240; // Ước lượng width dropdown (adjust nếu cần)
    if (dropdownLeft + estimatedWidth > window.innerWidth) {
      dropdownLeft = window.innerWidth - estimatedWidth - 8; // Shift left nếu tràn phải
    }
    if (isMobile) {
      return {
        position: "fixed",
        left: "50%",
        top: "120px", // Fixed dưới header
        transform: "translateX(-50%)",
        width: "90vw",
        minWidth: "280px",
        zIndex: 40,
      };
    } else {
      return {
        position: "fixed",
        left: `${dropdownLeft}px`,
        top: `${bottom + 8}px`, // Khoảng cách 8px dưới button
        minWidth: `${width}px`, // Ít nhất bằng button, tự mở rộng
        zIndex: 40,
      };
    }
  }, [activeFilter.rect, isMobile]);

  const renderDropdownContent = (filterKey) => {
    if (!filterKey || filterKey === "all") return null;
    const commonClasses =
      "bg-white/95 backdrop-blur-sm border border-gray-200 rounded-3xl shadow-xl py-3 max-h-[80vh] overflow-hidden z-40 filter-dropdown animate-in fade-in slide-in-from-top-2 duration-200";
    const dropdownStyle = getDropdownStyle();

    switch (filterKey) {
      case "brand":
        return (
          <div className={`${commonClasses} w-56`} style={dropdownStyle}>
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm">
              Chọn hãng xe
            </div>
            <div className="divide-y divide-gray-100">
              <button
                onClick={() => handleBrandChange("")}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 transition-all duration-200 text-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Factory size={12} className="text-gray-500" />
                </div>
                <span className="font-medium text-gray-800">Tất cả</span>
                {selectedBrand === "" && (
                  <Check size={18} className="ml-auto text-teal-500" />
                )}
              </button>
              {brands.map((brand) => (
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
          <div className={`${commonClasses} w-48`} style={dropdownStyle}>
            <div className="divide-y divide-gray-100">
              {[
                { value: "", label: "Tất cả" },
                { value: "manual", label: "Số sàn" },
                { value: "automatic", label: "Tự động" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleTransmissionChange(opt.value)}
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
          <div className={`${commonClasses} w-48`} style={dropdownStyle}>
            <div className="divide-y divide-gray-100">
              {[
                { value: "", label: "Tất cả" },
                { value: "petrol", label: "Xăng" },
                { value: "diesel", label: "Dầu" },
                { value: "electric", label: "Điện" },
                { value: "hybrid", label: "Hybrid" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleFuelChange(opt.value)}
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
          <div className={`${commonClasses} w-48`} style={dropdownStyle}>
            <div className="divide-y divide-gray-100">
              <button
                onClick={() => handleSeatsChange("")}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 transition-all duration-200 text-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Users size={12} className="text-gray-500" />
                </div>
                <span className="font-medium text-gray-800">Tất cả</span>
                {selectedSeats === "" && (
                  <Check size={18} className="ml-auto text-teal-500" />
                )}
              </button>
              {availableSeats.map((seat) => (
                <button
                  key={seat}
                  onClick={() => handleSeatsChange(seat.toString())}
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
      case "body_type":
        return (
          <div className={`${commonClasses} w-56`} style={dropdownStyle}>
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm">
              Chọn kiểu xe
            </div>
            <div className="divide-y divide-gray-100">
              <button
                onClick={() => handleBodyTypeChange("")}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 transition-all duration-200 text-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Car size={12} className="text-gray-500" />
                </div>
                <span className="font-medium text-gray-800">Tất cả</span>
                {selectedBodyType === "" && (
                  <Check size={18} className="ml-auto text-teal-500" />
                )}
              </button>
              {availableBodyTypes.map((bt) => {
                const labels = {
                  sedan: "Sedan",
                  suv: "SUV",
                  hatchback: "Hatchback",
                  convertible: "Convertible",
                  coupe: "Coupe",
                  minivan: "Minivan",
                  pickup: "Pickup",
                  van: "Van",
                  mpv: "MPV",
                };
                return (
                  <button
                    key={bt}
                    onClick={() => handleBodyTypeChange(bt)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 transition-all duration-200 text-sm"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Car size={12} className="text-gray-500" />
                    </div>
                    <span className="font-medium text-gray-800">
                      {labels[bt] || bt}
                    </span>
                    {selectedBodyType === bt && (
                      <Check size={18} className="ml-auto text-teal-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      case "bike_type":
        return (
          <div className={`${commonClasses} w-48`} style={dropdownStyle}>
            <div className="divide-y divide-gray-100">
              <button
                onClick={() => handleBikeTypeChange("")}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 transition-all duration-200 text-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Car size={12} className="text-gray-500" />
                </div>
                <span className="font-medium text-gray-800">Tất cả</span>
                {selectedBikeType === "" && (
                  <Check size={18} className="ml-auto text-teal-500" />
                )}
              </button>
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
                      {labels[bt] || bt}
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
          <div className={`${commonClasses} w-48`} style={dropdownStyle}>
            <div className="divide-y divide-gray-100">
              <button
                onClick={() => handleEngineChange("")}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 transition-all duration-200 text-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Fuel size={12} className="text-gray-500" />
                </div>
                <span className="font-medium text-gray-800">Tất cả</span>
                {selectedEngine === "" && (
                  <Check size={18} className="ml-auto text-teal-500" />
                )}
              </button>
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
      case "sort":
        return (
          <div className={`${commonClasses} w-48`} style={dropdownStyle}>
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
        );
      default:
        return null;
    }
  };

  return (
    <>
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          width: 0px;
          height: 0px;
        }
        .no-scrollbar {
          scrollbar-width: none;
        }
      `}</style>
      <div
        className="w-full bg-gradient-to-r from-white via-gray-50 to-white shadow-lg rounded-3xl px-6 py-5 relative"
        onClick={closeMenu}
      >
        <div className="flex flex-row overflow-x-auto gap-2 flex-1 min-w-0 no-scrollbar pb-2 pt-1 -mx-2 px-2">
          {filters.map((f) => {
            const isAllFilter = f.key === "all";
            const isActive = activeFilter.key === f.key;
            return (
              <div key={f.key} className="flex-shrink-0 inline-block">
                <button
                  onClick={
                    isAllFilter
                      ? handleAllClick
                      : (e) => handleFilterClick(f.key, e)
                  }
                  className={`group relative px-4 py-3 rounded-2xl font-medium flex items-center gap-2 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2
                    ${
                      isActive
                        ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-xl border-2 border-teal-400"
                        : "bg-white text-gray-700 border-2 border-transparent hover:border-teal-200 hover:shadow-md"
                    } text-sm shadow-sm whitespace-nowrap`}
                >
                  <span
                    className={`transition-transform duration-300 ${
                      isActive ? "scale-110" : ""
                    }`}
                  >
                    {f.icon}
                  </span>
                  <span className="min-w-0 truncate">{f.label}</span>
                  {!isAllFilter && (
                    <ChevronDown
                      size={14}
                      className={`ml-1 transition-transform duration-300 ${
                        isActive ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </button>
                {isActive && !isAllFilter && (
                  <div className="filter-dropdown">
                    {renderDropdownContent(f.key)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default FilterBar;
