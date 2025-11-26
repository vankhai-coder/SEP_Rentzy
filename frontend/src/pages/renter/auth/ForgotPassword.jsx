import { resetPassword } from "@/redux/features/auth/authSlice";
import { CheckCircle, EyeClosed, EyeIcon, Loader } from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const ForgotPassword = () => {
  // redux : 
  const dispatch = useDispatch()
  const { isLoadingResetPassword, isResetPasswordSuccess, errorResetPassword } = useSelector(state => state.userStore)
  // sua phia tren : 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // eye icon : 
  const [isEyeOpen, setIsEyeOpen] = useState(false)
  const [isEyeOpen2, setIsEyeOpen2] = useState(false)

  // check validate password : 
  const [hasUppercase, setHasUppercase] = useState(false);
  const [hasLowercase, setHasLowercase] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [hasMinLength, setHasMinLength] = useState(false);

  // get query param : 
  const [searchParams] = useSearchParams();
  // get query values
  const email = searchParams.get("email");
  const resetPasswordToken = searchParams.get("resetPasswordToken");

  // navigate : 
  const navigate = useNavigate()

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
    if (errorResetPassword) {
      toast.error(errorResetPassword)
    }
  }, [errorResetPassword])

  // if register success, toast it : 
  useEffect(() => {
    if (isResetPasswordSuccess) {
      toast.success('Đặt lại mật khẩu thành công.Bạn có thể đăng nhập ngay!')
      navigate('/')
    }
  }, [isResetPasswordSuccess])

  const handleResetPassword = async (e) => {
    e.preventDefault();
    // check if confirm password match : 
    if (password !== confirmPassword) {
      toast.error("Nhập lại mật khẩu không chính xác!");
      return;
    }
    // if match , then send register to backend : 
    await dispatch(resetPassword({ password, email, resetPasswordToken }))
  };
  return (
    <div
      className="mt-5 mb-40 flex items-center justify-center"
    >
      <div className="flex items-center justify-center bg-gay-100">
        <div className="w-full p-8 bg-white shadow-2xl">
          <h2 className="mb-6 text-2xl font-bold text-center">Đặt lại mật khẩu</h2>

          <div>
            <div className="mb-1">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type={isEyeOpen ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value.trim())}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
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
              onClick={handleResetPassword}
              disabled={!hasLowercase || !hasNumber || !hasUppercase || !hasMinLength}
              className={`${hasLowercase && hasUppercase && hasMinLength && hasNumber ? "" : 'cursor-not-allowed '} w-full py-2 mb-4 text-white transition duration-200 bg-green-500 rounded-md hover:bg-green-900 font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2`}
            >
              {isLoadingResetPassword ? <Loader className='animate-spin mx-auto' /> : 'Đặt lại mật khẩu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword