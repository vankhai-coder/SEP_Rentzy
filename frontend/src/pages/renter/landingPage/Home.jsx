// pages/renter/landingPage/Home.jsx
import React, { useEffect } from "react";
import AOS from "aos"; // [THÊM AOS: Import thư viện]
import "aos/dist/aos.css"; // [THÊM AOS: Import CSS global]
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchBrands } from "@/redux/features/renter/brand/brandSlice";
import Hero from "@/components/common/Hero";
import RecommendationSection from "@/components/renter/recommendation/RecommendationSection";
import BrandList from "@/components/renter/brand/BrandList";
import OwnerBanner from "@/components/common/OwnerBanner";
import AboutBanner from "@/components/common/AboutBanner";
import CounterSection from "@/components/common/CounterSection";

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

  // [SỬA AOS: Khởi tạo với once: false để animation chạy lại khi scroll qua nhiều lần]
  useEffect(() => {
    AOS.init({
      duration: 800, // Thời gian animation mặc định (ms)
      easing: "ease-out", // Chuyển động mượt
      once: false, // [SỬA: Đổi từ true → false để trigger lại mỗi lần vào viewport]
      offset: 100, // Trigger khi element cách viewport 100px
      delay: 100, // Độ trễ mặc định cho stagger
      disable: false, // Không disable trên mobile (nếu lag thì set 'mobile')
    });

    // [THÊM: Cleanup và refresh khi unmount/resize để tránh bug scroll]
    const handleResize = () => AOS.refresh();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      AOS.refreshHard(); // Refresh hard để reset state nếu cần
    };
  }, []);

  if (userLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden smooth-scroll">
      {" "}
      {/* [SỬA: Thêm smooth-scroll class cho mượt */}
      <Hero />
      {/* RecommendationSection - Giữ nguyên thứ tự */}
      <RecommendationSection limit={8} />
      {/* Phần BrandList - Giữ nguyên, nhưng limit 6 để gọn - KHÔNG ÁP DỤNG AOS */}
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
      <CounterSection /> {/* KHÔNG ÁP DỤNG AOS */}
      <AboutBanner />
    </div>
  );
};

export default Home;
