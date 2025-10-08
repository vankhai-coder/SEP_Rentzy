import { useState } from "react";
import { Car, Fuel, Users, Factory, Sparkles, ListFilter } from "lucide-react";

const FilterBar = () => {
  const [active, setActive] = useState("all");

  const filters = [
    { key: "all", label: "Tất cả", icon: <Sparkles size={16} /> },
    { key: "seats", label: "Số chỗ", icon: <Users size={16} /> },
    { key: "brand", label: "Hãng xe", icon: <Factory size={16} /> },
    { key: "transmission", label: "Loại xe", icon: <Car size={16} /> },
    { key: "fuel", label: "Nhiên liệu", icon: <Fuel size={16} /> },
    { key: "suggest", label: "Gợi ý", icon: <Sparkles size={16} /> },
  ];

  return (
    <div className="w-full bg-gradient-to-r from-gray-50 to-gray-100 shadow-md rounded-2xl px-5 py-4 flex items-center justify-between">
      {/* Filter buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActive(f.key)}
            className={`px-4 py-2.5 rounded-2xl font-medium flex items-center gap-1.5 transition-all duration-200 transform
              ${
                active === f.key
                  ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md scale-105"
                  : "bg-white text-gray-700 border hover:border-teal-400 hover:bg-teal-50 hover:scale-105"
              }`}
          >
            <span className="transition-transform duration-200 group-hover:rotate-6">
              {f.icon}
            </span>
            {f.label}
          </button>
        ))}
      </div>

      {/* Sort button */}
      <button className="px-5 py-2.5 rounded-2xl font-medium flex items-center gap-1.5 border border-teal-500 text-teal-600 hover:text-white hover:bg-gradient-to-r hover:from-teal-500 hover:to-emerald-500 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105">
        <ListFilter size={16} /> Sắp xếp
      </button>
    </div>
  );
};

export default FilterBar;
