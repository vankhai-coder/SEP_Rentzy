import React from "react";
import { Routes, Route } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutUser } from "@/redux/features/auth/authSlice";
import VehicleManagement from "./vehicleManagement/vehicleManagement.jsx";
import VehicleDetail from "./vehicleManagement/VehicleDetail.jsx";
import AddCarForm from "./vehicleManagement/addCarForm.jsx";
import AddMotoBikeForm from "./vehicleManagement/addMotoBikeForm.jsx";
import EditCarForm from "./vehicleManagement/editCarForm.jsx";
import EditMotoBikeForm from "./vehicleManagement/editMotoBikeForm.jsx";
import SidebarOwner from "@/components/SidebarOwner/SidebarOwner";
import BookingManagement from "./dashboard/BookingManagement.jsx";
import BookingDetail from "./dashboard/BookingDetail.jsx";
import Revenue from "./dashboard/Revenue.jsx";
import VehicleReviews from "./dashboard/VehicleReviews.jsx";
import Notifications from "./dashboard/Notifications.jsx";
import TransactionManagement from "./dashboard/TransactionManagement.jsx";
import AuthRequired from "./dashboard/AuthRequired.jsx";
import OverViewManagement from "./overview/OverViewManagement.jsx";
import TrafficFineSearch from "./dashboard/TrafficFineSearch.jsx";
const OwnerPage = () => {
  const dispatch = useDispatch();

  const handleLogout = (e) => {
    e.preventDefault();
    dispatch(logoutUser());
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen">
      <SidebarOwner handleLogout={handleLogout} />
      <div className="p-5 bg-gray-50 min-h-screen" style={{ marginLeft: '250px' }}>
        <Routes>
          <Route path="/" element={<OverViewManagement />} />
          <Route path="/overview" element={<OverViewManagement />} />
          <Route path="/vehicle-management" element={<VehicleManagement />} />
          <Route path="/vehicles/:id" element={<VehicleDetail />} />
          <Route path="/add-car" element={<AddCarForm />} />
          <Route path="/add-motorbike" element={<AddMotoBikeForm />} />
          <Route path="/edit-car/:id" element={<EditCarForm />} />
          <Route path="/edit-motorbike/:id" element={<EditMotoBikeForm />} />
          <Route
            path="/booking-management"
            element={
              <AuthRequired>
                <BookingManagement />
              </AuthRequired>
            }
          />
          <Route
            path="/booking-management/detail/:id"
            element={
              <AuthRequired>
                <BookingDetail />
              </AuthRequired>
            }
          />
          <Route
            path="/transaction-management"
            element={
              <AuthRequired>
                <TransactionManagement />
              </AuthRequired>
            }
          />
          <Route
            path="/revenue"
            element={
              <AuthRequired>
                <Revenue />
              </AuthRequired>
            }
          />
          <Route
            path="/vehicle-reviews"
            element={
              <AuthRequired>
                <VehicleReviews />
              </AuthRequired>
            }
          />
          <Route
            path="/notifications"
            element={
              <AuthRequired>
                <Notifications />
              </AuthRequired>
            }
          />
          <Route
            path="/traffic-fine-search"
            element={
              <AuthRequired>
                <TrafficFineSearch />
              </AuthRequired>
            }
          />
        </Routes>
      </div>
    </div>
  );
};

export default OwnerPage;
