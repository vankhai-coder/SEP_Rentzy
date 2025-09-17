const MotorbikeList = ({ bikes }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bikes.map((bike) => (
        <div key={bike.vehicle_id} className="border rounded-lg p-4 shadow-md">
          <img
            src={bike.main_image_url}
            alt={bike.model}
            className="w-full h-48 object-cover rounded-md"
          />
          <h2 className="text-xl font-bold mt-2">{bike.model}</h2>
          <p>Loại: {bike.bike_type}</p>
          <p>Dung tích: {bike.engine_capacity} cc</p>
          <p>Giá/ngày: {bike.price_per_day} VND</p>
          <button className="bg-green-500 text-white px-4 py-2 mt-2 rounded">
            Thuê ngay
          </button>
        </div>
      ))}
    </div>
  );
};

export default MotorbikeList;
