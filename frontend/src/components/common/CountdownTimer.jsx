import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

const CountdownTimer = ({ 
  startAt, 
  onTimeUp, 
  duration = 15 * 60 * 1000, // 15 phút mặc định
  warningThreshold = 2 * 60 * 1000 // 2 phút cảnh báo
}) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [isWarning, setIsWarning] = useState(false);

  // Tính toán thời gian còn lại
  const calculateTimeLeft = () => {
    if (!startAt) return 0;
    
    const now = new Date().getTime();
    const started = new Date(startAt).getTime();
    const elapsed = now - started;
    const remaining = duration - elapsed;
    
    // Debug log để kiểm tra
    console.log('⏰ Countdown calculation:', {
      startAt,
      now: new Date(now).toLocaleString('vi-VN'),
      started: new Date(started).toLocaleString('vi-VN'),
      elapsed: Math.floor(elapsed / 1000) + 's',
      remaining: Math.floor(remaining / 1000) + 's',
      duration: Math.floor(duration / 1000) + 's'
    });
    
    return Math.max(0, remaining);
  };

  // Format thời gian hiển thị
  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format thời gian tạo booking
  const formatStartTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Xử lý khi hết thời gian
  const handleTimeUp = () => {
    if (!isExpired && onTimeUp) {
      setIsExpired(true);
      onTimeUp();
    }
  };

  useEffect(() => {
    const updateTimer = () => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      setIsWarning(remaining <= warningThreshold && remaining > 0);
      
      if (remaining <= 0) {
        handleTimeUp();
      }
    };

    // Cập nhật ngay lập tức
    updateTimer();

    // Thiết lập interval
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startAt, duration, warningThreshold, isExpired]);

  if (isExpired) {
    return (
      <div className="countdown-section">
        <div className="booking-countdown expired">
          <div className="countdown-header">
            <AlertTriangle className="countdown-icon" />
            <span className="countdown-label">Đã hết thời gian thanh toán</span>
          </div>
          <div className="countdown-info">
            Booking sẽ được hủy tự động
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="countdown-section">
      <div className={`booking-countdown ${isWarning ? 'warning' : ''}`}>
        <div className="countdown-header">
          <Clock className="countdown-icon" />
          <span className="countdown-label">Thời gian giữ chỗ còn lại</span>
        </div>
        
        <div className="countdown-display">
          <span className="countdown-time">{formatTime(timeLeft)}</span>
        </div>
        
        <div className="countdown-info">
          Bắt đầu giữ chỗ lúc: {formatStartTime(startAt)}
        </div>
        
        {isWarning && (
          <div className="countdown-warning">
            ⚠️ Vui lòng hoàn tất thanh toán trước khi hết thời gian!
          </div>
        )}
        
        <div className="countdown-note">
          Booking sẽ tự động hủy nếu không thanh toán trong thời gian quy định
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;