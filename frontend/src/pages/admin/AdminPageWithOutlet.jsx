import { Link, NavLink, Outlet } from "react-router-dom";
import {
  CheckCircle2Icon,
  Gift,
  Heart,
  MessageCircle,
  Car,
  X,
  Menu,
  Search,
  Sun,
  Bell,
  User2,
  LogOut,
  Hexagon,
  Moon,
  SearchCheck,
  CardSimIcon,
  AlertTriangle,
  ChartArea,
  Backpack,
  ArrowBigLeft,
} from "lucide-react";
import { useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { MdAnalytics } from "react-icons/md";
import { BiMoneyWithdraw } from "react-icons/bi";
import axiosInstance from "@/config/axiosInstance";
import { FaBackspace } from "react-icons/fa";

const AdminPage = () => {
  // state for click menu sidebar :
  const [isOpenMenuSideBar, setIsOpenMenuSideBar] = useState(false);
  // state for show notification dropdown :
  const [isOpenNotificationDropdown, setIsOpenNotificationDropdown] =
    useState(false);
  // state for theme (dark / light) :
  const [theme, setTheme] = useState(
    localStorage.theme ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light")
  );
  // state for pending traffic fine requests count
  const [pendingTrafficFineCount, setPendingTrafficFineCount] = useState(0);
  // state for notifications
  const [notifications, setNotifications] = useState([]);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Fetch pending traffic fine requests count
  const fetchPendingCount = async () => {
    try {
      const response = await axiosInstance.get(
        "/api/admin/traffic-fine-requests/stats"
      );
      if (response.data.success) {
        setPendingTrafficFineCount(response.data.data.pending || 0);
      }
    } catch (error) {
      console.error("Error fetching pending traffic fine count:", error);
    }
  };

  useEffect(() => {
    fetchPendingCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);

    // Listen for custom event to refresh count
    const handleRefreshCount = () => {
      fetchPendingCount();
    };
    window.addEventListener("refreshTrafficFineCount", handleRefreshCount);

    return () => {
      clearInterval(interval);
      window.removeEventListener("refreshTrafficFineCount", handleRefreshCount);
    };
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await axiosInstance.get("/api/admin/notifications", {
        params: { limit: 5, page: 1 },
      });
      if (response.data.success) {
        setNotifications(response.data.data.notifications || []);
        setNotificationUnreadCount(response.data.data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching admin notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await axiosInstance.patch(
        `/api/admin/notifications/${notificationId}/read`
      );
      if (response.data.success) {
        // Update notification in list
        setNotifications((prev) =>
          prev.map((n) =>
            n.notification_id === notificationId ? { ...n, is_read: true } : n
          )
        );
        // Update unread count
        if (response.data.data?.unreadCount !== undefined) {
          setNotificationUnreadCount(response.data.data.unreadCount);
        } else {
          setNotificationUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      const response = await axiosInstance.patch(
        "/api/admin/notifications/mark-all-read"
      );
      if (response.data.success) {
        // Update all notifications to read
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        // Reset unread count
        setNotificationUnreadCount(0);
        // Refresh notifications to get updated list
        await fetchNotifications();
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Format notification date
  const formatNotificationDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "Vừa xong";
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    if (diffInMinutes < 10080)
      return `${Math.floor(diffInMinutes / 1440)} ngày trước`;

    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.theme = isDark ? "dark" : "light";
    setTheme(localStorage.theme);
  };

  // state for search shortcut (cmd + k) :
  const inputRef = useRef(null);
  const notificationDropdownRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      // Detect Ctrl + K (or Cmd + K on Mac)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); // Stop default browser search shortcut
        inputRef.current?.focus(); // Focus the input
      }
      // Close notification dropdown on Escape key
      if (e.key === "Escape" && isOpenNotificationDropdown) {
        setIsOpenNotificationDropdown(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpenNotificationDropdown]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(event.target) &&
        isOpenNotificationDropdown
      ) {
        setIsOpenNotificationDropdown(false);
      }
    }

    if (isOpenNotificationDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpenNotificationDropdown]);

  // check if user if logged in
  const { role } = useSelector((state) => state.userStore);
  if (role !== "admin") {
    return (
      <div className="w-full py-20 text-center text-gray-500">
        Vui lòng{" "}
        <Link to="/" className="text-blue-500 underline">
          đăng nhập bằng tài khoản quản trị viên admin
        </Link>{" "}
        để truy cập trang tài khoản của bạn.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-100 dark:bg-secondary-950">
      {/* dark layer when click to mobile navbar icon : */}
      <div
        onClick={() => {
          setIsOpenMenuSideBar(false);
        }}
        className={` ${
          isOpenMenuSideBar ? "block" : "hidden"
        } fixed inset-0 bg-black/50 z-40 lg:hidden`}
      ></div>

      {/* side bar : */}
      <aside
        className={`${
          isOpenMenuSideBar
            ? "fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out bg-white dark:bg-secondary-900 border-r border-secondary-200 dark:border-secondary-800 flex flex-col lg:z-30 lg:w-64 translate-x-0 w-64"
            : "fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out bg-white dark:bg-secondary-900 border-r border-secondary-200 dark:border-secondary-800 flex flex-col lg:z-30 lg:w-64 -translate-x-full lg:translate-x-0"
        } `}
      >
        {/* Rentzy Logo :  */}
        <div className="flex items-center h-16 px-4 border-b border-secondary-200 dark:border-secondary-800 justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              <ArrowBigLeft />
            </div>
            <span className="text-xl font-bold text-secondary-900 dark:text-white transition-opacity">
              Rentzy
            </span>
          </a>
          <button
            onClick={() => {
              setIsOpenMenuSideBar(false);
            }}
            className="lg:hidden p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800"
          >
            <X />
          </button>
        </div>
        {/* list of navigation :  */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            <li>
              <NavLink
                to="/admin"
                end
                onClick={() => {
                  setIsOpenMenuSideBar(false);
                }}
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    : "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >
                <User2 className="w-5 h-5 " />
                Tổng Quan
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/userManagement"
                onClick={() => {
                  setIsOpenMenuSideBar(false);
                }}
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    : "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >
                <User2 className="w-5 h-5 " />
                Quản Lý Người Dùng
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/admin/userchart"
                onClick={() => {
                  setIsOpenMenuSideBar(false);
                }}
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    : "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >
                <ChartArea className="w-5 h-5 " />
                Biểu Đồ Người Dùng
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/admin/approvalvehicle"
                onClick={() => {
                  setIsOpenMenuSideBar(false);
                }}
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    : "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >
                <Car
                  className="w-5 h-5 
                
                "
                />
                Chấp Nhận Xe
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/managementvehicle"
                onClick={() => {
                  setIsOpenMenuSideBar(false);
                }}
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    : "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >
                <MdAnalytics
                  className="w-5 h-5 
                
                "
                />
                Quản Lý Phương Tiện
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/admin/managementBrand"
                onClick={() => {
                  setIsOpenMenuSideBar(false);
                }}
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    : "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >
                <Hexagon
                  className="w-5 h-5 
                
                "
                />
                Quản Lý Thương Hiệu
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/admin/approveOwner"
                onClick={() => {
                  setIsOpenMenuSideBar(false);
                }}
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    : "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >
                <Heart
                  className="w-5 h-5 
                
                "
                />
                Chấp Nhận Chủ Xe
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/messages"
                onClick={() => {
                  setIsOpenMenuSideBar(false);
                }}
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    : "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >
                <MessageCircle
                  className="w-5 h-5 
                
                "
                />
                Nhắn Tin
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/reports"
                onClick={() => {
                  setIsOpenMenuSideBar(false);
                }}
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    : "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >
                <CheckCircle2Icon
                  className="w-5 h-5 
                
                "
                />
                Xử Lý Báo Cáo
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/revenue-stats"
                onClick={() => {
                  setIsOpenMenuSideBar(false);
                }}
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    : "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >
                <BiMoneyWithdraw
                  className="w-5 h-5 
                
                "
                />
                Thống Kê Doanh Thu
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/refundManagement"
                onClick={() => {
                  setIsOpenMenuSideBar(false);
                }}
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    : "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >
                <Gift
                  className="w-5 h-5 
                
                "
                />
                Quản Lý Hoàn Tiền
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/payoutManagement"
                onClick={() => {
                  setIsOpenMenuSideBar(false);
                }}
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    : "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >
                <Car
                  className="w-5 h-5 
                
                "
                />
                Giải Ngân Chủ Xe
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/trafficFinePayout"
                onClick={() => {
                  setIsOpenMenuSideBar(false);
                }}
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    : "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >
                <CheckCircle2Icon className="w-5 h-5" />
                Chuyển Tiền Phạt Nguội
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/voucherManagement"
                onClick={() => {
                  setIsOpenMenuSideBar(false);
                }}
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    : "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >
                <Car
                  className="w-5 h-5 
                
                "
                />
                Quản Lý Phiếu Giảm Giá
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/trafficFineApproval"
                onClick={() => {
                  setIsOpenMenuSideBar(false);
                }}
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    : "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >
                <div className="relative">
                  <AlertTriangle
                    className="w-5 h-5 
                  
                  "
                  />
                  {pendingTrafficFineCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </div>
                <span>Duyệt Phạt Nguội</span>
                {pendingTrafficFineCount > 0 && (
                  <span className="ml-auto flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-white bg-red-500 rounded-full">
                    {pendingTrafficFineCount > 99
                      ? "99+"
                      : pendingTrafficFineCount}
                  </span>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/systemSettings"
                onClick={() => {
                  setIsOpenMenuSideBar(false);
                }}
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    : "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >
                <CardSimIcon className="w-5 h-5" />
                Quản Lý Hệ Thống
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/logout"
                onClick={() => {
                  setIsOpenMenuSideBar(false);
                }}
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    : "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >
                <LogOut
                  className="w-5 h-5 text-red-400
                
                "
                />
                Đăng Xuất
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* bottom : admin user name ... */}
        <div className="border-t border-secondary-200 dark:border-secondary-800 p-4 mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
              AS
            </div>
            <div className="flex-1 transition-opacity">
              <p className="text-sm font-medium text-secondary-900 dark:text-white">
                Admin User
              </p>
              <p className="text-xs text-secondary-500 dark:text-secondary-400">
                rentzy.vehicle@gmail.com
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* header :  */}
      <div
        className="fixed top-0 right-0 z-20 h-16 bg-white dark:bg-secondary-900 border-b
                 border-secondary-200
                 dark:border-secondary-800 transition-all duration-300 lg:left-64 left-0"
      >
        <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setIsOpenMenuSideBar(true);
              }}
              className="lg:hidden p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
            >
              <Menu />
            </button>
            <button className="hidden lg:block p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors">
              <Menu />
            </button>
            <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-secondary-100 dark:bg-secondary-800 rounded-lg min-w-[300px] hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-colors">
              <Search />
              <input
                ref={inputRef}
                type="text"
                className="flex-1 text-sm text-secondary-500 dark:text-secondary-400 bg-transparent outline-none"
                placeholder="Search..."
              />

              <kbd className="hidden lg:inline-flex h-6 select-none items-center gap-0.5 rounded border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-700 px-2 font-mono text-xs font-medium text-secondary-600 dark:text-secondary-400">
                <span className="text-sm">⌘</span>
                "K"
              </kbd>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="md:hidden p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors">
              <Search />
            </button>
            <div className="relative">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors outline-none"
              >
                {theme === "dark" ? <Sun /> : <Moon />}
              </button>
            </div>
            <div className="relative" ref={notificationDropdownRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpenNotificationDropdown(!isOpenNotificationDropdown);
                  if (!isOpenNotificationDropdown) {
                    fetchNotifications();
                  }
                }}
                className="relative p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 hover:text-green-500 transition-colors outline-none cursor-pointer"
              >
                <Bell />
                {notificationUnreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                    {notificationUnreadCount > 99
                      ? "99+"
                      : notificationUnreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {isOpenNotificationDropdown && (
                <>
                  {/* dark background overlay for notification dropdown close - hiển thị trên cả desktop và mobile */}
                  <div
                    onClick={() => {
                      setIsOpenNotificationDropdown(false);
                    }}
                    className="fixed inset-0 bg-black/50 z-40"
                  ></div>

                  {/* Dropdown content */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl bg-white dark:bg-secondary-800 shadow-lg border border-secondary-200/50 dark:border-secondary-700/50 overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-secondary-200 dark:border-secondary-700">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-secondary-900 dark:text-white">
                          Notifications
                        </h3>
                        <div className="flex items-center gap-2">
                          {notificationUnreadCount > 0 && (
                            <span className="badge badge-primary px-2 py-0.5 text-xs text-[#1e40af] bg-[#dbeafe] rounded-xl">
                              {notificationUnreadCount} New
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setIsOpenNotificationDropdown(false);
                            }}
                            className="p-1 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
                            aria-label="Đóng thông báo"
                          >
                            <X className="w-4 h-4 text-secondary-500 dark:text-secondary-400" />
                          </button>
                        </div>
                      </div>
                      {notificationUnreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="w-full text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium py-1.5 px-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                        >
                          Đánh dấu tất cả đã đọc
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {loadingNotifications ? (
                        <div className="px-4 py-8 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-secondary-500 dark:text-secondary-400">
                          <p className="text-sm">Không có thông báo nào</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <button
                            key={notification.notification_id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!notification.is_read) {
                                handleMarkAsRead(notification.notification_id);
                              }
                            }}
                            className={`w-full px-4 py-3 text-left transition-colors border-b border-secondary-100 dark:border-secondary-700 last:border-0 hover:bg-secondary-50 dark:hover:bg-secondary-700/50 ${
                              !notification.is_read
                                ? "bg-primary-50/50 dark:bg-primary-900/10"
                                : ""
                            }`}
                          >
                            <div className="flex gap-3">
                              <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-success-600 dark:text-success-400 bg-success-100 dark:bg-success-900/20">
                                <CheckCircle2Icon className="text-green-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-0.5 line-clamp-2">
                                  {notification.content}
                                </p>
                                <p className="text-xs text-secondary-500 dark:text-secondary-500 mt-1">
                                  {formatNotificationDate(
                                    notification.created_at
                                  )}
                                </p>
                              </div>
                              {!notification.is_read && (
                                <div className="flex-shrink-0">
                                  <span className="w-2 h-2 bg-primary-600 rounded-full block"></span>
                                </div>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="relative">
              <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors outline-none">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                  AS
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-secondary-900 dark:text-white">
                    Admin User
                  </p>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">
                    rentzy.vehicle@gmail.com
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* main content */}
      <main className="pt- transition-all duration-300 lg:ml-64">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminPage;
