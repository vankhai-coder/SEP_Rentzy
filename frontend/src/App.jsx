import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home.jsx";
import Layout from "./components/Layout.jsx";
import HomeCar from "./pages/renter/home/HomeCar.jsx";
import HomeMotorbike from "./pages/renter/home/HomeMotorbike.jsx";
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
