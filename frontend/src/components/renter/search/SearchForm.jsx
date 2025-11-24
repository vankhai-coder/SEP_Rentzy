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

  // Dùng ref để biết đã khởi tạo lần đầu chưa
  const isFirstRender = useRef(true);

  // Flag để biết user đã tương tác chưa (để tránh search ngay với default)
  const [hasUserInteraction, setHasUserInteraction] = useState(false);

  const [formData, setFormData] = useState({
    location: initialValues.location || "",
    startDate: initialValues.startDate || "",
    endDate: initialValues.endDate || "",
  });

  // CHỈ sync từ URL khi component mount lần đầu và set default nếu chưa có
  useEffect(() => {
    if (isFirstRender.current) {
      const today = new Date();
      today.setHours(9, 0, 0, 0); // 9h hôm nay

      const tomorrow = addDays(today, 1);
      tomorrow.setHours(9, 0, 0, 0); // 9h ngày mai

      const defaultStart = today.toISOString();
      const defaultEnd = tomorrow.toISOString();

      setFormData({
        location: initialValues.location || "Đà Nẵng",
        startDate: initialValues.startDate || defaultStart,
        endDate: initialValues.endDate || defaultEnd,
      });
      isFirstRender.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy 1 lần khi mount

  // Realtime search - chỉ trigger nếu user đã tương tác
  const triggerSearch = useCallback(() => {
    if (!hasUserInteraction) return; // Skip nếu chưa có user interaction

    if (formData.location || (formData.startDate && formData.endDate)) {
      // Lấy ngày từ chuỗi an toàn
      const getDateOnly = (dateStr) => {
        if (!dateStr || dateStr === "undefined") return undefined;
        try {
          const date = new Date(dateStr);
          return isNaN(date.getTime()) ? undefined : format(date, "yyyy-MM-dd");
        } catch {
          return undefined;
        }
      };

      onSubmit({
        location: formData.location || undefined,
        start_date: getDateOnly(formData.startDate),
        end_date: getDateOnly(formData.endDate),
      });
    }
  }, [formData, onSubmit, hasUserInteraction]);

  useEffect(() => {
    const timer = setTimeout(triggerSearch, 300);
    return () => clearTimeout(timer);
  }, [triggerSearch]);

  // HIỂN THỊ THỜI GIAN - SIÊU ỔN ĐỊNH
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
        return `${format(start, "HH:mm")} - ${format(
          end,
          "HH:mm, dd/MM/yyyy"
        )}`;
      } else {
        return `${format(start, "HH:mm, dd/MM")} - ${format(
          end,
          "HH:mm, dd/MM/yyyy"
        )}`;
      }
    } catch {
      return "Chọn thời gian";
    }
  };

  const timeDisplay = formatTimeDisplay();

  const handleLocationSelect = (location) => {
    setHasUserInteraction(true); // Đánh dấu user đã tương tác
    setFormData((prev) => ({ ...prev, location }));
    setShowLocationModal(false);
  };

  // LƯU DỮ LIỆU AN TOÀN - DÙNG ISO STRING (vẫn ổn nếu xử lý đúng)
  const handleDateSave = (start, end) => {
    setHasUserInteraction(true); // Đánh dấu user đã tương tác
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
          {/* Địa điểm */}
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

          {/* Thời gian thuê */}
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
