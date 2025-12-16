import { useSelector, useDispatch } from "react-redux";
import {
  compareVehicles,
  removeFromCompare,
  clearCompareList,
  getAIRecommendation,
} from "../../../../redux/features/renter/compare/compareSlice";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// ==================== COMPONENT CON: BẢNG SO SÁNH ====================
const CompareTable = ({ data, type }) => {
  if (!data || !data.comparison) return null;

  const { comparison, vehicles } = data;

  const columns = [
    { key: "years", label: "Năm Sản Xuất" },
    { key: "prices", label: "Giá/Ngày" },
    { key: "rent_counts", label: "Lượt Thuê" },
    { key: "features", label: "Tính Năng" },
    { key: "fuel_consumptions", label: "Tiêu Thụ" },
    ...(type === "car"
      ? [
          { key: "seats", label: "Số Ghế" },
          { key: "fuel_types", label: "Nhiên Liệu" },
          { key: "transmissions", label: "Hộp Số" },
          { key: "body_types", label: "Kiểu Dáng" },
        ]
      : [
          { key: "bike_types", label: "Loại Xe" },
          { key: "engine_capacities", label: "Dung Tích" },
        ]),
  ];

  const renderFeatures = (vehicleIndex) => {
    const vehicle = vehicles[vehicleIndex];
    if (!vehicle || !vehicle.features || vehicle.features.length === 0)
      return <span className="text-gray-400 italic text-xs">Không có</span>;

    const shortFeatures = vehicle.features.slice(0, 3).join(", ");
    const fullList = vehicle.features.join(", ");
    const displayText =
      vehicle.features.length > 3
        ? `${shortFeatures}... (+${vehicle.features.length - 3})`
        : shortFeatures;

    return (
      <span
        title={`Tất cả: ${fullList}`}
        className="text-gray-700 text-xs block break-words cursor-help"
      >
        {displayText}
      </span>
    );
  };

  const formatPrice = (val) =>
    isNaN(parseFloat(val))
      ? "N/A"
      : new Intl.NumberFormat("vi-VN").format(parseFloat(val)) + "đ";

  const translateFuel = (v) =>
    ({ petrol: "Xăng", diesel: "Diesel", electric: "Điện", hybrid: "Lai" }[v] ||
    v ||
    "N/A");

  const translateTrans = (v) =>
    ({ manual: "Số sàn", automatic: "Tự động" }[v] || v || "N/A");

  const translateBodyType = (v) => {
    const map = {
      sedan: "Sedan",
      suv: "SUV",
      hatchback: "Hatchback",
      convertible: "Mui trần",
      coupe: "Coupe",
      minivan: "Minivan",
      pickup: "Bán tải",
      van: "Van",
      mpv: "MPV",
    };
    return map[v] || v || "N/A";
  };

  return (
    <div>
      <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200">
        <table className="min-w-full bg-white">
          <thead className="bg-gradient-to-r from-[#4ECDC4] to-[#44A08D] text-white">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-sm uppercase tracking-wide">
                Tiêu Chí
              </th>
              {comparison.models.map((m, i) => (
                <th key={i} className="px-4 py-3 font-bold text-center text-sm">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-semibold">{m}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {columns.map((col, idx) => (
              <tr
                key={col.key}
                className={`hover:bg-blue-50 ${
                  idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              >
                <td className="px-4 py-3 font-semibold text-gray-800 text-sm border-b border-gray-200">
                  {col.label}
                </td>
                {comparison[col.key].map((val, i) => (
                  <td
                    key={i}
                    className="px-4 py-3 text-sm text-center text-gray-700 border-b border-gray-200"
                  >
                    {col.key === "features" ? (
                      renderFeatures(i)
                    ) : col.key === "prices" ? (
                      <span className="font-bold text-green-600 text-base">
                        {formatPrice(val)}
                      </span>
                    ) : col.key === "fuel_types" ? (
                      translateFuel(val)
                    ) : col.key === "transmissions" ? (
                      translateTrans(val)
                    ) : col.key === "body_types" ? (
                      <span className="font-semibold text-blue-600">
                        {translateBodyType(val)}
                      </span>
                    ) : col.key === "fuel_consumptions" ? (
                      <span
                        className={`font-bold ${
                          val === "N/A"
                            ? "text-gray-400 italic"
                            : "text-emerald-600"
                        }`}
                      >
                        {val !== "N/A" ? `${val} L/100km` : val}
                      </span>
                    ) : col.key === "rent_counts" ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-bold text-xs">
                        {val} lần
                      </span>
                    ) : Array.isArray(val) ? (
                      val.join(", ")
                    ) : (
                      val
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-500 italic text-center">
        Di chuột vào "Tính năng" để xem thêm chi tiết
      </p>
    </div>
  );
};

// ==================== COMPONENT CON: AI RECOMMEND SECTION ====================
const AIRecommendSection = ({
  onRecommend,
  aiLoading,
  aiError,
  aiRecommendation,
}) => {
  const [survey, setSurvey] = useState({
    preferCheap: true,
    preferFuelEfficient: true,
    preferSpacious: false,
    preferLuxury: false,
    preferPopular: true,
    preferSafety: false,
    preferNewCar: false,
    preferLongTrip: false,
  });

  const handleRecommend = () => {
    const hasSelection = Object.values(survey).some((v) => v === true);
    if (!hasSelection) {
      toast.error("Vui lòng chọn ít nhất 1 tiêu chí ưu tiên!");
      return;
    }
    onRecommend(survey);
  };

  return (
    <div className="mt-12 p-8 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border-2 border-purple-300 shadow-lg">
      <div>
        <h3 className="text-3xl font-black text-purple-700 mb-8 text-center">
          AI Tư Vấn Thông Minh
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {[
            { key: "preferCheap", label: "Giá rẻ nhất" },
            { key: "preferFuelEfficient", label: "Tiết kiệm nhiên liệu" },
            { key: "preferSpacious", label: "Rộng rãi thoải mái" },
            { key: "preferLuxury", label: "Sang trọng, đầy đủ tiện nghi" },
            { key: "preferPopular", label: "Được ưa chuộng nhất" },
            { key: "preferSafety", label: "An toàn tối đa" },
            { key: "preferNewCar", label: "Xe mới, ít hư hỏng" },
            { key: "preferLongTrip", label: "Phù hợp đường dài" },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-3 cursor-pointer p-5 rounded-xl shadow-md border-2 border-gray-300 bg-white text-gray-800 hover:shadow-lg hover:border-purple-300 transition-all"
            >
              <input
                type="checkbox"
                checked={survey[item.key]}
                onChange={(e) =>
                  setSurvey({ ...survey, [item.key]: e.target.checked })
                }
                className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-400 cursor-pointer"
              />
              <span className="text-sm font-bold flex-1">{item.label}</span>
            </label>
          ))}
        </div>

        <button
          onClick={handleRecommend}
          disabled={aiLoading}
          className={`w-full py-5 rounded-xl font-black text-xl shadow-lg transition-all ${
            aiLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white hover:shadow-xl"
          }`}
        >
          {aiLoading ? (
            <span className="flex items-center justify-center gap-3">
              <span className="inline-block w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
              AI đang phân tích...
            </span>
          ) : (
            "Nhờ AI Gợi Ý Ngay"
          )}
        </button>

        {aiRecommendation && (
          <div className="mt-8 p-8 bg-white rounded-2xl border-2 border-purple-500 shadow-lg">
            <p className="text-purple-700 font-black text-2xl mb-6 text-center">
              Gợi Ý Từ AI
            </p>
            <div>
              <p className="text-lg leading-relaxed text-gray-800 font-semibold text-center bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                "{aiRecommendation}"
              </p>
            </div>
          </div>
        )}

        {aiError && (
          <div className="mt-6 p-5 bg-red-100 border-2 border-red-400 rounded-xl">
            <p className="text-red-700 text-center font-bold text-lg">
              {aiError}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== COMPONENT CHÍNH ====================
const CompareModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    compareList,
    comparisonData,
    loading,
    error,
    aiRecommendation,
    aiLoading,
    aiError,
  } = useSelector((state) => state.compareStore);

  const [localList, setLocalList] = useState([]);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (isOpen && !hasInitialized.current) {
      setLocalList(compareList);
      hasInitialized.current = true;
    }
    if (!isOpen) {
      hasInitialized.current = false;
    }
  }, [isOpen, compareList]);

  useEffect(() => {
    if (comparisonData?.vehicles && localList.length > 0) {
      setLocalList((prev) =>
        prev.map((item) => ({
          ...item,
          model:
            comparisonData.vehicles.find((v) => v.id === item.id)?.model ||
            `Xe #${item.id}`,
        }))
      );
    }
  }, [comparisonData]);

  const removeTimeoutRef = useRef(null);

  const handleRemove = useCallback(
    (id) => {
      dispatch(removeFromCompare(id));
      setLocalList((prev) => {
        const newList = prev.filter((i) => i.id !== id);

        if (removeTimeoutRef.current) clearTimeout(removeTimeoutRef.current);

        if (newList.length >= 2) {
          removeTimeoutRef.current = setTimeout(() => {
            dispatch(compareVehicles());
          }, 500);
        }

        return newList;
      });
    },
    [dispatch]
  );

  useEffect(() => {
    return () => {
      if (removeTimeoutRef.current) clearTimeout(removeTimeoutRef.current);
    };
  }, []);

  const handleCompare = () => dispatch(compareVehicles());
  const handleClear = () => {
    dispatch(clearCompareList());
    setLocalList([]);
    onClose();
  };

  const handleAIRecommend = useCallback(
    (surveyAnswers) => {
      dispatch(getAIRecommendation(surveyAnswers));
    },
    [dispatch]
  );

  const extractVehicleId = () => {
    if (!aiRecommendation || !comparisonData?.vehicles) return null;

    const recommendedVehicle = comparisonData.vehicles.find((v) =>
      aiRecommendation.toLowerCase().includes(v.model.toLowerCase())
    );

    return recommendedVehicle?.id || null;
  };

  const handleRentNow = () => {
    const vehicleId = extractVehicleId();
    if (vehicleId) {
      navigate(`/detail/${vehicleId}`);
      onClose();
    } else {
      toast.error("Không tìm thấy xe được gợi ý. Vui lòng thử lại!");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-7xl max-h-[92vh] shadow-2xl border border-gray-200 overflow-y-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-100">
          <div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              So Sánh Xe Chi Tiết
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Đang so sánh:{" "}
              <span className="font-bold text-purple-600">
                {localList.length}/4 xe
              </span>
              {localList.length > 0 && (
                <span className="ml-2 text-xs text-gray-400">
                  (
                  {localList
                    .map((item) => item.model || `#${item.id}`)
                    .join(", ")}
                  )
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 text-2xl font-bold transition-colors"
          >
            ×
          </button>
        </div>

        {/* DANH SÁCH XE ĐANG SO SÁNH */}
        {localList.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {localList.map((item) => (
              <div
                key={item.id}
                className="relative flex justify-between items-center bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-3 hover:shadow-md hover:border-blue-300 transition-all"
              >
                <div className="flex items-center gap-2 text-gray-800 truncate flex-1 pr-2">
                  <span className="text-sm font-bold truncate">
                    {item.model || `Xe #${item.id}`}
                  </span>
                </div>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-red-500 hover:bg-red-100 rounded-full text-lg font-bold transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* NÚT SO SÁNH */}
        {comparisonData === null && localList.length >= 2 && (
          <button
            onClick={handleCompare}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-lg py-4 rounded-xl mb-6 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-xl"
          >
            {loading ? "Đang tải..." : `So Sánh ${localList.length} Xe Ngay`}
          </button>
        )}

        {/* ERROR */}
        {error && (
          <div className="mb-5 p-4 bg-red-50 border-2 border-red-300 text-red-700 text-sm rounded-xl font-semibold">
            {error}
          </div>
        )}

        {/* BẢNG SO SÁNH */}
        {comparisonData?.success && (
          <>
            <CompareTable data={comparisonData} type={comparisonData.type} />
            <AIRecommendSection
              comparisonData={comparisonData}
              onRecommend={handleAIRecommend}
              aiLoading={aiLoading}
              aiError={aiError}
              aiRecommendation={aiRecommendation}
            />
          </>
        )}

        {/* FOOTER ACTIONS */}
        {comparisonData?.success && (
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              onClick={handleClear}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-4 rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all"
            >
              Xóa Tất Cả
            </button>

            {aiRecommendation && (
              <button
                onClick={handleRentNow}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                Thuê Xe Ngay
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompareModal;
