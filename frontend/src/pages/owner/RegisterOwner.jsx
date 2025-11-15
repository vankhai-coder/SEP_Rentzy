import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";


import React, { useEffect } from "react";

const RegisterOwner = () => {
  const { role, userId } = useSelector((state) => state.userStore);
  const navigate = useNavigate();

  // Removed auto-redirect for owner to allow manual navigation

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <h1 className="text-2xl font-bold mb-2">Đăng ký làm chủ xe</h1>
          <p className="text-gray-600 mb-6">
            Bạn chưa phải là chủ xe. Hãy gửi yêu cầu đăng ký để có thể đăng xe,
            quản lý đơn thuê và doanh thu tại Rentzy.
          </p>

          <div className="space-y-4">
            {!userId ? (
              <>
                <p className="text-gray-700">
                  Vui lòng đăng nhập trước khi thực hiện đăng ký.
                </p>
                <button
                  onClick={() => navigate("/renter/auth/login")}
                  className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Đăng nhập
                </button>
              </>
            ) : (
              <>
                <ul className="list-disc pl-6 text-gray-700">
                  <li>Cập nhật đầy đủ thông tin cá nhân và tài khoản ngân hàng.</li>
                  <li>Chuẩn bị giấy tờ xe và bằng lái hợp lệ.</li>
                  <li>Gửi yêu cầu xác thực để chuyển sang vai trò chủ xe.</li>
                </ul>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => navigate("/account")}
                    className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Về trang tài khoản
                  </button>
                  <button
                    onClick={() => navigate("/" )}
                    className="px-5 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Về trang chủ
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-6">
                  Lưu ý: Sau khi gửi yêu cầu, hệ thống sẽ xử lý và Admin sẽ xem xét phê duyệt.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterOwner;