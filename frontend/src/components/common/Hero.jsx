import React from "react";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => (
  <section className="relative bg-gradient-to-r from-blue-600 to-green-600 text-white py-20 overflow-hidden">
    <div className="absolute inset-0 bg-black opacity-20"></div>{" "}
    {/* Overlay tối */}
    <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
      <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">
        Thuê Xe Tự Lái Dễ Dàng
      </h1>
      <p className="text-xl mb-8 max-w-2xl mx-auto drop-shadow-md">
        Hàng ngàn xe chất lượng cao, giá tốt nhất, giao nhận tận nơi tại Hà Nội
        & TP.HCM. Bắt đầu hành trình ngay!
      </p>
      <Link
        to="/search"
        className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition transform hover:scale-105"
      >
        <Search className="mr-2" size={20} />
        Bắt Đầu Tìm Xe
      </Link>
    </div>
  </section>
);

export default Hero;
