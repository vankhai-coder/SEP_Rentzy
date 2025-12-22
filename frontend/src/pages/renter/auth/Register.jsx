import { register } from '@/redux/features/auth/authSlice';
import { CheckCircle, EyeClosed, EyeIcon, Loader } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner'

const Register = ({ setRegisterOpen, setLoginOpen, setIsRegisterWithPhoneOpen }) => {
  // redux : 
  const dispatch = useDispatch()
  const { isLoadingRegister, errorRegister, isRegisterSuccess } = useSelector(state => state.userStore)
  // 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // eye icon : 
  const [isEyeOpen, setIsEyeOpen] = useState(false)
  const [isEyeOpen2, setIsEyeOpen2] = useState(false)

  // check validate password : 
  const [hasUppercase, setHasUppercase] = useState(false);
  const [hasLowercase, setHasLowercase] = useState(false);
  const [hasNumber, setHasNumber] = useState(true);
  const [hasMinLength, setHasMinLength] = useState(false);

  const handlePasswordChange = () => {
    setHasUppercase(/[A-Z]/.test(password));
    setHasLowercase(/[a-z]/.test(password));
    setHasNumber(/[0-9]/.test(password));
    setHasMinLength(password.length >= 8);
  };
  // handle password change :
  useEffect(() => {
    handlePasswordChange()
  }, [password])

  // if error , toast it : 
  useEffect(() => {
    if (errorRegister) {
      toast.error(errorRegister)
    }
  }, [errorRegister])

  // if register success, toast it : 
  useEffect(() => {
    if (isRegisterSuccess) {
      toast.success('Đăng kí thành công. Mở email để xác thực tài khoản!')
      // close register form : 
      setRegisterOpen(false)
    }
  }, [isRegisterSuccess])

  const handleRegister = async (e) => {
    e.preventDefault();
    // check if confirm password match : 
    if (password !== confirmPassword) {
      toast.error("Nhập lại mật khẩu không chính xác!");
      return;
    }
    // if match , then send register to backend : 
    await dispatch(register({ email, password }))
  };

  return (
    <div className="flex items-center justify-center bg-gay-100">
      <div className="w-full max-w-sm p-2 bg-white">
        <h2 className="mb-6 text-2xl font-bold text-center">Đăng Ký</h2>

        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label htmlFor="phoneNumber" className="block mb-2 text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder=""
              required
            />
          </div>

          <div className="mb-1">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={isEyeOpen ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value.trim())}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                onKeyDown={
                  (e) => {
                    handleRegister(e)
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
          {/* validate password :  */}
          <div className='px-6 mb-3'>
            <ul>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className={hasUppercase ? "text-green-900 font-semibold" : "text-gray-400"} />
                <span className={hasUppercase ? "text-green-900 font-semibold" : "text-gray-400"}>Có ít nhất một chữ cái in hoa (A–Z).</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className={hasLowercase ? "text-green-900 font-semibold" : "text-gray-400"} />
                <span className={hasLowercase ? "text-green-900 font-semibold" : "text-gray-400"}>Có ít nhất một chữ cái in thường (a–z).</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className={hasNumber ? "text-green-900 font-semibold" : "text-gray-400"} />
                <span className={hasNumber ? "text-green-900 font-semibold" : "text-gray-400"} >Có ít nhất một chữ số (0–9).</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className={hasMinLength ? "text-green-900 font-semibold" : "text-gray-400"} />
                <span className={hasMinLength ? "text-green-900 font-semibold" : "text-gray-400"}>Độ dài tối thiểu 8 ký tự.</span>
              </li>
            </ul>
          </div>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Nhập lại mật khẩu
            </label>
            <div className="relative">
              <input
                type={isEyeOpen2 ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value.trim())}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                {isEyeOpen2 ?
                  <EyeIcon
                    onClick={() => {
                      setIsEyeOpen2(!isEyeOpen2)
                    }}
                  />
                  :
                  <EyeClosed
                    onClick={() => {
                      setIsEyeOpen2(!isEyeOpen2)
                    }}
                  />
                }
              </span>
            </div>
          </div>
          <button
            type="submit"
            disabled={!hasLowercase || !hasNumber || !hasUppercase || !hasMinLength}
            className={`${hasLowercase && hasUppercase && hasMinLength && hasNumber ? "" : 'cursor-not-allowed '} w-full py-2 mb-4 text-white transition duration-200 bg-green-500 rounded-md hover:bg-green-900 font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2`}
          >
            {isLoadingRegister ? <Loader className='animate-spin mx-auto' /> : 'Đăng ký'}
          </button>
        </form>

        <p className="mb-4 text-center text-gray-600">
          Đã có tài khoàn?{' '}
          <button
            className=" text-green-500 hover:text-green-900 font-semibold"
            onClick={() => {
              setRegisterOpen(false)
              setLoginOpen(true)
            }}

          >
            Đăng nhập ngay
          </button>
        </p>

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

        {/* register with phone number */}
        <div className="flex flex-col gap-4 space-x-4">
          <button
            className="mt-4 w-full py-2 mb-4 text-gray-700 transition duration-200 bg-white border border-gray-300 rounded-md hover:bg-gray-50 font-semibold focus:outline-none focus:ring-2 focus:ring-gray-500"
            onClick={() => {
              setRegisterOpen(false);
              setLoginOpen(false);
              setIsRegisterWithPhoneOpen(true);
            }}
          >
            Đăng ký bằng số điện thoại
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;