import { setEmail } from "@/redux/features/auth/authSlice";
import { resetUserInformationSlice, verifyUpdatedEmail } from "@/redux/features/auth/userInformationSlice";
import { Loader2Icon } from "lucide-react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const VerifyUpdatedEmail = () => {

    // redux :
    const dispatch = useDispatch()
    const {
        verifyUpdatedEmailError,
        isVerifyUpdatedEmailLoading,
        isVerifyUpdatedEmailSuccess
    } = useSelector(state => state.userInformationStore)

    // get query value from url : 
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email");
    const verifyEmailToken = searchParams.get("verifyEmailToken");

    // navigate : 
    const navigate = useNavigate()

    // dispatch verify email : 
    useEffect(() => {
        dispatch(verifyUpdatedEmail({ updatedEmail: email, verifyEmailToken }))
    }, [dispatch, email, verifyEmailToken])

    // TOAST : 
    // toast if error : 
    useEffect(() => {
        if (verifyUpdatedEmailError) {
            toast.error(verifyUpdatedEmailError)
            // clear state : 
            dispatch(resetUserInformationSlice())
        }
    }, [verifyUpdatedEmailError, dispatch])

    // toast if success : 
    useEffect(() => {
        if (isVerifyUpdatedEmailSuccess) {
            toast.success('Cập nhập email mới thành công!')
            // clear state : 
            dispatch(resetUserInformationSlice())
            // update new email in authSlice : 
            dispatch(setEmail(email))
            // navigate to /account 
            navigate('/account')
        }
    }, [isVerifyUpdatedEmailSuccess, dispatch, email, navigate])

    return (
        <div
            className="min-h-screen flex items-center justify-center"

        >
            {isVerifyUpdatedEmailLoading && <Loader2Icon className="animate-spin">Cập nhật email mới...</Loader2Icon>}
        </div>
    )
}

export default VerifyUpdatedEmail