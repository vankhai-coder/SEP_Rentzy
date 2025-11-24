import React from "react";
import {
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";

const BookingStatistics = ({ statistics }) => {
  if (!statistics) return null;

  const statItems = [
    {
      title: "Tổng đơn",
      value: statistics.total_bookings,
      icon: Calendar,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Đã hoàn thành",
      value: statistics.completed_bookings,
      icon: CheckCircle,
      color: "bg-green-500",
      textColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Đang thuê",
      value: statistics.active_bookings,
      icon: Clock,
      color: "bg-yellow-500",
      textColor: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Đã hủy",
      value: statistics.cancelled_bookings,
      icon: XCircle,
      color: "bg-red-500",
      textColor: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <div 
      className="w-full overflow-x-hidden box-border" 
      style={{ 
        width: '100%', 
        maxWidth: '100%', 
        boxSizing: 'border-box',
        position: 'relative'
      }}
    >
      <div 
        className="statistics-grid grid gap-1 sm:gap-2 md:gap-3 lg:gap-4 w-full box-border" 
        style={{ 
          width: '100%', 
          maxWidth: '100%', 
          boxSizing: 'border-box',
          gridTemplateColumns: '1fr',
          display: 'grid'
        }}
      >
        {statItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <div
              key={index}
              className={`${item.bgColor} rounded-lg p-1 sm:p-2 md:p-3 lg:p-4 border border-gray-200 box-border overflow-hidden`}
              style={{ 
                width: '100%', 
                maxWidth: '100%', 
                minWidth: 0,
                boxSizing: 'border-box',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <div 
                className="flex items-center justify-between gap-1 sm:gap-1.5 md:gap-2 lg:gap-3" 
                style={{ 
                  width: '100%', 
                  maxWidth: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box'
                }}
              >
                <div 
                  className="min-w-0 flex-1 overflow-hidden" 
                  style={{ 
                    minWidth: 0, 
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    flex: '1 1 0%'
                  }}
                >
                  <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 mb-0.5 sm:mb-1 truncate">
                    {item.title}
                  </p>
                  <p 
                    className={`text-xs sm:text-base md:text-xl lg:text-2xl font-bold ${item.textColor} leading-tight`}
                    style={{ 
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      boxSizing: 'border-box',
                      width: '100%'
                    }}
                  >
                    {item.value}
                  </p>
                </div>
                <div 
                  className={`${item.color} p-0.5 sm:p-1.5 md:p-2 lg:p-3 rounded-full flex-shrink-0`} 
                  style={{ 
                    flexShrink: 0,
                    boxSizing: 'border-box',
                    flex: '0 0 auto'
                  }}
                >
                  <IconComponent className="w-2.5 h-2.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        .statistics-grid {
          grid-template-columns: 1fr !important;
        }
        @media (min-width: 640px) {
          .statistics-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (min-width: 1024px) {
          .statistics-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
        }
        .statistics-grid > * {
          max-width: 100% !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
      `}</style>
    </div>
  );
};

export default BookingStatistics;
