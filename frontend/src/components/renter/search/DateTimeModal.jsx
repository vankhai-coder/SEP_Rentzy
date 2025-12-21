// DateTimeModal.jsx
import { useState, useEffect } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./DateTimeModal.css";
import vi from "date-fns/locale/vi";
import { X, Calendar, Clock, AlertCircle, ChevronDown } from "lucide-react";
import { addDays, format, isAfter } from "date-fns";
import { toast } from "react-toastify";

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
  const [endTime, setEndTime] = useState("08:00");
  const [isValid, setIsValid] = useState(true);
  const [showStartOptions, setShowStartOptions] = useState(false);
  const [showEndOptions, setShowEndOptions] = useState(false);
  const [startDate, endDate] = dateRange;

  const now = new Date();

  // ✅ Làm tròn lên giờ chẵn tiếp theo
  const roundToNextHour = (date) => {
    const d = new Date(date);
    const mins = d.getMinutes();
    if (mins > 0) {
      d.setHours(d.getHours() + 1);
    }
    d.setMinutes(0, 0, 0);
    return d;
  };

  const timeToMinutes = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const nextHourAfter = (mins) => {
    const hours = Math.floor(mins / 60) + 1;
    return `${hours.toString().padStart(2, "0")}:00`;
  };

  // Chỉ chạy 1 lần khi modal mount (lần đầu mở)
  useEffect(() => {
    if (initialStart) {
      const initStartTime = format(new Date(initialStart), "HH:00"); // ✅ Chỉ lấy giờ
      setStartTime(initStartTime);
    }
    if (initialEnd) {
      const initEndTime = format(new Date(initialEnd), "HH:00"); // ✅ Chỉ lấy giờ
      setEndTime(initEndTime);
    }
  }, []);

  useEffect(() => {
    const fullStart = new Date(startDate);
    fullStart.setHours(...startTime.split(":").map(Number), 0, 0);
    const fullEnd = new Date(endDate);
    fullEnd.setHours(...endTime.split(":").map(Number), 0, 0);
    setIsValid(isAfter(fullEnd, fullStart));
  }, [startDate, endDate, startTime, endTime]);

  const handleDateChange = (dates) => setDateRange(dates);

  const handleSaveTime = () => {
    if (!isValid)
      return toast.error("Thời gian kết thúc phải sau thời gian bắt đầu!");

    const fullStart = new Date(startDate);
    const [sh, sm] = startTime.split(":").map(Number);
    fullStart.setHours(sh, sm, 0, 0);

    const fullEnd = new Date(endDate);
    const [eh, em] = endTime.split(":").map(Number);
    fullEnd.setHours(eh, em, 0, 0);

    onDatesSelect(fullStart, fullEnd);
    onClose();
  };

  // ✅ CHỈ TẠO GIỜ CHẴN (0h, 1h, 2h, ..., 23h)
  const timeOptions = [];
  for (let h = 0; h < 24; h++) {
    timeOptions.push(`${h.toString().padStart(2, "0")}:00`);
  }

  // Build filtered options based on current day and selected start/end
  const isSameDay = (a, b) =>
    a && b && new Date(a).toDateString() === new Date(b).toDateString();

  const minStartTimeStr = isSameDay(startDate, now)
    ? format(roundToNextHour(now), "HH:00") // ✅ Làm tròn lên giờ chẵn
    : "00:00";
  const minStartMins = timeToMinutes(minStartTimeStr);

  const startTimeOptions = timeOptions.filter((t) => {
    if (isSameDay(startDate, now)) {
      return timeToMinutes(t) >= minStartMins;
    }
    return true;
  });

  let minEndMins = 0;
  if (isSameDay(endDate, now)) {
    minEndMins = Math.max(minEndMins, minStartMins);
  }
  if (isSameDay(startDate, endDate)) {
    minEndMins = Math.max(minEndMins, timeToMinutes(startTime));
  }
  const endTimeOptions = timeOptions.filter(
    (t) => timeToMinutes(t) > minEndMins
  );

  // Auto-adjust selected times if they become invalid
  useEffect(() => {
    if (isSameDay(startDate, now) && timeToMinutes(startTime) < minStartMins) {
      setStartTime(minStartTimeStr);
    }

    let requiredMinEnd = minEndMins;
    if (timeToMinutes(endTime) <= requiredMinEnd) {
      const adjusted = nextHourAfter(requiredMinEnd);
      setEndTime(adjusted);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, startTime]);

  const toggleStartOptions = () => setShowStartOptions(!showStartOptions);
  const toggleEndOptions = () => setShowEndOptions(!showEndOptions);

  const selectStartTime = (time) => {
    setStartTime(time);
    setShowStartOptions(false);
  };

  const selectEndTime = (time) => {
    setEndTime(time);
    setShowEndOptions(false);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg md:max-w-2xl shadow-xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Calendar Section */}
        <div className="md:w-1/2 p-4 md:p-6 flex flex-col items-center flex-shrink-0">
          <div className="flex justify-between items-center w-full mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Calendar size={20} />
              <span>Chọn ngày thuê</span>
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 rounded p-1"
            >
              <X size={24} />
            </button>
          </div>
          <DatePicker
            locale="vi"
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateChange}
            minDate={today}
            monthsShown={1}
            inline
            calendarClassName="custom-calendar w-full"
          />
        </div>

        {/* Time Section */}
        <div className="md:w-1/2 p-4 md:p-6 flex flex-col justify-between bg-green-50 flex-1 min-h-0">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-green-700 mb-4 flex items-center gap-2">
              <Clock size={16} />
              <span>Chọn giờ nhận / trả</span>
            </h4>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Giờ nhận
                </label>
                <div className="relative">
                  <div
                    className="border border-green-300 rounded-xl bg-white p-3 cursor-pointer flex justify-between items-center focus:ring-2 focus:ring-green-500"
                    onClick={toggleStartOptions}
                    tabIndex={0}
                  >
                    <span className="text-sm text-gray-700">{startTime}</span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${
                        showStartOptions ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                  {showStartOptions && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {startTimeOptions.map((time) => {
                        const isSelected = startTime === time;
                        return (
                          <div
                            key={time}
                            className={`flex items-center p-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                              isSelected
                                ? "bg-green-50 text-green-700"
                                : "hover:bg-gray-50"
                            }`}
                            onClick={() => selectStartTime(time)}
                          >
                            <div className="flex items-center mr-3">
                              <div
                                className={`w-4 h-4 rounded-full border-2 transition-colors ${
                                  startTime === time
                                    ? "bg-green-600 border-green-600"
                                    : "border-gray-300"
                                }`}
                              />
                            </div>
                            <span
                              className={`text-sm ${
                                isSelected ? "text-green-700" : "text-gray-700"
                              }`}
                            >
                              {time}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Giờ trả
                </label>
                <div className="relative">
                  <div
                    className="border border-green-300 rounded-xl bg-white p-3 cursor-pointer flex justify-between items-center focus:ring-2 focus:ring-green-500"
                    onClick={toggleEndOptions}
                    tabIndex={0}
                  >
                    <span className="text-sm text-gray-700">{endTime}</span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${
                        showEndOptions ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                  {showEndOptions && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {endTimeOptions.map((time) => {
                        const isSelected = endTime === time;
                        return (
                          <div
                            key={time}
                            className={`flex items-center p-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                              isSelected
                                ? "bg-green-50 text-green-700"
                                : "hover:bg-gray-50"
                            }`}
                            onClick={() => selectEndTime(time)}
                          >
                            <div className="flex items-center mr-3">
                              <div
                                className={`w-4 h-4 rounded-full border-2 transition-colors ${
                                  endTime === time
                                    ? "bg-green-600 border-green-600"
                                    : "border-gray-300"
                                }`}
                              />
                            </div>
                            <span
                              className={`text-sm ${
                                isSelected ? "text-green-700" : "text-gray-700"
                              }`}
                            >
                              {time}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-green-300 text-sm text-gray-700">
              {`${startTime} ngày ${format(
                startDate,
                "dd/MM/yyyy"
              )} - ${endTime} ngày ${format(endDate, "dd/MM/yyyy")}`}
              {!isValid && (
                <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                  <AlertCircle size={14} />
                  <span>Kết thúc phải sau bắt đầu</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 flex-shrink-0">
            <button
              onClick={handleSaveTime}
              disabled={!isValid}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              <Clock size={18} />
              <span>Xác nhận</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateTimeModal;
