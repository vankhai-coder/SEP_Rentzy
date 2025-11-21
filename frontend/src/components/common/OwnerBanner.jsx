// components/renter/common/OwnerBanner.jsx
import React from "react";
import { Link } from "react-router-dom";

const OwnerBanner = () => {
  return (
    <>
      <section
        className="container mx-auto px-6 py-20 mb-12 animate-fadeIn"
        data-aos="fade-up" // [THÊM AOS: Fade cho toàn section]
        data-aos-duration="800"
      >
        <div className="bg-gradient-to-br from-blue-50 via-cyan-50/50 to-indigo-50 rounded-3xl p-8 md:p-12 lg:p-16 shadow-md border border-blue-200/30 max-w-7xl mx-auto overflow-hidden relative">
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.1)_0%,transparent_50%)]" />
          </div>
          <div className="flex flex-col md:flex-row items-start gap-0 md:gap-8 lg:gap-12 relative z-10">
            <div
              className="flex-1 md:pr-8 lg:pr-12 space-y-6 z-10 relative animate-fadeInText"
              data-aos="slide-right" // [THÊM AOS: Slide từ phải cho text]
              data-aos-delay="200"
            >
              <div className="flex items-center gap-3 mb-4">
                <h3
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-black leading-tight"
                  data-aos="zoom-in" // [THÊM AOS: Zoom cho h3]
                  data-aos-delay="300"
                >
                  Bạn muốn cho thuê xe?
                </h3>
              </div>
              <p
                className="text-black text-lg lg:text-xl leading-relaxed opacity-95 max-w-md"
                data-aos="fade-up" // [THÊM AOS: Fade cho p]
                data-aos-delay="400"
              >
                Hàng trăm chủ xe đã tin dùng Rentzy.
                <br className="hidden md:block" />
                Biến xe của bạn thành nguồn thu nhập ổn định – lên đến 3 triệu
                đồng mỗi tháng! {/* [SỬA: Thêm ! cho emphasis */}
              </p>
              <div className="flex justify-start pt-4">
                <Link
                  to="/register_owner"
                  className="owner-ripple flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-teal-500 text-white font-semibold rounded-2xl hover:from-blue-600 hover:to-teal-600 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 relative overflow-hidden text-lg"
                  aria-label="Đăng ký trở thành chủ xe ngay"
                  data-aos="slide-left" // [THÊM AOS: Slide cho button]
                  data-aos-delay="500"
                >
                  Đăng ký ngay →
                </Link>
              </div>
            </div>

            <div
              className="flex-1 relative md:ml-6 lg:ml-8 animate-slideIn"
              data-aos="slide-left" // [THÊM AOS: Slide từ trái cho image]
              data-aos-delay="100"
            >
              <div className="relative w-full h-80 md:h-96 lg:h-[28rem] rounded-3xl overflow-hidden clip-path-polygon group">
                <img
                  src="/owner.jpg" // [SỬA: Nếu không có file, thay bằng "https://via.placeholder.com/600x400?text=Owner+Image" }
                  alt="Chủ xe Rentzy khám phá cơ hội thu nhập mới"
                  className="w-full h-full object-cover transition-all duration-700 ease-in-out group-hover:scale-110"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/600x400?text=Owner+Image";
                  }} // [SỬA: Fallback ảnh ]
                  data-aos="zoom-in" // [THÊM AOS: Zoom cho img]
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent rounded-3xl" />
                <div className="absolute inset-0 rounded-3xl border-2 border-cyan-400/10 group-hover:border-cyan-400/20 transition-colors duration-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* [SỬA: Tối ưu animation - giảm duration cho nhanh hơn - Giữ nguyên CSS cũ, AOS sẽ override */}
      <style jsx>{`
        .owner-ripple {
          position: relative;
          overflow: hidden;
        }
        .owner-ripple::after {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.4);
          transform: translate(-50%, -50%);
          transition: width 0.3s, height 0.3s ease-in-out; /* [SỬA: Giảm 0.4s → 0.3s cho responsive */
        }
        .owner-ripple:active::after {
          width: 150px;
          height: 150px;
        }
        .clip-path-polygon {
          clip-path: polygon(0 0, 100% 0, 100% 85%, 90% 100%, 0 100%);
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards; /* [SỬA: Giảm 1s → 0.8s */
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
          animation: fadeInText 0.6s ease-out 0.2s forwards; /* [SỬA: Giảm delay */
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
          animation: slideIn 0.6s ease-out 0.4s forwards;
          opacity: 0;
        }
      `}</style>
    </>
  );
};

export default OwnerBanner;
