import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { checkAuth } from "@/redux/features/auth/authSlice";


const ProtectedRoute = ({ children, allowRole }) => {
    const dispatch = useDispatch();
    const { role, loading, userId } = useSelector(state => state.userStore);

    useEffect(() => {
        // If we don't know the user yet, try to check auth from cookie
        if (!userId && !role) {
            dispatch(checkAuth());
        }
    }, [dispatch, userId, role]);

    // Show a simple loader while checking auth to avoid flicker/blank
    if (loading && !role) {
        return (
            <div className="w-full py-20 text-center text-gray-500">Đang kiểm tra phiên đăng nhập...</div>
        );
    }

    const allowed = Array.isArray(allowRole) ? allowRole.includes(role) : role === allowRole;

    if (allowed) {
        return children;
    }

    return <Navigate to="/" replace />;
}

export default ProtectedRoute