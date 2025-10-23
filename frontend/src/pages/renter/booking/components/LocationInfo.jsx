import React from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import './LocationInfo.scss';


const LocationInfo = ({ booking }) => {
  return (
    <section className="location-info">

      <h3 className="location-title">
        <FaMapMarkerAlt className="title-icon" />
        Thông tin địa điểm
      </h3>
      
      {/*nội dung chính*/}
      <div className="location-content">
        {/* Địa điểm nhận xe*/}
        <div className="location-item">
          <div className="location-label">Địa điểm nhận xe:</div>
          <div className="location-value">
            {booking?.pickupLocation || 'Chưa có thông tin'}
          </div>
        </div>
        
        {/* Địa điểm trả xe*/}
        <div className="location-item">
          <div className="location-label">Địa điểm trả xe:</div>
          <div className="location-value">
            {booking?.returnLocation || 'Chưa có thông tin'}
          </div>
        </div>
        
        {/* Thời gian nhận xe */}
        {booking?.pickupTime && (
          <div className="location-item">
            <div className="location-label">Thời gian nhận xe:</div>
            <div className="location-value">{booking.pickupTime}</div>
          </div>
        )}
        
        {/* Thời gian trả xe  */}
        {booking?.returnTime && (
          <div className="location-item">
            <div className="location-label">Thời gian trả xe:</div>
            <div className="location-value">{booking.returnTime}</div>
          </div>
        )}
        
      </div>
    </section>
  );
};

export default LocationInfo;