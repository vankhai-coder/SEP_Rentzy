import { useDispatch, useSelector } from "react-redux";
import Footer from "./Footer.jsx";
import Header from "./Header.jsx";
import { useEffect } from "react";
import ChatBox from "../chat/ChatBox.jsx";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { checkAuth } from "@/redux/features/auth/authSlice.js";

const Layout = ({ children }) => {
  const { role } = useSelector((state) => state.userStore);
  const dispatch = useDispatch();

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const error = queryParams.get("error");

  useEffect(() => {
    if (error === 'emailInUser') {
      toast.error('Email đã được sử dụng!')
    }
  }, [error])

  useEffect(() => {
    if (error === 'userBanned') {
      toast.error('Tài khoản của bạn đã bị cấm!')
    }
  }, [error])

  // check auth : 
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  // redirect owner to /owner when landing on home after auth
  // Removed auto-redirect for owner to allow manual navigation via account page

  // redirect admin to /admin when landing on home after auth
  // useEffect(() => {
  //   if (role === 'admin' && location.pathname === '/') {
  //     navigate('/admin', { replace: true });
  //   }
  // }, [role, location.pathname, navigate]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header - Ẩn khi role là owner/admin và đang ở trang owner/admin hoặc các trang con */}
      {!((role === 'owner' && location.pathname.startsWith('/owner')) ||
        (role === 'admin' && location.pathname.startsWith('/admin'))) && <Header />}
      {/* Main Content */}
      <main className="flex-1 bg-[#f6f6f6] w-full max-w-full overflow-x-hidden box-border mt-15 md:mt-20">{children}</main>
      {/* Footer - Ẩn khi role là owner/admin và đang ở trang owner/admin hoặc các trang con */}
      {!((role === 'owner' && location.pathname.startsWith('/owner')) ||
        (role === 'admin' && location.pathname.startsWith('/admin'))) && <Footer />}
      {/* appear only when role !== owner or admin */}
      {role !== 'owner' && role !== 'admin' && <ChatBox />}
    </div>
  );
};

export default Layout;
