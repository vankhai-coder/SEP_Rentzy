// src/components/SearchForm.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { MapPin, Calendar, ChevronDown } from "lucide-react";
import { format, addDays } from "date-fns";
import LocationModal from "./LocationModal";
import DateTimeModal from "./DateTimeModal";
import "./SearchForm.css";

const SearchForm = ({ onSubmit, initialValues = {}, type = "car" }) => {
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [hasUserInteraction, setHasUserInteraction] = useState(false);

  const isFirstRender = useRef(true);

  const [formData, setFormData] = useState({
    location: "",
    startDate: "",
    endDate: "",
  });

  // ✅ Helper: Làm tròn giờ lên giờ chẵn tiếp theo
  const roundToNextHour = (date) => {
    const d = new Date(date);
    const mins = d.getMinutes();
    if (mins > 0 || d.getSeconds() > 0) {
      d.setHours(d.getHours() + 1);
    }
    d.setMinutes(0, 0, 0);
    return d;
  };

  // ✅ Parse ngày giờ từ URL params hoặc dùng giờ hiện tại
  useEffect(() => {
    // ✅ Lấy giờ hiện tại và làm tròn lên giờ chẵn
    const now = new Date();
    const today = roundToNextHour(now);

    // ✅ Ngày mai cùng giờ
    const tomorrow = addDays(today, 1);

    let parsedStart = null;
    let parsedEnd = null;

    // Parse start_date và start_time từ URL
    if (initialValues.start_date) {
      const [year, month, day] = initialValues.start_date
        .split("-")
        .map(Number);
      const startTime = initialValues.start_time || format(today, "HH:mm");
      const [hours, minutes] = startTime.split(":").map(Number);
      parsedStart = new Date(year, month - 1, day, hours, minutes, 0, 0);
    }

    // Parse end_date và end_time từ URL
    if (initialValues.end_date) {
      const [year, month, day] = initialValues.end_date.split("-").map(Number);
      const endTime = initialValues.end_time || format(tomorrow, "HH:mm");
      const [hours, minutes] = endTime.split(":").map(Number);
      parsedEnd = new Date(year, month - 1, day, hours, minutes, 0, 0);
    }

    setFormData({
      location: initialValues.location || "Đà Nẵng",
      startDate: parsedStart ? parsedStart.toISOString() : today.toISOString(),
      endDate: parsedEnd ? parsedEnd.toISOString() : tomorrow.toISOString(),
    });

    if (isFirstRender.current) {
      isFirstRender.current = false;
    }
  }, [
    initialValues.location,
    initialValues.start_date,
    initialValues.end_date,
    initialValues.start_time,
    initialValues.end_time,
  ]);

  // Realtime search với cả ngày và giờ
  const triggerSearch = useCallback(() => {
    if (!hasUserInteraction) return;

    if (formData.location || (formData.startDate && formData.endDate)) {
      const getDateOnly = (dateStr) => {
        if (!dateStr || dateStr === "undefined") return undefined;
        try {
          const date = new Date(dateStr);
          return isNaN(date.getTime()) ? undefined : format(date, "yyyy-MM-dd");
        } catch {
          return undefined;
        }
      };

      const getTimeOnly = (dateStr) => {
        if (!dateStr || dateStr === "undefined") return undefined;
        try {
          const date = new Date(dateStr);
          return isNaN(date.getTime()) ? undefined : format(date, "HH:mm");
        } catch {
          return undefined;
        }
      };

      // ✅ GỬI CẢ NGÀY VÀ GIỜ vào URL params
      onSubmit({
        location: formData.location || undefined,
        start_date: getDateOnly(formData.startDate),
        end_date: getDateOnly(formData.endDate),
        start_time: getTimeOnly(formData.startDate),
        end_time: getTimeOnly(formData.endDate),
      });
    }
  }, [formData, onSubmit, hasUserInteraction]);

  useEffect(() => {
    const timer = setTimeout(triggerSearch, 300);
    return () => clearTimeout(timer);
  }, [triggerSearch]);

  // ✅ Format hiển thị thời gian (chỉ hiển thị giờ chẵn)
  const formatTimeDisplay = () => {
    if (!formData.startDate || !formData.endDate) return "Chọn thời gian";

    try {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return "Chọn thời gian";
      }

      const isSameDay = start.toDateString() === end.toDateString();

      if (isSameDay) {
        return `${format(start, "HH:00")} - ${format(
          end,
          "HH:00, dd/MM/yyyy"
        )}`;
      } else {
        return `${format(start, "HH:00, dd/MM")} - ${format(
          end,
          "HH:00, dd/MM/yyyy"
        )}`;
      }
    } catch {
      return "Chọn thời gian";
    }
  };

  const timeDisplay = formatTimeDisplay();

  const handleLocationSelect = (location) => {
    setHasUserInteraction(true);
    setFormData((prev) => ({ ...prev, location }));
    setShowLocationModal(false);
  };

  const handleDateSave = (start, end) => {
    setHasUserInteraction(true);
    setFormData((prev) => ({
      ...prev,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    }));
    setShowDateModal(false);
  };

  const themeClass = type === "car" ? "border-green-200" : "border-blue-200";

  return (
    <>
      <div className="search-form-container">
        <div className={`search-form ${themeClass}`}>
          <div
            className="search-form-section location-section"
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

          <div
            className="search-form-section datetime-section"
            onClick={() => setShowDateModal(true)}
          >
            <Calendar className="search-form-icon" />
            <div className="search-form-label">
              <span className="search-form-label-text">Thời gian thuê</span>
              <span className="search-form-label-value search-form-time-value">
                {timeDisplay}
              </span>
            </div>
            <ChevronDown className="search-form-chevron" />
          </div>
        </div>
      </div>

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
