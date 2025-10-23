import React from 'react';
import { FaCheck, FaCar, FaFileSignature } from 'react-icons/fa';

/**
 * ProgressBar Component
 * 
 * CHỨC NĂNG CHÍNH:
 * - Hiển thị thanh tiến trình của quy trình booking/payment
 * - Visual indicator cho user biết đang ở bước nào
 * - Highlight các bước đã hoàn thành và bước hiện tại
 * 
 * PROPS:
 * - step: Số bước hiện tại (0-4)
 *   + 0: Đã hủy/expired
 *   + 1: Thanh toán cọc 30%
 *   + 2: Ký hợp đồng  
 *   + 3: Nhận xe
 *   + 4: Hoàn thành
 * 
 * STEP LOGIC:
 * - completed: step > stepIndex (đã hoàn thành)
 * - current: step === stepIndex (đang thực hiện)
 * - inactive: step < stepIndex (chưa đến)
 * 
 * VISUAL STATES:
 * - active: Bước đã hoàn thành (màu xanh + check icon)
 * - current: Bước hiện tại (border xanh + icon gốc)
 * - inactive: Bước chưa đến (màu xám + icon gốc)
 */
const ProgressBar = ({ step }) => {
  // ==================== STEP CONFIGURATION ====================
  /**
   * Cấu hình các bước trong quy trình booking
   * Mỗi step có icon, text và logic completed
   */
  const steps = [
    { icon: FaCheck, text: 'Tìm và chọn xe', completed: true }, // Luôn completed
    { icon: FaCheck, text: 'Xác nhận đơn hàng', completed: true }, // Luôn completed
    { icon: FaCar, text: 'Thanh toán cọc 30%', completed: step > 1 }, // Completed khi step > 1
    { icon: FaFileSignature, text: 'Ký hợp đồng', completed: step > 2 }, // Completed khi step > 2
    { icon: FaCar, text: 'Nhận xe', completed: step > 3 } // Completed khi step > 3
  ];

  return (
    <div className={`progress-bar-wrapper step-${step}`}>
      <div className="progress-steps">
        {/* ==================== RENDER STEPS ==================== */}
        {steps.map((stepItem, index) => {
          const IconComponent = stepItem.icon;
          const isCompleted = stepItem.completed; // Đã hoàn thành
          const isCurrent = !isCompleted && index === step; // Đang thực hiện
          
          return (
            <div key={index} className={`progress-step ${isCompleted ? 'completed' : ''}`}>
              {/* Step Icon - hiển thị check nếu completed, icon gốc nếu chưa */}
              <div className={`step-icon ${isCompleted ? 'active' : isCurrent ? 'current' : 'inactive'}`}>
                {isCompleted ? <FaCheck /> : <IconComponent />}
              </div>
              
              {/* Step Text - mô tả bước */}
              <span className="step-text">{stepItem.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;