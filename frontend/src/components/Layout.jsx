import { useDispatch } from "react-redux";
import Footer from "./Footer.jsx";
import Header from "./Header.jsx";
import { useEffect } from "react";
import { checkAuth } from "@/redux/features/auth/authSlice.js";
import ChatBox from "./chat/ChatBox";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";

const Layout = ({ children }) => {
  const dispatch = useDispatch();

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const error = queryParams.get("error");

  useEffect(() => {
    if (!window.location.href.includes("verify-email") && !error) {
      dispatch(checkAuth());
    }
  }, [error]);

  useEffect(() => {
    if (error === 'emailInUser') {
      toast.error('Email đã được sử dụng!')
    }
  }, [error])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <Header />
      {/* Main Content */}
      <main className="flex-1 bg-[#f6f6f6]">{children}</main>
      {/* Footer : */}
      <Footer />
      <ChatBox />
    </div>
  );
};

export default Layout;
