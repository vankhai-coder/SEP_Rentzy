import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { checkAuth } from "@/redux/features/auth/authSlice";


const ProtectedRoute = ({ children, allowRole }) => {
    const dispatch = useDispatch();
    const { role, loading, userId, error } = useSelector(state => state.userStore);

    useEffect(() => {
        // Nếu chưa có thông tin user, kiểm tra từ cookie
        if (!userId && !role && !loading) {
            dispatch(checkAuth());
        }
    }, [dispatch, userId, role, loading]);

    // Trong khi đang kiểm tra hoặc chưa xác định vai trò, hiển thị trạng thái chờ
    if (loading || (!userId && !role && !error)) {
        return (
            <div className="w-full py-20 text-center text-gray-500">Đang kiểm tra phiên đăng nhập...</div>
        );
    }

    const allowed = Array.isArray(allowRole) ? allowRole.includes(role) : role === allowRole;

    if (allowed) {
        return children;
    }

    // Nếu yêu cầu role owner nhưng user không phải owner (có thể là renter)
    // và đã đăng nhập, redirect về trang đăng ký làm chủ xe
    if (allowRole === "owner" && userId && role && role !== "owner") {
        return <Navigate to="/register_owner" replace />;
    }

    // Sau khi kiểm tra xong mà không đúng quyền, chuyển về trang chủ
    return <Navigate to="/" replace />;
}

export default ProtectedRoute