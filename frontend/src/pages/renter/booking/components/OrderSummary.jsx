import React from 'react';
import { 
  FaUser, 
  FaPhone, 
  FaCalendarAlt, 
  FaClock, 
  FaIdCard,
  FaMapMarkerAlt,
} from 'react-icons/fa';
import LocationInfo from './LocationInfo';

const OrderSummary = ({ booking, formatDateTime }) => {

  return (
    <div className="order-summary-section">
      <div className="summary-header">
        <div className="header-content">
          <div>
            <h2 className="header-title">Chi Tiết Đơn Thuê</h2>
          </div>
        </div>
      </div>

      <div className="vehicle-card">
        <div className="vehicle-image-container">
          {/* Vehicle Info Section */}
          <div className="vehicle-info">
            <h3 className="vehicle-name">{booking?.vehicle?.model}</h3>
            <div className="vehicle-brand" style={{ backgroundColor: '#6366f1' }}>
              {booking?.vehicle?.brand}
            </div>
          </div>
          
          <img 
            src={booking?.vehicle?.main_image_url || "/images/car-placeholder.png"} 
            alt={booking?.vehicle?.model || "Vehicle"} 
            className="vehicle-image" 
          />
        </div>
      </div>


      {/* 
        Hiển thị thông tin cơ bản của booking:
        - Mã đặt xe (booking_id)
        - Tên khách thuê (renter.full_name)
        - Số điện thoại (renter.phone_number)
        
        Layout: Grid 3 items với icon + label + value
      */}
      <div className="booking-info-card">
        <h3 className="card-title">
          <FaIdCard className="title-icon" />
          Thông Tin Đặt Xe
        </h3>
        
        <div className="booking-info-grid">
          {/* Mã đặt xe */}
          <div className="info-item">
            <div className="info-icon">
              <FaIdCard />
            </div>
            <div className="info-content">
              <span className="info-label">Mã đặt xe</span>
              <span className="info-value booking-id">{booking?.booking_id}</span>
            </div>
          </div>

          {/* Tên khách thuê */}
          <div className="info-item">
            <div className="info-icon">
              <FaUser />
            </div>
            <div className="info-content">
              <span className="info-label">Khách thuê</span>
              <span className="info-value">{booking?.renter?.full_name || 'N/A'}</span>
            </div>
          </div>

          {/* Số điện thoại */}
          <div className="info-item">
            <div className="info-icon">
              <FaPhone />
            </div>
            <div className="info-content">
              <span className="info-label">Số điện thoại</span>
              <span className="info-value">{booking?.renter?.phone_number || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>


      {/*       Layout: Timeline vertical với 2 điểm và connector
        Sử dụng formatDateTime để format thời gian hiển thị
      */}
      <div className="rental-period-card">
        <h3 className="card-title">
          <FaCalendarAlt className="title-icon" />
          Thời Gian Thuê
        </h3>
        
        <div className="rental-timeline">
          {/* Thời điểm nhận xe */}
          <div className="timeline-item pickup">
            <div className="timeline-dot pickup-dot">
              <FaClock />
            </div>
            <div className="timeline-content">
              <span className="timeline-label">Nhận xe</span>
              <span className="timeline-value">
                {formatDateTime(booking?.startDate, booking?.startTime)}
              </span>
            </div>
          </div>
          
          {/* Connector line giữa 2 timeline items */}
          <div className="timeline-connector"></div>
          
          {/* Thời điểm trả xe */}
          <div className="timeline-item return">
            <div className="timeline-dot return-dot">
              <FaClock />
            </div>
            <div className="timeline-content">
              <span className="timeline-label">Trả xe</span>
              <span className="timeline-value">
                {formatDateTime(booking?.endDate, booking?.endTime)}
              </span>
            </div>
          </div>
        </div>
      </div>


      <div className="location-card">
        <h3 className="card-title">
          <FaMapMarkerAlt className="title-icon" />
          Địa Điểm
        </h3>
        <div className="location-wrapper">
          <LocationInfo booking={booking} />
        </div>
      </div>
      
    </div>
  );
};

export default OrderSummary;