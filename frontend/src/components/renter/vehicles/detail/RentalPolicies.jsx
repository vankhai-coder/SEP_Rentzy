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
      time: 'Trong vòng 1h sau giữ chỗ',
      fee: 'Miễn phí',
      refund: '100%',
      description: 'Hoàn lại 100% số tiền đã thanh toán',
      color: 'text-green-600 '
    },
    {
      time: 'Trước chuyến đi >7 ngày (Sau 1h giữ chỗ)',
      fee: '20% giá trị chuyến đi',
      refund: '80%',
      description: 'Hoàn lại 80% số tiền đã thanh toán',
      color: 'text-blue-600 '
    },
    {
      time: 'Trong vòng 7 ngày trước chuyến đi (Sau 1h giữ chỗ)',
      fee: '50% giá trị chuyến đi',
      refund: '50%',
      description: 'Hoàn lại 50% số tiền đã thanh toán',
      color: 'text-orange-600 '
    }
  ];
   // Thêm data cho Giấy tờ thuê xe
  const requiredDocuments = [
    {
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
        </svg>
      ),
      title: 'GPLX (đối chiếu)',
      description: 'Giấy phép lái xe hạng B1 trở lên còn hiệu lực',
      required: true
    }
  ];
  
  return (
    <div className="bg-white ">
       
      {/* Giấy tờ thuê xe */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center shadow-sm">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xl font-semibold text-gray-900 mb-1">Giấy tờ thuê xe</h4>
            <p className="text-sm text-gray-500">Tài liệu cần thiết để thuê xe</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
          {requiredDocuments.map((doc, index) => (
            <div key={index} className="flex items-start gap-5">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-blue-100 flex-shrink-0">
                {doc.icon}
              </div>
              <div className="flex-1 pt-2">
                <div className="flex items-center gap-3 mb-2">
                  <h5 className="text-lg font-semibold text-gray-900">{doc.title}</h5>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    Bắt buộc
                  </span>
                </div>
                <p className="text-gray-600 leading-relaxed">{doc.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tài sản thế chấp */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl flex items-center justify-center shadow-sm">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xl font-semibold text-gray-900 mb-1">Tài sản thế chấp</h4>
            <p className="text-sm text-gray-500">Chính sách về tài sản đảm bảo</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-8 border border-emerald-100 shadow-sm">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-emerald-100 flex-shrink-0">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1 pt-3">
              <div className="flex items-center gap-3 mb-3">
                <h5 className="text-lg font-semibold text-gray-900">Không yêu cầu thế chấp</h5>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                  Miễn phí
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed mb-4">
                Bạn không cần thế chấp tiền mặt hoặc xe máy khi thuê xe tại Rentzy.
              </p>
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Thuê xe dễ dàng, không rắc rối</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      
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
      
      {/* Chính sách hủy đặt xe - Dạng bảng */}
      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-4">❌ Chính sách hủy chuyến:</h4>
        
        {/* Bảng chính sách hủy */}
        <div className="overflow-x-auto mb-4 border border-gray-200 rounded-lg">
          <table className="w-full border-collapse bg-white rounded-lg shadow-sm border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-800">
                  Thời điểm hủy chuyến
                </th>
                <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-800">
                  Phí hủy chuyến
                </th>
                <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-800">
                  Số tiền hoàn lại
                </th>
                <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-800">
                  Mô tả
                </th>
              </tr>
            </thead>
            <tbody>
              {cancellationPolicy.map((policy, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="border border-gray-200 px-4 py-3 font-medium text-gray-800">
                    {policy.time}
                  </td>
                  <td className={`border border-gray-200 px-4 py-3`}>
                    <span className={`inline-flex items-center px-2.5 py-0.5  text-xs font-medium ${policy.color}`}>
                      {policy.fee}
                    </span>
                  </td>
                  <td className="border border-gray-200 px-4 py-3">
                    <span className={`font-semibold ${
                      policy.refund === '100%' ? 'text-green-600' :
                      policy.refund === '80%' ? 'text-blue-600' :
                      'text-orange-600'
                    }`}>
                      {policy.refund}
                    </span>
                  </td>
                  <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">
                    {policy.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Lưu ý */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-blue-800">
              <strong>Lưu ý quan trọng:</strong>
              <ul className="mt-2 space-y-1 text-blue-700">
                <li>• Thời gian tính theo giờ địa phương</li>
                <li>• Phí hủy sẽ được trừ vào số tiền hoàn lại</li>
                <li>• Thời gian hoàn tiền: 3-5 ngày làm việc</li>
                <li>• Sau 1h giữ chỗ, chính sách hủy sẽ thay đổi</li>
                <li>• Liên hệ hotline để được hỗ trợ hủy đặt xe</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalPolicies;