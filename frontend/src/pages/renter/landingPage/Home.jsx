// pages/renter/landingPage/Home.jsx
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchBrands } from "@/redux/features/renter/brand/brandSlice";
import Hero from "@/components/common/Hero";
import RecommendationSection from "@/components/renter/recommendation/RecommendationSection";
import BrandList from "@/components/renter/brand/BrandList";
import OwnerBanner from "@/components/common/OwnerBanner";
import AboutBanner from "@/components/common/AboutBanner";

const Home = () => {
  const dispatch = useDispatch();
  const { role, loading: userLoading } = useSelector(
    (state) => state.userStore
  );
  const navigate = useNavigate();

  const {
    brands,
    loading: brandLoading,
    error: brandError,
  } = useSelector((state) => state.brandStore);

  useEffect(() => {
    if (role === "admin") navigate("/admin");
    // Removed auto-redirect for owner to allow manual navigation via account page
  }, [role, navigate]);

  useEffect(() => {
    dispatch(fetchBrands("car"));
  }, [dispatch]);

  if (userLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <Hero />

      {/* RecommendationSection - Đặt trước Brands */}
      <RecommendationSection limit={8} />

      {/* Phần BrandList - Di chuyển xuống dưới, text căn giữa */}
      <section className="mb-8 container mx-auto p-6 pt-1">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">
            Đối Tác Thương Hiệu Nổi Bật
          </h2>
          <p className="text-gray-500 text-lg">Khám phá các hãng xe hàng đầu</p>
        </div>
        {brandLoading ? (
          <p className="text-center">Đang tải hãng xe...</p>
        ) : brandError ? (
          <p className="text-center text-red-500">{brandError}</p>
        ) : (
          <BrandList brands={brands.slice(0, 8)} />
        )}
      </section>

      <OwnerBanner />

      <AboutBanner />
    </div>
  );
};

export default Home;
