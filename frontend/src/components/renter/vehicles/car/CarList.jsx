import { MapPin, Car, Fuel, Users, Settings, Star } from "lucide-react";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN").format(value) + " VND";
};

const CarList = ({ cars }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cars.map((car) => (
        <div
          key={car.vehicle_id}
          className="bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden border border-gray-100"
        >
          {/* Hình ảnh */}
          <div className="relative">
            <img
              src={car.main_image_url}
              alt={car.model}
              className="w-full h-56 object-cover"
            />
            {/* Badge giảm giá */}
            {car.discount && (
              <span className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 text-sm rounded-full shadow">
                -{car.discount}%
              </span>
            )}
          </div>

          {/* Nội dung */}
          <div className="p-4">
            {/* Tag miễn thế chấp */}
            <div className="flex items-center mb-2">
              <span className="flex items-center text-gray-700 border border-gray-300 px-3 py-1 rounded-full text-xs">
                Miễn thế chấp
              </span>
            </div>

            {/* Tên xe */}
            <h2 className="text-base font-semibold text-gray-800 uppercase">
              {car.model} {car.year}
            </h2>

            {/* Đặc điểm nhanh */}
            <div className="flex items-center gap-5 mb-2 text-sm text-gray-600 flex-wrap">
              <span className="flex items-center gap-2">
                <Settings size={16} /> {car.transmission}
              </span>
              <span className="flex items-center gap-2">
                <Users size={16} /> {car.seats} chỗ
              </span>
              <span className="flex items-center gap-2">
                <Fuel size={16} /> {car.fuel_type}
              </span>
            </div>

            {/* Địa điểm */}
            <p className="flex items-center gap-1 text-sm text-gray-500">
              <MapPin size={16} /> {car.location}
            </p>

            {/* Tính năng */}
            {car.features && (
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-700">
                {car.features.map((f, i) => (
                  <span
                    key={i}
                    className="bg-gray-100 px-2 py-1 rounded-full border border-gray-200"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}

            <hr className="my-3 border-gray-200" />

            {/* Giá + rating */}
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-green-700 font-bold text-lg">
                  {formatCurrency(car.price_per_day)} / ngày
                </p>
                {car.price_per_hour && (
                  <p className="text-gray-500 text-sm">
                    {formatCurrency(car.price_per_hour)} / giờ
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 text-gray-700 text-sm">
                <Star size={16} className="text-yellow-500" />
                {car.rating || "5.0"} ({car.rent_count || "3"} chuyến)
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CarList;
