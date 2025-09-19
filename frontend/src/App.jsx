import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home.jsx";
import LoginPage from "./pages/Login.jsx";
import Layout from "./components/Layout.jsx";
import { useDispatch, useSelector } from "react-redux";
import { checkAuth } from "./redux/features/auth/authSlice.js";
import { useEffect } from "react";
import HomeCar from "./pages/renter/home/HomeCar.jsx";
import HomeMotorbike from "./pages/renter/home/HomeMotorbike.jsx";
import FavoritesPage from "./pages/renter/favorite/FavoritesPage.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
          <Route path="/login" element={<LoginPage />} />

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
