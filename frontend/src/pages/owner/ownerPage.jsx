import React, { useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import VehicleManagement from "./vehicleManagement/vehicleManagement.jsx";
import VehicleDetail from "./vehicleManagement/VehicleDetail.jsx";
import AddCarForm from "./vehicleManagement/addCarForm.jsx";
import AddMotoBikeForm from "./vehicleManagement/addMotoBikeForm.jsx";
import EditCarForm from "./vehicleManagement/editCarForm.jsx";
import EditMotoBikeForm from "./vehicleManagement/editMotoBikeForm.jsx";
import SidebarOwner from "@/components/SidebarOwner/SidebarOwner";
import { MdMenu } from "react-icons/md";
import BookingManagement from "./dashboard/BookingManagement.jsx";
import OwnerVoucherManagement from "./dashboard/OwnerVoucherManagement.jsx";
import BookingDetail from "./dashboard/BookingDetail.jsx";
import Revenue from "./dashboard/Revenue.jsx";
import VehicleReviews from "./dashboard/VehicleReviews.jsx";
import Notifications from "./dashboard/Notifications.jsx";
import TransactionManagement from "./dashboard/TransactionManagement.jsx";
import AuthRequired from "./dashboard/AuthRequired.jsx";
import OverViewManagement from "./overview/OverViewManagement.jsx";
import ContractOwner from "./dashboard/ContractOwner.jsx";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MdOutlineDashboard,
  MdDirectionsCar,
  MdCalendarMonth,
  MdNotifications,
  MdShowChart,
  MdTransform,
} from "react-icons/md";
import { FaClipboardList } from "react-icons/fa";

const OwnerPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Map pathname to page name
  const getPageName = (pathname) => {
    if (pathname.startsWith("/owner/vehicles/")) {
      return "Chi tiết xe";
    }
    if (pathname.startsWith("/owner/booking-management/detail/")) {
      return "Chi tiết đơn thuê";
    }
    if (pathname.startsWith("/owner/edit-car/") || pathname.startsWith("/owner/edit-motorbike/")) {
      return "Chỉnh sửa xe";
    }
    if (pathname.startsWith("/owner/add-car") || pathname.startsWith("/owner/add-motorbike")) {
      return "Thêm xe";
    }
    if (pathname.startsWith("/owner/contract/")) {
      return "Hợp đồng";
    }

    const pageMap = {
      "/owner": "Tổng Quan Hệ Thống",
      "/owner/": "Tổng Quan Hệ Thống",
      "/owner/overview": "Tổng Quan Hệ Thống",
      "/owner/vehicle-management": "Quản lý xe",
      "/owner/booking-management": "Quản lý đơn thuê",
      "/owner/transaction-management": "Quản lý giao dịch",
      "/owner/revenue": "Doanh thu",
      "/owner/vehicle-reviews": "Đánh giá về xe của tôi",
      "/owner/notifications": "Thông báo",
      "/owner/vouchers": "Mã giảm giá của tôi",
    };
    return pageMap[pathname] || "Tổng Quan Hệ Thống";
  };

  const currentPageName = getPageName(location.pathname);

  return (
    <div className="min-h-screen">
      <SidebarOwner isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      <div className="p-5 bg-gray-50 min-h-screen md:ml-[250px] ml-0">
        <div className="md:hidden mb-4">
          <div className="flex items-center gap-2 mb-3">
            <button
              aria-label="Mở menu"
              className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-white border border-gray-200 shadow-sm text-gray-700"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <MdMenu className="text-xl" />
            </button>
            <span className="text-lg font-semibold text-gray-800 whitespace-nowrap">Khu vực chủ xe</span>
          </div>
          {/* Navigation dropdown for mobile */}
          <Select
            onValueChange={(value) => navigate(value)}
            value={location.pathname.startsWith("/owner/vehicles/") ||
              location.pathname.startsWith("/owner/booking-management/detail/") ||
              location.pathname.startsWith("/owner/edit-") ||
              location.pathname.startsWith("/owner/add-") ||
              location.pathname.startsWith("/owner/contract/")
              ? undefined
              : location.pathname}
          >
            <SelectTrigger className="w-full text-md font-medium py-4 bg-[#ffffff]">
              <SelectValue placeholder={currentPageName} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem
                  className={"border-b-1 py-2 text-md font-medium"}
                  value="/owner/overview"
                >
                  <MdOutlineDashboard className="inline mr-2" /> Tổng quan
                </SelectItem>
                <SelectItem
                  className={"border-b-1 py-2 text-md font-medium"}
                  value="/owner/vehicle-management"
                >
                  <MdDirectionsCar className="inline mr-2" /> Quản lý xe
                </SelectItem>
                <SelectItem
                  className={"border-b-1 py-2 text-md font-medium"}
                  value="/owner/booking-management"
                >
                  <MdCalendarMonth className="inline mr-2" /> Quản lý đơn thuê
                </SelectItem>
                <SelectItem
                  className={"border-b-1 py-2 text-md font-medium"}
                  value="/owner/transaction-management"
                >
                  <MdTransform className="inline mr-2" /> Quản lý giao dịch
                </SelectItem>
                <SelectItem
                  className={"border-b-1 py-2 text-md font-medium"}
                  value="/owner/revenue"
                >
                  <MdShowChart className="inline mr-2" /> Doanh thu
                </SelectItem>
                <SelectItem
                  className={"border-b-1 py-2 text-md font-medium"}
                  value="/owner/vehicle-reviews"
                >
                  <FaClipboardList className="inline mr-2" /> Đánh giá về xe của tôi
                </SelectItem>
                <SelectItem
                  className={"border-b-1 py-2 text-md font-medium"}
                  value="/owner/notifications"
                >
                  <MdNotifications className="inline mr-2" /> Thông báo
                </SelectItem>
                <SelectItem
                  className={"border-b-1 py-2 text-md font-medium"}
                  value="/owner/vouchers"
                >
                  <MdNotifications className="inline mr-2" /> Mã giảm giá của tôi
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
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
            path="/vouchers"
            element={
              <AuthRequired>
                <OwnerVoucherManagement />
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
    </div>
  );
};

export default OwnerPage;