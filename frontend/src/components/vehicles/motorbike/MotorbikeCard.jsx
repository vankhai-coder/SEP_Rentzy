const MotorbikeCard = ({ bike }) => {
  return (
    <div className="border rounded-xl shadow p-4 hover:shadow-lg transition">
      <img
        src={bike.image}
        alt={bike.name}
        className="w-full h-40 object-cover rounded-md"
      />
      <h2 className="text-lg font-semibold mt-2">{bike.name}</h2>
      <p className="text-gray-600">Loại xe: {bike.type}</p>
      <p className="text-gray-600">Dung tích: {bike.cc}cc</p>
      <p className="text-green-600 font-bold mt-1">{bike.price}₫ / ngày</p>
    </div>
  );
};

export default MotorbikeCard;
