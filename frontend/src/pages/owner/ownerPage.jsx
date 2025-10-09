import React from 'react'
import { Routes, Route } from 'react-router-dom'
import VehicleManagement from './vehicleManagement/vehicleManagement.jsx';
import SidebarOwner from '@/components/SidebarOwner/SidebarOwner';
const OwnerPage = () => {
  return (
    <div className="flex min-h-screen">
      <SidebarOwner />
      <div className="flex-grow ml-64 p-5 bg-gray-50 min-h-screen">
        <Routes>
          <Route path="/" element={<div className="p-6"><h1 className="text-2xl font-bold">Tổng quan</h1></div>} />
          <Route path="/vehicle-management" element={<VehicleManagement />} />
          <Route path="/booking-management" element={<div className="p-6"><h1 className="text-2xl font-bold">Quản lý đơn thuê</h1></div>} />
          <Route path="/cancel-requests" element={<div className="p-6"><h1 className="text-2xl font-bold">Duyệt đơn hủy</h1></div>} />
          <Route path="/revenue" element={<div className="p-6"><h1 className="text-2xl font-bold">Doanh thu</h1></div>} />
          <Route path="/vehicle-reviews" element={<div className="p-6"><h1 className="text-2xl font-bold">Đánh giá về xe của tôi</h1></div>} />
          <Route path="/notifications" element={<div className="p-6"><h1 className="text-2xl font-bold">Thông báo</h1></div>} />
        </Routes>
      </div>
    </div>
  )
}

export default OwnerPage;
