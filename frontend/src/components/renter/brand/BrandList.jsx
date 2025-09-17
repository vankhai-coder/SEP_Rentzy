// components/renter/brand/BrandList.jsx
const BrandList = ({ brands }) => {
  if (!brands || brands.length === 0) {
    return <p>Chưa có hãng xe nào.</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {brands.map((brand) => (
        <div
          key={brand.brand_id}
          className="bg-white p-6 shadow rounded-xl text-center border border-gray-100 hover:shadow-lg hover:scale-105 transition transform"
        >
          {/* Logo trong khung tròn */}
          {brand.logo_url && (
            <div className="w-24 h-24 mx-auto mb-3 flex items-center justify-center rounded-full border border-gray-200 bg-gray-50">
              <img
                src={brand.logo_url}
                alt={brand.name}
                className="w-16 h-16 object-contain"
              />
            </div>
          )}

          {/* Tên hãng */}
          <h3 className="font-semibold text-base text-gray-800">
            {brand.name}
          </h3>
          <p className="text-gray-500 text-sm">{brand.country}</p>
        </div>
      ))}
    </div>
  );
};

export default BrandList;
