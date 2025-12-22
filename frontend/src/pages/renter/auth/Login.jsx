import { Button } from '@/components/ui/button';
import { loginUser, requestResetPassword, requestVerifyEmail, resetState } from '@/redux/features/auth/authSlice';
import { EyeClosed, EyeIcon, Loader, Loader2Icon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';

const Login = ({ setRegisterOpen, setLoginOpen, setIsLoginWithPhoneOpen }) => {
  // redux : 
  const { isLoadingLogin, isNotVerifyEmailError, isLoginSuccess, errorLogin,
    isLoadingRequest, isRequestSuccess, errorRequest,
    isLoadingRequestReset, isRequestResetSuccess, errorRequestReset,
  } = useSelector(state => state.userStore)

  // get role from redux :
  const { role } = useSelector(state => state.userStore)

  const dispatch = useDispatch()

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // state for send request reset password button : 
  const [isRequestResetPasswordButtonOpen, setIsRequestResetPasswordButtonOpen] = useState(false)

  const [isEyeOpen, setIsEyeOpen] = useState(false)

  // if errro , toast it : 
  useEffect(() => {
    if (errorLogin) {
      toast.error(errorLogin)
    }
  }, [errorLogin])

  useEffect(() => {
    if (errorRequest) {
      toast.error(errorRequest)
    }
  }, [errorRequest])

  useEffect(() => {
    if (errorRequestReset) {
      toast.error(errorRequestReset)
    }
  }, [errorRequestReset])

  // if login success , toast it : 
  useEffect(() => {
    if (isLoginSuccess) {
      toast.success('Đăng nhập thành công!')
      dispatch(resetState())
      // close login modal :
      setLoginOpen(false)

      if (role === 'admin') {
        // redirect to /admin
        window.location.href = '/admin'
      }
    }
  }, [isLoginSuccess, dispatch])

  // if request to create veirfy email link success , toast it : 
  useEffect(() => {
    if (isRequestSuccess) {
      toast.success('Mở email để xác nhận tài khoản!')
    }
  }, [isRequestSuccess])

  // if request to create reeset password success : 
  useEffect(() => {
    if (isRequestResetSuccess) {
      toast.success('Mở email để đặt lại mật khẩu!')
    }
  }, [isRequestResetSuccess])

  // reset state if unmounted : 
  useEffect(() => {
    return () => {
      dispatch(resetState())
    }
  }, [dispatch])

  const handleLogin = (e) => {
    e.preventDefault();
    // Handle login logic here
    dispatch(loginUser({ email, password }))
  };

  return (
    <div className="flex items-center justify-center bg-gay-100">
      <div className="w-full max-w-sm p-8 bg-white">
        <h2 className="mb-6 text-2xl font-bold text-center">Đăng nhập</h2>

        <div>
          <div className="mb-4">
            <label htmlFor="phoneNumber" className="block mb-2 text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="phoneNumber"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder=""
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={isEyeOpen ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder=""
                required
                onKeyDown={
                  (e) => {
                    console.log('enter pressed')
                    handleLogin(e)
                  }
                }
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                {isEyeOpen ?
                  <EyeIcon
                    onClick={() => {
                      setIsEyeOpen(!isEyeOpen)
                    }}
                  />
                  :
                  <EyeClosed
                    onClick={() => {
                      setIsEyeOpen(!isEyeOpen)
                    }}
                  />
                }
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end mb-6">
            <a
              onClick={() => {
                setIsRequestResetPasswordButtonOpen(!isRequestResetPasswordButtonOpen)
              }}
              className="text-sm hover:cursor-pointer font-medium text-green-500 hover:text-green-600">
              Quên mật khẩu?
            </a>
            {/* request reset password buton :  */}
            {isRequestResetPasswordButtonOpen &&
              <Button
                variant={'outline'}
                disabled={isLoadingRequestReset}
                className='w-full mt-2'
                onClick={async () => {
                  if (email) {
                    await dispatch(requestResetPassword(email))
                  } else {
                    toast.error('Nhập email để gửi!')
                  }
                }}
              >
                {isLoadingRequestReset ? <Loader className='animate-spin mx-auto' /> : 'Gửi link đặt lại mật khẩu!'}
              </Button>
            }
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoadingLogin}
            className="w-full py-2 mb-4 font-bold text-white transition duration-200 bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            {isLoadingLogin ? <Loader className='animate-spin mx-auto' /> : ' Đăng nhập'}
          </button>
        </div>

        <p className="mb-4 text-center text-gray-600">
          Bạn chưa là thành viên?{' '}
          <button
            onClick={() => {
              setRegisterOpen(true)
              setLoginOpen(false)
            }}
            className="font-medium text-green-500 hover:text-green-600">
            Đăng ký ngay
          </button>
        </p>

        <div className="flex space-x-4">

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

        {/* button for login with phone number */}
        <Button
          className={'w-full mt-3'}
          variant={'outline'}
          onClick={() => {
            setLoginOpen(false);
            setIsLoginWithPhoneOpen(true);
          }}
        >
          Đăng nhập bằng số điện thoại
        </Button>

        {/* button for send request create veriyf email : */}
        {isNotVerifyEmailError &&
          <Button
            className={'w-full mt-3'}
            disabled={isRequestSuccess}
            onClick={() => {
              if (email) {
                dispatch(requestVerifyEmail(email))
              } else {
                return
              }
            }}
          >
            {isLoadingRequest ? <Loader2Icon className='animate-spin' /> : (isRequestSuccess ? 'Open your email to verify!' : `Send verify link to ${email}`)}
          </Button>
        }
      </div>
    </div>
  );
};

export default Login;