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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statItems.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <div
            key={index}
            className={`${item.bgColor} rounded-lg p-4 border border-gray-200`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {item.title}
                </p>
                <p className={`text-2xl font-bold ${item.textColor}`}>
                  {item.value}
                </p>
              </div>
              <div className={`${item.color} p-3 rounded-full`}>
                <IconComponent className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BookingStatistics;
