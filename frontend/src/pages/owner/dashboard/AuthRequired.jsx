import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { checkAuth } from '../../../redux/features/auth/authSlice.js';
import { MdLogin, MdWarning } from 'react-icons/md';

const AuthRequired = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userId, role, loading, error } = useSelector((state) => state.userStore || {});

  useEffect(() => {
    // Kiểm tra authentication khi component mount
    if (!userId) {
      dispatch(checkAuth());
    }
  }, [dispatch, userId]);

  // Hiển thị loading khi đang kiểm tra auth
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Nếu chưa đăng nhập, hiển thị thông báo yêu cầu đăng nhập
  if (!userId || error) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="flex justify-center mb-4">
            <MdWarning className="h-16 w-16 text-yellow-500" />
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Yêu cầu đăng nhập
          </h2>
          
          <p className="text-gray-600 mb-6">
            Bạn cần đăng nhập để truy cập trang này. Vui lòng đăng nhập với tài khoản owner để tiếp tục.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">
                Lỗi: {error}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => navigate('/renter/auth/login')}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <MdLogin className="h-4 w-4 mr-2" />
              Đăng nhập
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Về trang chủ
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Lưu ý: Bạn cần có tài khoản owner để truy cập dashboard này.
              Nếu bạn là renter, vui lòng sử dụng tài khoản phù hợp.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Kiểm tra role owner
  if (role !== 'owner') {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="flex justify-center mb-4">
            <MdWarning className="h-16 w-16 text-red-500" />
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Không có quyền truy cập
          </h2>
          
          <p className="text-gray-600 mb-6">
            Bạn không có quyền truy cập trang owner dashboard. 
            Chỉ tài khoản owner mới có thể truy cập trang này.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/renter')}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Vào trang Renter
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Về trang chủ
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Hiện tại bạn đang đăng nhập với vai trò: <strong>{role}</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Nếu đã đăng nhập và có role owner, hiển thị children
  return children;
};

export default AuthRequired;
