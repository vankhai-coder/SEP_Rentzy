import axiosInstance from "@/config/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, EyeClosed, EyeIcon, Loader } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react";

const ResetPassword = () => {

  const navigate = useNavigate();
  // check if user if logged in
  const { userId } = useSelector((state) => state.userStore);
  // use useQuery from tank stack to check if user auth method is email : /api/auth/is-auth-method-email using axiosInstance
  const checkIfUserAuthMethodIsEmail = async () => {
    try {
      const response = await axiosInstance.get("/api/auth/is-auth-method-email");
      return response.data.isEmailAuth;
    } catch (error) {
      console.error("Error checking user auth method:", error);
      return false;
    }
  };
  const { data: isEmailAuth, isLoading: isLoadingCheckIfUserAuthMethodIsEmail,
    isError: isErrorCheckIfUserAuthMethodIsEmail } = useQuery({
      queryKey: ["isUserAuthMethodEmail", userId],
      queryFn: checkIfUserAuthMethodIsEmail,
      enabled: !!userId, // only run this query if userId exists
    });

  // state for isLoadingChangePassword :
  const [isLoadingChangePassword, setIsLoadingChangePassword] = useState(false);

  // state for old password :
  const [oldPassword, setOldPassword] = useState('');
  const [isEyeOpenForOldPassword, setIsEyeOpenForOldPassword] = useState(false)
  // state for new password :
  const [newPassword, setNewPassword] = useState('');
  const [isEyeOpenForNewPassword, setIsEyeOpenForNewPassword] = useState(false)
  // // state for confirm new password :
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isEyeOpenForConfirmNewPassword, setIsEyeOpenForConfirmNewPassword] = useState(false)

  // state for check validate new password : 
  const [hasUppercase, setHasUppercase] = useState(false);
  const [hasLowercase, setHasLowercase] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [hasMinLength, setHasMinLength] = useState(false);

  const handlePasswordChange = () => {
    setHasUppercase(/[A-Z]/.test(newPassword));
    setHasLowercase(/[a-z]/.test(newPassword));
    setHasNumber(/[0-9]/.test(newPassword));
    setHasMinLength(newPassword.length >= 8);
  };
  // handle password change :
  useEffect(() => {
    handlePasswordChange()
  }, [newPassword])

  // funtion to handle reset password :
  const handleResetPassword = async (e) => {
    e.preventDefault();
    // check if new password match confirm new password : 
    if (newPassword !== confirmNewPassword) {
      toast.error("Xác nhận mật khẩu mới không khớp!");
      return;
    }
    // check if new password is valid : 
    if (!hasUppercase || !hasLowercase || !hasNumber || !hasMinLength) {
      toast.error("Mật khẩu mới không hợp lệ! Vui lòng kiểm tra lại.");
      return;
    }
    try {
      setIsLoadingChangePassword(true);
      // send reset password request to backend :
      const response = await axiosInstance.post('/api/auth/change-password-for-email-auth-user', {
        oldPassword,
        newPassword
      });
      if (response.data.success) {
        toast.success("Đổi mật khẩu thành công!");
        // clear input fields :
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        toast.error(response.data.message || "Đã xảy ra lỗi khi đổi mật khẩu.");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error(error.response?.data?.message || "Đã xảy ra lỗi khi đổi mật khẩu.");
    } finally {
      setIsLoadingChangePassword(false);
    }
  };


  if (!isEmailAuth && !isLoadingCheckIfUserAuthMethodIsEmail) {
    toast.error("Chức năng này chỉ khả dụng cho người dùng đăng nhập bằng email và mật khẩu.");
    navigate("/account");
    return null;
  }

  if (isLoadingCheckIfUserAuthMethodIsEmail) {
    return <div className="flex items-center justify-center">
      <Loader className="animate-spin h-6 w-6 text-gray-600" />
    </div>;
  }

  if (isErrorCheckIfUserAuthMethodIsEmail) {
    toast.error("Đã xảy ra lỗi khi kiểm tra phương thức xác thực của người dùng.");
    navigate("/account");
    return null;
  }

  return (

    <div className="flex items-center justify-center">

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Đổi mật khẩu mới</CardTitle>
          <CardDescription>
            Nhập mật khẩu cũ và mật khẩu mới của bạn để đặt lại mật khẩu.
          </CardDescription>
          <CardAction>
            <Button variant="link">Đổi mật khẩu</Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="oldPassword">Mật khẩu cũ</Label>
              <div className="flex gap-3 items-center">
                <Input
                  id="oldPassword"
                  placeholder="Mật khẩu cũ"
                  type={isEyeOpenForOldPassword ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value.trim())}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <span className="">
                  {isEyeOpenForOldPassword ?
                    <EyeIcon
                      onClick={() => {
                        setIsEyeOpenForOldPassword(!isEyeOpenForOldPassword)
                      }}
                    />
                    :
                    <EyeClosed
                      onClick={() => {
                        setIsEyeOpenForOldPassword(!isEyeOpenForOldPassword)
                      }}
                    />
                  }
                </span>
              </div>
            </div>
            {/* new password */}
            <div className="grid gap-2">
              <Label htmlFor="newPassword">Mật khẩu mới</Label>
              <div className="flex gap-3">
                <Input
                  id="newPassword"
                  type={isEyeOpenForNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value.trim())}
                  placeholder="Mật khẩu mới"
                  required
                />
                <span className="">
                  {isEyeOpenForNewPassword ?
                    <EyeIcon
                      onClick={() => {
                        setIsEyeOpenForNewPassword(!isEyeOpenForNewPassword)
                      }}
                    />
                    :
                    <EyeClosed
                      onClick={() => {
                        setIsEyeOpenForNewPassword(!isEyeOpenForNewPassword)
                      }}
                    />
                  }
                </span>
              </div>
              {/* check validate :  */}
              <div className=''>
                <ul>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className={hasUppercase ? "text-green-500 font-semibold" : "text-gray-400"} />
                    <span className={hasUppercase ? "text-green-500 font-semibold" : "text-gray-400"}>Có ít nhất một chữ cái in hoa (A–Z).</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className={hasLowercase ? "text-green-500 font-semibold" : "text-gray-400"} />
                    <span className={hasLowercase ? "text-green-500 font-semibold" : "text-gray-400"}>Có ít nhất một chữ cái in thường (a–z).</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className={hasNumber ? "text-green-500 font-semibold" : "text-gray-400"} />
                    <span className={hasNumber ? "text-green-500 font-semibold" : "text-gray-400"} >Có ít nhất một chữ số (0–9).</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className={hasMinLength ? "text-green-500 font-semibold" : "text-gray-400"} />
                    <span className={hasMinLength ? "text-green-500 font-semibold" : "text-gray-400"}>Độ dài tối thiểu 8 ký tự.</span>
                  </li>
                </ul>
              </div>
            </div>
            {/* confirm new password */}
            <div className="grid gap-2">
              <Label htmlFor="confirmNewPassword">Xác nhận mật khẩu mới</Label>
              <div className="flex gap-3">
                <Input
                  id="confirmNewPassword"
                  type={isEyeOpenForConfirmNewPassword ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value.trim())}
                  placeholder="Xác nhận mật khẩu mới"
                  required
                />
                <span className="">
                  {isEyeOpenForConfirmNewPassword ?
                    <EyeIcon
                      onClick={() => {
                        setIsEyeOpenForConfirmNewPassword(!isEyeOpenForConfirmNewPassword)
                      }}
                    />
                    :
                    <EyeClosed
                      onClick={() => {
                        setIsEyeOpenForConfirmNewPassword(!isEyeOpenForConfirmNewPassword)
                      }}
                    />
                  }
                </span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button type="submit" className="w-full" onClick={handleResetPassword}
            disabled={!hasLowercase || !hasNumber || !hasUppercase || !hasMinLength || !oldPassword || !newPassword || !confirmNewPassword || isLoadingChangePassword}
          >
            {isLoadingChangePassword ? <Loader className='animate-spin mx-auto' /> : 'Đổi mật khẩu'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default ResetPassword
// import { CheckCircle, EyeClosed, EyeIcon, Loader } from "lucide-react";
// import { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { useNavigate, useSearchParams } from "react-router-dom";
// import { toast } from "sonner";

// const ForgotPassword = () => {
//   // redux : 
//   const dispatch = useDispatch()
//   const { isLoadingResetPassword, isResetPasswordSuccess, errorResetPassword } = useSelector(state => state.userStore)
//   // sua phia tren : 
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');

//   // eye icon : 
//   const [isEyeOpen, setIsEyeOpen] = useState(false)
//   const [isEyeOpen2, setIsEyeOpen2] = useState(false)

//   // check validate password : 
//   const [hasUppercase, setHasUppercase] = useState(false);
//   const [hasLowercase, setHasLowercase] = useState(false);
//   const [hasNumber, setHasNumber] = useState(true);
//   const [hasMinLength, setHasMinLength] = useState(false);

//   // get query param : 
//   const [searchParams] = useSearchParams();
//   // get query values
//   const email = searchParams.get("email");
//   const resetPasswordToken = searchParams.get("resetPasswordToken");

//   // navigate : 
//   const navigate = useNavigate()

//   const handlePasswordChange = () => {
//     setHasUppercase(/[A-Z]/.test(password));
//     setHasLowercase(/[a-z]/.test(password));
//     setHasNumber(/[0-9]/.test(password));
//     setHasMinLength(password.length >= 8);
//   };
//   // handle password change :
//   useEffect(() => {
//     handlePasswordChange()
//   }, [password])

//   // if error , toast it : 
//   useEffect(() => {
//     if (errorResetPassword) {
//       toast.error(errorResetPassword)
//     }
//   }, [errorResetPassword])

//   // if register success, toast it : 
//   useEffect(() => {
//     if (isResetPasswordSuccess) {
//       toast.success('Đặt lại mật khẩu thành công.Bạn có thể đăng nhập ngay!')
//       navigate('/')
//     }
//   }, [isResetPasswordSuccess])

//   const handleResetPassword = async (e) => {
//     e.preventDefault();
//     // check if confirm password match : 
//     if (password !== confirmPassword) {
//       toast.error("Nhập lại mật khẩu không chính xác!");
//       return;
//     }
//     // if match , then send register to backend : 
//     await dispatch(resetPassword({ password, email, resetPasswordToken }))
//   };
//   return (
//     <div
//       className="mt-5 mb-40 flex items-center justify-center"
//     >
//       <div className="flex items-center justify-center bg-gay-100">
//         <div className="w-full p-8 bg-white shadow-2xl">
//           <h2 className="mb-6 text-2xl font-bold text-center">Đặt lại mật khẩu</h2>

//           <div>
//             <div className="mb-1">
//               <label className="block mb-2 text-sm font-medium text-gray-700">
//                 Mật khẩu mới
//               </label>
//               <div className="relative">
//                 <input
//                   type={isEyeOpen ? 'text' : 'password'}
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
//                   required
//                 />
//                 <span className="absolute inset-y-0 right-0 flex items-center pr-3">
//                   {isEyeOpen ?
//                     <EyeIcon
//                       onClick={() => {
//                         setIsEyeOpen(!isEyeOpen)
//                       }}
//                     />
//                     :
//                     <EyeClosed
//                       onClick={() => {
//                         setIsEyeOpen(!isEyeOpen)
//                       }}
//                     />
//                   }
//                 </span>
//               </div>
//             </div>
//             {/* validate password :  */}
//             <div className='px-6 mb-3'>
//               <ul>
//                 <li className="flex items-center gap-2">
//                   <CheckCircle size={16} className={hasUppercase ? "text-green-900 font-semibold" : "text-gray-400"} />
//                   <span className={hasUppercase ? "text-green-900 font-semibold" : "text-gray-400"}>Có ít nhất một chữ cái in hoa (A–Z).</span>
//                 </li>
//                 <li className="flex items-center gap-2">
//                   <CheckCircle size={16} className={hasLowercase ? "text-green-900 font-semibold" : "text-gray-400"} />
//                   <span className={hasLowercase ? "text-green-900 font-semibold" : "text-gray-400"}>Có ít nhất một chữ cái in thường (a–z).</span>
//                 </li>
//                 <li className="flex items-center gap-2">
//                   <CheckCircle size={16} className={hasNumber ? "text-green-900 font-semibold" : "text-gray-400"} />
//                   <span className={hasNumber ? "text-green-900 font-semibold" : "text-gray-400"} >Có ít nhất một chữ số (0–9).</span>
//                 </li>
//                 <li className="flex items-center gap-2">
//                   <CheckCircle size={16} className={hasMinLength ? "text-green-900 font-semibold" : "text-gray-400"} />
//                   <span className={hasMinLength ? "text-green-900 font-semibold" : "text-gray-400"}>Độ dài tối thiểu 8 ký tự.</span>
//                 </li>
//               </ul>
//             </div>
//             <div className="mb-4">
//               <label className="block mb-2 text-sm font-medium text-gray-700">
//                 Nhập lại mật khẩu
//               </label>
//               <div className="relative">
//                 <input
//                   type={isEyeOpen2 ? 'text' : 'password'}
//                   value={confirmPassword}
//                   onChange={(e) => setConfirmPassword(e.target.value)}
//                   className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
//                   required
//                 />
//                 <span className="absolute inset-y-0 right-0 flex items-center pr-3">
//                   {isEyeOpen2 ?
//                     <EyeIcon
//                       onClick={() => {
//                         setIsEyeOpen2(!isEyeOpen2)
//                       }}
//                     />
//                     :
//                     <EyeClosed
//                       onClick={() => {
//                         setIsEyeOpen2(!isEyeOpen2)
//                       }}
//                     />
//                   }
//                 </span>
//               </div>
//             </div>
//             <button
//               type="submit"
//               onClick={handleResetPassword}
//               disabled={!hasLowercase || !hasNumber || !hasUppercase || !hasMinLength}
//               className={`${hasLowercase && hasUppercase && hasMinLength && hasNumber ? "" : 'cursor-not-allowed '} w-full py-2 mb-4 text-white transition duration-200 bg-green-500 rounded-md hover:bg-green-900 font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2`}
//             >
//               {isLoadingResetPassword ? <Loader className='animate-spin mx-auto' /> : 'Đặt lại mật khẩu'}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default ForgotPassword