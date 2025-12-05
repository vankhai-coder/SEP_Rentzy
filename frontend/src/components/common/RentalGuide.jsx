// components/common/RentalGuide.jsx
import React from "react";

const RentalGuide = () => {
  const steps = [
    {
      number: "01",
      title: "Đặt xe trên web Rentzy",
      icon: (
        <img src="/book.png" alt="Đặt xe" className="w-32 h-32 mx-auto mb-6" />
      ),
    },
    {
      number: "02",
      title: "Nhận xe",
      icon: (
        <img
          src="/getcar.jfif"
          alt="Nhận xe"
          className="w-32 h-32 mx-auto mb-6"
        />
      ),
    },
    {
      number: "03",
      title: "Bắt đầu hành trình của bạn",
      icon: (
        <img
          src="/start.jpg"
          alt="Bắt đầu hành trình"
          className="w-32 h-32 mx-auto mb-6"
        />
      ),
    },
    {
      number: "04",
      title: "Trả xe & đánh giá chuyến đi",
      icon: (
        <img
          src="/return.png"
          alt="Trả xe đánh giá"
          className="w-32 h-32 mx-auto mb-6"
        />
      ),
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-screen-xl mx-auto px-6">
        {/* TITLE CENTER */}
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
            Hướng Dẫn Thuê Xe
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Chỉ với 4 bước đơn giản để trải nghiệm thuê xe Rentzy một cách nhanh
            chóng
          </p>
        </div>
        {/* GRID CENTER */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-16">
          {steps.map((step, index) => (
            <div
              key={index}
              className="text-center transition-all duration-300 hover:-translate-y-2"
            >
              {step.icon}
              <div className="text-3xl font-bold text-green-600 mb-2">
                {step.number}
              </div>
              <h3 className="text-xl font-semibold text-gray-800">
                {step.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RentalGuide;
