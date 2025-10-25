import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { resetUserInformationSlice, sendOtpToPhoneNumber, verifyOtpForPhoneNumber } from "@/redux/features/auth/userInformationSlice"
import { Loader2Icon, Pen } from "lucide-react"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { toast } from "sonner"


const UpdatePhone = () => {

    // redux : 
    const dispatch = useDispatch()
    const {
        sendOtpToPhoneNumberSuccess, isLoadingSendOtpToPhoneNumber, errorWhenSendOtpToPhoneNumber,
        verifyOtpForPhoneNumberSuccess, isLoadingVerifyOtpForPhoneNumber, errorWhenVerifyOtpForPhoneNumber
    } = useSelector((state) => state.userInformationStore)

    // state for phone number input
    const [phoneNumber, setPhoneNumber] = useState('')
    // state for otp input
    const [otp, setOtp] = useState('')
    // state for dialog open/close
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // check if phone is correct format
    const isPhoneValid = (phone) => {
        const phoneRegex = /^[0-9]{10,15}$/
        return phoneRegex.test(phone)
    }

    // handle update phone number
    const handleUpdatePhone = async () => {
        if (!isPhoneValid(phoneNumber)) {
            toast.error('Số điện thoại không hợp lệ. Vui lòng nhập lại.')
            return
        }
        // dispatch action to send otp to new phone number
        dispatch(sendOtpToPhoneNumber({ phoneNumber }))
    }

    // handle verify otp
    const handleVerifyOtp = async () => {
        // check if otp is 6 digits
        if (otp.length !== 6) {
            toast.error('Mã OTP phải gồm 6 chữ số. Vui lòng nhập lại.')
            return
        }
        // dispatch action to verify otp
        dispatch(verifyOtpForPhoneNumber({ phoneNumber, otpCode: otp }))
    }


    // toast success or error for send otp to phone number :
    useEffect(() => {
        if (sendOtpToPhoneNumberSuccess) {
            toast.success('Đã gửi mã OTP đến số điện thoại mới.')
            // 
        }
        if (errorWhenSendOtpToPhoneNumber) {
            toast.error(errorWhenSendOtpToPhoneNumber)
            setIsDialogOpen(false)
            dispatch(resetUserInformationSlice())
            // clera phone number input
            setPhoneNumber('')
        }
    }, [sendOtpToPhoneNumberSuccess, errorWhenSendOtpToPhoneNumber, dispatch])

    // toast for verify otp success or error for verify otp for phone number :
    useEffect(() => {
        if (errorWhenVerifyOtpForPhoneNumber) {
            toast.error(errorWhenVerifyOtpForPhoneNumber)
            // clear otp input
            setOtp('')
            setPhoneNumber('')
            // close dialog
            setIsDialogOpen(false)
            dispatch(resetUserInformationSlice())
        }
    }, [errorWhenVerifyOtpForPhoneNumber, dispatch])

    // success effect for verify otp
    useEffect(() => {
        if (verifyOtpForPhoneNumberSuccess) {
            toast.success('Cập nhật số điện thoại thành công.')
            // clear otp and phone number input
            setOtp('')
            setPhoneNumber('')
            // close dialog
            setIsDialogOpen(false)
            dispatch(resetUserInformationSlice())
        }
    }, [verifyOtpForPhoneNumberSuccess, dispatch])

    return (

        // return dialog from shacnui the that allows user to update phone number
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} >
            <DialogTrigger asChild>
                <Pen className="hover:cursor-pointer" size={16} />
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle></DialogTitle>
                    <DialogDescription>
                    </DialogDescription>
                </DialogHeader>

                <div
                    className="relative w-full rounded-lg bg-re-300 p-6 "
                >
                    {/* Title: Cập nhật email */}
                    <h2 className="mb-6 text-center text-xl font-bold text-gray-800">
                        {sendOtpToPhoneNumberSuccess ? 'Nhập mã OTP' : 'Cập nhật số điện thoại'}
                    </h2>

                    {/* Input Field: Email mới */}
                    <div className="mb-6">
                        <input
                            type="number"
                            value={sendOtpToPhoneNumberSuccess ? otp : phoneNumber}
                            onChange={(e) => {
                                sendOtpToPhoneNumberSuccess ? setOtp(e.target.value) : setPhoneNumber(e.target.value)
                            }}
                            placeholder={sendOtpToPhoneNumberSuccess ? 'Nhập mã OTP' : 'Số điện thoại mới'}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            aria-label="New Email"
                        />
                    </div>

                    {/* Update Button: Cập nhật */}
                    <button
                        className="w-full rounded-lg hover:cursor-pointer bg-green-500 py-3 text-lg font-semibold text-white transition-colors hover:bg-green-600 disabled:bg-green-300"
                        onClick={() => {
                            sendOtpToPhoneNumberSuccess ? handleVerifyOtp() : handleUpdatePhone()
                        }}
                    >
                        {isLoadingSendOtpToPhoneNumber || isLoadingVerifyOtpForPhoneNumber ? <Loader2Icon className="mx-auto animate-spin" /> :
                            (sendOtpToPhoneNumberSuccess ? 'Xác thực OTP' : 'Cập nhật')}
                    </button>
                </div>

                <DialogFooter>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default UpdatePhone
