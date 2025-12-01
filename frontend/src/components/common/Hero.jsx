import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import "./Hero.css";

const Hero = () => (
  <section
    className="relative min-h-[70vh] sm:min-h-[80vh] md:min-h-screen flex items-center justify-center overflow-visible bg-gray-900 px-4 py-8"
    data-aos="fade-down" // [THÊM AOS: Fade từ trên xuống cho toàn section]
    data-aos-duration="1000" // Thời gian dài hơn cho hero
    data-aos-delay="0"
  >
    <div
      className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60 parallax-bg" // [THÊM: Class cho parallax]
      style={{
        backgroundImage:
          'url("https://media-cdn-v2.laodong.vn/Storage/NewsPortal/2021/4/3/895460/Xe-Gia-Dinh.jpg")',
      }}
    />
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60" />
    <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center overflow-visible pb-8">
      <h1
        className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl xl:text-9xl font-black mb-4 bg-gradient-to-r from-white via-blue-100 to-green-100 bg-clip-text text-transparent tracking-tight"
        style={{ 
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: '1.2',
          paddingBottom: '1rem',
          marginBottom: '1rem',
          display: 'block',
          overflow: 'visible'
        }}
        data-aos="zoom-in" // [THÊM AOS: Zoom cho title]
        data-aos-delay="200"
      >
        Rentzy
      </h1>
      {/* [SỬA: Giảm text, thêm typewriter cho slogan */}
      <p
        className="text-xl sm:text-2xl md:text-3xl font-light mb-6 sm:mb-8 text-white/90 max-w-3xl mx-auto leading-relaxed typewriter"
        data-aos="fade-up" // [THÊM AOS: Fade cho slogan]
        data-aos-delay="400"
      >
        Tìm chiếc xe <span className="text-teal-300">hoàn hảo</span> cho chuyến
        đi của bạn.
      </p>
      <p
        className="text-base sm:text-lg md:text-xl mb-8 sm:mb-12 text-white/70 max-w-2xl mx-auto leading-relaxed hidden xs:block" // [SỬA: Sử dụng xs: thay vì md: để hiển thị sớm hơn trên tablet nhỏ, nhưng vẫn ẩn trên mobile nhỏ]
        data-aos="fade-up" // [THÊM AOS: Fade cho subtext]
        data-aos-delay="600"
      >
        {" "}
        {/* [SỬA: Ẩn text dài trên mobile để gọn */}
        Nhanh chóng, dễ dàng và giá tốt nhất.
      </p>
      <div
        className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full max-w-md sm:max-w-none mx-auto"
        data-aos="fade-up" // [THÊM AOS: Fade cho buttons]
        data-aos-delay="800"
      >
        <Link
          to="/cars"
          className="inline-flex items-center justify-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-sm text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-medium border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 shadow-2xl flex-1 min-w-0 pulse-cta text-sm sm:text-base" // [SỬA: Responsive padding, gap, text size; justify-center cho button trên mobile]
          aria-label="Khám phá xe ô tô"
        >
          Khám Phá Xe Ô Tô
          <ArrowRight size={16} className="sm:w-5 sm:h-5" />{" "}
          {/* [SỬA: Giảm icon size trên mobile */}
        </Link>
        <Link
          to="/motorbikes"
          className="inline-flex items-center justify-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-sm text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-medium border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 shadow-2xl flex-1 min-w-0 pulse-cta text-sm sm:text-base" // [SỬA: Tương tự cho button thứ 2]
          aria-label="Khám phá xe máy"
        >
          Khám Phá Xe Máy
          <ArrowRight size={16} className="sm:w-5 sm:h-5" />
        </Link>
      </div>
    </div>

    {/* [THÊM AOS: CSS cho parallax background (di chuyển chậm khi scroll) */}
    <style jsx>{`
      @keyframes typewriter {
        from {
          width: 0;
        }
        to {
          width: 100%;
        }
      }
      .typewriter {
        overflow: hidden;
        border-right: 2px solid #14b8a6;
        white-space: nowrap;
        animation: typewriter 2s steps(40) forwards,
          blink 0.75s step-end infinite;
        width: 0;
      }
      @keyframes blink {
        from,
        to {
          border-color: transparent;
        }
        50% {
          border-color: #14b8a6;
        }
      }
      @keyframes pulse {
        0%,
        100% {
          box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
        }
        50% {
          box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
        }
      }
      .pulse-cta {
        animation: pulse 2s infinite;
      }
      /* [THÊM: Parallax cho bg - di chuyển chậm 0.5x tốc độ scroll] */
      .parallax-bg {
        background-attachment: fixed;
        background-position: center top;
      }
      @media (max-width: 768px) {
        .parallax-bg {
          background-attachment: scroll; /* Tắt parallax trên mobile để tránh lag */
        }
      }

      @media (max-width: 640px) {
        .typewriter {
          animation: typewriter 2.5s steps(30) forwards; /* Tăng steps/time cho mobile text ngắn hơn */
        }
      }
    `}</style>
  </section>
);

export default Hero;
