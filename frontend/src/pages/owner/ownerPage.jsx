import React, { useEffect, useRef, useState } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
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
import ContractOwner from "./dashboard/ContractOwner.jsx";
import { Menu, Search, Bell } from "lucide-react";
import axiosInstance from "@/config/axiosInstance";

const OwnerPage = () => {
  const dispatch = useDispatch();
  const { email, avatar } = useSelector((state) => state.userStore || {});
  const { full_name } = useSelector((state) => state.userInformationStore || {});

  // state for click menu sidebar - default to true on desktop (will be handled by useEffect)
  const [isOpenMenuSideBar, setIsOpenMenuSideBar] = useState(true);
  // state for show notification dropdown
  const [isOpenNotificationDropdown, setIsOpenNotificationDropdown] = useState(false);
  // state for unread notifications count
  const [unreadCount, setUnreadCount] = useState(0);

  // state for search shortcut (cmd + k)
  const inputRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      // Detect Ctrl + K (or Cmd + K on Mac)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); // Stop default browser search shortcut
        inputRef.current?.focus(); // Focus the input
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch unread notifications count
  useEffect(() => {
    let isMounted = true;
    let timerId;

    const fetchUnread = async () => {
      try {
        const res = await axiosInstance.get("/api/owner/dashboard/notifications", { params: { limit: 1 } });
        if (res.data && res.data.success && isMounted) {
          setUnreadCount(res.data.data.unreadCount || 0);
        }
      } catch {
        // silent
      }
    };

    fetchUnread();
    timerId = setInterval(fetchUnread, 30000);

    return () => {
      isMounted = false;
      if (timerId) clearInterval(timerId);
    };
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    dispatch(logoutUser());
    window.location.href = "/";
  };

  // Get initials from full_name or email
  const getInitials = () => {
    if (full_name) {
      const names = full_name.split(" ");
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "O";
  };

  return (
    <div>
      <div className="min-h-screen bg-white">
        <SidebarOwner 
          handleLogout={handleLogout} 
          isOpen={isOpenMenuSideBar}
          setIsOpen={setIsOpenMenuSideBar}
        />

      {/* header */}
      <div className={`fixed top-0 right-0 z-20 h-16 bg-white border-b border-gray-200 transition-all duration-300 ${
        isOpenMenuSideBar ? "lg:left-64" : "lg:left-0"
      } left-0`}>
        <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setIsOpenMenuSideBar(true) }} 
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-900" />
            </button>
            <button 
              onClick={() => { setIsOpenMenuSideBar(!isOpenMenuSideBar) }} 
              className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-900" />
            </button>
            <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg min-w-[300px] hover:bg-gray-200 transition-colors">
              <Search className="w-5 h-5 text-gray-900" />
              <input
                ref={inputRef}
                type="text"
                className="flex-1 text-sm text-gray-500 bg-transparent outline-none"
                placeholder="Search..."
              />
              <kbd className="hidden lg:inline-flex h-6 select-none items-center gap-0.5 rounded border border-gray-300 bg-white px-2 font-mono text-xs font-medium text-gray-600">
                <span className="text-sm">⌘</span>
                K
              </kbd>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Search className="w-5 h-5 text-gray-900" />
            </button>
            <div className="relative">
              <button 
                onClick={() => { setIsOpenNotificationDropdown(!isOpenNotificationDropdown) }} 
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors outline-none"
              >
                <Bell className="w-5 h-5 text-gray-900" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* dark background overlay for notification dropdown close */}
              <div 
                onClick={() => { setIsOpenNotificationDropdown(false) }} 
                className={`${isOpenNotificationDropdown ? "block" : "hidden"} fixed inset-0 bg-black/50 z-40 lg:hidden`}
              />

              <div className={`${isOpenNotificationDropdown ? "block" : "hidden"} absolute right-0 mt-2 w-80 origin-top-right rounded-xl bg-white shadow-lg border border-gray-200 overflow-hidden z-50`}>
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Thông báo</h3>
                    {unreadCount > 0 && (
                      <span className="badge badge-primary px-2 py-0.5 text-xs text-[#1e40af] bg-[#dbeafe] rounded-xl">
                        {unreadCount} Mới
                      </span>
                    )}
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <div className="px-4 py-6 text-center text-gray-500 text-sm">
                    Không có thông báo mới
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors outline-none">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                  {avatar ? (
                    <img src={avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    getInitials()
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {full_name || "Chủ xe"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {email || ""}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* main content */}
      <main className={`pt-16 transition-all duration-300 bg-white min-h-screen ${
        isOpenMenuSideBar ? "lg:ml-64" : "lg:ml-0"
      }`}>
        <div className="w-full">
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
          <Route
            path="/contract/:id"
            element={
              <AuthRequired>
                <ContractOwner />
              </AuthRequired>
            }
          />
            </Routes>
        </div>
      </main>
      </div>
    </div>
  );
};

export default OwnerPage;
