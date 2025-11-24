import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import "./Hero.css";

const Hero = () => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const backgroundImageUrl =
    "https://media-cdn-v2.laodong.vn/Storage/NewsPortal/2021/4/3/895460/Xe-Gia-Dinh.jpg";

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  return (
    <section
      className="hero-section relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-900"
      data-aos="fade-down"
      data-aos-duration="1000"
      data-aos-delay="0"
    >
      {/* Background Image */}
      <div
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60 parallax-bg transition-opacity duration-500 ${
          imageLoaded ? "opacity-60" : "opacity-0"
        }`}
        style={{
          backgroundImage: imageError
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : `url("${backgroundImageUrl}")`,
        }}
      >
        {/* Preload image */}
        {!imageLoaded && !imageError && (
          <img
            src={backgroundImageUrl}
            alt=""
            className="hidden"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h1
          className="hero-title text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black mb-4 sm:mb-6 bg-gradient-to-r from-white via-blue-100 to-green-100 bg-clip-text text-transparent leading-none tracking-tight"
          data-aos="zoom-in"
          data-aos-delay="200"
        >
          Rentzy
        </h1>

        {/* Slogan with typewriter effect */}
        <p
          className="hero-slogan text-xl sm:text-2xl md:text-3xl font-light mb-6 sm:mb-8 text-white/90 max-w-3xl mx-auto leading-relaxed typewriter"
          data-aos="fade-up"
          data-aos-delay="400"
        >
          Tìm chiếc xe <span className="text-teal-300">hoàn hảo</span> cho
          chuyến đi của bạn.
        </p>

        {/* Subtext - hidden on mobile */}
        <p
          className="text-base sm:text-lg md:text-xl mb-8 sm:mb-12 text-white/70 max-w-2xl mx-auto leading-relaxed hidden md:block"
          data-aos="fade-up"
          data-aos-delay="600"
        >
          Nhanh chóng, dễ dàng và giá tốt nhất.
        </p>

        {/* CTA Buttons */}
        <div
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4"
          data-aos="fade-up"
          data-aos-delay="800"
        >
          <Link
            to="/cars"
            className="hero-button inline-flex items-center justify-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-sm text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-medium border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 shadow-2xl w-full sm:w-auto pulse-cta"
            aria-label="Khám phá xe ô tô"
          >
            <span>Khám Phá Xe Ô Tô</span>
            <ArrowRight size={18} className="sm:w-5 sm:h-5" />
          </Link>
          <Link
            to="/motorbikes"
            className="hero-button inline-flex items-center justify-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-sm text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-medium border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 shadow-2xl w-full sm:w-auto pulse-cta"
            aria-label="Khám phá xe máy"
          >
            <span>Khám Phá Xe Máy</span>
            <ArrowRight size={18} className="sm:w-5 sm:h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
