import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/renter/landingPage/Home.jsx";
import Layout from "./components/common/Layout.jsx";
import HomeCar from "./pages/renter/home/HomeCar.jsx";
import HomeMotorbike from "./pages/renter/home/HomeMotorbike.jsx";
import FavoritesPage from "./pages/renter/account/FavoritesPage.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import VerifyEmail from "./pages/renter/auth/VerifyEmail.jsx";
import ForgotPassword from "./pages/renter/auth/ForgotPassword.jsx";
import UserInformation from "./pages/renter/account/UserInformation.jsx";
import DeleteAccount from "./pages/renter/account/DeleteAccount.jsx";
import ResetPassword from "./pages/renter/account/ResetPassword.jsx";
import MyAddress from "./pages/renter/account/MyAddress.jsx";
import MyReward from "./pages/renter/account/MyReward.jsx";
import MyTrips from "./pages/renter/account/MyTrips.jsx";
import MyVehicles from "./pages/renter/account/MyVehicles.jsx";
import Account from "./pages/renter/account/Account.jsx";
import LongTermRenting from "./pages/renter/account/LongTermRenting.jsx";
import BankAccountPage from "./pages/renter/account/BankAccountPage.jsx";
import Logout from "./pages/renter/auth/Logout.jsx";
import About from "./components/common/About.jsx";
import BrandVehicles from "./components/renter/brand/BrandVehicles.jsx";
import OwnerPublicPage from "./pages/renter/owner/OwnerPublicPage.jsx";

import VehicleDetail from "./pages/renter/vehicle/VehicleDetail.jsx";
import MyReviewsPage from "./pages/renter/bookingReview/MyReviewsPage.jsx";
import BookingHistory from "./pages/renter/bookingHistory/BookingHistory.jsx";
import BookingDetailsPage from "./pages/renter/booking/bookingDetailRenter/BookingDetailsPage.jsx";
import TransactionHistory from "./pages/renter/transaction/TransactionHistory.jsx";
import PointsHistory from "./pages/renter/points/PointsHistory.jsx";
import MessagesPage from "./pages/admin/SideBarComponents/Messages.jsx";
import MyReportedVehicles from "./pages/renter/account/MyReportedVehicles";
import NotificationsRenter from "./pages/renter/account/Notifications.jsx";
import TrafficFineSearch from "./pages/renter/account/TrafficFineSearch.jsx";

import BookingReviewPage from "./pages/renter/bookingReview/BookingReviewPage.jsx";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import OwnerPage from "./pages/owner/ownerPage.jsx";
import RegisterOwner from "./pages/owner/RegisterOwner.jsx";
import AdminPage from "./pages/admin/AdminPageWithOutlet.jsx";
import ManagementBrand from "./pages/admin/SideBarComponents/ManagementBrand.jsx";

// booking
import OrderConfirmation from "./pages/renter/booking/OrderConfirmation.jsx";
import PaymentDeposit from "./pages/renter/booking/PaymentDeposit.jsx";
import ContractPage from "./pages/renter/booking/ContractBooking.jsx";
import WaitingOwnerApproval from "./pages/renter/booking/WaitingOwnerApproval.jsx";

import SearchResults from "./pages/renter/search/SearchResults.jsx";
import VerifyUpdatedEmail from "./pages/renter/auth/VerifyUpdatedEmail.jsx";
import ManagementVehicles from "./pages/admin/SideBarComponents/ManagementVehicles.jsx";
import ApprovalVehicle from "./pages/admin/SideBarComponents/ApprovalVehicle.jsx";
import UserManagement from "./pages/admin/SideBarComponents/UserManagement.jsx";
import ApproveOwner from "./pages/admin/SideBarComponents/ApproveOwner.jsx";
import Messages from "./pages/admin/SideBarComponents/Messages.jsx";
import Reports from "./pages/admin/SideBarComponents/Reports.jsx";
import Revenue from "./pages/owner/dashboard/Revenue.jsx";
import RevenueStats from "./pages/admin/SideBarComponents/RevenueStats.jsx";
import RefundManagement from "./pages/admin/SideBarComponents/RefundManagement.jsx";
import PayoutManagement from "./pages/admin/SideBarComponents/PayoutManagement.jsx";
import DisburseOwner from "./pages/admin/SideBarComponents/DisburseOwner.jsx";
import VoucherManagement from "./pages/admin/SideBarComponents/VoucherManagement.jsx";
import SystemSettingManagement from "./pages/admin/SideBarComponents/SystemSettingManagement.jsx";
import OverViewAdminDashboard from "./pages/admin/SideBarComponents/OverViewAdminDashboard.jsx";
import TrafficFineApproval from "./pages/admin/SideBarComponents/TrafficFineApproval.jsx";
import UserChart from "./pages/admin/SideBarComponents/UserChart.jsx";
import TrafficFinePayoutManagement from "./pages/admin/SideBarComponents/TrafficFinePayoutManagement.jsx";

// Test pages

const App = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Login,Register: */}
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/logout" element={<Logout />} />
          <Route
            path="/verify-updated-email"
            element={<VerifyUpdatedEmail />}
          />

          {/* Home : */}
          <Route path="/" element={<HomePage />} />

          {/* Trang đăng ký chủ xe */}
          <Route path="/register_owner" element={<RegisterOwner />} />

          <Route path="/about" element={<About />} />
          {/* RENTER ROUTES :  */}
          <Route path="/" element={<Account />}>
            <Route path="/account" element={<UserInformation />} />
            <Route path="/notifications" element={<NotificationsRenter />} />
            <Route path="/myvehicles" element={<MyVehicles />} />
            <Route path="/my-reports" element={<MyReportedVehicles />} />
            <Route path="/booking-history" element={<BookingHistory />} />
            <Route path="/my-reviews" element={<MyReviewsPage />} />
            {/* booking detail renter */}
            <Route
              path="/booking-history/booking-detail/:id"
              element={<BookingDetailsPage />}
            />
            {/* Contract Page */}
            <Route path="/contract/:bookingId" element={<ContractPage />} />
            <Route path="/transactions" element={<TransactionHistory />} />
            <Route path="/points" element={<PointsHistory />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/mytrips" element={<MyTrips />} />
            <Route path="/longtermrenting" element={<LongTermRenting />} />
            <Route path="/myreward" element={<MyReward />} />
            <Route path="/myaddress" element={<MyAddress />} />
            <Route path="/bank-accounts" element={<BankAccountPage />} />
            <Route path="/resetpw" element={<ResetPassword />} />
            <Route path="/deleteaccount" element={<DeleteAccount />} />
            <Route path="/traffic-fine-search" element={<TrafficFineSearch />} />
            <Route
              path="/booking-review/:bookingId"
              element={
                <ProtectedRoute allowRole={"renter"}>
                  <BookingReviewPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Home Xe Ô Tô */}
          <Route path="/cars" element={<HomeCar />} />
          <Route path="/cars/search" element={<SearchResults type="car" />} />
          <Route
            path="/brands/:brand_id/vehicles"
            element={<BrandVehicles />}
          />
          {/* Vehicle Detail */}
          <Route path="/detail/:id" element={<VehicleDetail />} />

          {/* Public Owner Page */}
          <Route path="/owner-public/:ownerId" element={<OwnerPublicPage />} />

          {/* Order Confirmation */}
          <Route
            path="/order-confirmation/:bookingId"
            element={<OrderConfirmation />}
          />
          {/* Payment Deposit */}
          <Route
            path="/payment-deposit/:bookingId"
            element={<PaymentDeposit />}
          />

          {/* Waiting Owner Approval */}
          <Route
            path="/booking-waiting/:bookingId"
            element={<WaitingOwnerApproval />}
          />

          {/* Home Xe Máy */}
          <Route path="/motorbikes" element={<HomeMotorbike />} />
          <Route
            path="/motorbikes/search"
            element={<SearchResults type="motorbike" />}
          />
          {/* OWNER ROUTES :  */}
          <Route
            path="/owner/*"
            element={
              <ProtectedRoute allowRole={"owner"}>
                <OwnerPage />
              </ProtectedRoute>
            }
          />

          {/* ADMIN ROUTES :  */}
          <Route path="/admin" element={<AdminPage />}>
            {/* Admin Routes For Admin Here : */}
            {/* index */}
            <Route index element={<OverViewAdminDashboard />} />
            <Route path="approvalvehicle" element={<ApprovalVehicle />} />
            <Route path="managementvehicle" element={<ManagementVehicles />} />
            <Route path="managementBrand" element={<ManagementBrand />} />
            <Route path="userManagement" element={<UserManagement />} />
            {/* userchart */}
            <Route path="userchart" element={<UserChart />} />
            <Route path="approveOwner" element={<ApproveOwner />} />

            <Route path="messages" element={<Messages />} />
            <Route path="reports" element={<Reports />} />
            <Route path="revenue-stats" element={<RevenueStats />} />
            <Route path="refundManagement" element={<RefundManagement />} />
            <Route path="payoutManagement" element={<PayoutManagement />} />

            <Route path="disburseOwner" element={<DisburseOwner />} />

            <Route path="voucherManagement" element={<VoucherManagement />} />
            <Route
              path="trafficFineApproval"
              element={<TrafficFineApproval />}
            />

            <Route
              path="systemSettings"
              element={<SystemSettingManagement />}
            />

            <Route
              path="trafficFinePayout"
              element={<TrafficFinePayoutManagement />}
            />

            <Route
              path="systemSettings"
              element={<SystemSettingManagement />}
            />

            {/* catch all route start with /admin  */}
            <Route path="*" element={<ApprovalVehicle />} />
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Layout>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </Router>
  );
};

export default App;
