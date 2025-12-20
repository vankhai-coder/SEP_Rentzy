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
      return <span className="text-slate-400 italic text-xs">Không có</span>;

    const shortFeatures = vehicle.features.slice(0, 3).join(", ");
    const fullList = vehicle.features.join(", ");
    const displayText =
      vehicle.features.length > 3
        ? `${shortFeatures}... (+${vehicle.features.length - 3})`
        : shortFeatures;

    return (
      <span
        title={`Tất cả: ${fullList}`}
        className="text-slate-600 text-xs block break-words cursor-help"
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
    <div className="mt-4">
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="min-w-full bg-white">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left font-bold text-slate-700 text-sm uppercase tracking-wider">
                Tiêu Chí
              </th>
              {comparison.models.map((m, i) => (
                <th
                  key={i}
                  className="px-6 py-4 font-bold text-center text-indigo-700 text-sm uppercase tracking-wider"
                >
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {columns.map((col) => (
              <tr key={col.key} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-600 text-sm bg-slate-50/50">
                  {col.label}
                </td>
                {comparison[col.key].map((val, i) => (
                  <td
                    key={i}
                    className="px-6 py-4 text-sm text-center text-slate-600"
                  >
                    {col.key === "features" ? (
                      renderFeatures(i)
                    ) : col.key === "prices" ? (
                      <span className="font-bold text-slate-900 text-base">
                        {formatPrice(val)}
                      </span>
                    ) : col.key === "fuel_types" ? (
                      translateFuel(val)
                    ) : col.key === "transmissions" ? (
                      translateTrans(val)
                    ) : col.key === "body_types" ? (
                      <span className="font-medium text-slate-700">
                        {translateBodyType(val)}
                      </span>
                    ) : col.key === "fuel_consumptions" ? (
                      <span
                        className={`font-medium ${
                          val === "N/A"
                            ? "text-slate-400 italic"
                            : "text-slate-700"
                        }`}
                      >
                        {val !== "N/A" ? `${val} L/100km` : val}
                      </span>
                    ) : col.key === "rent_counts" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {val} lượt thuê
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
    <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-indigo-200 shadow-lg">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800">
          AI Tư Vấn Thông Minh
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { key: "preferCheap", label: "Giá rẻ nhất" },
          { key: "preferFuelEfficient", label: "Tiết kiệm nhiên liệu" },
          { key: "preferSpacious", label: "Rộng rãi thoải mái" },
          { key: "preferLuxury", label: "Sang trọng, đầy đủ tiện ích" },
          { key: "preferPopular", label: "Được ưa chuộng nhất" },
          { key: "preferSafety", label: "An toàn tối đa" },
          { key: "preferNewCar", label: "Xe mới, ít hư hỏng" },
          { key: "preferLongTrip", label: "Phù hợp đường dài" },
        ].map((item) => (
          <label
            key={item.key}
            className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-all ${
              survey[item.key]
                ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <input
              type="checkbox"
              checked={survey[item.key]}
              onChange={(e) =>
                setSurvey({ ...survey, [item.key]: e.target.checked })
              }
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <span
              className={`text-sm font-medium ${
                survey[item.key] ? "text-indigo-700" : "text-slate-600"
              }`}
            >
              {item.label}
            </span>
          </label>
        ))}
      </div>
      <button
        onClick={handleRecommend}
        disabled={aiLoading}
        className="w-full py-3.5 rounded-xl font-bold text-white bg-slate-900 hover:bg-black transition-all disabled:bg-slate-300 flex items-center justify-center gap-2"
      >
        {aiLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Đang phân tích dữ liệu...
          </>
        ) : (
          "Nhận gợi ý từ AI"
        )}
      </button>
      {aiRecommendation && (
        <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="p-5 bg-white rounded-xl border border-indigo-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-indigo-600">
              <span className="text-xs font-bold uppercase tracking-widest">
                Kết quả phân tích
              </span>
              <div className="h-px flex-1 bg-indigo-50"></div>
            </div>
            <p className="text-slate-700 leading-relaxed italic">
              "{aiRecommendation}"
            </p>
          </div>
        </div>
      )}
      {aiError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl text-center font-medium">
          {aiError}
        </div>
      )}
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

  const extractVehicleId = () => {
    if (!aiRecommendation || !comparisonData?.vehicles) return null;

    // Debug log (bỏ khi production)
    console.log("AI Recommendation:", aiRecommendation.toLowerCase());
    console.log(
      "Available vehicles:",
      comparisonData.vehicles.map((v) => ({
        id: v.id,
        model: v.model.toLowerCase(),
      }))
    );

    const recLower = aiRecommendation.toLowerCase();
    const recommendedVehicle = comparisonData.vehicles.find((v) => {
      const modelLower = v.model.toLowerCase();

      // Partial match hai chiều: rec contains model HOẶC model contains key parts of rec
      const recWords = recLower.split(" ").filter((word) => word.length > 2); // Lấy từ >2 ký tự
      const modelWords = modelLower
        .split(" ")
        .filter((word) => word.length > 2);

      const recContainsModel = recLower.includes(modelLower);
      const modelContainsRecWords = recWords.some((word) =>
        modelLower.includes(word)
      );
      const recContainsModelWords = modelWords.some((word) =>
        recLower.includes(word)
      );

      return recContainsModel || modelContainsRecWords || recContainsModelWords;
    });

    console.log(
      "Matched vehicle:",
      recommendedVehicle
        ? { id: recommendedVehicle.id, model: recommendedVehicle.model }
        : "None"
    );

    return recommendedVehicle?.id || null;
  };

  const handleRemove = useCallback(
    (id) => {
      dispatch(removeFromCompare(id));
      setLocalList((prev) => {
        const newList = prev.filter((i) => i.id !== id);
        setTimeout(() => {
          if (newList.length >= 2) {
            dispatch(compareVehicles());
          }
        }, 500);
        return newList;
      });
    },
    [dispatch]
  );

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
    <div className="fixed inset-0 bg-slate-900/10 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col border border-white">
        {/* HEADER */}
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              So Sánh Chi Tiết
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              <p className="text-sm text-slate-500 font-medium">
                Đang chọn {localList.length}/4 phương tiện
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
          {/* XE ĐANG CHỌN */}
          {localList.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-8">
              {localList.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl group hover:border-indigo-300 transition-all shadow-sm"
                >
                  <span className="text-sm font-bold text-slate-700">
                    {item.model || `Xe #${item.id}`}
                  </span>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
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
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 transition-all mb-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Đang xử lý dữ liệu..." : "Tiến Hành So Sánh Ngay"}
            </button>
          )}

          {/* ERROR */}
          {error && (
            <div className="mb-5 p-4 bg-red-50 border-2 border-red-400 text-red-700 text-sm rounded-lg font-medium">
              {error}
            </div>
          )}

          {/* BẢNG SO SÁNH */}
          {comparisonData?.success && (
            <>
              <CompareTable data={comparisonData} type={comparisonData.type} />
              <AIRecommendSection
                onRecommend={handleAIRecommend}
                aiLoading={aiLoading}
                aiError={aiError}
                aiRecommendation={aiRecommendation}
              />
            </>
          )}
        </div>
        {/* FOOTER */}
        {comparisonData?.success && (
          <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex gap-4">
            <button
              onClick={handleClear}
              className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all flex-1"
            >
              Xóa Tất Cả
            </button>

            {aiRecommendation && (
              <button
                onClick={handleRentNow}
                className="px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex-[2] flex items-center justify-center gap-2"
              >
                Thuê Xe Ngay
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompareModal;
