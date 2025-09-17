const CarCard = ({ car }) => {
  return (
    <div className="border rounded-xl shadow p-4 hover:shadow-lg transition">
      <img
        src={car.image}
        alt={car.name}
        className="w-full h-40 object-cover rounded-md"
      />
      <h2 className="text-lg font-semibold mt-2">{car.name}</h2>
      <p className="text-gray-600">Số chỗ: {car.seats}</p>
      <p className="text-gray-600">Hộp số: {car.transmission}</p>
      <p className="text-green-600 font-bold mt-1">{car.price}₫ / ngày</p>
    </div>
  );
};

export default CarCard;
