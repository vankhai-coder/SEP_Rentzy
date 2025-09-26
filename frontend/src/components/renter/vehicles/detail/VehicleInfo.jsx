import React from 'react';

const VehicleInfo = ({ vehicle }) => {
  if (!vehicle) return null;
  
  const specifications = [
    { label: 'Truyền động', value: vehicle.transmission || 'Số tự động', icon: '⚙️', color: 'from-blue-500 to-blue-600' },
    { label: 'Số ghế', value: vehicle.seats || '5 chỗ', icon: '🪑', color: 'from-green-500 to-green-600' },
    { label: 'Nhiên liệu', value: vehicle.fuel_type || 'Xăng', icon: '🔋', color: 'from-yellow-500 to-orange-500' },
    { label: 'Tiêu hao', value: vehicle.fuel_consumption || '10L/100km', icon: '💧', color: 'from-cyan-500 to-blue-500' }
  ].filter(spec => spec.value);
  
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl shadow-lg">
      {/* Header with modern gradient */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          <h3 className="text-3xl font-bold mb-2">Thông tin xe</h3>
        </div>
        <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
      </div>
      
      {/* Vehicle Basic Info - Modern Card */}
      <div className="mb-8 bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-2xl font-bold text-gray-800 mb-2">{vehicle.model} {vehicle.year}</h4>
            {vehicle.location && (
              <div className="flex items-center gap-3 text-gray-600">
                <div className="w-8 h-8 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">📍</span>
                </div>
                <span className="font-medium text-lg">{vehicle.location}</span>
              </div>
            )}
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🚗</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Specifications - Modern Grid */}
      {specifications.length > 0 && (
        <div className="mb-8">
          <h4 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="text-3xl">⚡</span>
            Đặc điểm nổi bật
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {specifications.map((spec, index) => (
              <div key={index} className="group bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className={`w-14 h-14 bg-gradient-to-r ${spec.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-2xl">{spec.icon}</span>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-2 font-medium">{spec.label}</div>
                  <div className="font-bold text-gray-800 text-lg">{spec.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Description - Modern Card */}
      {vehicle.description ? (
        <div className="mb-8 bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
          <h4 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="text-3xl">📝</span>
            Mô tả chi tiết
          </h4>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">{vehicle.description}</p>
          </div>
        </div>
      ) : (
        <div className="mb-8 bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
          <h4 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="text-3xl">📝</span>
            Mô tả chi tiết
          </h4>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🚗</span>
                </div>
                <p className="font-bold text-xl text-gray-800">FORD TERRITORY TITANIUM X-2024</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🚚</span>
                </div>
                <p className="text-lg">Giao nhận tận nơi yêu cầu</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✨</span>
                </div>
                <p className="text-lg">Xe mới đẹp, rộng rãi, an toàn, tiện nghi, phù hợp cho gia đình du lịch.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🔧</span>
                </div>
                <p className="text-lg">Xe trang bị hệ thống cảm biến camera 360 gạt mưa tự động, đèn pha tự động v..v</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Features - Modern Grid */}
      {vehicle.features && vehicle.features.length > 0 ? (
        <div className="mb-8">
          <h4 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="text-3xl">🎯</span>
            Tiện nghi cao cấp
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {vehicle.features.map((feature, index) => {
              const getFeatureIcon = (featureName) => {
                 const name = featureName.toLowerCase();
                 if (name.includes('bluetooth')) return '🔗';
                 if (name.includes('camera') && name.includes('360')) return '🎯';
                 if (name.includes('camera') && name.includes('cập lề')) return '📸';
                 if (name.includes('camera') && name.includes('hành trình')) return '🎬';
                 if (name.includes('camera') && name.includes('lùi')) return '🔄';
                 if (name.includes('cảm biến') && name.includes('lốp')) return '⚡';
                 if (name.includes('cảm biến') && name.includes('va chạm')) return '🛡️';
                 if (name.includes('cảnh báo') && name.includes('tốc độ')) return '🚨';
                 if (name.includes('cửa sổ trời')) return '☀️';
                 if (name.includes('định vị') || name.includes('gps')) return '🧭';
                 if (name.includes('khe cắm') || name.includes('usb')) return '🔌';
                 if (name.includes('lốp dự phòng')) return '🔧';
                 if (name.includes('etc')) return '💎';
                 if (name.includes('túi khí') || name.includes('an toàn')) return '🛡️';
                 return '✨';
               };
              
              const getFeatureColor = (index) => {
                const colors = [
                  'from-blue-400 to-blue-600',
                  'from-green-400 to-green-600', 
                  'from-purple-400 to-purple-600',
                  'from-pink-400 to-pink-600',
                  'from-yellow-400 to-orange-500',
                  'from-cyan-400 to-blue-500',
                  'from-red-400 to-pink-500',
                  'from-indigo-400 to-purple-500'
                ];
                return colors[index % colors.length];
              };
              
              return (
                <div key={index} className="group bg-white rounded-lg shadow-md p-4 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-r ${getFeatureColor(index)} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <span className="text-white text-lg">{getFeatureIcon(feature)}</span>
                    </div>
                    <span className="font-medium text-gray-700 text-sm group-hover:text-gray-800 transition-colors duration-300">{feature}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <h4 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="text-3xl">🎯</span>
            Tiện nghi cao cấp
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
               { name: 'Bluetooth', icon: '🔗', color: 'from-blue-400 to-blue-600' },
               { name: 'Camera 360', icon: '🎯', color: 'from-green-400 to-green-600' },
               { name: 'Camera cập lề', icon: '📸', color: 'from-purple-400 to-purple-600' },
               { name: 'Camera hành trình', icon: '🎬', color: 'from-pink-400 to-pink-600' },
               { name: 'Camera lùi', icon: '🔄', color: 'from-yellow-400 to-orange-500' },
               { name: 'Cảm biến lốp', icon: '⚡', color: 'from-cyan-400 to-blue-500' },
               { name: 'Cảm biến va chạm', icon: '🛡️', color: 'from-red-400 to-pink-500' },
               { name: 'Cảnh báo tốc độ', icon: '🚨', color: 'from-indigo-400 to-purple-500' },
               { name: 'Cửa sổ trời', icon: '☀️', color: 'from-yellow-400 to-orange-500' },
               { name: 'Định vị GPS', icon: '🧭', color: 'from-green-400 to-emerald-500' },
               { name: 'Khe cắm USB', icon: '🔌', color: 'from-blue-400 to-cyan-500' },
               { name: 'Lốp dự phòng', icon: '🔧', color: 'from-gray-400 to-gray-600' },
               { name: 'ETC', icon: '💎', color: 'from-purple-400 to-pink-500' },
               { name: 'Túi khí an toàn', icon: '🛡️', color: 'from-red-400 to-orange-500' }
             ].map((feature, index) => (
              <div key={index} className="group bg-white rounded-lg shadow-md p-4 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-white text-lg">{feature.icon}</span>
                  </div>
                  <span className="font-medium text-gray-700 text-sm group-hover:text-gray-800 transition-colors duration-300">{feature.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleInfo;