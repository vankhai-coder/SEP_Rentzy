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
  Moon,
  SearchCheck,
  CardSimIcon,
  AlertTriangle,
} from "lucide-react";
import { useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { MdAnalytics } from "react-icons/md";

const AdminPage = () => {

  // state for click menu sidebar : 
  const [isOpenMenuSideBar, setIsOpenMenuSideBar] = useState(false);
  // state for show notification dropdown :
  const [isOpenNotificationDropdown, setIsOpenNotificationDropdown] = useState(false);
  // state for theme (dark / light) :
  const [theme, setTheme] = useState(localStorage.theme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.theme = isDark ? "dark" : "light";
    setTheme(localStorage.theme);
  };

  // state for search shortcut (cmd + k) :
  const inputRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      // Detect Ctrl + K (or Cmd + K on Mac)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); // Stop default browser search shortcut
        inputRef.current?.focus(); // Focus the input
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);


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
      <div onClick={() => { setIsOpenMenuSideBar(false) }} className={` ${isOpenMenuSideBar ? "block" : "hidden"} fixed inset-0 bg-black/50 z-40 lg:hidden`}></div>

      {/* side bar : */}
      <aside className={`${isOpenMenuSideBar
        ?
        "fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out bg-white dark:bg-secondary-900 border-r border-secondary-200 dark:border-secondary-800 flex flex-col lg:z-30 lg:w-64 translate-x-0 w-64"
        :
        "fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out bg-white dark:bg-secondary-900 border-r border-secondary-200 dark:border-secondary-800 flex flex-col lg:z-30 lg:w-64 -translate-x-full lg:translate-x-0"
        } `}
      >
        {/* Rentzy Logo :  */}
        <div className="flex items-center h-16 px-4 border-b border-secondary-200 dark:border-secondary-800 justify-between">
          <a href="/rentzy" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">

              T
            </div>
            <span className="text-xl font-bold text-secondary-900 dark:text-white transition-opacity">
              TailPanel
            </span>
          </a>
          <button onClick={() => { setIsOpenMenuSideBar(false) }} className="lg:hidden p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800">
            <X />
          </button>
        </div>
        {/* list of navigation :  */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            <li>
              <NavLink to="/admin" end
                onClick={() => {
                  setIsOpenMenuSideBar(false)
                }}
                className={({ isActive }) =>
                  isActive ?
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    :
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >
                <User2 className="w-5 h-5 "
                />
                Tổng Quan 
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/userManagement"
                onClick={() => {
                  setIsOpenMenuSideBar(false)
                }}
                className={({ isActive }) =>
                  isActive ?
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    :
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >
                <User2 className="w-5 h-5 "
                />
                Quản Lý Người Dùng
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/approvalvehicle"
                onClick={() => {
                  setIsOpenMenuSideBar(false)
                }}
                className={({ isActive }) =>
                  isActive ?
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    :
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >

                <Car className="w-5 h-5 
                
                " />
                Chấp Nhận Xe
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/managementvehicle"
                onClick={() => {
                  setIsOpenMenuSideBar(false)
                }}
                className={({ isActive }) =>
                  isActive ?
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    :
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >
                <MdAnalytics className="w-5 h-5 
                
                " />
                Quản Lý Phương Tiện
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/approveOwner"
                onClick={() => {
                  setIsOpenMenuSideBar(false)
                }}
                className={({ isActive }) =>
                  isActive ?
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    :
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                }
              >
                <Heart className="w-5 h-5 
                
                " />
                Chấp Nhận Chủ Xe
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/messages"
                onClick={() => {
                  setIsOpenMenuSideBar(false)
                }}
                className={({ isActive }) =>
                  isActive ?
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    :
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"}>
                <MessageCircle className="w-5 h-5 
                
                " />
                Nhắn Tin
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/reports"
                onClick={() => {
                  setIsOpenMenuSideBar(false)
                }}
                className={({ isActive }) =>
                  isActive ?
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    :
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"}>
                <CheckCircle2Icon className="w-5 h-5 
                
                " />
                Xử Lý Báo Cáo
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/revenue-stats"
                onClick={() => {
                  setIsOpenMenuSideBar(false)
                }}
                className={({ isActive }) =>
                  isActive ?
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    :
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"}>
                <Gift className="w-5 h-5 
                
                " />
                Thống Kê Doanh Thu
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/refundManagement"
                onClick={() => {
                  setIsOpenMenuSideBar(false)
                }}
                className={({ isActive }) =>
                  isActive ?
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    :
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"}>
                <Gift className="w-5 h-5 
                
                " />
                Quản Lý Hoàn Tiền
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/payoutManagement"
                onClick={() => {
                  setIsOpenMenuSideBar(false)
                }}
                className={({ isActive }) =>
                  isActive ?
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    :
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"}>
                <Car className="w-5 h-5 
                
                " />
                Giải Ngân Chủ Xe
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/voucherManagement"
                onClick={() => {
                  setIsOpenMenuSideBar(false)
                }}
                className={({ isActive }) =>
                  isActive ?
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    :
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"}>
                <Car className="w-5 h-5 
                
                " />
                Quản Lý Phiếu Giảm Giá
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/trafficFineApproval"
                onClick={() => {
                  setIsOpenMenuSideBar(false)
                }}
                className={({ isActive }) =>
                  isActive ?
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    :
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"}>
                <AlertTriangle className="w-5 h-5 
                
                " />
                Duyệt Phạt Nguội
              </NavLink>
            </li>
            <li>
              <NavLink to="/logout"
                onClick={() => {
                  setIsOpenMenuSideBar(false)
                }}
                className={({ isActive }) =>
                  isActive ?
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    :
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"}>
                <LogOut className="w-5 h-5 text-red-400
                
                " />
                Đăng Xuất
              </NavLink>
            </li>


          </ul>
        </nav>

        {/* bottom : admin user name ... */}
        <div className="border-t border-secondary-200 dark:border-secondary-800 p-4 mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold flex-shrink-0">AS</div>
            <div className="flex-1 transition-opacity">
              <p className="text-sm font-medium text-secondary-900 dark:text-white">Admin User</p>
              <p cl></p>
            </div>
          </div>
        </div>
      </aside>

      {/* header :  */}
      <div className="fixed top-0 right-0 z-20 h-16 bg-white dark:bg-secondary-900 border-b
                 border-secondary-200
                 dark:border-secondary-800 transition-all duration-300 lg:left-64 left-0">
        <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => { setIsOpenMenuSideBar(true) }} className="lg:hidden p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors">
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
              <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors outline-none">
                {theme === "dark" ? <Sun /> : <Moon />}
              </button>
            </div>
            <div className="relative">
              <button onClick={() => { setIsOpenNotificationDropdown(!isOpenNotificationDropdown) }} className="relative p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors outline-none">
                <Bell />
                <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
                  2
                </span>
              </button>

              {/* dark background overlay for notification dropdown close */}
              <div onClick={() => { setIsOpenNotificationDropdown(false) }} className={` ${isOpenNotificationDropdown ? "block" : "hidden"} fixed inset-0 bg-black/50 z-40 lg:hidden`}></div>

              <div className={` ${isOpenNotificationDropdown ? "block" : "hidden"} absolute right-0 mt-2 w-80 origin-top-right rounded-xl bg-white dark:bg-secondary-800 shadow-lg border border-secondary-200/50 dark:border-secondary-700/50 overflow-hidden z-50`}>
                <div className="px-4 py-3 border-b border-secondary-200 dark:border-secondary-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-secondary-900 dark:text-white">Notifications</h3>
                    <span className="badge badge-primary px-2 py-0.5 text-xs text-[#1e40af] bg-[#dbeafe] rounded-xl">
                      2 New
                    </span>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {/* one notification */}
                  <button className="w-full px-4 py-3 text-left transition-colors border-b border-secondary-100 dark:border-secondary-700 last:border-0 hover:bg-secondary-50 dark:hover:bg-secondary-700/50 bg-primary-50/50 dark:bg-primary-900/10">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-success-600 dark:text-success-400 bg-success-100 dark:bg-success-900/20">
                        <CheckCircle2Icon className="text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">Order Completed</p>
                        <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-0.5 line-clamp-2">Your order #1234 has been completed</p>
                        <p className="text-xs text-secondary-500 dark:text-secondary-500 mt-1">5 minutes ago</p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="w-2 h-2 bg-primary-600 rounded-full block"></span>
                      </div>
                    </div>

                  </button>
                  {/* one notification */}
                  <button className="w-full px-4 py-3 text-left transition-colors border-b border-secondary-100 dark:border-secondary-700 last:border-0 hover:bg-secondary-50 dark:hover:bg-secondary-700/50 bg-primary-50/50 dark:bg-primary-900/10">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-success-600 dark:text-success-400 bg-success-100 dark:bg-success-900/20">
                        <CheckCircle2Icon className="text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">Order Completed</p>
                        <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-0.5 line-clamp-2">Your order #1234 has been completed</p>
                        <p className="text-xs text-secondary-500 dark:text-secondary-500 mt-1">5 minutes ago</p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="w-2 h-2 bg-primary-600 rounded-full block"></span>
                      </div>
                    </div>

                  </button>
                </div>
              </div>
            </div>
            <div className="relative">
              <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors outline-none">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                  AS
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-secondary-900 dark:text-white">Admin User</p>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">admin@example.com</p>
                </div>

              </button>
            </div>

          </div>
        </div>
      </div>

      {/* main content */}
      <main className="pt-16 transition-all duration-300 lg:ml-64">
        <Outlet />
      </main>

    </div>

  );
};

export default AdminPage;
