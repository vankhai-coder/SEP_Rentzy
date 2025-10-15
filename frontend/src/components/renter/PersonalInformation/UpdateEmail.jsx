import { resetUserInformationSlice, sendUpdateEmail } from "@/redux/features/auth/userInformationSlice";
import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

const UpdateEmail = ({ setOpen }) => {

  // redux : 
  const dispatch = useDispatch()
  const {
    errorWhenSendUpdateEmail,
    isLoadingSendUpdateEmail,
    isSendUpdateEmailSuccess
  }
    = useSelector(state => state.userInformationStore)

  // state for email : 
  const [newEmail, setNewEmail] = useState('')

  // check valid funtion : 
  const isValidEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  }
  // update email fucntion : 
  const submitUpdatedEmail = async () => {

    // check email field not empty
    if (!newEmail) {
      toast.error('Nhập email mới!')
      return
    }
    // check if email valid
    if (!isValidEmail(newEmail)) {
      toast.error('Vui lòng nhập email đúng định dạng!')
      return
    }
    // dispatch function update email : 
    await dispatch(sendUpdateEmail({ updatedEmail: newEmail }))

  }

  // TOAST : 
  // toast if success : 
  useEffect(() => {
    if (isSendUpdateEmailSuccess) {
      toast.success(`Gửi yêu cầu cập nhập email thành công. Kiểm tra ${newEmail} để xác thực!`)
      setOpen(false)
      // clear redux state(success , error)
      dispatch(resetUserInformationSlice())
    }
  }, [isSendUpdateEmailSuccess])

  // toast if error : 
  useEffect(() => {
    if (errorWhenSendUpdateEmail) {
      toast.error(errorWhenSendUpdateEmail)
    }
  }, [errorWhenSendUpdateEmail])

  return (
    <div
      className="relative w-full rounded-lg bg-re-300 p-6 "
    >
      {/* Title: Cập nhật email */}
      <h2 className="mb-6 text-center text-xl font-bold text-gray-800">
        Cập nhật email
      </h2>

      {/* Input Field: Email mới */}
      <div className="mb-6">
        <input
          type="email"
          value={newEmail}
          onChange={(e) => {
            setNewEmail(e.target.value)
          }}
          placeholder="Email mới"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          aria-label="New Email"
        />
      </div>

      {/* Update Button: Cập nhật */}
      <button
        className="w-full rounded-lg hover:cursor-pointer bg-green-500 py-3 text-lg font-semibold text-white transition-colors hover:bg-green-600 disabled:bg-green-300"
        onClick={submitUpdatedEmail}
      >
        {isLoadingSendUpdateEmail ? <Loader2Icon className="mx-auto animate-spin" /> : 'Cập nhật'}
      </button>
    </div>
  )
}

export default UpdateEmail