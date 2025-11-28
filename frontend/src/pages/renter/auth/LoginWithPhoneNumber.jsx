import { Button } from '@/components/ui/button';
import { checkAuth, loginWithPhoneNumber, requestLoginWithPhoneNumber, resetState } from '@/redux/features/auth/authSlice';
import { Loader } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner'

const LoginWithPhoneNumber = ({ setIsRegisterWithPhoneOpen, setIsLoginWithPhoneOpen, setLoginOpen }) => {
    // redux : 
    const dispatch = useDispatch()
    const { errorRequestLoginPhone, isRequestLoginPhoneSuccess, isLoadingRequestLoginPhone,

        isLoginPhoneSuccess, errorLoginPhone, isLoadingLoginPhone

    } = useSelector(state => state.userStore)

    // navigate :
    const navigate = useNavigate()



    // state for phone number and OTP :
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');

    // function to handle sending OTP :
    const handleSendOtp = (e) => {
        e.preventDefault();

        // validate phone number in Viet Nam format: 
        if (!/^0\d{9}$/.test(phoneNumber)) {
            toast.error('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam bắt đầu bằng 0 và có 10 chữ số.');
            return;
        }

        // dispatch action to send OTP to the phone number
        dispatch(requestLoginWithPhoneNumber({ phoneNumber }))
    };

    // function to handle login with phone number and OTP :
    const handleLoginWithPhoneNumber = (e) => {
        e.preventDefault();
        // validate phone number in Viet Nam format: 
        if (!/^0\d{9}$/.test(phoneNumber)) {
            toast.error('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam bắt đầu bằng 0 và có 10 chữ số.');
            return;
        }
        // validate OTP is 6 digits :
        if (!/^\d{6}$/.test(otp)) {
            toast.error('Mã OTP không hợp lệ. Vui lòng nhập mã OTP gồm 6 chữ số.');
            return;
        }
        // dispatch action to login with phone number and OTP
        dispatch(loginWithPhoneNumber({ phoneNumber, otp }))
    };

     // function to format phone like : 0123 456 789 , number fifth is space
    const formatPhoneNumber = (phone) => {
        return phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
    }






    // Toast if any error or success :
    useEffect(() => {
        if (errorRequestLoginPhone) {
            toast.error(errorRequestLoginPhone)
        }
    }, [errorRequestLoginPhone])
    useEffect(() => {
        if (isRequestLoginPhoneSuccess) {
            toast.success('Đã gửi mã OTP đến số điện thoại của bạn')
        }
    }, [isRequestLoginPhoneSuccess])
    useEffect(() => {
        if (errorLoginPhone) {
            toast.error(errorLoginPhone)
        }
    }, [errorLoginPhone])
    useEffect(() => {
        if (isLoginPhoneSuccess) {
            toast.success('Đăng nhập thành công')
            // clear state if needed
            dispatch(resetState())
            // close login with phone dialog :
            setIsLoginWithPhoneOpen(false)
            navigate('/')
            // dispatch checkAuth : 
            dispatch(checkAuth())
        }
    }, [isLoginPhoneSuccess, setIsLoginWithPhoneOpen, dispatch, navigate])



    return (
        <div className="flex items-center justify-center bg-gay-100" >
            <div className="w-full max-w-sm p-8 bg-white">
                <h2 className="mb-6 font-bold text-2xl text-center">Đăng Nhập</h2>

                <form>

                    {/* Phone Number Input */}
                    <div className="mb-4">
                        <label htmlFor="phoneNumber" className="block mb-2 text-sm font-medium text-gray-700">
                            Số điện thoại
                        </label>
                        <input
                            type="text"
                            id="phoneNumber"
                            value={formatPhoneNumber(phoneNumber)}
                            onChange={(e) => { setPhoneNumber(e.target.value) }}
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Nhập sđt theo định dạng 0123 456 789"
                            required
                        />
                    </div>

                    {/* OTP Input */}
                    <div className={`${isRequestLoginPhoneSuccess ? 'block' : 'hidden'} mb-4`}>
                        <label className="block mb-2 text-sm font-medium text-gray-700">
                            Mã OTP
                        </label>
                        <div className="relative">
                            <input
                                value={otp}
                                onChange={(e) => { setOtp(e.target.value) }}
                                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                                placeholder='Nhập mã OTP'
                            />
                        </div>
                    </div>

                    {/* Send OTP Button */}
                    <Button
                        type="submit"
                        onClick={handleSendOtp}
                        className={`${isRequestLoginPhoneSuccess ? 'hidden' : 'block'}  my-2 w-full px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500`}
                    >
                        {isLoadingRequestLoginPhone ? <Loader className="size-6 mx-auto animate-spin" /> : 'Gửi mã OTP'}
                    </Button>

                    {/* Login Button */}
                    <Button
                        type="submit"
                        onClick={handleLoginWithPhoneNumber}
                        className={`${isRequestLoginPhoneSuccess ? 'block' : 'hidden'} my-2 w-full px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500`}
                    >
                        {isLoadingLoginPhone ? <Loader className="size-6 mx-auto animate-spin" /> : 'Đăng nhập'}
                    </Button>

                    {/* Resend OTP */}
                    <Button
                        type="submit"
                        onClick={handleSendOtp}
                        className={`${errorLoginPhone ? 'block' : 'hidden'} my-2 w-full px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500`}
                    >
                        {isLoadingRequestLoginPhone ? <Loader className="size-6 mx-auto animate-spin" /> : 'Gửi lại mã OTP'}
                    </Button>

                </form>

                <p className="mb-4 text-center text-gray-600">
                    Chưa có tài khoàn?{' '}
                    <button
                        className=" text-green-500 hover:text-green-900 font-semibold"
                        onClick={() => {
                            setIsRegisterWithPhoneOpen(true)
                            setIsLoginWithPhoneOpen(false)
                        }}

                    >
                        Đăng ký ngay bằng số điện thoại
                    </button>
                </p>

                {/* login with google */}
                <div className="flex flex-col gap-4 space-x-4">

                    <a
                        className="flex items-center justify-center hover:cursor-pointer w-full px-4 py-2 text-gray-700 transition duration-200 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        href={`${import.meta.env.VITE_API_URL}/api/auth/google`}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5 mr-2"
                            viewBox="0 0 24 24"
                        >
                            <path
                                fill="#4285F4"
                                d="M23.49 12.27c0-.79-.07-1.54-.21-2.27H12v4.3h6.45c-.28 1.48-1.12 2.73-2.37 3.57v2.96h3.83c2.24-2.06 3.58-5.1 3.58-8.56z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.83-2.96c-1.06.71-2.41 1.14-4.1 1.14-3.15 0-5.82-2.13-6.77-4.99H2.24v3.09C4.21 21.53 7.83 24 12 24z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.23 14.28c-.25-.71-.39-1.47-.39-2.28s.14-1.57.39-2.28V6.63H2.24A11.96 11.96 0 0 0 0 12c0 1.93.46 3.75 1.24 5.37l3.99-3.09z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.07 15.24 0 12 0 7.83 0 4.21 2.47 2.24 6.63l3.99 3.09c.95-2.86 3.62-4.97 6.77-4.97z"
                            />
                        </svg>

                        Google
                    </a>
                </div>

                {/* register with email button */}
                <div className="flex flex-col gap-4 space-x-4">
                    <Button
                        className="mt-4"
                        variant={'outline'}
                        onClick={() => {
                            setIsLoginWithPhoneOpen(false);
                            setLoginOpen(true);
                        }}
                    >
                        Đăng nhập bằng email
                    </Button>
                </div>
            </div>

        </div>
    );
};

export default LoginWithPhoneNumber;