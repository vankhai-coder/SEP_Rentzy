const CarList = ({ cars }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cars.map((car) => (
        <div key={car.vehicle_id} className="border rounded-lg p-4 shadow-md">
          <img
            src={car.main_image_url}
            alt={car.model}
            className="w-full h-48 object-cover rounded-md"
          />
          <h2 className="text-xl font-bold mt-2">{car.model}</h2>
          <p>Ghế: {car.seats}</p>
          <p>Hộp số: {car.transmission}</p>
          <p>Giá/ngày: {car.price_per_day} VND</p>
          <button className="bg-green-500 text-white px-4 py-2 mt-2 rounded">
            Thuê ngay
          </button>
        </div>
      ))}
    </div>
  );
};

export default CarList;
