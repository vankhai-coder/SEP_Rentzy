import { useSelector } from "react-redux"
import { Navigate } from "react-router-dom";


const ProtectedRoute = ({ children, allowRole }) => {

    const { role } = useSelector(state => state.userStore)

    const allowed = Array.isArray(allowRole) ? allowRole.includes(role) : role === allowRole

    if (allowed) {
        return children
    } else {
        return <Navigate to="/" replace />;
    }
}

export default ProtectedRoute