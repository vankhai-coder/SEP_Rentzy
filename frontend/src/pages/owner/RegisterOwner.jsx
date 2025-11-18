import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import IdentityCardVerify from "../../components/renter/PersonalCardVerify/IdentityCardVerify.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import React, { useEffect } from "react";
import { toast } from "react-toastify";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/config/axiosInstance.js";
import { Button } from "@/components/ui/button.jsx";

const RegisterOwner = () => {
  const { role } = useSelector((state) => state.userStore);
  const navigate = useNavigate();

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

  // Redirect if not renter
  useEffect(() => {
    if (role === 'owner') {
      navigate('/');
      toast.error("Bạn đã là chủ xe, không thể đăng ký thêm!");
    }
  }, [role, navigate]);

  // Loading state
  if (isEmailVerifyLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center pb-20">

      {/* 1.Check if verify essensial infomation : email */}
      <div>
        {/*  check if user is verify email , if not then show dialog to let user verify email */}
        <div>
          <Dialog open={!isEmailVerified}  >
            {/* <DialogTrigger>Open</DialogTrigger> */}
            {/* dont show close icon x */}
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
        </div>
      </div>

      {/* 2.Verify identity card */}
      <div className="">

        <IdentityCardVerify />
      </div>

      {/* 3. Terms and Conditions */}
      <div>term</div>


    </div>
  );
};

export default RegisterOwner;