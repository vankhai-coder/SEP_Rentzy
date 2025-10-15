import React, { useState, useCallback, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import TimePicker from 'react-time-picker';
import { toast } from 'react-toastify';
import "react-datepicker/dist/react-datepicker.css";
import "react-time-picker/dist/TimePicker.css";
import "react-toastify/dist/ReactToastify.css";
import './DateTimeSelector.css';
import axios from 'axios';

function DateTimeSelector({ bookedDates, onDateTimeChange, initialStartDate, initialEndDate, initialPickupTime, initialReturnTime, vehicleId }) {
    // Không set ngày mặc định nếu không có initialStartDate/initialEndDate
    const [startDate, setStartDate] = useState(initialStartDate ? new Date(initialStartDate) : null);
    const [endDate, setEndDate] = useState(initialEndDate ? new Date(initialEndDate) : null);
    const [pickupTime, setPickupTime] = useState(initialPickupTime || null);
    const [returnTime, setReturnTime] = useState(initialReturnTime || null);
    const [selectedPickupSlot, setSelectedPickupSlot] = useState(initialPickupTime || null);
    const [selectedReturnSlot, setSelectedReturnSlot] = useState(initialReturnTime || null);

    // === MỚI: fetch lịch đã đặt từ API ===
    const [apiBookedDates, setApiBookedDates] = useState([]);

    // Chuẩn hóa dữ liệu booking từ API về format dùng trong component
    const normalizeBookings = (data) => {
        return data.map(b => {
            const startDate = b.startDate || b.start_date;
            const endDate = b.endDate || b.end_date;
            const pickupTimeRaw = b.pickupTime || b.start_time;
            const returnTimeRaw = b.returnTime || b.end_time;

            const pickupTime = pickupTimeRaw ? pickupTimeRaw.slice(0, 5) : '00:00';
            const returnTime = returnTimeRaw ? returnTimeRaw.slice(0, 5) : '23:00';

            const startDateTime = startDate && pickupTime ? new Date(`${startDate}T${pickupTime}:00`) : null;
            const endDateTime = endDate && returnTime ? new Date(`${endDate}T${returnTime}:00`) : null;

            return { startDate, endDate, pickupTime, returnTime, startDateTime, endDateTime };
        });
    };

    useEffect(() => {
        const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const endpoint = `${VITE_API_URL}/api/renter/booking/getDate/${vehicleId}`;

        const fetchBookedDates = async () => {
            try {
                const res = await axios.get(endpoint, { headers: { 'Accept-Language': 'vi' } });
                // SỬA: axios dùng status + data
                if (res.status < 200 || res.status >= 300) throw new Error(`HTTP ${res.status}`);
                const json = res.data;

                // Hỗ trợ API trả mảng trực tiếp hoặc trong json.data
                const raw = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
                const normalized = normalizeBookings(raw);
                console.log('Dữ liệu ngày đã đặt:', normalized);
                setApiBookedDates(normalized);
            } catch (err) {
                console.error('Lỗi tải ngày đã đặt:', err);
                // Tùy chọn: báo toast cho người dùng
                // toast.error('Không thể tải lịch đã đặt');
            }
        };

        fetchBookedDates();
    }, [vehicleId]);

    // Dùng dữ liệu từ props nếu có, ngược lại dùng dữ liệu từ API
    const effectiveBookedDates = (bookedDates && bookedDates.length > 0) ? bookedDates : apiBookedDates;

    const handleConfirm = () => {
        if (!startDate || !endDate) {
            toast.error('Vui lòng chọn ngày nhận và trả xe');
            return;
        }

        if (!pickupTime || !returnTime) {
            toast.error('Vui lòng chọn giờ nhận và trả xe');
            return;
        }

        // Validate date range
        const startDateTime = new Date(startDate);
        const endDateTime = new Date(endDate);
        const [startHours, startMinutes] = pickupTime.split(':').map(Number);
        const [endHours, endMinutes] = returnTime.split(':').map(Number);

        startDateTime.setHours(startHours, startMinutes, 0, 0);
        endDateTime.setHours(endHours, endMinutes, 0, 0);

        if (endDateTime <= startDateTime) {
            toast.error('Thời gian kết thúc phải sau thời gian bắt đầu');
            return;
        }

        // Format dates in YYYY-MM-DD format
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        onDateTimeChange({
            startDate: formatDate(startDateTime),
            endDate: formatDate(endDateTime),
            pickupTime: pickupTime,
            returnTime: returnTime
        });
    };

    const isDateAvailable = useCallback((date) => {
        if (!date) return false;

        const currentDate = new Date(date);
        currentDate.setHours(0, 0, 0, 0);

        // Kiểm tra ngày trong quá khứ
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (currentDate < today) {
            return false;
        }

        if (!effectiveBookedDates || effectiveBookedDates.length === 0) return true;

        // Kiểm tra từng booking
        for (const booking of effectiveBookedDates) {
            const bookingStart = new Date(booking.startDate);
            const bookingEnd = new Date(booking.endDate);
            
            // Nếu ngày hiện tại nằm trong khoảng thời gian booking
            if (currentDate >= bookingStart && currentDate <= bookingEnd) {
                // Lấy giờ bắt đầu và kết thúc của booking
                const [startHour] = booking.pickupTime.split(':').map(Number);
                const [endHour] = booking.returnTime.split(':').map(Number);
                
                // Nếu booking kéo dài cả ngày (từ 00:00 đến 23:59)
                if (startHour === 0 && endHour === 23) {
                    return false;
                }
                
                // Nếu booking chỉ trong một khoảng thời gian cụ thể
                // Chúng ta vẫn cho phép chọn ngày này, nhưng sẽ hiển thị icon
                return true;
            }
        }
        return true;
    }, [effectiveBookedDates]);

    const getDateClassName = useCallback((date) => {
        if (!isDateAvailable(date)) {
            return 'disabled-date';
        }

        const currentDate = new Date(date);
        currentDate.setHours(0, 0, 0, 0);

        // Kiểm tra xem ngày này có booking nào không
        const hasBooking = effectiveBookedDates?.some(booking => {
            const bookingStart = new Date(booking.startDate);
            const bookingEnd = new Date(booking.endDate);
            return currentDate >= bookingStart && currentDate <= bookingEnd;
        });

        if (hasBooking) {
            return 'has-booking';
        }

        return '';
    }, [effectiveBookedDates, isDateAvailable]);

    // Thêm hàm để lấy thông tin booking cho một ngày cụ thể
    const getBookingInfoForDate = useCallback((date) => {
        if (!effectiveBookedDates || effectiveBookedDates.length === 0) return null;

        const currentDate = new Date(date);
        currentDate.setHours(0, 0, 0, 0);

        return effectiveBookedDates.find(booking => {
            const bookingStart = new Date(booking.startDate);
            const bookingEnd = new Date(booking.endDate);
            return currentDate >= bookingStart && currentDate <= bookingEnd;
        });
    }, [effectiveBookedDates]);

    // Thêm component để hiển thị thông tin booking
    const BookingInfo = ({ date }) => {
        const booking = getBookingInfoForDate(date);
        if (!booking) return null;

        return (
            <div className="booking-info">
                <span className="booking-time">
                    {booking.pickupTime} - {booking.returnTime}
                </span>
            </div>
        );
    };

    const isHourBooked = useCallback((hour, date) => {
        if (!effectiveBookedDates || effectiveBookedDates.length === 0) return false;
        if (!date) return false;

        const selectedDateTime = new Date(date);
        selectedDateTime.setHours(hour, 0, 0, 0);

        // Kiểm tra giờ trong quá khứ
        const now = new Date();
        if (selectedDateTime < now) {
            return true;
        }

        const vietnamOffset = 7 * 60; // 7 hours in minutes
        const localOffset = selectedDateTime.getTimezoneOffset();
        const totalOffset = vietnamOffset + localOffset;
        selectedDateTime.setMinutes(selectedDateTime.getMinutes() + totalOffset);

        return effectiveBookedDates.some(booking => {
            const startDateTime = new Date(booking.startDateTime);
            const endDateTime = new Date(booking.endDateTime);

            if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
                return false;
            }

            startDateTime.setMinutes(startDateTime.getMinutes() + totalOffset);
            endDateTime.setMinutes(endDateTime.getMinutes() + totalOffset);

            return selectedDateTime >= startDateTime && selectedDateTime < endDateTime;
        });
    }, [effectiveBookedDates]);

    const getAvailableHours = useCallback((date) => {
        if (!date) return [];
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(dateObj.getTime())) {
            return [];
        }

        return Array.from({ length: 24 }, (_, i) => {
            const hour = i.toString().padStart(2, '0');
            const time = `${hour}:00`;
            return {
                time,
                isAvailable: !isHourBooked(i, dateObj)
            };
        });
    }, [isHourBooked]);

    const filterPassedDates = useCallback((date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today && isDateAvailable(date);
    }, [isDateAvailable]);

    const getHighlightDates = useCallback(() => {
        if (!effectiveBookedDates || effectiveBookedDates.length === 0) return [];

        const highlight = effectiveBookedDates.map(booking => {
            const start = new Date(booking.startDateTime);
            const end = new Date(booking.endDateTime);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return null;
            }

            const dates = [];
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                dates.push(new Date(d));
            }
            return dates;
        }).filter(Boolean).flat();
   
        return [
            {
                "react-datepicker__day--highlighted-custom": highlight
            }
        ];
    }, [effectiveBookedDates]);

    const handleDateChange = (type, date) => {
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

        // Kiểm tra ngày trong quá khứ
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);

        if (selectedDate < now) {
            toast.warning('Không thể chọn ngày trong quá khứ.');
            return;
        }

        // Kiểm tra ngày đã được đặt
        if (!isDateAvailable(selectedDate)) {
            toast.warning('Ngày này đã được đặt hoặc không khả dụng.');
            return;
        }

        if (type === 'startDate') {
            setStartDate(date);
            // Reset time khi thay đổi ngày
            setPickupTime(null);
            setSelectedPickupSlot(null);
            
            if (endDate && date > endDate) {
                setEndDate(null);
                setReturnTime(null);
                setSelectedReturnSlot(null);
                toast.warning('Ngày trả xe không thể trước ngày nhận xe. Vui lòng chọn lại ngày trả.');
            }
        } else {
            if (startDate && date < startDate) {
                toast.warning('Ngày trả xe không thể trước ngày nhận xe.');
                return;
            }
            setEndDate(date);
            // Reset time khi thay đổi ngày
            setReturnTime(null);
            setSelectedReturnSlot(null);
        }
    };

    const handleTimeSlotClick = (type, time) => {
        const [selectedHour] = time.split(':').map(Number);
        const selectedDate = type === 'pickup' ? startDate : endDate;
        const selectedDateTime = new Date(selectedDate);
        selectedDateTime.setHours(selectedHour, 0, 0, 0);

        // Kiểm tra giờ trong quá khứ
        const now = new Date();
        if (selectedDateTime < now) {
            toast.warning('Không thể chọn giờ trong quá khứ.');
            return;
        }

        // Kiểm tra logic thời gian nhận/trả xe
        if (type === 'pickup') {
            if (endDate && returnTime) {
                const [returnHour] = returnTime.split(':').map(Number);
                const returnDateTime = new Date(endDate);
                returnDateTime.setHours(returnHour, 0, 0, 0);

                if (selectedDateTime >= returnDateTime) {
                    if (startDate.toDateString() === endDate.toDateString()) {
                        toast.warning('Giờ nhận xe phải trước giờ trả xe.');
                    } else {
                        toast.warning('Ngày nhận xe phải trước ngày trả xe.');
                    }
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

                if (selectedDateTime <= pickupDateTime) {
                    if (startDate.toDateString() === endDate.toDateString()) {
                        toast.warning('Giờ trả xe phải sau giờ nhận xe.');
                    } else {
                        toast.warning('Ngày trả xe phải sau ngày nhận xe.');
                    }
                    return;
                }
            }
            setReturnTime(time);
            setSelectedReturnSlot(time);
        }
    };

    // Tính toán số ngày thuê
    const calculateRentalDays = () => {
        if (!startDate || !endDate) return 0;
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays || 1;
    };

    // Format thời gian hiển thị
    const formatDisplayTime = (date, time) => {
        if (!date || !time) return '';
        const formattedDate = date.toLocaleDateString('vi-VN');
        return `${time}, ${formattedDate}`;
    };

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
                        {startDate ? (
                            <div className="time-content-wrapper">
                                <div className="time-slots">
                                    {getAvailableHours(startDate).length > 0 ? (
                                        getAvailableHours(startDate).map((slot) => (
                                            <button
                                                key={slot.time}
                                                className={`time-slot ${
                                                    selectedPickupSlot === slot.time ? 'selected' : ''
                                                } ${
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
                        ) : (
                            <div className="time-content-wrapper">
                                <div className="placeholder-message">Vui lòng chọn ngày nhận xe trước</div>
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
                        {endDate ? (
                            <div className="time-content-wrapper">
                                <div className="time-slots">
                                    {getAvailableHours(endDate).length > 0 ? (
                                        getAvailableHours(endDate).map((slot) => (
                                            <button
                                                key={slot.time}
                                                className={`time-slot ${
                                                    selectedReturnSlot === slot.time ? 'selected' : ''
                                                } ${
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
                        ) : (
                            <div className="time-content-wrapper">
                                <div className="placeholder-message">
                                    {!startDate ? 'Vui lòng chọn ngày nhận xe trước' : 'Vui lòng chọn ngày trả xe'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary Section */}
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
};

export default DateTimeSelector;