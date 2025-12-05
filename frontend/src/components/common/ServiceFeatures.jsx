// components/common/ServiceFeatures.jsx
import React from "react";

const ServiceFeatures = () => {
  const features = [
    {
      icon: (
        <img
          src="/checkoto.png"
          alt="Kiểm tra định kỳ"
          className="w-20 h-20 mx-auto mb-5"
        />
      ),
      title: "Xe Được Kiểm Tra Định Kỳ",
      description:
        "Tất cả xe được kiểm tra kỹ lưỡng trước khi giao, đảm bảo an toàn và chất lượng cao cho mọi chuyến đi của bạn.",
    },
    {
      icon: (
        <img
          src="/safeoto.png"
          alt="An tâm đặt xe"
          className="w-20 h-20 mx-auto mb-5"
        />
      ),
      title: "An Tâm Đặt Xe",
      description:
        "Hủy miễn phí 100% trong 1 giờ sau khi giữ chỗ. Sau 1 giờ: Hủy trước >7 ngày hoàn 70% (phí 30%); Hủy trong 7 ngày hoàn 30% (phí 70%).",
    },
    {
      icon: (
        <img
          src="/thutuc.png"
          alt="Thủ tục đơn giản"
          className="w-20 h-20 mx-auto mb-5"
        />
      ),
      title: "Thủ Tục Đơn Giản",
      description:
        "Chỉ cần CMND/CCCD hoặc hộ chiếu và GPLX là bạn có thể thuê xe dễ dàng, không rườm rà thủ tục.",
    },
    {
      icon: (
        <img
          src="/payment.png"
          alt="Thanh toán dễ dàng"
          className="w-20 h-20 mx-auto mb-5"
        />
      ),
      title: "Thanh Toán Dễ Dàng",
      description:
        "Thanh toán qua PayOS: Quét QR code nhanh chóng hoặc trả tiền mặt trực tiếp để nhận xe tiện lợi.",
    },
    {
      icon: (
        <img
          src="/ship.jpg"
          alt="Giao xe tận nơi"
          className="w-20 h-20 mx-auto mb-5"
        />
      ),
      title: "Giao Xe Tận Nơi",
      description:
        "Giao nhận tận nơi theo yêu cầu, hỗ trợ phí khứ hồi giúp bạn nhận xe thuận tiện hơn bao giờ hết.",
    },
    {
      icon: (
        <img
          src="/cartype.png"
          alt="Đa dạng dòng xe"
          className="w-20 h-20 mx-auto mb-5"
        />
      ),
      title: "Đa Dạng Dòng Xe",
      description:
        "Hàng trăm xe từ Sedan, CUV, MPV, SUV với các thương hiệu Toyota, Kia, Hyundai và nhiều hơn nữa.",
    },
  ];
  return (
    <section className="py-24 bg-white">
      <div className="max-w-screen-xl mx-auto px-6">
        {/* TITLE CENTER */}
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
            Ưu Điểm Của Rentzy
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Những tính năng giúp bạn dễ dàng hơn khi thuê xe trên Rentzy.
          </p>
        </div>
        {/* GRID CENTER */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16 text-center">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-4 transition-all duration-300 hover:-translate-y-2"
            >
              <div className="mb-5">{feature.icon}</div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed mx-auto max-w-xs">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default ServiceFeatures;
