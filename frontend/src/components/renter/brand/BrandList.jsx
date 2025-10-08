// components/renter/brand/BrandList.jsx
const BrandList = ({ brands }) => {
  if (!brands || brands.length === 0) {
    return <p>Chưa có hãng xe nào.</p>;
  }

  return (
    <section className="bg-gray-50 py-10 rounded-xl">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-10 place-items-center">
        {brands.map((brand) => (
          <div key={brand.brand_id} className="text-center group">
            {/* Logo tròn */}
            <div
              className="w-24 h-24 mx-auto mb-3 flex items-center justify-center 
                         rounded-full bg-white border border-gray-200 shadow-sm 
                         overflow-hidden transition duration-300 ease-in-out 
                         group-hover:border-blue-500 group-hover:shadow-lg group-hover:scale-110"
            >
              <img
                src={brand.logo_url}
                alt={brand.name}
                className="w-3/4 h-3/4 object-contain transition-transform duration-300 ease-in-out group-hover:scale-110"
              />
            </div>

            {/* Tên hãng */}
            <h3 className="font-medium text-sm text-gray-700 group-hover:text-blue-600 transition">
              {brand.name}
            </h3>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BrandList;
