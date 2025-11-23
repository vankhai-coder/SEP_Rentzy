import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/config/axiosInstance";

const RentalPolicies = ({ vehicle }) => {
  const terms = [
    "Người thuê phải từ 18 tuổi trở lên và có bằng lái xe hợp lệ",
    "Không sử dụng xe vào mục đích bất hợp pháp",
    "Không cho người khác thuê lại xe",
    "Trả xe đúng thời gian đã thỏa thuận",
    "Chịu trách nhiệm về các vi phạm giao thông trong thời gian thuê xe",
    "Bồi thường thiệt hại nếu có sự cố xảy ra do lỗi của người thuê",
  ];

  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const CODE_TO_LABEL = useMemo(
    () => ({
      CANCEL_WITHIN_HOLD_1H: "Trong vòng 1h sau giữ chỗ",
      CANCEL_BEFORE_7_DAYS: "Trước chuyến đi >7 ngày (Sau 1h giữ chỗ)",
      CANCEL_WITHIN_7_DAYS: "Trong vòng 7 ngày trước chuyến đi (Sau 1h giữ chỗ)",
    }),
    []
  );

  const CODE_ORDER = [
    "CANCEL_WITHIN_HOLD_1H",
    "CANCEL_BEFORE_7_DAYS",
    "CANCEL_WITHIN_7_DAYS",
  ];

  const feeColor = (percent) => {
    if (percent === 0) return "text-green-600";
    if (percent <= 25) return "text-blue-600";
    return "text-orange-600";
  };

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axiosInstance.get(
          "/api/renter/system-settings/cancellation-policy"
        );
        const items = Array.isArray(res.data) ? res.data : [];
        // sort by code order
        const sorted = items.sort(
          (a, b) => CODE_ORDER.indexOf(a.feeCode) - CODE_ORDER.indexOf(b.feeCode)
        );
        setPolicies(sorted);
      } catch (e) {
        console.error(e);
        setError("Không thể tải chính sách hủy từ hệ thống");
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, []);

  // Bảo đảm hooks luôn được gọi trước, sau đó mới điều kiện trả về
  if (!vehicle) return null;
  // Thêm data cho Giấy tờ thuê xe
  const requiredDocuments = [
    {
      icon: (
        <svg
          className="w-6 h-6 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5"
          />
        </svg>
      ),
      title: "GPLX (đối chiếu)",
      description: "Chỉ cần GPLX bản gốc trùng thông tin hệ thống Rentzy",
      required: true,
    },
  ];

  return (
    <div className="bg-white ">
      {/* Giấy tờ thuê xe */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-xl font-semibold text-gray-900">
              Giấy tờ thuê xe
            </h4>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 p-4">
          {requiredDocuments.map((doc, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {doc.title}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    Bắt buộc
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  {doc.description}
                </p>
                <ul className="text-xs text-gray-600 mt-2 space-y-1">
                  <li>• Trùng họ tên với hồ sơ hệ thống</li>
                  <li>• Trùng số GPLX đã khai báo</li>
                  <li>• GPLX còn hiệu lực (chưa hết hạn)</li>
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tài sản thế chấp */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-xl font-semibold text-gray-900">
              Tài sản thế chấp
            </h4>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-gray-900">
              Không yêu cầu thế chấp
            </span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
              Thoải mái
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-3">
            Thuê xe dễ dàng, không cần tiền cọc hoặc tài sản đảm bảo.
          </p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Miễn đặt cọc 100%</li>
            <li>• Không phát sinh chi phí cọc trong mọi trường hợp</li>
            <li>• Quy trình nhận xe nhanh và minh bạch</li>
          </ul>
        </div>
      </div>

      <h3 className="text-2xl font-bold text-gray-800 mb-6 pb-3">
        Chính sách & Điều khoản
      </h3>

      {/* Điều khoản thuê xe */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          📋 Điều khoản thuê xe:
        </h4>
        <ul className="list-none p-0 m-0">
          {terms.map((term, index) => (
            <li key={index} className="flex items-start gap-3 py-2">
              <span className="font-bold text-blue-600 min-w-[20px] text-sm">
                {index + 1}.
              </span>
              <span className="text-gray-700">{term}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Chính sách hủy đặt xe - Dạng bảng */}
      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          ❌ Chính sách hủy chuyến:
        </h4>

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
              {loading && (
                <tr>
                  <td colSpan="4" className="px-4 py-3 text-center text-sm">
                    Đang tải...
                  </td>
                </tr>
              )}
              {error && !loading && (
                <tr>
                  <td colSpan="4" className="px-4 py-3 text-center text-sm text-red-600">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && policies.length > 0 && (
                policies.map((it) => {
                  const percent = Number(it.percent || 0);
                  const refundPercent = Math.max(0, 100 - percent);
                  const feeText = percent === 0 ? "Miễn phí" : `${percent}% giá trị chuyến đi`;
                  const timeText = CODE_TO_LABEL[it.feeCode] || it.name || it.feeCode;
                  return (
                    <tr key={it.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="border border-gray-200 px-4 py-3 font-medium text-gray-800">
                        {timeText}
                      </td>
                      <td className={`border border-gray-200 px-4 py-3`}>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium ${feeColor(percent)}`}
                        >
                          {feeText}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-3">
                        <span
                          className={`font-semibold ${refundPercent >= 80 ? "text-green-600" : refundPercent >= 50 ? "text-blue-600" : "text-orange-600"}`}
                        >
                          {refundPercent}%
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">
                        {it.description || ""}
                      </td>
                    </tr>
                  );
                })
              )}
              {!loading && !error && policies.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-4 py-3 text-center text-sm text-gray-600">
                    Chưa có chính sách hủy từ hệ thống
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Lưu ý */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-blue-800">
              <strong>Lưu ý quan trọng:</strong>
              <ul className="mt-2 space-y-1 text-blue-700">
                <li>• Thời gian tính theo giờ địa phương</li>
                <li>• Phí hủy sẽ được trừ vào số tiền hoàn lại</li>
                <li>• Sau 1h giữ chỗ, chính sách hủy sẽ thay đổi</li>
                <li>• Liên hệ hotline để được hỗ trợ hủy đặt xe</li>
                <li>. Trước 1h nhận xe, không thể hủy chuyến</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalPolicies;
