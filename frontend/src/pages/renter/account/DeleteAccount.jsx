import { Button } from "@/components/ui/button"
import axiosInstance from "@/config/axiosInstance";
import { logoutUser } from "@/redux/features/auth/authSlice";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DialogClose } from "@radix-ui/react-dialog";
import { Loader } from "lucide-react";

const DeleteAccount = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  // check if user if logged in
  const { userId } = useSelector((state) => state.userStore);
  // use useQuery to delete account :  /api/auth/delete-account
  const handleDeleteAccount = async () => {
    // send delete account request to backend
    try {
      setIsLoading(true);
      const response = await axiosInstance.delete('/api/auth/delete-account');
      if (response.data.success) {
        toast.success("Yêu cầu xóa tài khoản đã được gửi thành công!");
        // logout user
        dispatch(logoutUser());
        // redirect to home page
        navigate('/');
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(error.response?.data?.message || "Đã xảy ra lỗi khi gửi yêu cầu xóa tài khoản.");
    } finally {
      setIsLoading(false);
    }
  };


  if (!userId) {
    return <div className="flex items-center justify-center">Bạn cần đăng nhập để xóa tài khoản.</div>
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {/*  */}
      <h1 className="text-2xl font-semibold">Yêu cầu xóa tài khoản</h1>
      {/* image public/empty-del-account.8493997e.svg  */}
      <img src="/empty-del-account.8493997e.svg" alt="delete account" className="w-64 h-64" />
      {/* description */}
      <div className="text-xs text-justify px-4 md:px-0 md:w-2/3 lg:w-1/2 space-y-2">
        <p>Khi xóa tài khoản, các thông tin sau (nếu có) sẽ bị xóa trên hệ thống:</p>
        <ul>
          <li>1.  Thông tin cá nhân</li>
          <li>2.  Thông tin lịch sử chuyến và danh sách xe</li>
        </ul>
        <p>Tiền ví và điểm thưởng sẽ được thanh toán theo quy định và chính sách hiện hành của Rentzy.</p>
        <p>Việc đồng ý xóa tài khoản là bạn đã chấp nhận điều khoản chính sách xóa tài khoản của Rentzy.</p>
        <p>Yêu cầu xóa tài khoản sẽ được xử lý trong vòng 15 ngày làm việc. Rentzy sẽ liên hệ trực tiếp với bạn thông qua Email hoặc Số điện thoại đã cung cấp.</p>
        <p>Mọi thắc mắc xin liên hệ Fanpage của Rentzy hoặc Hotline 0815 909 549 (7AM - 10PM) để được hỗ trợ.</p>
      </div>
      {/* button delete */}
      <Dialog>
        <DialogTrigger>
          <Button variant={'destructive'} disabled={!userId || isLoading}>
            Yêu cầu xóa tài khoản
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bạn có chắc chắn muốn xóa tài khoản không?</DialogTitle>
            <DialogDescription>
              Hành động này sẽ gửi yêu cầu xóa tài khoản của bạn. Vui lòng xác nhận để tiếp tục.
            </DialogDescription>
          </DialogHeader>
          {/* button */}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button variant={'destructive'} onClick={handleDeleteAccount} disabled={!userId || isLoading}>
              {isLoading ? <Loader className="animate-spin" /> : 'Xác nhận xóa tài khoản'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DeleteAccount