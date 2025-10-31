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
import Logout from "./pages/renter/auth/Logout.jsx";

import VehicleDetail from "./pages/renter/vehicle/VehicleDetail.jsx";
import MyReviewsPage from "./pages/renter/bookingReview/MyReviewsPage.jsx";
import BookingHistory from "./pages/renter/bookingHistory/BookingHistory.jsx";
import BookingDetailsPage from "./pages/renter/booking/bookingDetailRenter/BookingDetailsPage.jsx";
import TransactionHistory from "./pages/renter/transaction/TransactionHistory.jsx";
import PointsHistory from "./pages/renter/points/PointsHistory.jsx";

import BookingReviewPage from "./pages/renter/bookingReview/BookingReviewPage.jsx";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import OwnerPage from "./pages/owner/ownerPage.jsx";
import AdminPage from "./pages/admin/AdminPageWithOutlet.jsx";

// booking
import OrderConfirmation from "./pages/renter/booking/OrderConfirmation.jsx";
import PaymentDeposit from "./pages/renter/booking/PaymentDeposit.jsx";
import ContractPage from "./pages/renter/booking/ContractBooking.jsx";

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
import DisburseOwner from "./pages/admin/SideBarComponents/DisburseOwner.jsx";
import VoucherManagement from "./pages/admin/SideBarComponents/VoucherManagement.jsx";

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

          {/* RENTER ROUTES :  */}
          <Route
            path="/"
            element={<Account />}
          >
            <Route path="/account" element={<UserInformation />} />
            <Route path="/myvehicles" element={<MyVehicles />} />
            <Route path="/booking-history" element={<BookingHistory />} />
            <Route path="/my-reviews" element={<MyReviewsPage />} />
            {/* booking detail renter */}
            <Route
              path="/booking-history/booking-detail/:id"
              element={<BookingDetailsPage />}
            />
            <Route path="/transactions" element={<TransactionHistory />} />
            <Route path="/points" element={<PointsHistory />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/mytrips" element={<MyTrips />} />
            <Route path="/longtermrenting" element={<LongTermRenting />} />
            <Route path="/myreward" element={<MyReward />} />
            <Route path="/myaddress" element={<MyAddress />} />
            <Route path="/resetpw" element={<ResetPassword />} />
            <Route path="/deleteaccount" element={<DeleteAccount />} />
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
          {/* Vehicle Detail */}
          <Route path="/detail/:id" element={<VehicleDetail />} />

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
          {/* Contract Page */}
          <Route path="/contract/:bookingId" element={<ContractPage />} />

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
          <Route
            path="/admin"
            element={<AdminPage />}
          >
            {/* Admin Routes For Admin Here : */}
            <Route
              path="approvalvehicle"
              element={<ApprovalVehicle />}
            />
            <Route
              path="managementvehicle"
              element={<ManagementVehicles />}
            />
            <Route
              path="userManagement"
              element={<UserManagement />}
            />

            <Route
              path="approveOwner"
              element={<ApproveOwner />}
            />

            <Route
              path="messages"
              element={<Messages />}
            />
            <Route
              path="reports"
              element={<Reports />}
            />
            <Route
              path="revenue-stats"
              element={<RevenueStats />}
            />
            <Route
              path="refundManagement"
              element={<RefundManagement />}
            />

            <Route
              path="disburseOwner"
              element={<DisburseOwner />}
            />

            <Route
              path="voucherManagement"
              element={<VoucherManagement />}
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
