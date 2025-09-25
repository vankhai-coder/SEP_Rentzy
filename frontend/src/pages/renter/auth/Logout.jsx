import { logoutUser } from '@/redux/features/auth/authSlice'
import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'

const Logout = () => {

    const dispatch = useDispatch()
    useEffect(() => {
        dispatch(logoutUser())
         window.location.href = "/";
    }, [])
    return (


        <div className='text-center'>Logging out...</div>
    )
}

export default Logout