import { useState, useEffect } from "react";
import { MapPin, Calendar, Search, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import LocationModal from "./LocationModal";
import DateTimeModal from "./DateTimeModal";
import "./SearchForm.css"; // Import CSS mới để dễ chỉnh

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

  const themeClass = type === "car" ? "border-green-200" : "border-blue-200"; // Giữ cho theme, nhưng CSS chính ở file riêng

  return (
    <>
      {/* Thanh tìm kiếm trung tâm - Thêm padding top/bottom qua CSS */}
      <div className="search-form-container">
        {" "}
        {/* Class mới cho container */}
        <form onSubmit={handleSubmit} className={`search-form ${themeClass}`}>
          {/* Địa điểm */}
          <div
            className="search-form-section" // Class mới
            onClick={() => setShowLocationModal(true)}
          >
            <MapPin className="search-form-icon" />
            <div className="search-form-label">
              <span className="search-form-label-text">Địa điểm</span>
              <span className="search-form-label-value">
                {formData.location || "Chọn địa điểm"}
              </span>
            </div>
            <ChevronDown className="search-form-chevron" />
          </div>

          {/* Thời gian thuê */}
          <div
            className="search-form-section" // Class mới (không border-r vì CSS handle)
            onClick={() => setShowDateModal(true)}
          >
            <Calendar className="search-form-icon" />
            <div className="search-form-label">
              <span className="search-form-label-text">Thời gian thuê</span>
              <span className="search-form-label-value search-form-time-value">
                {" "}
                {/* Class riêng cho time */}
                {timeDisplay}
              </span>
            </div>
            <ChevronDown className="search-form-chevron" />
          </div>

          <button
            type="submit"
            disabled={
              !formData.location.trim() ||
              !formData.startDate ||
              !formData.endDate
            }
            className="search-form-submit" // Class mới
          >
            <Search className="search-form-submit-icon" />
            <span>Tìm Xe</span>
          </button>
        </form>
      </div>

      {/* Modals - Giữ nguyên */}
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
