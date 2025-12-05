import { logoutUser } from '@/redux/features/auth/authSlice'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

const Logout = () => {

    const navigate = useNavigate()
    const dispatch = useDispatch()

    const { loading } = useSelector((state) => state.userStore)

    useEffect(() => {
        // Xóa dark mode khi logout
        localStorage.removeItem('theme');
        document.documentElement.classList.remove('dark');
        
        dispatch(logoutUser())
        navigate("/")
    }, [dispatch, navigate])

    if (loading) {
        return (
            <div className='text-center'>Logging out...</div>
        )
    }
    return (
        <div className='text-center'>Logging out...</div>
    )
}

export default Logout