import React, { useState, useEffect } from "react";

const Counter = ({ to, className = "", duration = 2000, loopDelay = 5000 }) => {
  // [SỬA: loopDelay mặc định 5s]
  const [currentCount, setCurrentCount] = useState(0);

  const animate = (startTime = null) => {
    let animationStart = startTime || performance.now();
    const step = (timestamp) => {
      if (!animationStart) animationStart = timestamp;
      const progress = Math.min((timestamp - animationStart) / duration, 1);

      // Ease-out cho mượt
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCurrentCount(Math.floor(easeOut * to));

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        // Hoàn thành: Chờ loopDelay rồi reset và animate lại
        setTimeout(() => {
          setCurrentCount(0); // Reset về 0
          requestAnimationFrame(animate); // Chạy lại
        }, loopDelay);
      }
    };
    requestAnimationFrame(step);
  };

  useEffect(() => {
    animate(); // Bắt đầu animation đầu tiên

    return () => {
      // Cleanup timeout nếu unmount
    };
  }, [to, duration, loopDelay]);

  return <span className={className}>{currentCount.toLocaleString()}+</span>; // Giữ '+' cho đẹp
};

export default Counter;
