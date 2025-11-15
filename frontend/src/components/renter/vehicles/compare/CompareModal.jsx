import { useSelector, useDispatch } from "react-redux";
import {
  compareVehicles,
  removeFromCompare,
  clearCompareList,
} from "../../../../redux/features/renter/compare/compareSlice";
import { useState, useEffect } from "react";
import { X, Scale, CarFront } from "lucide-react";

const CompareTable = ({ data, type }) => {
  if (!data || !data.comparison) return null;

  const { comparison, vehicles } = data;

  const columns = [
    { key: "years", label: "Năm Sản Xuất" },
    { key: "prices", label: "Giá/Ngày (VND)" },
    { key: "rent_counts", label: "Số Lượt Thuê" },
    { key: "features", label: "Tính Năng" },
    ...(type === "car"
      ? [
          { key: "seats", label: "Số Ghế" },
          { key: "fuel_types", label: "Nhiên Liệu" },
          { key: "transmissions", label: "Hộp Số" },
        ]
      : [
          { key: "bike_types", label: "Loại Xe" },
          { key: "engine_capacities", label: "Dung Tích" },
        ]),
  ];

  const renderFeatures = (vehicleIndex) => {
    const vehicle = vehicles[vehicleIndex];
    if (!vehicle || !vehicle.features || vehicle.features.length === 0)
      return <span className="text-gray-400 italic">Không có</span>;

    const shortFeatures = vehicle.features.slice(0, 4).join(", ");
    const fullList = vehicle.features.join(", ");
    const displayText =
      vehicle.features.length > 4
        ? `${shortFeatures}... (${vehicle.features.length} tính năng)`
        : shortFeatures;

    return (
      <span
        title={`Tất cả: ${fullList}`}
        className="text-gray-700 text-sm block max-w-xs break-words cursor-help"
      >
        {displayText}
      </span>
    );
  };

  const formatPrice = (val) =>
    isNaN(parseFloat(val))
      ? "N/A"
      : new Intl.NumberFormat("vi-VN").format(parseFloat(val)) + " VND";

  const translateFuel = (v) =>
    ({ petrol: "Xăng", diesel: "Diesel", electric: "Điện", hybrid: "Lai" }[v] ||
    v ||
    "N/A");

  const translateTrans = (v) =>
    ({ manual: "Số sàn", automatic: "Số tự động" }[v] || v || "N/A");

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-xl shadow-sm">
        <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
          <tr>
            <th className="px-4 py-3 border-b text-left font-semibold text-gray-700">
              Tiêu Chí
            </th>
            {comparison.models.map((m, i) => (
              <th
                key={i}
                className="px-4 py-3 border-b font-semibold text-center text-gray-800 text-sm"
              >
                <div className="flex flex-col items-center">
                  <CarFront size={18} className="mb-1 text-blue-500" />
                  <span className="truncate max-w-[120px]">{m}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {columns.map((col, idx) => (
            <tr
              key={col.key}
              className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
            >
              <td className="px-4 py-3 border-b font-medium text-gray-700 w-1/5">
                {col.label}
              </td>
              {comparison[col.key].map((val, i) => (
                <td
                  key={i}
                  className="px-4 py-3 border-b text-sm text-center text-gray-800"
                >
                  {col.key === "features"
                    ? renderFeatures(i)
                    : col.key === "prices"
                    ? formatPrice(val)
                    : col.key === "fuel_types"
                    ? translateFuel(val)
                    : col.key === "transmissions"
                    ? translateTrans(val)
                    : Array.isArray(val)
                    ? val.join(", ")
                    : val}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-gray-500 italic text-center">
        *(Di chuột vào “Tính năng” để xem chi tiết)
      </p>
    </div>
  );
};

const CompareModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { compareList, comparisonData, loading, error } = useSelector(
    (state) => state.compareStore
  );

  const [localList, setLocalList] = useState([]);

  useEffect(() => setLocalList(compareList), [compareList]);

  useEffect(() => {
    if (comparisonData && comparisonData.vehicles && localList.length > 0) {
      setLocalList((prev) =>
        prev.map((item) => ({
          ...item,
          model:
            comparisonData.vehicles.find((v) => v.id === item.id)?.model ||
            `Xe #${item.id}`,
        }))
      );
    }
  }, [comparisonData, localList]);

  if (!isOpen) return null;

  const handleRemove = (id) => {
    dispatch(removeFromCompare(id));
    setLocalList((prev) => {
      const n = prev.filter((i) => i.id !== id);
      if (n.length >= 2) dispatch(compareVehicles());
      return n;
    });
  };

  const handleCompare = () => dispatch(compareVehicles());
  const handleClear = () => {
    dispatch(clearCompareList());
    setLocalList([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] shadow-2xl border border-gray-100 overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Scale className="text-blue-500" size={22} /> So Sánh Xe
            <span className="text-gray-500 text-sm ml-2">
              ({localList.length}/4)
            </span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500"
          >
            <X size={24} />
          </button>
        </div>

        {localList.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {localList.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center bg-gray-50 border border-gray-200 rounded-lg p-3"
              >
                <div className="flex items-center gap-2 text-gray-700 truncate">
                  <Scale size={16} className="text-blue-500" />
                  <span className="text-sm font-medium truncate max-w-[100px]">
                    {item.model || `Xe #${item.id}`}
                  </span>
                </div>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {comparisonData === null && localList.length >= 2 && (
          <button
            onClick={handleCompare}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg mb-6"
          >
            {loading ? "Đang tải dữ liệu..." : `So Sánh ${localList.length} Xe`}
          </button>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {comparisonData?.success && (
          <CompareTable data={comparisonData} type={comparisonData.type} />
        )}

        {comparisonData?.success && (
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button
              onClick={handleClear}
              className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-semibold"
            >
              ❌ Xóa Tất Cả
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompareModal;
