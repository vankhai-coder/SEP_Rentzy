import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home.jsx";
import Layout from "./components/Layout.jsx";
import HomeCar from "./pages/renter/home/HomeCar.jsx";
import HomeMotorbike from "./pages/renter/home/HomeMotorbike.jsx";
import FavoritesPage from "./pages/renter/favorite/FavoritesPage.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import VerifyEmail from "./pages/renter/auth/VerifyEmail.jsx";
import ForgotPassword from "./pages/renter/auth/ForgotPassword.jsx";
const App = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Login,Register: */}
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Home : */}
          <Route path="/" element={<HomePage />} />

          {/* RENTER ROUTES :  */}
          <Route path="/favorites" element={<FavoritesPage />} />
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
