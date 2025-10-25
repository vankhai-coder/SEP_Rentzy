import React from 'react'
import { Routes, Route } from 'react-router-dom'
import VehicleManagement from './vehicleManagement/vehicleManagement.jsx';
import VehicleDetail from './vehicleManagement/VehicleDetail.jsx';
import AddCarForm from './vehicleManagement/addCarForm.jsx';
import AddMotoBikeForm from './vehicleManagement/addMotoBikeForm.jsx';
import EditCarForm from './vehicleManagement/editCarForm.jsx';
import EditMotoBikeForm from './vehicleManagement/editMotoBikeForm.jsx';
import SidebarOwner from '@/components/SidebarOwner/SidebarOwner';
import BookingManagement from './dashboard/BookingManagement.jsx';
import BookingDetail from './dashboard/BookingDetail.jsx';
import CancelRequests from './dashboard/CancelRequests.jsx';
import Revenue from './dashboard/Revenue.jsx';
import VehicleReviews from './dashboard/VehicleReviews.jsx';
import Notifications from './dashboard/Notifications.jsx';
import AuthRequired from './dashboard/AuthRequired.jsx';
import OverViewManagement from './overview/OverViewManagement.jsx';
const OwnerPage = () => {
  return (
    <div className="flex min-h-screen">
      <SidebarOwner />
      <div className="flex-grow ml-[250px] p-5 bg-gray-50 min-h-screen">
        <Routes>
          <Route path="/" element={<OverViewManagement />} />
          <Route path="/overview" element={<OverViewManagement />} />
          <Route path="/vehicle-management" element={<VehicleManagement />} />
          <Route path="/vehicles/:id" element={<VehicleDetail />} />
          <Route path="/add-car" element={<AddCarForm />} />
          <Route path="/add-motorbike" element={<AddMotoBikeForm />} />
          <Route path="/edit-car/:id" element={<EditCarForm />} />
          <Route path="/edit-motorbike/:id" element={<EditMotoBikeForm />} />
          <Route path="/booking-management" element={
            <AuthRequired>
              <BookingManagement />
            </AuthRequired>
          } />
          <Route path="/booking-management/detail/:id" element={
            <AuthRequired>
              <BookingDetail />
            </AuthRequired>
          } />
          <Route path="/cancel-requests" element={
            <AuthRequired>
              <CancelRequests />
            </AuthRequired>
          } />
          <Route path="/revenue" element={
            <AuthRequired>
              <Revenue />
            </AuthRequired>
          } />
          <Route path="/vehicle-reviews" element={
            <AuthRequired>
              <VehicleReviews />
            </AuthRequired>
          } />
          <Route path="/notifications" element={
            <AuthRequired>
              <Notifications />
            </AuthRequired>
          } />
        </Routes>
      </div>
    </div>
  )
}

export default OwnerPage;
