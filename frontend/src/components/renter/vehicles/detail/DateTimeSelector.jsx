import React, { useState, useCallback, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { toast } from 'react-toastify';
import 'react-datepicker/dist/react-datepicker.css';
import 'react-toastify/dist/ReactToastify.css';
import './DateTimeSelector.css';
import axios from 'axios';

function DateTimeSelector({
  bookedDates,
  onDateTimeChange,
  initialStartDate,
  initialEndDate,
  initialPickupTime,
  initialReturnTime,
  vehicleId
}) {
  const [startDate, setStartDate] = useState(initialStartDate ? new Date(initialStartDate) : null);
  const [endDate, setEndDate] = useState(initialEndDate ? new Date(initialEndDate) : null);
  const [pickupTime, setPickupTime] = useState(initialPickupTime || null);
  const [returnTime, setReturnTime] = useState(initialReturnTime || null);
  const [selectedPickupSlot, setSelectedPickupSlot] = useState(initialPickupTime || null);
  const [selectedReturnSlot, setSelectedReturnSlot] = useState(initialReturnTime || null);
  const [apiBookedDates, setApiBookedDates] = useState([]);

  // Normalize bookings to ensure UTC consistency
  const normalizeBookings = useCallback((data) => {
    return data.map((booking) => {
      const startDateTime = new Date(booking.startDateTime);
      const endDateTime = new Date(booking.endDateTime);
      const startDate = startDateTime.toISOString().split('T')[0];
      const endDate = endDateTime.toISOString().split('T')[0];
      const pickupTime = booking.pickupTime ? booking.pickupTime.slice(0, 5) : '00:00';
      const returnTime = booking.returnTime ? booking.returnTime.slice(0, 5) : '23:00';
      return { startDateTime, endDateTime, pickupTime, returnTime, startDate, endDate };
    });
  }, []);

  useEffect(() => {
    const fetchBookedDates = async () => {
      try {
        const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const endpoint = `${VITE_API_URL}/api/renter/booking/getDate/${vehicleId}`;
        const res = await axios.get(endpoint, { headers: { 'Accept-Language': 'vi' } });

        if (res.status < 200 || res.status >= 300) {
          throw new Error(`HTTP ${res.status}`);
        }

        const raw = Array.isArray(res.data.bookedDates) ? res.data.bookedDates : [];
        const normalized = normalizeBookings(raw);
        setApiBookedDates(normalized);
      } catch (err) {
        console.error('Lỗi tải ngày đã đặt:', err);
        toast.error('Không thể tải lịch đã đặt');
      }
    };

    if (vehicleId && !bookedDates?.length) {
      fetchBookedDates();
    }
  }, [vehicleId, normalizeBookings, bookedDates]);

  const effectiveBookedDates = bookedDates?.length > 0 ? bookedDates : apiBookedDates;

  // Check if a date is available (only block past dates)
  const isDateAvailable = useCallback((date) => {
    if (!date) return false;
    const currentDate = new Date(date);
    currentDate.setUTCHours(0, 0, 0, 0);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return currentDate >= today;
  }, []);

  // Check if an hour is booked
  const isHourBooked = useCallback(
    (hour, date) => {
      if (!effectiveBookedDates?.length || !date) return false;

      const slotStart = new Date(date);
      slotStart.setUTCHours(hour, 0, 0, 0); // Use UTC
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000); // Next hour

      // Disable past hours based on current UTC time
      const now = new Date();
      const currentUTCTime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), 0));
      if (slotStart < currentUTCTime) return true;

      return effectiveBookedDates.some((booking) => {
        const start = new Date(booking.startDateTime);
        const end = new Date(booking.endDateTime);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;

        // Check if the hour slot overlaps with the booked range
        return slotStart < end && slotEnd > start;
      });
    },
    [effectiveBookedDates]
  );

  const getAvailableHours = useCallback(
    (date) => {
      if (!date) return [];
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return [];

      return Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, '0');
        const time = `${hour}:00`;
        return {
          time,
          isAvailable: !isHourBooked(i, dateObj),
        };
      });
    },
    [isHourBooked]
  );

  const filterPassedDates = useCallback((date) => {
    return isDateAvailable(date);
  }, [isDateAvailable]);

  const getDateClassName = useCallback(
    (date) => {
      const currentDate = new Date(date);
      currentDate.setUTCHours(0, 0, 0, 0);

      const hasBooking = effectiveBookedDates?.some((booking) => {
        const start = new Date(booking.startDateTime);
        const end = new Date(booking.endDateTime);
        start.setUTCHours(0, 0, 0, 0);
        end.setUTCHours(0, 0, 0, 0);
        return currentDate >= start && currentDate <= end;
      });

      return hasBooking ? 'has-booking' : '';
    },
    [effectiveBookedDates]
  );

  const getHighlightDates = useCallback(() => {
    if (!effectiveBookedDates?.length) return [];

    const highlight = effectiveBookedDates
      .map((booking) => {
        const start = new Date(booking.startDateTime);
        const end = new Date(booking.endDateTime);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
        const dates = [];
        for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
          dates.push(new Date(d));
        }
        return dates;
      })
      .filter(Boolean)
      .flat();

    return [
      {
        'react-datepicker__day--highlighted-custom': highlight,
      },
    ];
  }, [effectiveBookedDates]);

  const handleDateChange = useCallback(
    (type, date) => {
      if (!date) {
        if (type === 'startDate') {
          setStartDate(null);
          setPickupTime(null);
          setSelectedPickupSlot(null);
        } else {
          setEndDate(null);
          setReturnTime(null);
          setSelectedReturnSlot(null);
        }
        return;
      }

      if (isNaN(date.getTime())) {
        toast.error('Ngày được chọn không hợp lệ.');
        return;
      }

      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate < now) {
        toast.warning('Không thể chọn ngày trong quá khứ.');
        return;
      }

      if (type === 'startDate') {
        setStartDate(date);
        setPickupTime(null);
        setSelectedPickupSlot(null);
        if (endDate && date > endDate) {
          setEndDate(null);
          setReturnTime(null);
          setSelectedReturnSlot(null);
          toast.warning('Ngày trả xe không thể trước ngày nhận xe. Vui lòng chọn lại ngày trả.');
        }
      } else {
        setEndDate(date);
        setReturnTime(null);
        setSelectedReturnSlot(null);
      }
    },
    [startDate, endDate]
  );

  const handleTimeSlotClick = useCallback(
    (type, time) => {
      const [selectedHour] = time.split(':').map(Number);
      const selectedDate = type === 'pickup' ? startDate : endDate;
      if (!selectedDate) {
        toast.warning(type === 'pickup' ? 'Vui lòng chọn ngày nhận xe trước' : 'Vui lòng chọn ngày trả xe trước');
        return;
      }

      const selectedDateTime = new Date(selectedDate);
      selectedDateTime.setHours(selectedHour, 0, 0, 0);

      const now = new Date();
      if (selectedDateTime < now) {
        toast.warning('Không thể chọn giờ trong quá khứ.');
        return;
      }

      if (type === 'pickup') {
        if (endDate && returnTime) {
          const [returnHour] = returnTime.split(':').map(Number);
          const returnDateTime = new Date(endDate);
          returnDateTime.setHours(returnHour, 0, 0, 0);

          // Giữ kiểm tra theo giờ nếu cùng ngày
          if (startDate && endDate && startDate.toDateString() === endDate.toDateString() && selectedDateTime >= returnDateTime) {
            toast.warning('Giờ nhận xe phải trước giờ trả xe.');
            return;
          }
        }
        setPickupTime(time);
        setSelectedPickupSlot(time);
      } else {
        if (startDate && pickupTime) {
          const [pickupHour] = pickupTime.split(':').map(Number);
          const pickupDateTime = new Date(startDate);
          pickupDateTime.setHours(pickupHour, 0, 0, 0);

          // Giữ kiểm tra theo giờ nếu cùng ngày
          if (startDate && endDate && startDate.toDateString() === endDate.toDateString() && selectedDateTime <= pickupDateTime) {
            toast.warning('Giờ trả xe phải sau giờ nhận xe.');
            return;
          }
        }
        setReturnTime(time);
        setSelectedReturnSlot(time);
      }
    },
    [startDate, endDate, pickupTime, returnTime]
  );

  const handleConfirm = useCallback(() => {
    if (!startDate || !endDate || !pickupTime || !returnTime) {
      toast.error('Vui lòng chọn đầy đủ ngày và giờ nhận/trả xe');
      return;
    }

    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    const [startHours, startMinutes] = pickupTime.split(':').map(Number);
    const [endHours, endMinutes] = returnTime.split(':').map(Number);

    startDateTime.setUTCHours(startHours, startMinutes, 0, 0);
    endDateTime.setUTCHours(endHours, endMinutes, 0, 0);

    // XÓA: không cần kiểm tra 'Thời gian trả phải sau thời gian nhận' ở đây
    // if (endDateTime <= startDateTime) { toast.error('Thời gian trả phải sau thời gian nhận'); return; }

    const formatDate = (date) => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    onDateTimeChange({
      startDate: formatDate(startDateTime),
      endDate: formatDate(endDateTime),
      pickupTime,
      returnTime,
    });
  }, [startDate, endDate, pickupTime, returnTime, onDateTimeChange, effectiveBookedDates]);

  const calculateRentalDays = useCallback(() => {
    if (!startDate || !endDate || !pickupTime || !returnTime) return 0;
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    const [startHours, startMinutes] = pickupTime.split(':').map(Number);
    const [endHours, endMinutes] = returnTime.split(':').map(Number);
    startDateTime.setUTCHours(startHours, startMinutes, 0, 0);
    endDateTime.setUTCHours(endHours, endMinutes, 0, 0);
    const diffTime = Math.abs(endDateTime - startDateTime);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  }, [startDate, endDate, pickupTime, returnTime]);

  const formatDisplayTime = useCallback((date, time) => {
    if (!date || !time) return '';
    const formattedDate = date.toLocaleDateString('vi-VN', { timeZone: 'UTC' });
    return `${time}, ${formattedDate}`;
  }, []);

  return (
    <div className="date-time-modal-overlay">
      <div className="date-time-modal">
        <div className="modal-header">
          <h3>Chọn thời gian thuê xe</h3>
          <button onClick={() => onDateTimeChange(null)}>✕</button>
        </div>

        <div className="date-time-selection">
          <div className="pickup-section">
            <h4>Thời gian nhận xe</h4>
            <DatePicker
              selected={startDate}
              onChange={(date) => handleDateChange('startDate', date)}
              minDate={new Date()}
              dateFormat="dd/MM/yyyy"
              placeholderText="Chọn ngày nhận xe"
              className="date-picker-input"
              filterDate={filterPassedDates}
              highlightDates={getHighlightDates()}
              dayClassName={getDateClassName}
              calendarClassName="custom-datepicker"
              showPopperArrow={false}
              popperClassName="datepicker-popper"
              withPortal
            />
            {startDate && (
              <div className="time-content-wrapper">
                <div className="time-slots">
                  {getAvailableHours(startDate).length > 0 ? (
                    getAvailableHours(startDate).map((slot) => (
                      <button
                        key={slot.time}
                        className={`time-slot ${selectedPickupSlot === slot.time ? 'selected' : ''} ${
                          !slot.isAvailable ? 'time-slot-disabled' : ''
                        }`}
                        onClick={() => slot.isAvailable && handleTimeSlotClick('pickup', slot.time)}
                        disabled={!slot.isAvailable}
                      >
                        {slot.time}
                      </button>
                    ))
                  ) : (
                    <div className="no-available-hours">Không có giờ trống cho ngày này</div>
                  )}
                </div>
                {!pickupTime && <div className="validation-message">Vui lòng chọn giờ nhận xe</div>}
              </div>
            )}
          </div>

          <div className="return-section">
            <h4>Thời gian trả xe</h4>
            <DatePicker
              selected={endDate}
              onChange={(date) => handleDateChange('endDate', date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate || new Date()}
              filterDate={filterPassedDates}
              dateFormat="dd/MM/yyyy"
              className="date-picker-input"
              placeholderText="Chọn ngày trả xe"
              dayClassName={getDateClassName}
              highlightDates={getHighlightDates()}
              calendarClassName="custom-datepicker"
              showPopperArrow={false}
              popperClassName="datepicker-popper"
              withPortal
              disabled={!startDate}
            />
            {endDate && (
              <div className="time-content-wrapper">
                <div className="time-slots">
                  {getAvailableHours(endDate).length > 0 ? (
                    getAvailableHours(endDate).map((slot) => (
                      <button
                        key={slot.time}
                        className={`time-slot ${selectedReturnSlot === slot.time ? 'selected' : ''} ${
                          !slot.isAvailable ? 'time-slot-disabled' : ''
                        }`}
                        onClick={() => slot.isAvailable && handleTimeSlotClick('return', slot.time)}
                        disabled={!slot.isAvailable}
                      >
                        {slot.time}
                      </button>
                    ))
                  ) : (
                    <div className="no-available-hours">Không có giờ trống cho ngày này</div>
                  )}
                </div>
                {!returnTime && <div className="validation-message">Vui lòng chọn giờ trả xe</div>}
              </div>
            )}
          </div>
        </div>

        {startDate && endDate && pickupTime && returnTime && (
          <div className="rental-summary">
            <div className="summary-item">
              <span className="summary-label">Thời gian nhận xe</span>
              <span className="summary-value">{formatDisplayTime(startDate, pickupTime)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Thời gian trả xe</span>
              <span className="summary-value">{formatDisplayTime(endDate, returnTime)}</span>
            </div>
            <div className="summary-divider"></div>
            <div className="rental-duration">
              <div className="duration-info">
                <span className="duration-label">Thời gian thuê:</span>
                <span className="duration-value">{calculateRentalDays()} ngày</span>
                <div className="info-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9,9h6v6H9z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="modal-footer">
          <button
            className="confirm-button"
            onClick={handleConfirm}
            disabled={!startDate || !endDate || !pickupTime || !returnTime}
          >
            Tiếp tục
          </button>
          <button className="cancel-button" onClick={() => onDateTimeChange(null)}>
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}

export default DateTimeSelector;