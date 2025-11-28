import { Button } from '@/components/ui/button';
import { checkAuth, registerWithPhoneNumber, resetState, verifyPhoneNumber } from '@/redux/features/auth/authSlice';
import { Loader } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner'

const RegisterWithPhoneNumber = ({ setIsRegisterWithPhoneOpen, setIsLoginWithPhoneOpen, setRegisterOpen }) => {

    // redux : 
    const dispatch = useDispatch()

    const { isLoadingRegisterPhone, isRegisterPhoneSuccess, errorRegisterPhone
        , errorVerifyPhone, isLoadingVerifyPhone, isVerifyPhoneSuccess
    } = useSelector(state => state.userStore)

    // navigate :
    const navigate = useNavigate();




    // state for phone number and OTP :
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');

    // function to handle register with phone number :
    const handleRegisterWithPhoneNumber = (e) => {
        e.preventDefault();

        // log : 
        console.log("Registering with phone number:", phoneNumber);

        // check phone is start with 0 and has 10 or 11 digits :
        if (!/^0\d{9,10}$/.test(phoneNumber)) {
            toast.error('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại bắt đầu bằng 0 và có 10 hoặc 11 chữ số.');
            return;
        }

        // dispatch register with phone number action 
        dispatch(registerWithPhoneNumber({ phoneNumber }));
    }

    // function to handle verify OTP :
    const handleVerifyOtp = (e) => {
        e.preventDefault();

        // log : 
        console.log("Verifying OTP for phone number:", phoneNumber, "with OTP:", otp);

        // check phone is start with 0 and has 10 or 11 digits :
        if (!/^0\d{9,10}$/.test(phoneNumber)) {
            toast.error('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại bắt đầu bằng 0 và có 10 hoặc 11 chữ số.');
            return;
        }

        // validate OTP is 6 digits :
        if (!/^\d{6}$/.test(otp)) {
            toast.error('Mã OTP không hợp lệ. Vui lòng nhập mã OTP gồm 6 chữ số.');
            return;
        }

        // dispatch verify phone number action
        dispatch(verifyPhoneNumber({ phoneNumber, otp }));
    }

    // function to format phone like : 0123 456 789 , number fifth is space
    const formatPhoneNumber = (phone) => {
        return phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
    }





    // toast error if errorRegister changes :
    useEffect(() => {
        if (errorRegisterPhone) {
            toast.error(errorRegisterPhone)
        }
    }, [errorRegisterPhone, dispatch])

    // toast error if errorVerifyPhoneNumber changes :
    useEffect(() => {
        if (errorVerifyPhone) {
            toast.error(errorVerifyPhone)
        }
    }, [errorVerifyPhone, dispatch])

    // toast success if isRegisterPhoneSuccess changes :
    useEffect(() => {
        if (isRegisterPhoneSuccess) {
            toast.success('Vui lòng kiểm tra tin nhắn SMS để lấy mã OTP.');
        }
    }, [isRegisterPhoneSuccess, dispatch])

    // tost success if phone number is verified successfully :
    useEffect(() => {
        if (isVerifyPhoneSuccess) {
            toast.success('Xác minh số điện thoại thành công!');
            // clear state
            dispatch(resetState());
            // close login with phone dialog : 
            setIsRegisterWithPhoneOpen(false)
            // dispatch checkauth : 
            dispatch(checkAuth())
            // navigate to login page
            navigate('/');
        }
    }, [isVerifyPhoneSuccess, dispatch, navigate, setIsRegisterWithPhoneOpen])








    return (
        <div className="flex items-center justify-center bg-gay-100" >
            <div className="w-full max-w-sm p-8 bg-white">
                <h2 className="mb-6 text-2xl font-bold text-center">Đăng Ký</h2>

                <form>

                    {/* phone number input :  */}
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
                            placeholder="Nhập sdt theo định dạng 0123 456 789"
                            required
                        />
                    </div>
                    {/* OTP input :  */}
                    <div className={`mb-1 ${isRegisterPhoneSuccess ? 'block' : 'hidden'}`}>
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

                    {/* Send OTP button */}
                    <button
                        type="submit"
                        onClick={handleRegisterWithPhoneNumber}
                        className={`${isRegisterPhoneSuccess ? 'hidden' : 'my-4 w-full px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500'}`}
                    >
                        {isLoadingRegisterPhone ? <Loader className="size-6 mx-auto animate-spin" /> : 'Gửi mã OTP'}
                    </button>

                    {/* Verify OTP button */}

                    <button
                        type="submit"
                        onClick={handleVerifyOtp}
                        className={`${isRegisterPhoneSuccess ? 'block' : 'hidden'} my-4 w-full px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500`}
                    >
                        {isLoadingVerifyPhone ? <Loader className="size-6 mx-auto animate-spin" /> : 'Xác minh mã OTP'}
                    </button>

                    {/* Resend OTP button */}
                    <button
                        type="submit"
                        onClick={handleRegisterWithPhoneNumber}
                        className={`${errorVerifyPhone ? 'block' : 'hidden'} my-4 w-full px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500`}
                    >
                        {isLoadingRegisterPhone ? <Loader className="size-6 mx-auto animate-spin" /> : 'Gửi lại mã OTP'}
                    </button>

                </form>

                <p className="mb-4 text-center text-gray-600">
                    Đã có tài khoàn?{' '}
                    <button
                        className=" text-green-500 hover:text-green-900 font-semibold"
                        onClick={() => {
                            setIsRegisterWithPhoneOpen(false);
                            setIsLoginWithPhoneOpen(true);
                        }}

                    >
                        Đăng nhập ngay bằng số điện thoại
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
                            setIsRegisterWithPhoneOpen(false);
                            setRegisterOpen(true);
                        }}
                    >
                        Đăng ký bằng email
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RegisterWithPhoneNumber;