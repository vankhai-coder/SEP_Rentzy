import { useSelector } from "react-redux"
import { Navigate } from "react-router-dom";


const ProtectedRoute = ({ children, allowRole }) => {

    const { role } = useSelector(state => state.userStore)

    if (role === allowRole) {
        return children
    } else {
        return <Navigate to="/login" replace />;
    }
}

export default ProtectedRoute