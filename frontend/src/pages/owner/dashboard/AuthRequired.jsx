import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Navigate } from 'react-router-dom';
import { checkAuth } from '../../../redux/features/auth/authSlice.js';

const AuthRequired = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userId, role, loading, error } = useSelector((state) => state.userStore || {});

  useEffect(() => {
    console.log('AuthRequired: Component mounted, userId:', userId, 'role:', role, 'loading:', loading);
    // Kiểm tra authentication khi component mount
    if (!userId && !loading) {
      dispatch(checkAuth());
    }
  }, [dispatch, userId, loading]);

  // Kiểm tra role owner TRƯỚC khi render - nếu không phải owner và đã đăng nhập, redirect ngay
  useEffect(() => {
    if (userId && role && role !== 'owner' && !loading) {
      console.log('AuthRequired: Redirecting renter to register_owner');
      navigate('/register_owner', { replace: true });
    }
  }, [userId, role, loading, navigate]);

  // Nếu không phải owner và đã đăng nhập, redirect về trang đăng ký
  if (userId && role && role !== 'owner') {
    console.log('AuthRequired: User is not owner, redirecting');
    return <Navigate to="/register_owner" replace />;
  }

  // Vì ProtectedRoute đã kiểm tra role ở level trên, nên nếu đến đây thì user là owner
  // Hoặc đang trong quá trình load, cho phép render children
  // Nếu chưa đăng nhập, ProtectedRoute sẽ xử lý
  console.log('AuthRequired: Rendering children');
  return children;
};

export default AuthRequired;
