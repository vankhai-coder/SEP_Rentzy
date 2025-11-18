import React from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => (
  <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-900">
    <div
      className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
      style={{
        backgroundImage:
          'url("https://media-cdn-v2.laodong.vn/Storage/NewsPortal/2021/4/3/895460/Xe-Gia-Dinh.jpg")',
      }}
    />
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60" />
    <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
      <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-4 bg-gradient-to-r from-white via-blue-100 to-green-100 bg-clip-text text-transparent leading-none tracking-tight">
        Rentzy
      </h1>
      <p className="text-2xl md:text-3xl font-light mb-8 text-white/90 max-w-3xl mx-auto leading-relaxed">
        Tìm chiếc xe
        <br className="hidden md:block" />
        <span className="block md:inline">hoàn hảo cho chuyến đi của bạn.</span>
      </p>
      <p className="text-lg md:text-xl mb-12 text-white/70 max-w-2xl mx-auto leading-relaxed">
        Nhanh chóng, dễ dàng và giá tốt nhất. Dù bạn lên kế hoạch cho một chuyến
        đi cuối tuần hay hành trình xuyên Việt, đội xe đa dạng và dịch vụ tận
        tâm của chúng tôi sẽ giúp bạn lên đường thật dễ dàng.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Link
          to="/cars"
          className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-medium border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 shadow-2xl flex-1 sm:flex-none"
        >
          Khám Phá Xe Ô Tô
          <ArrowRight size={20} />
        </Link>
        <Link
          to="/motorbikes"
          className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-medium border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 shadow-2xl flex-1 sm:flex-none"
        >
          Khám Phá Xe Máy
          <ArrowRight size={20} />
        </Link>
      </div>
    </div>
  </section>
);

export default Hero;
