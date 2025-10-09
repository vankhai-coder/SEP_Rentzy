import { useState, useEffect } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import vi from "date-fns/locale/vi";
import { X, Calendar, Clock, AlertCircle } from "lucide-react";
import { addDays, format, isAfter } from "date-fns";

registerLocale("vi", vi);

const DateTimeModal = ({
  onClose,
  onDatesSelect,
  initialStart = null,
  initialEnd = null,
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [dateRange, setDateRange] = useState([
    initialStart || today,
    initialEnd || addDays(today, 1),
  ]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [isValid, setIsValid] = useState(true);
  const [startDate, endDate] = dateRange;

  useEffect(() => {
    if (initialStart) setStartTime(format(new Date(initialStart), "HH:mm"));
    if (initialEnd) setEndTime(format(new Date(initialEnd), "HH:mm"));

    const fullStart = new Date(startDate);
    fullStart.setHours(...startTime.split(":").map(Number), 0, 0);
    const fullEnd = new Date(endDate);
    fullEnd.setHours(...endTime.split(":").map(Number), 0, 0);
    setIsValid(isAfter(fullEnd, fullStart));
  }, [startDate, endDate, startTime, endTime, initialStart, initialEnd]);

  const handleDateChange = (dates) => setDateRange(dates);

  const handleSaveTime = () => {
    if (!isValid)
      return alert("Thời gian kết thúc phải sau thời gian bắt đầu!");

    const fullStart = new Date(startDate);
    const [sh, sm] = startTime.split(":").map(Number);
    fullStart.setHours(sh, sm, 0, 0);

    const fullEnd = new Date(endDate);
    const [eh, em] = endTime.split(":").map(Number);
    fullEnd.setHours(eh, em, 0, 0);

    onDatesSelect(fullStart, fullEnd);
    onClose();
  };

  const timeOptions = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      timeOptions.push(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
      );
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Calendar size={20} />
            <span>Chọn thời gian thuê xe</span>
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded p-1"
          >
            <X size={24} />
          </button>
        </div>

        {/* Calendar */}
        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Chọn khoảng thời gian
          </label>
          <div className="flex justify-center">
            <DatePicker
              locale="vi"
              selectsRange
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateChange}
              minDate={today}
              monthsShown={2}
              inline
              calendarClassName="custom-calendar"
            />
          </div>
        </div>

        {/* Time Picker */}
        <div className="p-6 border-t border-gray-200 bg-green-50">
          <h4 className="text-sm font-medium text-green-700 mb-4 flex items-center gap-2">
            <Clock size={16} />
            <span>Chọn giờ nhận / trả</span>
          </h4>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Giờ nhận
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-3 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 bg-white"
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Giờ trả
              </label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-3 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 bg-white"
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 bg-white rounded-xl border border-green-300">
            <span className="text-sm text-gray-700 block">
              {`${startTime} ngày ${format(
                startDate,
                "dd/MM/yyyy"
              )} - ${endTime} ngày ${format(endDate, "dd/MM/yyyy")}`}
            </span>
            {!isValid && (
              <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                <AlertCircle size={14} />
                <span>Kết thúc phải sau bắt đầu</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={handleSaveTime}
            disabled={!isValid}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Clock size={18} />
            <span>Lưu thời gian</span>
          </button>
        </div>
      </div>

      <style jsx global>{`
        .custom-calendar {
          width: fit-content !important;
          margin: 0 auto !important;
          display: flex !important;
          justify-content: center !important;
          gap: 2rem;
        }
        .react-datepicker__month-container {
          border-radius: 8px;
        }
        .react-datepicker__header {
          background-color: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          text-align: center;
        }
        .react-datepicker__day--selected,
        .react-datepicker__day--in-range,
        .react-datepicker__day--keyboard-selected {
          background-color: #22c55e !important;
          color: white !important;
        }
        .react-datepicker__day--in-selecting-range {
          background-color: #bbf7d0 !important;
        }
        .react-datepicker__current-month {
          font-weight: 600;
          color: #065f46;
        }
      `}</style>
    </div>
  );
};

export default DateTimeModal;
