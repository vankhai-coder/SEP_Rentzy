// fe/src/components/SidebarOwner/SidebarOwner.jsx
import React, { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Car,
  Calendar,
  Bell,
  TrendingUp,
  LogOut,
  ArrowLeftRight,
  Receipt,
  ClipboardList,
  X,
  ArrowLeft,
} from "lucide-react";
import axiosInstance from "@/config/axiosInstance";
import { useSelector } from "react-redux";

const SidebarOwner = ({ handleLogout, isOpen, setIsOpen }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { email, avatar } = useSelector((state) => state.userStore || {});
  const { full_name } = useSelector((state) => state.userInformationStore || {});

  useEffect(() => {
    let isMounted = true;
    let timerId;

    const fetchUnread = async () => {
      try {
        const res = await axiosInstance.get("/api/owner/dashboard/notifications", { params: { limit: 1 } });
        if (res.data && res.data.success && isMounted) {
          setUnreadCount(res.data.data.unreadCount || 0);
        }
      } catch {
        // silent
      }
    };

    fetchUnread();
    timerId = setInterval(fetchUnread, 30000);

    return () => {
      isMounted = false;
      if (timerId) clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || "";
    if (!base) return;
    const wsUrl = base.replace(/^http/i, "ws") + "/ws";
    let ws;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg && msg.type === "NOTIFICATIONS_UNREAD_COUNT") {
            const next = msg.data && typeof msg.data.unreadCount === "number" ? msg.data.unreadCount : 0;
            setUnreadCount(next);
          }
        } catch (err) {
          console.error(err);
        }
      };
    } catch (err) {
      console.error(err);
    }
    return () => { try { ws && ws.close(); } catch (err) { console.error(err); } };
  }, []);

  // Get initials from full_name or email
  const getInitials = () => {
    if (full_name) {
      const names = full_name.split(" ");
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "O";
  };

  return (
    <>
      {/* dark layer when click to mobile navbar icon */}
      <div 
        onClick={() => { setIsOpen(false) }} 
        className={`${isOpen ? "block" : "hidden"} fixed inset-0 bg-black/50 z-40 lg:hidden`}
      />

      {/* sidebar */}
      <aside className={`${
        isOpen
          ? "fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out bg-white dark:bg-secondary-900 border-r border-secondary-200 dark:border-secondary-800 flex flex-col lg:z-30 lg:w-64 translate-x-0 w-64"
          : "fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out bg-white dark:bg-secondary-900 border-r border-secondary-200 dark:border-secondary-800 flex flex-col lg:z-30 lg:w-64 -translate-x-full"
      }`}>
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-secondary-200 dark:border-secondary-800 justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Link 
              to="/" 
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white hover:from-primary-600 hover:to-primary-800 transition-colors flex-shrink-0"
              title="Về trang chủ"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="text-xl font-bold text-secondary-900 dark:text-white transition-opacity">
              Bảng điều khiển chủ xe
            </span>
          </div>
          <button 
            onClick={() => { setIsOpen(false) }} 
            className="lg:hidden p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800"
          >
            <X />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            <li>
              <NavLink
                to="/owner/overview"
                end
                onClick={() => {
                  // Chỉ đóng sidebar trên mobile (< 1024px)
                  if (window.innerWidth < 1024) {
                    setIsOpen(false);
                  }
                }}
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    : "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >
                <LayoutDashboard className="w-5 h-5" />
                Tổng quan
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/owner/vehicle-management"
                onClick={() => {
                  // Chỉ đóng sidebar trên mobile (< 1024px)
                  if (window.innerWidth < 1024) {
                    setIsOpen(false);
                  }
                }}
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    : "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >
                <Car className="w-5 h-5" />
                Quản lý xe
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/owner/booking-management"
                onClick={() => {
                  // Chỉ đóng sidebar trên mobile (< 1024px)
                  if (window.innerWidth < 1024) {
                    setIsOpen(false);
                  }
                }}
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    : "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >
                <Calendar className="w-5 h-5" />
                Quản lý đơn thuê
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/owner/transaction-management"
                onClick={() => {
                  // Chỉ đóng sidebar trên mobile (< 1024px)
                  if (window.innerWidth < 1024) {
                    setIsOpen(false);
                  }
                }}
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    : "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >
                <ArrowLeftRight className="w-5 h-5" />
                Quản lí giao dịch
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/owner/revenue"
                onClick={() => {
                  // Chỉ đóng sidebar trên mobile (< 1024px)
                  if (window.innerWidth < 1024) {
                    setIsOpen(false);
                  }
                }}
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    : "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >
                <TrendingUp className="w-5 h-5" />
                Doanh thu
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/owner/traffic-fine-search"
                onClick={() => {
                  // Chỉ đóng sidebar trên mobile (< 1024px)
                  if (window.innerWidth < 1024) {
                    setIsOpen(false);
                  }
                }}
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    : "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >
                <Receipt className="w-5 h-5" />
                Tra Cứu Phạt Nguội
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/owner/vehicle-reviews"
                onClick={() => {
                  // Chỉ đóng sidebar trên mobile (< 1024px)
                  if (window.innerWidth < 1024) {
                    setIsOpen(false);
                  }
                }}
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    : "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >
                <ClipboardList className="w-5 h-5" />
                Đánh giá về xe của tôi
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/owner/notifications"
                onClick={() => {
                  // Chỉ đóng sidebar trên mobile (< 1024px)
                  if (window.innerWidth < 1024) {
                    setIsOpen(false);
                  }
                }}
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    : "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >
                <Bell className="w-5 h-5" />
                Thông báo
                {unreadCount > 0 && (
                  <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            </li>
            <li>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleLogout(e);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800 text-red-500 dark:text-red-400"
              >
                <LogOut className="w-5 h-5" />
                Đăng Xuất
              </button>
            </li>
          </ul>
        </nav>

        {/* bottom : owner user name */}
        <div className="border-t border-secondary-200 dark:border-secondary-800 p-4 mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {avatar ? (
                <img src={avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                getInitials()
              )}
            </div>
            <div className="flex-1 transition-opacity min-w-0">
              <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                {full_name || "Chủ xe"}
              </p>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate">
                {email || ""}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default SidebarOwner;
