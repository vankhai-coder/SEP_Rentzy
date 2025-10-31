import { useSelector } from "react-redux";
import Footer from "./Footer.jsx";
import Header from "./Header.jsx";
import { useEffect } from "react";
import ChatBox from "../chat/ChatBox.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Layout = ({ children }) => {
  const { role } = useSelector((state) => state.userStore);
  const navigate = useNavigate();

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const error = queryParams.get("error");

  useEffect(() => {
    // Temporarily disabled auth check for testing
    // if (!window.location.href.includes("verify-email") && !error) {
    //   dispatch(checkAuth());
    // }
  }, [error]);

  useEffect(() => {
    if (error === 'emailInUser') {
      toast.error('Email đã được sử dụng!')
    }
  }, [error])

  // redirect owner to /owner when landing on home after auth
  useEffect(() => {
    if (role === 'owner' && location.pathname === '/') {
      navigate('/owner', { replace: true });
    }
  }, [role, location.pathname, navigate]);

  // redirect admin to /admin when landing on home after auth
  useEffect(() => {
    if (role === 'admin' && location.pathname === '/') {
      navigate('/admin', { replace: true });
    }
  }, [role, location.pathname, navigate]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header - Ẩn khi role là owner/admin và đang ở trang owner/admin hoặc các trang con */}
      {!((role === 'owner' && location.pathname.startsWith('/owner')) ||
        (role === 'admin')) && <Header />}
      {/* Main Content */}
      <main className="flex-1 bg-[#f6f6f6]">{children}</main>
      {/* Footer - Ẩn khi role là owner/admin và đang ở trang owner/admin hoặc các trang con */}
      {!((role === 'owner' && location.pathname.startsWith('/owner')) ||
        (role === 'admin')) && <Footer />}
      <ChatBox />
    </div>
  );
};

export default Layout;
