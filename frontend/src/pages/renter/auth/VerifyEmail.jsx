import { resetState, verifyEmail } from "@/redux/features/auth/authSlice";
import { Loader2Icon } from "lucide-react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const VerifyEmail = () => {

  // redux : 
  const dispatch = useDispatch()
  const { isLoadingVerifyEmail, errorVerifyEmail, isVerifyEmailSuccess } = useSelector(state => state.userStore)

  const [searchParams] = useSearchParams();

  // get query value : 
  const email = searchParams.get("email");
  const verifyEmailToken = searchParams.get("verifyEmailToken");

  // navigate : 
  const navigate = useNavigate()

  // toast error when have one : 
  useEffect(() => {
    if (errorVerifyEmail) {
      toast.error(errorVerifyEmail)
    }
  }, [errorVerifyEmail])

  // toast when success : 
  useEffect(() => {
    if (isVerifyEmailSuccess) {
      toast.success('Verify email successfully!')
    }
  }, [isVerifyEmailSuccess])

  // navigate to home page when verify success : 
  useEffect(() => {
    if (isVerifyEmailSuccess) {
      navigate('/')
    }
  }, [isVerifyEmailSuccess])

  // dispatch to verify email : 
  useEffect(() => {
    dispatch(verifyEmail({ email, verifyEmailToken }))
  }, [])

  // reset state : 
  useEffect(() => {
    return () => {
      dispatch(resetState())
    }
  }, [])

  return (
    <div
      className="min-h-screen flex items-center justify-center"

    >
      {isLoadingVerifyEmail && <Loader2Icon className="animate-spin">Verifying...</Loader2Icon>}
    </div>
  )
}

export default VerifyEmail