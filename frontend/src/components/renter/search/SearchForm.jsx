import { useState, useEffect } from "react";
import { MapPin, Calendar, Search, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import LocationModal from "./LocationModal";
import DateTimeModal from "./DateTimeModal";

const SearchForm = ({ onSubmit, initialValues = {}, type = "car" }) => {
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);

  const [formData, setFormData] = useState({
    location: initialValues.location || "",
    startDate: initialValues.startDate || "",
    endDate: initialValues.endDate || "",
  });

  useEffect(() => {
    setFormData({
      location: initialValues.location || "",
      startDate: initialValues.startDate || "",
      endDate: initialValues.endDate || "",
    });
  }, [initialValues]);

  const formatDisplayDateTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return format(date, "HH:mm, dd/MM/yyyy");
  };

  const timeDisplay =
    formData.startDate && formData.endDate
      ? `${formatDisplayDateTime(formData.startDate)} - ${formatDisplayDateTime(
          formData.endDate
        )}`
      : "Chọn thời gian";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.location.trim()) {
      alert("Vui lòng chọn địa điểm!");
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      alert("Vui lòng chọn thời gian!");
      return;
    }
    onSubmit(formData);
  };

  const handleLocationSelect = (location) => {
    setFormData({ ...formData, location });
    setShowLocationModal(false);
  };

  const handleDateSave = (start, end) => {
    setFormData({
      ...formData,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
    setShowDateModal(false);
  };

  const themeClass = type === "car" ? "border-green-200" : "border-blue-200";

  return (
    <>
      {/* Thanh tìm kiếm trung tâm */}
      <div className="w-full flex justify-center mt-6">
        <form
          onSubmit={handleSubmit}
          className={`bg-white rounded-full shadow-lg border ${themeClass} 
                      flex items-center justify-between gap-4 px-6 py-4 
                      w-[75%] max-w-5xl transition-all duration-300 hover:shadow-xl`}
        >
          {/* Địa điểm */}
          <div
            className="flex items-center gap-3 flex-1 cursor-pointer border-r border-gray-200 pr-4 hover:bg-gray-50 rounded-full transition"
            onClick={() => setShowLocationModal(true)}
          >
            <MapPin className="text-gray-500" size={22} />
            <div className="flex flex-col text-left">
              <span className="text-sm text-gray-500">Địa điểm</span>
              <span className="font-medium text-gray-800 truncate max-w-[180px]">
                {formData.location || "Chọn địa điểm"}
              </span>
            </div>
            <ChevronDown className="ml-auto text-gray-400" size={18} />
          </div>

          {/* Thời gian thuê */}
          <div
            className="flex items-center gap-3 flex-1 cursor-pointer border-r border-gray-200 pr-4 hover:bg-gray-50 rounded-full transition"
            onClick={() => setShowDateModal(true)}
          >
            <Calendar className="text-gray-500" size={22} />
            <div className="flex flex-col text-left">
              <span className="text-sm text-gray-500">Thời gian thuê</span>
              <span className="font-medium text-gray-800 truncate max-w-[250px]">
                {timeDisplay}
              </span>
            </div>
            <ChevronDown className="ml-auto text-gray-400" size={18} />
          </div>

          <button
            type="submit"
            disabled={
              !formData.location.trim() ||
              !formData.startDate ||
              !formData.endDate
            }
            className="flex items-center justify-center gap-2 bg-green-500 text-white px-8 py-3 rounded-full 
                       hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search size={18} />
            <span>Tìm Xe</span>
          </button>
        </form>
      </div>

      {/* Modals */}
      {showLocationModal && (
        <LocationModal
          onClose={() => setShowLocationModal(false)}
          onLocationSelect={handleLocationSelect}
          initialLocation={formData.location}
        />
      )}

      {showDateModal && (
        <DateTimeModal
          onClose={() => setShowDateModal(false)}
          onDatesSelect={handleDateSave}
          initialStart={
            formData.startDate ? new Date(formData.startDate) : null
          }
          initialEnd={formData.endDate ? new Date(formData.endDate) : null}
        />
      )}
    </>
  );
};

export default SearchForm;
