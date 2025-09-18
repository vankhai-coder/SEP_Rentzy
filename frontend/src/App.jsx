import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home.jsx";
import LoginPage from "./pages/renter/auth/Login.jsx";
import Layout from "./components/Layout.jsx";
import { useDispatch, useSelector } from "react-redux";
import { checkAuth } from "./redux/features/auth/authSlice.js";
import { useEffect } from "react";
import HomeCar from "./pages/renter/home/HomeCar.jsx";
import HomeMotorbike from "./pages/renter/home/HomeMotorbike.jsx";
import Register from "./pages/renter/auth/Register.jsx";
import VerifyEmail from "./pages/renter/auth/VerifyEmail.jsx";
import ForgotPassword from "./pages/renter/auth/ForgotPassword.jsx";
const App = () => {
  // check auth :
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.userStore);

  useEffect(() => {
    dispatch(checkAuth());
  }, []);

  if (loading) {
    return <div className="min-h-screen text-center">Checking auth...</div>;
  }

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
    </Router>
  );
};

export default App;
