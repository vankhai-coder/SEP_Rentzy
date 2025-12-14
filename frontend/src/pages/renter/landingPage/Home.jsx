// pages/renter/landingPage/Home.jsx
import React, { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { useSelector, useDispatch } from "react-redux";
import { fetchBrands } from "@/redux/features/renter/brand/brandSlice";
import { compareVehicles } from "@/redux/features/renter/compare/compareSlice";
import Hero from "@/components/common/Hero";
import RecommendationSection from "@/components/renter/recommendation/RecommendationSection";
import BrandList from "@/components/renter/brand/BrandList";
import OwnerBanner from "@/components/common/OwnerBanner";
import AboutBanner from "@/components/common/AboutBanner";
import CounterSection from "@/components/common/CounterSection";
import ServiceFeatures from "@/components/common/ServiceFeatures";
import RentalGuide from "@/components/common/RentalGuide";
import CompareModal from "@/components/renter/vehicles/compare/CompareModal";
import { Scale } from "lucide-react";
import { toast } from "react-toastify";

const Home = () => {
  const dispatch = useDispatch();

  const { loading: userLoading } = useSelector((state) => state.userStore);

  const {
    brands,
    loading: brandLoading,
    error: brandError,
  } = useSelector((state) => state.brandStore);

  // State cho Compare Modal
  const { compareList } = useSelector((state) => state.compareStore);
  const [showModal, setShowModal] = useState(false);

  // Fetch brands khi component mount
  useEffect(() => {
    dispatch(fetchBrands("car"));
  }, [dispatch]);

  // Khởi tạo AOS animation
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: "ease-out",
      once: false,
      offset: 100,
      delay: 100,
      disable: false,
    });

    const handleResize = () => AOS.refresh();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      AOS.refreshHard();
    };
  }, []);

  // Handler cho nút so sánh
  const handleOpenCompare = () => {
    if (compareList.length < 2) {
      toast.warn("Chọn ít nhất 2 xe để so sánh!");
      return;
    }
    dispatch(compareVehicles());
    setShowModal(true);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 overflow-hidden smooth-scroll">
        <Hero />

        {/* RecommendationSection - Giữ nguyên thứ tự */}
        <RecommendationSection limit={8} />

        {/* Phần BrandList - Giữ nguyên, nhưng limit 8 để gọn */}
        <section className="mb-6 sm:mb-8 container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">
              Đối Tác Thương Hiệu Nổi Bật
            </h2>
            <p className="text-gray-500 text-base sm:text-lg">
              Khám phá các hãng xe hàng đầu
            </p>
          </div>
          {brandLoading ? (
            <p className="text-center">Đang tải hãng xe...</p>
          ) : brandError ? (
            <p className="text-center text-red-500">{brandError}</p>
          ) : (
            <BrandList brands={brands.slice(0, 8)} />
          )}
        </section>

        <ServiceFeatures />
        <OwnerBanner />
        <RentalGuide />
        <CounterSection />
        <AboutBanner />

        {/* Compare Modal */}
        {showModal && (
          <CompareModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            compareList={compareList}
          />
        )}
      </div>

      {/* Nút So Sánh Floating - Di chuyển sang bottom-left để tránh che bởi nút chat */}
      {compareList.length > 0 && (
        <button
          onClick={handleOpenCompare}
          className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl text-sm font-medium"
          disabled={compareList.length < 2}
          title="So sánh xe đã chọn"
        >
          <Scale size={16} />
          <span className="hidden sm:inline">So sánh</span>
          <span className="bg-white text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold ml-1">
            {compareList.length}
          </span>
        </button>
      )}
    </>
  );
};

export default Home;
