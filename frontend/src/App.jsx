import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home.jsx";
import Layout from "./components/Layout.jsx";
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
const App = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Login,Register: */}
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/logout" element={<Logout />} />

          {/* Home : */}
          <Route path="/" element={<HomePage />} />

          {/* RENTER ROUTES :  */}
          <Route path='/' element={<Account/>}>
            <Route path="/account"  element={<UserInformation/>} />
            <Route path="/myvehicles"  element={<MyVehicles/>} />
            <Route path="/favorites"  element={<FavoritesPage/>} />
            <Route path="/mytrips"  element={<MyTrips/>} />
            <Route path="/longtermrenting"  element={<LongTermRenting/>} />
            <Route path="/myreward"  element={<MyReward/>} />
            <Route path="/myaddress"  element={<MyAddress/>} />
            <Route path="/resetpw"  element={<ResetPassword/>} />
            <Route path="/deleteaccount"  element={<DeleteAccount/>} />
          </Route>
          {/* Home Xe Ô Tô */}
          <Route path="/cars" element={<HomeCar />} />

          {/* Home Xe Máy */}
          <Route path="/motorbikes" element={<HomeMotorbike />} />

          {/* OWNER ROUTES :  */}

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
