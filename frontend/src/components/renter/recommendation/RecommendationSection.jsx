// src/components/renter/recommendation/RecommendationSection.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchRecommendations } from "@/redux/features/renter/recommendation/recommendationSlice";
import VehicleCard from "../vehicles/VehicleCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-toastify";
import { Settings, Users, Fuel, Bike, Gauge, BadgeCheck } from "lucide-react"; // [SỬA: Thêm BadgeCheck cho badge]

const RecommendationSection = ({ limit = 8 }) => {
  const dispatch = useDispatch();
  const { recommendations, loading, error } = useSelector(
    (state) => state.recommendation
  );

  useEffect(() => {
    dispatch(fetchRecommendations(limit))
      .unwrap()
      .catch((err) => toast.error(err || "Lỗi tải gợi ý!"));
  }, [dispatch, limit]);

  if (loading) {
    return (
      <section
        className="py-12 bg-white"
        data-aos="fade-up" // [THÊM AOS: Fade cho toàn section khi loading]
        data-aos-duration="600"
      >
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
            Xe Dành Cho Bạn <BadgeCheck className="text-green-500" size={24} />{" "}
            {/* [SỬA: Thêm badge icon */}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {" "}
            {/* [SỬA: Responsive hơn: 1→2→4 cols */}
            {[...Array(limit)].map((_, i) => (
              <Skeleton
                key={i}
                className="h-80 w-full rounded-xl"
                data-aos="fade-up" // [THÊM AOS: Stagger cho skeletons]
                data-aos-delay={`${i * 100}`} // Delay tăng dần 100ms/item
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section
        className="py-12 bg-white"
        data-aos="fade-up" // [THÊM AOS: Fade cho error]
      >
        <div className="text-center text-red-500">Lỗi tải gợi ý: {error}</div>
      </section>
    );
  }

  if (recommendations.length === 0) return null;

  // [GIỮ NGUYÊN: Helper functions và getIconSpecs - không thay đổi logic]

  const formatFuelType = (fuel) => {
    if (!fuel) return "N/A";
    const normalized = fuel.toLowerCase();
    if (normalized.includes("xăng") || normalized.includes("petrol"))
      return "Xăng";
    if (normalized.includes("điện") || normalized.includes("electric"))
      return "Điện";
    return fuel.charAt(0).toUpperCase() + fuel.slice(1);
  };

  const formatTransmission = (trans) => {
    if (!trans) return "N/A";
    const normalized = trans.toLowerCase();
    if (
      normalized.includes("auto") ||
      normalized.includes("automatic") ||
      normalized.includes("at")
    )
      return "Tự động";
    if (normalized.includes("manual") || normalized.includes("mt"))
      return "Số sàn";
    return trans.charAt(0).toUpperCase() + trans.slice(1);
  };

  const formatBikeType = (bikeType) => {
    if (!bikeType) return "N/A";
    const normalized = bikeType.toLowerCase();
    if (
      normalized.includes("scooter") ||
      normalized.includes("ga") ||
      normalized.includes("dutch")
    )
      return "Xe ga";
    if (normalized.includes("clutch") || normalized.includes("côn"))
      return "Xe côn";
    if (normalized.includes("manual") || normalized.includes("số"))
      return "Xe số";
    if (normalized.includes("electric") || normalized.includes("điện"))
      return "Xe điện";
    return bikeType.charAt(0).toUpperCase() + bikeType.slice(1);
  };

  const getIconSpecs = (vehicle) => {
    const type = vehicle.vehicle_type || "car";
    if (type === "car") {
      return [
        {
          icon: <Settings size={16} />,
          value: formatTransmission(vehicle.transmission),
        },
        { icon: <Users size={16} />, value: `${vehicle.seats || "N/A"} chỗ` },
        { icon: <Fuel size={16} />, value: formatFuelType(vehicle.fuel_type) },
      ];
    } else if (type === "motorbike") {
      return [
        { icon: <Bike size={16} />, value: formatBikeType(vehicle.bike_type) },
        {
          icon: <Gauge size={16} />,
          value: `${vehicle.engine_capacity || "N/A"}cc`,
        },
        { icon: <Fuel size={16} />, value: formatFuelType(vehicle.fuel_type) },
      ];
    }
    return [
      { icon: <Users size={16} />, value: `${vehicle.seats || "N/A"} chỗ` },
      { icon: <Fuel size={16} />, value: formatFuelType(vehicle.fuel_type) },
      {
        icon: <Settings size={16} />,
        value: formatTransmission(vehicle.transmission),
      },
    ];
  };

  return (
    <section
      className="py-12 bg-white"
      data-aos="fade-up" // [THÊM AOS: Fade cho section title]
      data-aos-duration="600"
    >
      <div className="max-w-7xl mx-auto px-4">
        <h2
          className="text-2xl font-bold text-center mb-4 flex items-center justify-center gap-2"
          data-aos="zoom-in" // [THÊM AOS: Zoom cho title]
          data-aos-delay="100"
        >
          Xe Dành Cho Bạn <BadgeCheck className="text-green-500" size={24} />
        </h2>
        {/* [SỬA: Thêm subtext cho trust */}
        <p
          className="text-center text-gray-600 mb-8"
          data-aos="fade-up" // [THÊM AOS: Fade cho subtext]
          data-aos-delay="200"
        >
          Dựa trên lịch sử tìm kiếm và thuê xe của bạn – cá nhân hóa 100%
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendations.map((vehicle, index) => (
            <VehicleCard
              key={vehicle.vehicle_id}
              vehicle={vehicle}
              iconSpecs={getIconSpecs(vehicle)}
              type={vehicle.vehicle_type}
              showCompare={false}
              data-aos="fade-up" // [THÊM AOS: Fade-up cho từng card]
              data-aos-delay={`${index * 150}`} // Stagger: Delay tăng 150ms/card để xuất hiện lần lượt
              data-aos-duration="700"
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecommendationSection;
