// pages/renter/about/About.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Users, Shield, Clock, DollarSign } from "lucide-react"; // Giả sử dùng Lucide, nếu không thì dùng SVG

const About = () => {
  return (
    <>
      <div className="min-h-screen bg-white">
        {/* Giới Thiệu Chi Tiết - Nội dung tự do, không khung */}
        <section className="container mx-auto px-6 py-8 md:py-12 relative z-10 animate-fadeIn">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4 animate-slideInLeft">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Hành trình cùng Rentzy
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Với Rentzy, mỗi chuyến đi là một hành trình thú vị. Bạn cầm lái
                xe, cảm nhận gió trên đường, và khám phá những nơi mới mà không
                lo lắng về chi phí hay an toàn.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed">
                Chúng tôi giúp bạn thuê xe dễ dàng, từ xe máy đô thị đến ô tô
                gia đình, với các chủ xe thân thiện và xe được kiểm tra kỹ
                lưỡng. Hãy bắt đầu hành trình của riêng bạn – an toàn và tự do.
              </p>
              <div className="flex gap-4 mt-6">
                <Link
                  to="/cars"
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-300"
                >
                  Xe ô tô
                </Link>
                <Link
                  to="/motorbikes"
                  className="px-6 py-3 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors duration-300"
                >
                  Xe máy
                </Link>
              </div>
            </div>
            <div className="order-first md:order-last animate-slideInRight">
              {/* Ảnh đầu tiên từ URL */}
              <img
                src="https://files01.danhgiaxe.com/MbOhQUZjs2bIkEmez7eM3N2Q4e0=/fit-in/1280x0/20180905/tieu-chi-chon-mua-xe-cho-gia-dinh--153934.jpg"
                alt="Hành trình cầm lái xe cùng gia đình"
                className="w-full h-64 md:h-80 lg:h-96 object-cover rounded-lg"
              />
            </div>
          </div>
        </section>

        {/* Divider giữa section 1 và 2 */}
        <hr className="border-gray-200 my-8 mx-auto w-full max-w-7xl" />

        {/* Phần giữa - Reverse: Ảnh trái, text phải; text ngắn hơn */}
        <section
          className="container mx-auto px-6 py-8 md:py-12 relative z-10 animate-fadeIn"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Ảnh bên trái */}
            <div className="order-first animate-slideInLeft md:order-first">
              <img
                src="https://static.vinwonders.com/production/du-lich-gia-dinh-11.jpg"
                alt="Khám phá đường đèo an toàn với Rentzy"
                className="w-full h-64 md:h-80 lg:h-96 object-cover rounded-lg"
              />
            </div>
            {/* Text bên phải - Ngắn hơn */}
            <div className="space-y-4 animate-slideInRight md:pr-0">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Khám phá hành trình an toàn
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Hành trình không chỉ là di chuyển, mà là những khoảnh khắc đáng
                nhớ. Với Rentzy, chọn xe phù hợp cho phố xá đông đúc hay chuyến
                phiêu lưu cuối tuần.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed">
                Mỗi xe được kiểm tra định kỳ, đảm bảo an toàn tuyệt đối. Cầm lái
                với tự tin, tập trung vào niềm vui và kỷ niệm.
              </p>
            </div>
          </div>
        </section>

        {/* Divider giữa section 2 và 3 */}
        <hr className="border-gray-200 my-8 mx-auto w-full max-w-7xl" />

        {/* Features Grid - Nội dung tự do, không card */}
        <section
          className="container mx-auto px-6 py-8 md:py-12 relative z-10 animate-fadeIn"
          style={{ animationDelay: "0.4s" }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-8">
            Những điều Rentzy mang lại
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="space-y-3 text-center">
              <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800">
                Hành trình chia sẻ
              </h3>
              <p className="text-gray-600 text-sm">
                Kết nối với những người yêu xe, cùng nhau khám phá.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="space-y-3 text-center">
              <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800">
                Thuê xe an toàn
              </h3>
              <p className="text-gray-600 text-sm">
                Xe được kiểm tra, chủ xe đáng tin cậy cho mọi chuyến đi.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="space-y-3 text-center">
              <Clock className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800">
                Dễ dàng cầm lái
              </h3>
              <p className="text-gray-600 text-sm">
                Chọn xe phù hợp, bắt đầu hành trình chỉ trong vài phút.
              </p>
            </div>
            {/* Feature 4 */}
            <div className="space-y-3 text-center">
              <DollarSign className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800">
                Tiết kiệm đơn giản
              </h3>
              <p className="text-gray-600 text-sm">
                Giá cả rõ ràng, phù hợp cho mọi hành trình dài ngắn.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* CSS Inline cho animations */}
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
          animation: fadeIn 0.6s ease-out forwards;
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.5s ease-out forwards;
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideInRight {
          animation: slideInRight 0.5s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default About;
