import React, { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContractBooking } from './hooks/useContractBooking';
import './ContractBooking.scss';

const ContractBooking = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const contractRef = useRef();

  const {
    booking,
    loading,
    error,
    refreshBooking
  } = useContractBooking(bookingId);

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle PDF download
  const handleDownloadPDF = () => {
    window.print();
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Format time
  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.slice(0, 5);
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Calculate rental duration
  const calculateDuration = () => {
    if (!booking?.start_date || !booking?.end_date) return 0;
    const start = new Date(booking.start_date);
    const end = new Date(booking.end_date);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Get current date for contract
  const getCurrentDate = () => {
    const now = new Date();
    return {
      day: now.getDate(),
      month: now.getMonth() + 1,
      year: now.getFullYear()
    };
  };

  const currentDate = getCurrentDate();
  const duration = calculateDuration();

  if (loading) {
    return (
      <div className="contract-booking">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải hợp đồng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="contract-booking">
        <div className="error-container">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <div className="error-text">
              <h2>Lỗi tải hợp đồng</h2>
              <p>{error}</p>
              <button onClick={refreshBooking} className="retry-button">
                Thử lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="contract-booking">
        <div className="not-found-container">
          <div className="not-found-content">
            <div className="not-found-icon">📄</div>
            <div className="not-found-text">
              <h2>Không tìm thấy hợp đồng</h2>
              <p>Hợp đồng không tồn tại hoặc đã bị xóa.</p>
              <button onClick={() => navigate('/renter/bookings')} className="back-button">
                Quay lại danh sách booking
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="contract-booking">
      {/* Header Actions */}
      <div className="contract-header">
        <div className="header-left">
          <button onClick={() => navigate('/renter/bookings')} className="back-btn">
            ← Quay lại
          </button>
          <h1>Hợp đồng thuê xe</h1>
        </div>
        <div className="header-actions">
          <button onClick={refreshBooking} className="refresh-btn">
            🔄 Làm mới
          </button>
          <button onClick={handlePrint} className="print-btn">
            🖨️ In hợp đồng
          </button>
          <button onClick={handleDownloadPDF} className="download-btn">
            📄 Tải PDF
          </button>
        </div>
      </div>

      {/* Contract Content */}
      <div className="contract-booking-container">
        <div className="contract-content" ref={contractRef}>
          {/* Document Header */}
          <div className="document-header">
            <div className="country-header">
              <div className="country-name">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div className="country-motto">Độc lập - Tự do - Hạnh phúc</div>
            </div>
          </div>

          {/* Contract Introduction */}
          <div className="contract-introduction">
            <div className="contract-title">HỢP ĐỒNG THUÊ XE TỰ LÁI</div>
            <div className="contract-number">Số: {booking?.id || 'N/A'}/{currentDate.year}</div>
            <div className="legal-basis">
              (Căn cứ Bộ luật Dân sự năm 2015; Luật Thương mại năm 2005)
            </div>
          </div>

          {/* Party Information */}
          <div className="party-section">
            <div className="party-title">BÊN CHO THUÊ (Bên A):</div>
            <div className="party-info">
              <div className="info-item">
                <span className="label">Họ và tên:</span>
                <span className="value">{booking?.car?.owner?.full_name || 'Chủ xe'}</span>
              </div>
              <div className="info-item">
                <span className="label">Năm sinh:</span>
                <span className="value">{booking?.car?.owner?.birth_year || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">CMND/CCCD:</span>
                <span className="value">{booking?.car?.owner?.id_number || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">Địa chỉ:</span>
                <span className="value">{booking?.car?.owner?.address || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">Điện thoại:</span>
                <span className="value">{booking?.car?.owner?.phone || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="party-section">
            <div className="party-title">BÊN THUÊ (Bên B):</div>
            <div className="party-info">
              <div className="info-item">
                <span className="label">Họ và tên:</span>
                <span className="value">{booking?.renter?.full_name || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">Năm sinh:</span>
                <span className="value">{booking?.renter?.birth_year || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">CMND/CCCD:</span>
                <span className="value">{booking?.renter?.id_number || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">Địa chỉ:</span>
                <span className="value">{booking?.renter?.address || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">Điện thoại:</span>
                <span className="value">{booking?.renter?.phone || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="vehicle-section">
            <div className="section-title">THÔNG TIN XE:</div>
            <div className="vehicle-info">
              <div className="info-item">
                <span className="label">Loại xe:</span>
                <span className="value">{booking?.car?.brand} {booking?.car?.model}</span>
              </div>
              <div className="info-item">
                <span className="label">Biển số:</span>
                <span className="value">{booking?.car?.license_plate || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">Màu sắc:</span>
                <span className="value">{booking?.car?.color || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">Năm sản xuất:</span>
                <span className="value">{booking?.car?.year || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="terms-section">
            <div className="section-title">ĐIỀU KHOẢN HỢP ĐỒNG:</div>
            
            <div className="article">
              <div className="article-title">Điều 1: Thời gian và địa điểm thuê xe</div>
              <div className="article-content">
                <div className="term-item">
                  <span className="term-label">- Thời gian thuê:</span>
                  <span className="term-value">Từ {formatDate(booking?.start_date)} {formatTime(booking?.start_time)} đến {formatDate(booking?.end_date)} {formatTime(booking?.end_time)} ({duration} ngày)</span>
                </div>
                <div className="term-item">
                  <span className="term-label">- Địa điểm nhận xe:</span>
                  <span className="term-value">{booking?.pickup_location || 'N/A'}</span>
                </div>
                <div className="term-item">
                  <span className="term-label">- Địa điểm trả xe:</span>
                  <span className="term-value">{booking?.return_location || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="article">
              <div className="article-title">Điều 2: Giá thuê và phương thức thanh toán</div>
              <div className="article-content">
                <div className="term-item">
                  <span className="term-label">- Giá thuê:</span>
                  <span className="term-value">{formatCurrency(booking?.total_price)}</span>
                </div>
                <div className="term-item">
                  <span className="term-label">- Phương thức thanh toán:</span>
                  <span className="term-value">Chuyển khoản/Tiền mặt</span>
                </div>
              </div>
            </div>

            <div className="article">
              <div className="article-title">Điều 3: Quyền và nghĩa vụ của bên cho thuê</div>
              <div className="article-content">
                <div className="obligation-item">- Giao xe đúng thời gian, địa điểm đã thỏa thuận</div>
                <div className="obligation-item">- Xe giao phải đảm bảo chất lượng kỹ thuật, an toàn</div>
                <div className="obligation-item">- Cung cấp đầy đủ giấy tờ xe theo quy định</div>
                <div className="obligation-item">- Hướng dẫn bên thuê sử dụng xe an toàn</div>
              </div>
            </div>

            <div className="article">
              <div className="article-title">Điều 4: Quyền và nghĩa vụ của bên thuê</div>
              <div className="article-content">
                <div className="obligation-item">- Sử dụng xe đúng mục đích, tuân thủ luật giao thông</div>
                <div className="obligation-item">- Thanh toán đầy đủ, đúng hạn theo hợp đồng</div>
                <div className="obligation-item">- Bảo quản xe cẩn thận, không cho người khác thuê lại</div>
                <div className="obligation-item">- Trả xe đúng thời gian, địa điểm đã thỏa thuận</div>
                <div className="obligation-item">- Chịu trách nhiệm về các vi phạm giao thông trong thời gian thuê</div>
              </div>
            </div>

            <div className="article">
              <div className="article-title">Điều 5: Cam kết chung</div>
              <div className="article-content">
                <div className="commitment-item">- Hai bên cam kết thực hiện đúng các điều khoản đã thỏa thuận</div>
                <div className="commitment-item">- Mọi tranh chấp sẽ được giải quyết bằng thương lượng, hòa giải</div>
                <div className="commitment-item">- Hợp đồng có hiệu lực kể từ ngày ký</div>
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div className="signature-section">
            <div className="signature-date">
              Ngày {currentDate.day} tháng {currentDate.month} năm {currentDate.year}
            </div>
            <div className="signature-parties">
              <div className="signature-party">
                <div className="party-label">BÊN CHO THUÊ</div>
                <div className="signature-space"></div>
                <div className="party-name">{booking?.car?.owner?.full_name || 'Chủ xe'}</div>
              </div>
              <div className="signature-party">
                <div className="party-label">BÊN THUÊ</div>
                <div className="signature-space"></div>
                <div className="party-name">{booking?.renter?.full_name || 'Người thuê'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractBooking;