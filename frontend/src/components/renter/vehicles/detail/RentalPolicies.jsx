import React from 'react';

const RentalPolicies = ({ vehicle }) => {
  if (!vehicle) return null;
  
  const terms = [
    'Người thuê phải từ 18 tuổi trở lên và có bằng lái xe hợp lệ',
    'Không sử dụng xe vào mục đích bất hợp pháp',
    'Không cho người khác thuê lại xe',
    'Trả xe đúng thời gian đã thỏa thuận',
    'Chịu trách nhiệm về các vi phạm giao thông trong thời gian thuê xe',
    'Bồi thường thiệt hại nếu có sự cố xảy ra do lỗi của người thuê'
  ];
  
  const cancellationPolicy = [
    {
      time: 'Trước 24h',
      fee: 'Miễn phí hủy',
      description: 'Hoàn lại 100% số tiền đã thanh toán'
    },
    {
      time: '12-24h trước',
      fee: 'Phí hủy 25%',
      description: 'Hoàn lại 75% số tiền đã thanh toán'
    },
    {
      time: '6-12h trước',
      fee: 'Phí hủy 50%',
      description: 'Hoàn lại 50% số tiền đã thanh toán'
    },
    {
      time: 'Dưới 6h',
      fee: 'Không hoàn tiền',
      description: 'Không hoàn lại số tiền đã thanh toán'
    }
  ];
  
  return (
    <div className="bg-white p-8">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 pb-3">Chính sách & Điều khoản</h3>
      
      {/* Điều khoản thuê xe */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">📋 Điều khoản thuê xe:</h4>
        <ul className="list-none p-0 m-0">
          {terms.map((term, index) => (
            <li key={index} className="flex items-start gap-3 py-2">
              <span className="font-bold text-blue-600 min-w-[20px] text-sm">{index + 1}.</span>
              <span className="text-gray-700">{term}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Chính sách hủy đặt xe */}
      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-4">❌ Chính sách hủy đặt xe:</h4>
        <div className="mb-4">
          {cancellationPolicy.map((policy, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 items-center">
              <div className="font-semibold text-gray-800">{policy.time}</div>
              <div className="text-blue-600 font-semibold">{policy.fee}</div>
              <div className="text-gray-600 text-sm">{policy.description}</div>
            </div>
          ))}
        </div>
        <div className="bg-white p-4 text-sm text-gray-700">
          <strong className="text-blue-800">Lưu ý:</strong> Thời gian tính theo giờ địa phương. 
          Phí hủy sẽ được trừ vào số tiền hoàn lại.
        </div>
      </div>
    </div>
  );
};

export default RentalPolicies;