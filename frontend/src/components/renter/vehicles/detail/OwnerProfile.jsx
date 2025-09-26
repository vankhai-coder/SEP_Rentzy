import React, { useState } from 'react';

const OwnerProfile = ({ vehicle }) => {
  const [activeSection, setActiveSection] = useState('owner');
  
  if (!vehicle) {
    return (
      <div className="bg-white p-6">
        <div className="flex items-center justify-center py-8 text-gray-500">Đang tải thông tin chủ xe...</div>
      </div>
    );
  }
  
  // Mock data for owner (in real app, this would come from API)
  const ownerData = {
    name: 'Nguyễn Văn A',
    avatar: '/api/placeholder/80/80',
    rating: 4.8,
    totalRentals: 156,
    joinDate: '2022-03-15',
    responseTime: '2 giờ',
    verificationStatus: {
      phone: true,
      email: true,
      identity: true,
      license: true
    },
    bio: 'Chủ xe nhiệt tình, luôn sẵn sàng hỗ trợ khách hàng. Xe được bảo dưỡng định kỳ và luôn trong tình trạng tốt nhất.'
  };
  
  // Mock reviews data
  const reviews = [
    {
      id: 1,
      userName: 'Trần Thị B',
      userAvatar: '/api/placeholder/40/40',
      rating: 5,
      date: '2024-01-15',
      comment: 'Xe rất sạch sẽ, chủ xe nhiệt tình. Sẽ thuê lại lần sau!',
      helpful: 12
    },
    {
      id: 2,
      userName: 'Lê Văn C',
      userAvatar: '/api/placeholder/40/40',
      rating: 4,
      date: '2024-01-10',
      comment: 'Xe chạy êm, tiết kiệm xăng. Chủ xe giao nhận đúng giờ.',
      helpful: 8
    },
    {
      id: 3,
      userName: 'Phạm Thị D',
      userAvatar: '/api/placeholder/40/40',
      rating: 5,
      date: '2024-01-05',
      comment: 'Trải nghiệm tuyệt vời! Xe mới, sạch sẽ. Chủ xe rất dễ thương và hỗ trợ tận tình.',
      helpful: 15
    }
  ];
  
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span key={index} className={`star ${index < rating ? 'filled' : ''}`}>
        ⭐
      </span>
    ));
  };
  
  const getVerificationIcon = (isVerified) => {
    return isVerified ? '✅' : '❌';
  };
  
  return (
    <div className="bg-white p-6">
      {/* Section Toggle */}
      <div className="flex bg-white p-1 mb-6">
        <button
          className={`flex-1 py-2 px-4 text-sm font-medium ${
            activeSection === 'owner'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600'
          }`}
          onClick={() => setActiveSection('owner')}
        >
          Thông tin chủ xe
        </button>
        <button
          className={`flex-1 py-2 px-4 text-sm font-medium ${
            activeSection === 'reviews'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600'
          }`}
          onClick={() => setActiveSection('reviews')}
        >
          Đánh giá ({reviews.length})
        </button>
      </div>
      
      {/* Owner Information */}
      {activeSection === 'owner' && (
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="relative">
              <img 
                src={ownerData.avatar} 
                alt={ownerData.name}
                className="w-16 h-16 object-cover bg-white"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 bg-white"></div>
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-gray-800 mb-2">{ownerData.name}</h4>
              <div className="flex items-center gap-2 mb-2">
                {renderStars(Math.floor(ownerData.rating))}
                <span className="text-gray-600">({ownerData.rating})</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="font-medium">{ownerData.totalRentals} chuyến</span>
                <span>•</span>
                <span>Tham gia từ {new Date(ownerData.joinDate).getFullYear()}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4">
            <p className="text-gray-700 leading-relaxed">{ownerData.bio}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">Thời gian phản hồi</div>
              <div className="text-lg font-bold text-blue-600">{ownerData.responseTime}</div>
            </div>
            <div className="bg-white p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">Tỷ lệ chấp nhận</div>
              <div className="text-lg font-bold text-green-600">95%</div>
            </div>
          </div>
          
          <div className="bg-white p-4">
            <h5 className="font-semibold text-gray-800 mb-3">Trạng thái xác minh</h5>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span>{getVerificationIcon(ownerData.verificationStatus.phone)}</span>
                <span className="text-gray-700">Số điện thoại</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>{getVerificationIcon(ownerData.verificationStatus.email)}</span>
                <span className="text-gray-700">Email</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>{getVerificationIcon(ownerData.verificationStatus.identity)}</span>
                <span className="text-gray-700">CMND/CCCD</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>{getVerificationIcon(ownerData.verificationStatus.license)}</span>
                <span className="text-gray-700">Bằng lái xe</span>
              </div>
            </div>
          </div>
          
          <button className="w-full bg-blue-600 text-white font-medium py-3 px-4">
            Liên hệ chủ xe
          </button>
        </div>
      )}
      
      {/* Reviews Section */}
      {activeSection === 'reviews' && (
        <div className="space-y-6">
          <div className="bg-white p-6 text-center">
            <div className="flex items-center justify-center gap-4">
              <span className="text-4xl font-bold text-blue-600">{ownerData.rating}</span>
              <div className="text-left">
                <div className="flex items-center gap-1 mb-1">
                  {renderStars(Math.floor(ownerData.rating))}
                </div>
                <span className="text-gray-600 text-sm">({reviews.length} đánh giá)</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review.id} className="bg-white p-4">
                <div className="flex items-start gap-3 mb-3">
                  <img 
                    src={review.userAvatar} 
                    alt={review.userName}
                    className="w-10 h-10 object-cover"
                  />
                  <div className="flex-1">
                    <h6 className="font-semibold text-gray-800">{review.userName}</h6>
                    <div className="flex items-center gap-2 mb-1">
                      {renderStars(review.rating)}
                      <span className="text-xs text-gray-500">
                        {new Date(review.date).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                </div>
                
                <div className="flex justify-end">
                  <button className="text-sm text-blue-600 flex items-center gap-1">
                    👍 Hữu ích ({review.helpful})
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full bg-white text-gray-700 font-medium py-3 px-4">
            Xem thêm đánh giá
          </button>
        </div>
      )}
    </div>
  );
};

export default OwnerProfile;