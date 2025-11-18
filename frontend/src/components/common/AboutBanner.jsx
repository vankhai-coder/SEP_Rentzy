// components/renter/common/AboutBanner.jsx
import React from "react";
import { Link } from "react-router-dom";

const AboutBanner = () => {
  return (
    <>
      <section className="w-full px-6 md:px-12 lg:px-20 pt-20 pb-24 animate-fadeIn bg-white">
        {/* Line Separator (phía trên bảo đảm giống website Mioto) */}
        <div className="w-full h-px bg-gray-200/60 mb-16"></div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-14">
          {/* Left Side: Text */}
          <div className="flex-1 space-y-6 animate-fadeInText">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
              Về Rentzy
            </h1>

            <p className="text-gray-700 text-xl leading-relaxed max-w-xl">
              Rentzy mang đến hành trình an toàn, tiện lợi và đầy cảm hứng. Trải
              nghiệm thuê xe hiện đại – nơi mỗi chuyến đi bắt đầu với sự an tâm
              và thoải mái tuyệt đối.
            </p>

            <Link
              to="/about"
              className="
                inline-flex items-center gap-2 
                text-blue-700 font-semibold text-lg
                hover:underline underline-offset-4 transition-all
              "
            >
              Tìm hiểu thêm →
            </Link>
          </div>

          {/* Right Side: Image (tự do, không khung, không bo) */}
          <div className="flex-1 animate-slideIn">
            <img
              src="https://xedoisong.vn/uploads/20221024/xedoisong_secrets_top_view_of_hypercar_supercar_sportcar_aerodynamic_beauty_h3_ttdm.jpg"
              alt="Rentzy Banner"
              className="w-full h-auto object-cover rounded-xl"
            />
          </div>
        </div>

        {/* Line Separator (phía dưới để chia section) */}
        <div className="w-full h-px bg-gray-200/60 mt-20"></div>
      </section>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }

        @keyframes fadeInText {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fadeInText {
          animation: fadeInText 0.8s ease-out 0.2s forwards;
          opacity: 0;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.8s ease-out 0.3s forwards;
          opacity: 0;
        }
      `}</style>
    </>
  );
};

export default AboutBanner;
