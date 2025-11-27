import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import IdentityCardVerify from "../../components/renter/PersonalCardVerify/IdentityCardVerify.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/config/axiosInstance.js";
import { Button } from "@/components/ui/button.jsx";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AlertCircleIcon, CircleCheck, CircleX, Clock8, Loader, PopcornIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.jsx";
import { CheckCircle2Icon } from "lucide-react";

const RegisterOwner = () => {
  const { role } = useSelector((state) => state.userStore);
  const navigate = useNavigate();

  // state for sending request loading
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  // function to check if user is verify essential information : email  , GET /api/renter/info/verify//is-verify-email using axiosInstance
  const checkIfUserIsVerifyEmail = async () => {
    try {
      const response = await axiosInstance.get('/api/renter/info/is-verify-email');
      return response.data.isVerifyEmail; // Assuming the response contains a field 'isVerified'
    } catch (error) {
      console.error("Error checking email verification status:", error);
      return false;
    }
  }
  // user react query to check if user is verify essential information : email 
  const { data: isEmailVerified, isLoading: isEmailVerifyLoading } = useQuery({
    queryKey: ['isEmailVerified'],
    queryFn: checkIfUserIsVerifyEmail,
  });

  // function to check if user is verify identity card , GET /api/renter/info/verify/is-verify-identity-card using axiosInstance
  const checkIfUserIsVerifyIdentityCard = async () => {
    try {
      const response = await axiosInstance.get('/api/renter/info/is-verify-identity-card');
      return response.data.isVerifyIdentityCard; // Assuming the response contains a field 'isVerifyIdentityCard'
    } catch (error) {
      console.error("Error checking identity card verification status:", error);
      return false;
    }
  }
  // user react query to check if user is verify identity card
  const { data: isIdentityCardVerified, isLoading: isIdentityCardVerifyLoading, refetch: refetchIdentityCard } = useQuery({
    queryKey: ['isIdentityCardVerified'],
    queryFn: checkIfUserIsVerifyIdentityCard,
  });

  // functon to check if user is have bank account linked , GET /api/renter/info/verify/is-register-bank-account using axiosInstance
  const checkIfUserIsLinkBankAccount = async () => {
    try {
      const response = await axiosInstance.get('/api/renter/info/is-register-bank-account');
      return response.data.isRegisterBankAccount; // Assuming the response contains a field 'isRegisterBankAccount'
    } catch (error) {
      console.error("Error checking bank account link status:", error);
      return false;
    }
  }
  // user react query to check if user is have bank account linked
  const { data: isLinkBankAccount, isLoading: isLinkBankAccountLoading } = useQuery({
    queryKey: ['isLinkBankAccount'],
    queryFn: checkIfUserIsLinkBankAccount,
  });

  // function to check if user is already request to become owner , GET /api/renter/info/status-request-to-be-owner using axiosInstance
  const checkStatusForRequestToBecomeOwner = async () => {
    try {
      const response = await axiosInstance.get('/api/renter/info/status-request-to-be-owner');
      return response.data; // Assuming the response contains a field 'status'
    } catch (error) {
      console.error("Error checking request to become owner status:", error);
      return false;
    }
  }
  // user react query to check if user is already request to become owner
  const { data: statusForRequestToBecomeOwner, isLoading: isLoadingStatusForRequestToBecomeOwner, refetch: refetchRequestToBecomeOwner } = useQuery({
    queryKey: ['statusForRequestToBecomeOwner'],
    queryFn: checkStatusForRequestToBecomeOwner,

  });

  // function to check if user is agree to terms : to : /api/renter/info/verify/is-agree-terms-and-conditions
  const checkIfUserIsAgreeToTerms = async () => {
    try {
      const response = await axiosInstance.get('/api/renter/info/is-agree-terms-and-conditions');
      return response.data.isAgreeToTerms; // Assuming the response contains a field 'isAgreeToTerms'
    } catch (error) {
      console.error("Error checking agree to terms status:", error);
      return false;
    }
  }




  // user react query to check if user is agree to terms
  const { data: isAgreeToTermsFromServer, isLoading: isAgreeToTermsLoading, refetch: refetchAgreeToTerms } = useQuery({
    queryKey: ['isAgreeToTerms'],
    queryFn: checkIfUserIsAgreeToTerms,
  });

  // funtion to set isAgreeToTerms when user agree to terms : 
  const agreeToTerms = async () => {
    try {
      const response = await axiosInstance.post('/api/renter/info/agree-terms-and-conditions');
      // refetch the isAgreeToTerms query : 
      refetchAgreeToTerms();
      return response.data;
    } catch (error) {
      console.error("Error agreeing to terms:", error);
      throw error;
    }
  }
  // state to manage is loading for agree to terms
  const [isSendingAgreeToTerms, setIsSendingAgreeToTerms] = useState(false);
  // state for check if user is click to agree to terms box : 
  const [isClickAgreeToTermsBox, setIsClickAgreeToTermsBox] = useState(false);

  // Redirect if not renter
  useEffect(() => {
    if (role === 'owner') {
      navigate('/');
      toast.info("Bạn đã là chủ xe, không thể đăng ký thêm!");
    }
  }, [role, navigate]);

  // log for test :            disabled={!(isEmailVerified && isIdentityCardVerified && isLinkBankAccount && isAgreeToTerms) || isSendingRequest}
  console.log("isEmailVerified:", isEmailVerified);
  console.log("isIdentityCardVerified:", isIdentityCardVerified);
  console.log("isLinkBankAccount:", isLinkBankAccount);
  console.log("isAgreeToTerms:", isAgreeToTermsFromServer);
  console.log("statusForRequestToBecomeOwner:", statusForRequestToBecomeOwner);

  // Loading state
  if (isEmailVerifyLoading || isIdentityCardVerifyLoading || isLinkBankAccountLoading || isLoadingStatusForRequestToBecomeOwner || isAgreeToTermsLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center py-10">

      <Card className={'lg:w-2xl'}>
        <CardHeader>
          <CardTitle className={'text-2xl font-semibold'}>Đăng ký chủ xe</CardTitle>
          {/* <CardDescription>desc</CardDescription> */}
          {/* <CardAction>Card Action</CardAction> */}
        </CardHeader>
        <CardContent className={'flex flex-col gap-6 items-center justify-center'}>
          {/* each div for each step: */}

          {/* STEP 1: verify email */}
          <div className="p-6 border-3 border-gray-200 rounded-lg w-full  ">
            <div className="flex items-center justify-between py-4 border-b-2 border-gray-200 mb-4">
              <span className="font-bold text-xl">Bước 1 : Xác thực email</span>
              <span>
                {isEmailVerified ? (
                  <CircleCheck className="text-green-400" />
                ) : (
                  <CircleX className="text-red-400" />
                )}
              </span>
            </div>
            <div>
              {isEmailVerified ? (
                <span>Bạn đã xác thực địa chỉ email</span>
              ) : (
                // dialog to let user verify email
                <Dialog>
                  <DialogTrigger>
                    <Button>Xác minh email</Button>
                  </DialogTrigger>
                  <DialogContent showCloseButton={false} >
                    <DialogHeader>
                      <DialogTitle>Bạn cần phải xác minh email trước khi tiếp tục</DialogTitle>
                      <DialogDescription className={'flex justify-center my-6'}>
                        <Button>
                          <Link to="/account">Xác minh email ngay</Link>
                        </Button>
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* STEP 2: check if user is have bank account */}
          <div className="p-6 border-3 border-gray-200 rounded-lg w-full  ">
            <div className="flex items-center justify-between py-4 border-b-2 border-gray-200 mb-4">
              <span className="font-bold text-xl">Bước 2 : Tạo tài khoản ngân hàng</span>
              <span>
                {isLinkBankAccount ? (
                  <CircleCheck className="text-green-400" />
                ) : (
                  <CircleX className="text-red-400" />
                )}
              </span>
            </div>
            <div>
              {isLinkBankAccount ? (
                <span>Bạn đã tạo tài khoản ngân hàng</span>
              ) : (
                // dialog to let user verify email
                <Dialog>
                  <DialogTrigger>
                    <Button>Tạo tài khoản ngân hàng</Button>
                  </DialogTrigger>
                  <DialogContent showCloseButton={false} >
                    <DialogHeader>
                      <DialogTitle>Bạn cần phải tạo tài khoản ngân hàng trước khi tiếp tục</DialogTitle>
                      <DialogDescription className={'flex justify-center my-6'}>
                        <Button>
                          <Link to="/account">Tạo tài khoản ngân hàng ngay</Link>
                        </Button>
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              )}

            </div>
          </div>

          {/* STEP 3: verify identity card */}
          <div className="p-6 border-3 border-gray-200 rounded-lg w-full  ">
            <div className="flex items-center justify-between py-4 border-b-2 border-gray-200 mb-4">
              <span className="font-bold text-xl">Bước 3 : Xác thực giấy tờ tùy thân</span>
              <span>
                {isIdentityCardVerified ? (
                  <CircleCheck className="text-green-400" />
                ) : (
                  <CircleX className="text-red-400" />
                )}
              </span>
            </div>
            <div className="">
              {isIdentityCardVerified ? (
                <span>Bạn đã xác thực giấy tờ tùy thân</span>
              ) : (
                // {/* // dialog to let user verify identity card */}
                <Dialog   >
                  <DialogTrigger>
                    <Button className={'mx-auto'}>Xác minh căn cước công dân</Button>
                  </DialogTrigger>

                  <DialogContent className="overflow-y-auto" showCloseButton={false} >
                    <DialogHeader>
                      <DialogTitle>
                        Bạn cần phải xác minh căn cước công dân trước khi tiếp tục
                      </DialogTitle>
                    </DialogHeader>

                    <div className="mt-4 max-h-[80vh] overflow-y-auto ">
                      <IdentityCardVerify refetchIdentityCard={refetchIdentityCard} />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* STEP 4: agree terms */}
          {!isAgreeToTermsFromServer &&
            <div className="p-6 border-3 border-gray-200 rounded-lg w-full  ">
              <div className="flex items-center justify-between py-4 border-b-2 border-gray-200 mb-4">
                <span className="font-bold text-xl">Bước 4 : Đồng ý với các điều khoản</span>
                <span>
                  {isAgreeToTermsFromServer ? (
                    <CircleCheck className="text-green-400" />
                  ) : (
                    <CircleX className="text-red-400" />
                  )}
                </span>
              </div>
              <div>
                {/* // dialog to let user agree to terms */}
                <Dialog   >
                  <DialogTrigger>
                    <Button className={'mx-auto'} variant={'outline'} >Xem điều khoản</Button>
                  </DialogTrigger>

                  <DialogContent className="overflow-y-auto " showCloseButton={false}>
                    <DialogHeader>
                      <DialogTitle>
                        Bạn cần phải đồng ý với các điều khoản trước khi tiếp tục
                      </DialogTitle>
                    </DialogHeader>

                    <div
                      className="h-[80vh] overflow-y-scroll p-4 border rounded"
                    >
                      <h2 className="font-bold mb-2">Điều khoản cho chủ xe</h2>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Chịu trách nhiệm giao xe đúng thời gian và địa điểm đã thỏa thuận.</li>
                        <li>Kiểm tra tình trạng xe trước và sau khi giao, lập biên bản nếu có hư hỏng.</li>
                        <li>Phí nền tảng là 10% trên mỗi booking thành công.</li>
                        <li>Xe phải có đầy đủ giấy tờ hợp pháp: đăng ký, đăng kiểm, bảo hiểm dân sự bắt buộc.</li>
                        <li>Chủ xe phải đảm bảo xe trong tình trạng an toàn: phanh, đèn, lốp, nhiên liệu.</li>
                        <li>Người thuê chịu trách nhiệm về vi phạm giao thông trong thời gian thuê.</li>
                        <li>Chủ xe có quyền từ chối cho thuê nếu người thuê không đủ điều kiện (bằng lái, giấy tờ tùy thân).</li>
                        <li>Bồi thường thiệt hại nếu xe bị hư hỏng hoặc mất mát trong thời gian thuê.</li>
                        <li>Không sử dụng xe vào mục đích trái pháp luật (chở hàng cấm, đua xe, gây rối trật tự).</li>
                        <li>Hợp đồng thuê xe phải được lập bằng văn bản hoặc xác nhận điện tử trên nền tảng.</li>
                      </ul>

                      <div className="mt-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={isAgreeToTermsFromServer}
                            onChange={(e) => {
                              setIsClickAgreeToTermsBox(e.target.checked);
                            }}
                          />
                          <span>Tôi đồng ý với các điều khoản trên</span>
                        </label>
                      </div>

                      {/* agree button : */}
                      <div className="flex justify-center mt-6">
                        <Button
                          variant={'outline'}
                          onClick={async () => {
                            try {
                              setIsSendingAgreeToTerms(true);
                              await agreeToTerms();
                              toast.success("Bạn đã đồng ý với các điều khoản.");
                            } catch (error) {
                              console.error("Error agreeing to terms:", error);
                              toast.error("Đã xảy ra lỗi. Vui lòng thử lại.");
                            } finally {
                              setIsSendingAgreeToTerms(false);
                            }
                          }}
                          disabled={isAgreeToTermsFromServer || isSendingAgreeToTerms || !isClickAgreeToTermsBox}
                        >
                          {isSendingAgreeToTerms ? <Loader className="animate-spin text-green-400" /> : 'Đồng ý với các điều khoản'}
                        </Button>
                      </div>

                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          }

          {/* STEP 5: Waiting for admin to accept */}
          <div className="p-6 border-3 border-gray-200 rounded-lg w-full  ">
            <div className="flex items-center justify-between py-4 border-b-2 border-gray-200 mb-4">
              <span className="font-bold text-xl">Bước 5 : Gửi yêu cầu thành chủ xe</span>
              <span>
                {statusForRequestToBecomeOwner.status === 'pending' ? (
                  <Clock8 className="text-yellow-400" />
                ) :

                  statusForRequestToBecomeOwner.status === 'no_request' ? (
                    <CircleX className="text-red-400" />
                  ) : statusForRequestToBecomeOwner.status === 'approved' ? (
                    <CircleCheck className="text-green-400" />
                  ) :

                    (
                      <CircleX className="text-red-400" />
                    )}
              </span>
            </div>
            <div>
              {statusForRequestToBecomeOwner.status === 'pending' ? (
                <span>Bạn đã gửi yêu cầu trở thành chủ xe. Vui lòng chờ quản trị viên phê duyệt.</span>
              ) :
                <Button
                  onClick={async () => {
                    try {
                      setIsSendingRequest(true);
                      await axiosInstance.post('/api/renter/info/register-owner-request');
                      toast.success("Yêu cầu trở thành chủ xe đã được gửi thành công!");
                      // refetch the isRequestToBecomeOwner query : 
                      refetchRequestToBecomeOwner();
                    } catch (error) {
                      console.error("Error sending request to become owner:", error);
                      toast.error("Gửi yêu cầu thất bại. Vui lòng thử lại.");
                    } finally {
                      setIsSendingRequest(false);
                    }
                  }}
                  disabled={!(isEmailVerified && isIdentityCardVerified && isLinkBankAccount && isAgreeToTermsFromServer) || isSendingRequest}
                >
                  {isSendingRequest ? <Loader className="animate-spin text-green-400" /> : 'Gửi yêu cầu trở thành chủ xe'}

                </Button>
              }
            </div>
          </div>


          {/* STEP 6 */}
          {/* if  statusForRequestToBecomeOwner =  "rejected" , then display dialog to let the user know the reason */}
          <Dialog open={statusForRequestToBecomeOwner.status === 'rejected'}>
            <DialogContent showCloseButton={false}>
              <DialogHeader>
                <DialogTitle>Yêu cầu trở thành chủ xe bị từ chối</DialogTitle>
                <DialogDescription className={'flex justify-center my-6'}>
                  <div className="grid w-full max-w-xl items-start gap-4">
                    <Alert variant="destructive">
                      <AlertCircleIcon />
                      <AlertTitle>Yêu cầu bị từ chối</AlertTitle>
                      <AlertDescription>
                        Lý do: {statusForRequestToBecomeOwner.reason_rejected || "Vui lòng liên hệ quản trị viên để biết thêm chi tiết."}
                      </AlertDescription>
                    </Alert>

                    <Alert>
                      {/* <PopcornIcon /> */}
                      <AlertTitle className={'flex justify-center'}>
                        <Button>
                          <Link to='/' >Quay về trang chủ</Link>
                        </Button>
                      </AlertTitle>
                    </Alert>
                  </div>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>

          {/* STEP 7 */}
          {/* if  statusForRequestToBecomeOwner =  "approved" , then display dialog to let the user know the success , in this case , they must log in again to set role */}
          <Dialog open={statusForRequestToBecomeOwner.status === 'approved'}>
            <DialogContent showCloseButton={false} >
              <DialogHeader>
                <DialogTitle>Yêu cầu trở thành chủ xe đã được phê duyệt</DialogTitle>
                <DialogDescription className={'flex justify-center my-6'}>
                  <Alert>
                    <CheckCircle2Icon />
                    <AlertTitle>Hãy đăng nhập lại để cập nhật vai trò của bạn</AlertTitle>
                    <AlertDescription>
                      <Button className={'mt-4 mx-auto'}>
                        <Link to='/logout' >Đăng xuất ngay</Link>
                      </Button>
                    </AlertDescription>
                  </Alert>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

    </div >
  );
};

export default RegisterOwner;