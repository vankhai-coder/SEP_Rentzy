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
import BookingHistory from "./pages/renter/bookingHistory/BookingHistory.jsx";
import BookingReviewPage from "./pages/renter/bookingReview/BookingReviewPage.jsx";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import OwnerPage from "./pages/owner/ownerPage.jsx";

// booking
import OrderConfirmation from "./pages/renter/booking/OrderConfirmation.jsx";

import SearchResults from "./pages/renter/search/SearchResults.jsx";
import VerifyUpdatedEmail from "./pages/renter/auth/VerifyUpdatedEmail.jsx";
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
            element={
              <ProtectedRoute allowRole={["renter", "owner", "admin"]}>
                <Account />
              </ProtectedRoute>
            }
          >
            <Route path="/account" element={<UserInformation />} />
            <Route path="/myvehicles" element={<MyVehicles />} />
            <Route path="/booking-history" element={<BookingHistory />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/mytrips" element={<MyTrips />} />
            <Route path="/longtermrenting" element={<LongTermRenting />} />
            <Route path="/myreward" element={<MyReward />} />
            <Route path="/myaddress" element={<MyAddress />} />
            <Route path="/resetpw" element={<ResetPassword />} />
            <Route path="/deleteaccount" element={<DeleteAccount />} />
          </Route>

          <Route
            path="/booking-review/:bookingId"
            element={
              <ProtectedRoute allowRole={"renter"}>
                <BookingReviewPage />
              </ProtectedRoute>
            }
          />
          {/* Home Xe Ô Tô */}
          <Route path="/cars" element={<HomeCar />} />
          <Route path="/cars/search" element={<SearchResults type="car" />} />
          {/* Vehicle Detail */}
          <Route path="/detail/:id" element={<VehicleDetail />} />
          
          {/* Order Confirmation */}
          <Route path="/order-confirmation/:bookingId" element={<OrderConfirmation />} />

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

          {/* 404 fallback */}
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
