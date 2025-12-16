import React, { useState, useCallback, useEffect, useMemo } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { vi } from "date-fns/locale";
import axios from "axios";
import { toast } from "sonner";
import "react-datepicker/dist/react-datepicker.css";
import "./DateTimeSelector.css";

registerLocale("vi", vi);

function DateTimeSelector({
  onDateTimeChange,
  initialStartDate,
  initialEndDate,
  initialPickupTime,
  initialReturnTime,
  vehicleId,
}) {
  
  const [startDate, setStartDate] = useState(
    initialStartDate ? new Date(initialStartDate) : null
  );
  const [endDate, setEndDate] = useState(
    initialEndDate ? new Date(initialEndDate) : null
  );
  const [pickupTime, setPickupTime] = useState(initialPickupTime || null);
  const [returnTime, setReturnTime] = useState(initialReturnTime || null);
  const [bookedDates, setBookedDates] = useState([]);
  const [inlineError, setInlineError] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

  // Lấy danh sách ngày mà xe đã đặt 
  useEffect(() => {
    const fetchBookedDates = async () => {
      if (!vehicleId) return;

      try {
        setIsLoading(true);
        const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const { data } = await axios.get(
          `${baseURL}/api/renter/booking/getDate/${vehicleId}`
        );

        if (data.success && Array.isArray(data.bookedDates)) {
          const normalized = data.bookedDates.map((b) => ({
            start: new Date(b.startDateTime),
            end: new Date(b.endDateTime),
            pickup: b.pickupTime,
            return: b.returnTime,
          }));
          setBookedDates(normalized);


        }
      } catch (err) {
        console.error("Lỗi tải lịch:", err);
        toast.error("Không thể tải lịch đã đặt");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookedDates();
  }, [vehicleId]);

  // Utility functions
  const getCurrentDateTime = () => new Date();
  
  const isPastDate = (date) =>
    date.setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
    
  const formatDateDisplay = (date, time) =>
    date && time ? `${time}, ${date.toLocaleDateString("vi-VN")}` : "";

  const formatDateToYMD = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // Kiểm tra giờ có bị đặt không
  const isHourBooked = useCallback(
    (hour, date) => {
      if (!bookedDates.length || !date) return false;

      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setHours(hour + 1);

      return bookedDates.some(({ start, end, pickup, return: returnTime }) => {
        // Kiểm tra khoảng thời gian đã đặt
        const isInBookedRange = slotStart < end && slotEnd > start;
        
        // Kiểm tra giờ pickup và return cụ thể
        const dateStr = formatDateToYMD(date);
        const startDateStr = formatDateToYMD(start);
        const endDateStr = formatDateToYMD(end);
        
        let isSpecificHour = false;
        
        // Nếu là ngày bắt đầu, ẩn giờ pickup
        if (dateStr === startDateStr && pickup) {
          const pickupHour = parseInt(pickup.split(':')[0]);
          if (hour === pickupHour) {
            isSpecificHour = true;
          }
        }
        
        // Nếu là ngày kết thúc, ẩn giờ return
        if (dateStr === endDateStr && returnTime) {
          const returnHour = parseInt(returnTime.split(':')[0]);
          if (hour === returnHour) {
            isSpecificHour = true;
          }
        }
        
        return isInBookedRange || isSpecificHour;
      });
    },
    [bookedDates]
  );

  // Kiểm tra giờ có trong quá khứ không
  const isPastHour = useCallback((hour, date) => {
    if (!date) return false;
    
    const slotDateTime = new Date(date);
    slotDateTime.setHours(hour, 0, 0, 0);
    
    return slotDateTime <= getCurrentDateTime();
  }, []);

  // Lấy danh sách giờ có thể chọn
  const getAvailableHours = useCallback(
    (date, isReturnTime = false) => {
      if (!date) return [];

      return Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, "0");
        let isAvailable = true;
        let reason = "";

        // Kiểm tra giờ trong quá khứ
        if (isPastHour(i, date)) {
          isAvailable = false;
          reason = "Đã qua";
        }
        // Kiểm tra giờ đã được đặt
        else if (isHourBooked(i, date)) {
          isAvailable = false;
          reason = "Đã đặt";
        }
        // Nếu là giờ trả xe, kiểm tra phải sau giờ nhận xe
        else if (isReturnTime && startDate && pickupTime) {
          const isSameDay = startDate.toDateString() === date.toDateString();
          if (isSameDay) {
            const [pickupHour] = pickupTime.split(":").map(Number);
            if (i <= pickupHour) {
              isAvailable = false;
              reason = "Phải sau giờ nhận";
            }
          }
        }

        return { 
          time: `${hour}:00`, 
          isAvailable, 
          reason,
          hour: i 
        };
      });
    },
    [isHourBooked, isPastHour, startDate, pickupTime]
  );

  // Lấy danh sách ngày để highlight
  const getHighlightDates = useCallback(() => {
    const allDates = bookedDates.flatMap(({ start, end }) => {
      const arr = [];
      for (
        let d = new Date(start);
        d <= end;
        d.setUTCDate(d.getUTCDate() + 1)
      ) {
        arr.push(new Date(d));
      }
      return arr;
    });
    return [{ "react-datepicker__day--highlighted-custom": allDates }];
  }, [bookedDates]);

  // Validation functions
  // Helper to check for intersection with any booked interval
  const checkConflict = (start, end) => {
      if (!start || !end || !bookedDates.length) return null;
      for (const booking of bookedDates) {
          // start/end of request vs booking.start/booking.end
          if (start < booking.end && end > booking.start) {
              return booking;
          }
      }
      return null;
  };

  const validateDateSelection = (type, date) => {
    if (!date) return { isValid: true };

    if (isPastDate(date)) {
      return { 
        isValid: false, 
        message: "Không thể chọn ngày trong quá khứ" 
      };
    }

    if (type === "start" && endDate && date > endDate) {
      return { 
        isValid: false, 
        message: "Ngày nhận xe không thể sau ngày trả xe" 
      };
    }

    if (type === "end" && startDate && date < startDate) {
      return { 
        isValid: false, 
        message: "Ngày trả xe không thể trước ngày nhận xe" 
      };
    }

    // Check conflict for intermediate days
    if (type === "end" && startDate && date > startDate) {
         const checkStart = new Date(startDate);
         checkStart.setHours(23, 59, 59, 999);
         
         const checkEnd = new Date(date);
         checkEnd.setHours(0, 0, 0, 0);
         
         if (checkStart < checkEnd) {
             const conflict = checkConflict(checkStart, checkEnd);
             if (conflict) {
                 return {
                     isValid: false,
                     message: "Đã có người thuê trong khoảng thời gian này, vui lòng chọn ngày khác"
                 };
             }
         }
    }

    if (type === "start" && endDate && date < endDate) {
         const checkStart = new Date(date);
         checkStart.setHours(23, 59, 59, 999);
         
         const checkEnd = new Date(endDate);
         checkEnd.setHours(0, 0, 0, 0);
         
         if (checkStart < checkEnd) {
             const conflict = checkConflict(checkStart, checkEnd);
             if (conflict) {
                 return {
                     isValid: false,
                     message: "Đã có người thuê trong khoảng thời gian này, vui lòng chọn ngày khác"
                 };
             }
         }
    }

    return { isValid: true };
  };

  const validateTimeSelection = (type, time, selectedDate) => {
    if (!selectedDate || !time) return { isValid: true };

    const [hour] = time.split(":").map(Number);
    
    // Kiểm tra giờ trong quá khứ
    if (isPastHour(hour, selectedDate)) {
      return { 
        isValid: false, 
        message: "Không thể chọn giờ trong quá khứ" 
      };
    }

    // Kiểm tra giờ đã được đặt
    if (isHourBooked(hour, selectedDate)) {
      return { 
        isValid: false, 
        message: "Giờ này đã được đặt" 
      };
    }

    // Kiểm tra logic giờ trả sau giờ nhận
    if (type === "return" && startDate && pickupTime) {
      const isSameDay = startDate.toDateString() === selectedDate.toDateString();
      if (isSameDay) {
        const [pickupHour] = pickupTime.split(":").map(Number);
        if (hour <= pickupHour) {
          return { 
            isValid: false, 
            message: "Giờ trả xe phải sau giờ nhận xe" 
          };
        }
      }
    }

    // Full range check if we have enough info
    let sDate = startDate;
    let eDate = endDate;
    let pTime = pickupTime;
    let rTime = returnTime;
    
    if (type === 'pickup') {
        pTime = time;
        sDate = selectedDate; 
    } else if (type === 'return') {
        rTime = time;
        eDate = selectedDate;
    }
    
    if (sDate && eDate && pTime && rTime) {
        const start = new Date(sDate);
        const [ph] = pTime.split(":").map(Number);
        start.setHours(ph, 0, 0, 0);
        
        const end = new Date(eDate);
        const [rh] = rTime.split(":").map(Number);
        end.setHours(rh, 0, 0, 0);
        
        if (start < end) {
             const conflict = checkConflict(start, end);
             if (conflict) {
                 return {
                     isValid: false,
                     message: "Đã có người thuê trong khoảng thời gian này, vui lòng chọn ngày khác"
                 };
             }
        }
    }

    return { isValid: true };
  };

  // Event Handlers
  const handleDateChange = (type, date) => {
    setInlineError(null);
    const validation = validateDateSelection(type, date);
    
    if (!validation.isValid) {
      toast.warning(validation.message);
      setInlineError(validation.message);
      return;
    }

    // Kiểm tra xem ngày đã chọn có giờ nào trống không
    const hours = getAvailableHours(date, type === "end");
    const hasSlots = hours.some(h => h.isAvailable);

    if (!hasSlots) {
      const msg = "Ngày này đã kín lịch, vui lòng chọn ngày khác";
      toast.error(msg);
      setInlineError(msg);
      return;
    }

    if (type === "start") {
      setStartDate(date);
      setPickupTime(null); // Reset pickup time khi đổi ngày
      
      // Nếu ngày trả xe trước ngày nhận xe mới, reset ngày trả xe
      if (endDate && date && date > endDate) {
        setEndDate(null);
        setReturnTime(null);
      }
    } else {
      setEndDate(date);
      setReturnTime(null); // Reset return time khi đổi ngày
    }
  };

  const handleTimeSelect = (type, time) => {
    setInlineError(null);
    const selectedDate = type === "pickup" ? startDate : endDate;
    
    if (!selectedDate) {
      toast.warning(
        type === "pickup" ? "Vui lòng chọn ngày nhận xe trước" : "Vui lòng chọn ngày trả xe trước"
      );
      return;
    }

    const validation = validateTimeSelection(type, time, selectedDate);
    
    if (!validation.isValid) {
      toast.warning(validation.message);
      setInlineError(validation.message);
      return;
    }

    if (type === "pickup") {
      setPickupTime(time);
      
      // Nếu đã có giờ trả xe và cùng ngày, kiểm tra lại logic
      if (returnTime && endDate && startDate?.toDateString() === endDate.toDateString()) {
        const [newPickupHour] = time.split(":").map(Number);
        const [currentReturnHour] = returnTime.split(":").map(Number);
        
        if (newPickupHour >= currentReturnHour) {
          setReturnTime(null);
          toast.info("Đã reset giờ trả xe do thay đổi giờ nhận xe");
        }
      }
    } else {
      setReturnTime(time);
    }
  };

  const handleConfirm = () => {
    setInlineError(null);
    if (!startDate || !endDate || !pickupTime || !returnTime) {
      const msg = "Vui lòng chọn đầy đủ ngày và giờ nhận/trả xe";
      toast.error(msg);
      setInlineError(msg);
      return;
    }

    // Validation cuối cùng
    const start = new Date(startDate);
    const end = new Date(endDate);
    const [ph] = pickupTime.split(":").map(Number);
    const [rh] = returnTime.split(":").map(Number);
    
    start.setHours(ph, 0, 0, 0);
    end.setHours(rh, 0, 0, 0);

    if (start >= end) {
      const msg = "Thời gian trả xe phải sau thời gian nhận xe";
      toast.error(msg);
      setInlineError(msg);
      return;
    }

    const conflict = checkConflict(start, end);
    if (conflict) {
      const msg = "Đã có người thuê trong khoảng thời gian này, vui lòng chọn ngày khác";
      toast.error(msg);
      setInlineError(msg);
      return;
    }

    onDateTimeChange({
      startDate: formatDateToYMD(start),
      endDate: formatDateToYMD(end),
      pickupTime,
      returnTime,
    });
  };

  const calculateDays = () => {
    if (!startDate || !endDate || !pickupTime || !returnTime) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const [ph] = pickupTime.split(":").map(Number);
    const [rh] = returnTime.split(":").map(Number);
    start.setHours(ph, 0, 0, 0);
    end.setHours(rh, 0, 0, 0);
    return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) || 1;
  };

  // Memoized values
  const pickupHours = useMemo(() => getAvailableHours(startDate, false), [getAvailableHours, startDate]);
  const returnHours = useMemo(() => getAvailableHours(endDate, true), [getAvailableHours, endDate]);
  const highlightDates = useMemo(() => getHighlightDates(), [getHighlightDates]);

  // JSX
  return (
    <div className="date-time-modal-overlay">
      <div className="date-time-modal">
        <div className="modal-header">
          <h3>Chọn thời gian thuê xe</h3>
          <button onClick={() => onDateTimeChange(null)}>✕</button>
        </div>

        {isLoading && (
          <div className="loading-indicator">
            <p>Đang tải lịch đặt xe...</p>
          </div>
        )}

        <div className="date-time-selection">
          {/* Nhận xe */}
          <DateSection
            title="Thời gian nhận xe"
            date={startDate}
            time={pickupTime}
            availableHours={pickupHours}
            handleDate={(d) => handleDateChange("start", d)}
            handleTime={(t) => handleTimeSelect("pickup", t)}
            highlightDates={highlightDates}
            disabled={false}
            placeholder="Chọn ngày nhận xe"
          />

          {/* Trả xe */}
          <DateSection
            title="Thời gian trả xe"
            date={endDate}
            time={returnTime}
            availableHours={returnHours}
            handleDate={(d) => handleDateChange("end", d)}
            handleTime={(t) => handleTimeSelect("return", t)}
            highlightDates={highlightDates}
            disabled={!startDate}
            placeholder="Chọn ngày trả xe"
          />
        </div>

        {inlineError && (
          <div className="text-red-500 text-center my-2 font-medium bg-red-50 p-2 rounded-md border border-red-100">
            {inlineError}
          </div>
        )}

        <div className="rental-summary">

          {startDate && endDate && pickupTime && returnTime && (
            <>
              <div className="summary-item">
                <span>Thời gian nhận xe</span>
                <span>{formatDateDisplay(startDate, pickupTime)}</span>
              </div>
              <div className="summary-item">
                <span>Thời gian trả xe</span>
                <span>{formatDateDisplay(endDate, returnTime)}</span>
              </div>
              <div className="summary-divider" />
              <div className="summary-item">
                <span>Thời gian thuê:</span>
                <strong>{calculateDays()} ngày</strong>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="confirm-button"
            onClick={handleConfirm}
            disabled={!startDate || !endDate || !pickupTime || !returnTime || isLoading}
          >
            Tiếp tục
          </button>
          <button
            className="cancel-button"
            onClick={() => onDateTimeChange(null)}
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}

/** Component con để giảm lặp */
const DateSection = ({
  title,
  date,
  time,
  availableHours,
  handleDate,
  handleTime,
  highlightDates,
  disabled,
  placeholder,
}) => (
  <div className="date-section">
    <h4>{title}</h4>
    <DatePicker
      selected={date}
      onChange={handleDate}
      dateFormat="dd/MM/yyyy"
      locale="vi"
      placeholderText={placeholder}
      highlightDates={highlightDates}
      className="date-picker-input"
      disabled={disabled}
      withPortal
      minDate={new Date()}
    />
    {date && (
      <div className="time-content-wrapper">
        <div className="time-slots">
          {availableHours.map(({ time: t, isAvailable, reason }) => (
            <button
              key={t}
              className={`time-slot ${time === t ? "selected" : ""} ${
                !isAvailable ? "time-slot-disabled" : ""
              }`}
              onClick={() => isAvailable && handleTime(t)}
              disabled={!isAvailable}
              title={!isAvailable ? reason : ""}
            >
               {t}
             </button>
          ))}
        </div>
        {!time && <div className="validation-message">Vui lòng chọn giờ</div>}
      </div>
    )}
  </div>
);

export default DateTimeSelector;
