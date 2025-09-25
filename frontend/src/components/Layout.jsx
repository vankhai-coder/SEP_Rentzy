import { useDispatch } from "react-redux";
import Footer from "./Footer.jsx";
import Header from "./Header.jsx";
import { useEffect } from "react";
import { checkAuth } from "@/redux/features/auth/authSlice.js";
import ChatBox from "./chat/ChatBox";
const Layout = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!window.location.href.includes("verify-email")) {
      dispatch(checkAuth());
    }
  }, []);

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
