// components/renter/common/AboutBanner.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Info } from "lucide-react"; // [SỬA: Thêm icon cho text]

const AboutBanner = () => {
  return (
    <>
      <section
        className="w-full px-6 md:px-12 lg:px-20 pt-20 pb-24 animate-fadeIn bg-white"
        data-aos="fade-up" // [THÊM AOS: Fade cho toàn section]
        data-aos-duration="700"
      >
        {/* [SỬA: Xóa đường kẻ trên để tránh dư thừa với section trước đó (OwnerBanner) */}

        <div
          className="flex flex-col lg:flex-row items-center lg:items-start gap-14"
          data-aos="fade-up" // [THÊM AOS: Fade cho container]
        >
          {/* [SỬA: Responsive flex */}
          <div
            className="flex-1 space-y-6 animate-fadeInText"
            data-aos="slide-right" // [THÊM AOS: Slide từ phải cho text block]
            data-aos-delay="100"
          >
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight flex items-center gap-3"
              data-aos="zoom-in" // [THÊM AOS: Zoom cho h1]
              data-aos-delay="200"
            >
              {/* [SỬA: Thêm icon */}
              <Info size={48} className="text-blue-500" /> Về Rentzy
            </h1>

            <p
              className="text-gray-700 text-xl leading-relaxed max-w-xl"
              data-aos="fade-up" // [THÊM AOS: Fade cho p]
              data-aos-delay="300"
            >
              Rentzy mang đến hành trình an toàn, tiện lợi và đầy cảm hứng. Trải
              nghiệm thuê xe hiện đại – nơi mỗi chuyến đi bắt đầu với sự an tâm
              và thoải mái tuyệt đối.
            </p>

            <Link
              to="/about"
              className="
                inline-flex items-center gap-2 
                text-blue-700 font-semibold text-lg
                hover:underline underline-offset-4 transition-all hover:text-teal-600" // [SỬA: Thêm hover color ]
              aria-label="Tìm hiểu thêm về Rentzy"
              data-aos="slide-left" // [THÊM AOS: Slide cho link]
              data-aos-delay="400"
            >
              Tìm hiểu thêm →
            </Link>
          </div>
          <div
            className="flex-1 animate-slideIn w-full"
            data-aos="slide-left" // [THÊM AOS: Slide từ trái cho image]
            data-aos-delay="0"
          >
            {/* [SỬA: Full-width trên mobile */}
            <img
              src="https://xedoisong.vn/uploads/20221024/xedoisong_secrets_top_view_of_hypercar_supercar_sportcar_aerodynamic_beauty_h3_ttdm.jpg"
              alt="Rentzy Banner - Hành trình an toàn và tiện lợi"
              className="w-full h-auto object-cover rounded-xl" // [SỬA: Giữ rounded, thêm alt tốt hơn ]
              loading="lazy"
              data-aos="zoom-in" // [THÊM AOS: Zoom cho img]
            />
          </div>
        </div>

        {/* [SỬA: Xóa đường kẻ dưới để tránh dư thừa với footer hoặc section sau */}
      </section>

      {/* [SỬA: Animations - stagger delay nhỏ hơn - Giữ nguyên, AOS override */}
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
          animation: fadeInText 0.8s ease-out 0.1s forwards; /* [SỬA: Giảm delay 0.2s → 0.1s */
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
          animation: slideIn 0.8s ease-out 0.2s forwards; /* [SỬA: Delay 0.3s → 0.2s */
          opacity: 0;
        }
      `}</style>
    </>
  );
};

export default AboutBanner;
