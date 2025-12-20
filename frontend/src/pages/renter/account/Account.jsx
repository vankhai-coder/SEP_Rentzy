import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectGroup } from "@radix-ui/react-select";
import {
  CheckCircle2Icon,
  Gift,
  List,
  Heart,
  LocationEditIcon,
  LockIcon,
  MapPinCheck,
  Trash2,
  User,
  Star,
  ArrowRightLeft,
  AlertCircle,
  CreditCard,
  LayoutDashboard,
  Bell,
  Receipt,
  MessageSquare,
} from "lucide-react";
import { BiLogOut } from "react-icons/bi";
import { useSelector } from "react-redux";
import axiosInstance from "@/config/axiosInstance";
import { useQuery } from "@tanstack/react-query";

const Account = () => {
  // check if user if logged in
  const { userId, role } = useSelector((state) => state.userStore);
  // use useQuery from tank stack to check if user auth method is email : /api/auth/is-auth-method-email using axiosInstance
  const checkIfUserAuthMethodIsEmail = async () => {

    try {
      const response = await axiosInstance.get("/api/auth/is-auth-method-email");
      return response.data.isEmailAuth;
    } catch (error) {
      console.error("Error checking user auth method:", error);
      return false;
    }
  };
  const { data: isEmailAuth, isLoading: isLoadingCheckIfUserAuthMethodIsEmail,
    isError: isErrorCheckIfUserAuthMethodIsEmail } = useQuery({
      queryKey: ["isUserAuthMethodEmail", userId],
      queryFn: checkIfUserAuthMethodIsEmail,
      enabled: !!userId, // only run this query if userId exists
    });

  console.log("isEmailAuth:", isEmailAuth);
  console.log("isLoadingCheckIfUserAuthMethodIsEmail:", isLoadingCheckIfUserAuthMethodIsEmail);
  console.log("isErrorCheckIfUserAuthMethodIsEmail:", isErrorCheckIfUserAuthMethodIsEmail);

  const navigate = useNavigate();
  const location = useLocation();

  // Valid routes in the Select dropdown
  const validRoutes = [
    "/account",
    "/notifications",
    "/booking-history",
    "/my-reviews",
    "/owner",
    "/register_owner",
    "/favorites",
    "/my-reports",
    "/mytrips",
    "/longtermrenting",
    "/points",
    "/myreward",
    "/myaddress",
    "/bank-accounts",
    "/traffic-fine-search",
    "/resetpw",
    "/deleteaccount",
  ];

  // Map pathname to page name
  const getPageName = (pathname) => {
    // Handle routes that start with specific paths
    if (pathname.startsWith("/account")) {
      return "Tài khoản của tôi";
    }
    if (pathname.startsWith("/owner")) {
      return "Bảng điều khiển chủ xe";
    }

    const pageMap = {
      "/account": "Tài khoản của tôi",
      "/notifications": "Thông báo",
      "/booking-history": "Danh sách thuê xe",
      "/my-reviews": "Đánh giá của tôi",
      "/owner": "Bảng điều khiển chủ xe",
      "/register_owner": "Bảng điều khiển chủ xe",
      "/favorites": "Xe yêu thích",
      "/my-reports": "Xe đã báo cáo",
      "/longtermrenting": "Đơn hàng Thuê xe dài hạn",
      "/points": "Điểm thưởng",
      "/myaddress": "Địa chỉ của tôi",
      "/bank-accounts": "Tài khoản ngân hàng",
      "/traffic-fine-search": "Tra Cứu Phạt Nguội",
      "/resetpw": "Đổi mật khẩu",
      "/deleteaccount": "Yêu cầu xóa tài khoản",
    };
    return pageMap[pathname] || "Tài khoản của tôi";
  };

  const currentPageName = getPageName(location.pathname);

  // Check if current pathname matches any valid route
  const getSelectValue = () => {
    if (location.pathname === "/logout") {
      return undefined;
    }
    // Check if pathname exactly matches a valid route
    if (validRoutes.includes(location.pathname)) {
      return location.pathname;
    }
    // Check if pathname starts with /account or /owner
    if (location.pathname.startsWith("/account") || location.pathname.startsWith("/owner")) {
      return location.pathname.startsWith("/account") ? "/account" : "/owner";
    }
    return undefined;
  };

  const baseClass =
    "flex items-center gap-2 py-2 hover:cursor-pointer hover:bg-gray-100 hover:opacity-70 pl-5";

  const activeClass = "border-l-4 border-l-green-500  font-semibold bg-gray-50";

  // useEffect(() => {
  //   if (role === "admin") {
  //     navigate("/admin", { replace: true });
  //   }
  // }, [role, navigate]);

  if (!userId) {
    return (
      <div className="w-full py-20 text-center text-gray-500">
        Vui lòng{" "}
        <Link to="/" className="text-blue-500 underline">
          đăng nhập
        </Link>{" "}
        để truy cập trang tài khoản của bạn.
      </div>
    );
  }

  // if (role === "admin") {
  //   navigate("/admin", { replace: true });
  //   return null;
  // }

  return (
    <div className="p-8 xs:px-4 sm:px-8 md:px-12 lg:px-24 xm:pt-2 sm:pt-6 md:pt-16 mb-16 w-full max-w-full overflow-x-hidden box-border">
      {/* mobile: nav list */}
      <Select
        onValueChange={(value) => {
          navigate(value);
        }}
        value={getSelectValue()}
      >
        <SelectTrigger className="lg:hidden w-full text-md font-medium py-4 bg-[#ffffff] mb-6 md:mb-10">
          <SelectValue placeholder={currentPageName} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem
              className={"border-b-1 py-2 text-md font-medium"}
              value="/account"
            >
              <User /> Tài khoản của tôi
            </SelectItem>
            <SelectItem
              className={"border-b-1 py-2 text-md font-medium"}
              value="/notifications"
            >
              <Bell /> Thông báo
            </SelectItem>
            <SelectItem
              className={"border-b-1 py-2 text-md font-medium"}
              value="/booking-history"
            >
              <List /> Danh sách thuê xe
            </SelectItem>
            <SelectItem
              className={"border-b-1 py-2 text-md font-medium"}
              value="/my-reviews"
            >
              <Star /> Đánh giá của tôi
            </SelectItem>
            {/* Bảng điều khiển chủ xe ở vị trí thứ 5 */}
            {role === "owner" &&
              <SelectItem
                className={"border-b-1 py-2 text-md font-medium"}
                value={'/owner'}
              >
                <LayoutDashboard /> Bảng điều khiển chủ xe
              </SelectItem>
            }
            {/* Bảng điều khiển admin */}
            {role === "admin" &&
              <SelectItem
                className={"border-b-1 py-2 text-md font-medium"}
                value={"/admin"}
              >
                <LayoutDashboard /> Bảng điều khiển quản trị viên
              </SelectItem>
            }
            <SelectItem
              className={"border-b-1 py-2 text-md font-medium"}
              value="/favorites"
            >
              <Heart /> Xe yêu thích
            </SelectItem>
            <SelectItem
              className={"border-b-1 py-2 text-md font-medium"}
              value="/my-reports"
            >
              <AlertCircle size={20} /> Xe đã báo cáo
            </SelectItem>
            <SelectItem
              className={"border-b-1 py-2 text-md font-medium"}
              value="/longtermrenting"
            >
              <CheckCircle2Icon />
              Đơn hàng Thuê xe dài hạn
            </SelectItem>
            <SelectItem
              className={"border-b-1 py-2 text-md font-medium"}
              value="/points"
            >
              <Gift /> Điểm thưởng
            </SelectItem>
            <SelectItem
              className={"border-b-1 py-2 text-md font-medium"}
              value="/messages"
            >
              <MessageSquare /> Tin nhắn
            </SelectItem>
            <SelectItem
              className={"border-b-1 py-2 text-md font-medium"}
              value="/myaddress"
            >
              <LocationEditIcon /> Địa chỉ của tôi
            </SelectItem>
            <SelectItem
              className={"border-b-1 py-2 text-md font-medium"}
              value="/bank-accounts"
            >
              <CreditCard /> Tài khoản ngân hàng
            </SelectItem>
            <SelectItem
              className={"border-b-1 py-2 text-md font-medium"}
              value="/traffic-fine-search"
            >
              <Receipt /> Tra Cứu Phạt Nguội
            </SelectItem>
            {isEmailAuth &&
              <SelectItem
                className={"border-b-1 py-2 text-md font-medium"}
                value="/resetpw"
              >
                <LockIcon /> Đổi mật khẩu
              </SelectItem>
            }
            <SelectItem
              className={"border-b-1 py-2 text-md font-medium"}
              value="/deleteaccount"
            >
              <Trash2 />
              Yêu cầu xóa tài khoản
            </SelectItem>
            <SelectItem
              className={"border-b-1 py-2 text-md font-medium text-red-500"}
              value="/logout"
            >
              {" "}
              <BiLogOut size={20} />
              Đăng xuất
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* laptop : nav list */}
      <div className="grid lg:grid-cols-5 gap-10">
        {/* sidebar nav : */}
        <div className=" hidden lg:block col-span-1 sticky top-6 h-screen">
          <div>
            <div className="text-3xl font-bold text-center pb-4 border-b-1">
              Xin chào bạn!
            </div>
            <NavLink
              to="/account"
              className={({ isActive }) =>
                isActive ? `${baseClass} ${activeClass}` : baseClass
              }
            >
              <User /> Tài khoản của tôi
            </NavLink>

            <NavLink
              to="/favorites"
              className={({ isActive }) =>
                isActive ? `${baseClass} ${activeClass}` : baseClass
              }
            >
              <Heart /> Xe yêu thích
            </NavLink>
            <NavLink
              to="/my-reports"
              className={({ isActive }) =>
                isActive ? `${baseClass} ${activeClass}` : baseClass
              }
            >
              <AlertCircle size={20} /> Xe đã báo cáo
            </NavLink>
            <NavLink
              to="/booking-history"
              className={({ isActive }) =>
                isActive ? `${baseClass} ${activeClass}` : baseClass
              }
            >
              <List size={20} /> Danh sách thuê xe
            </NavLink>
            <NavLink
              to="/my-reviews"
              className={({ isActive }) =>
                isActive ? `${baseClass} ${activeClass}` : baseClass
              }
            >
              <Star size={20} /> Đánh giá của tôi
            </NavLink>

            {/* Bảng điều khiển chủ xe ở vị trí thứ 5 */}
            {
              role === "owner" &&
              <NavLink
                to={"/owner"}
                className={({ isActive }) =>
                  isActive ? `${baseClass} ${activeClass}` : baseClass
                }
              >
                <LayoutDashboard /> Bảng điều khiển chủ xe
              </NavLink>
            }

            {/* Bảng điều khiển admin */}
            {
              role === "admin" &&
              <NavLink
                to={"/admin"}
                className={({ isActive }) =>
                  isActive ? `${baseClass} ${activeClass}` : baseClass
                }
              >
                <LayoutDashboard /> Bảng điều khiển quản trị viên
              </NavLink>
            }

            <NavLink
              to="/transactions"
              className={({ isActive }) =>
                isActive ? `${baseClass} ${activeClass}` : baseClass
              }
            >
              <ArrowRightLeft /> Lịch sử giao dịch
            </NavLink>

            <NavLink
              to="/points"
              className={({ isActive }) =>
                isActive ? `${baseClass} ${activeClass}` : baseClass
              }
            >
              <Gift /> Điểm thưởng
            </NavLink>
            <NavLink
              to="/messages"
              className={({ isActive }) =>
                isActive ? `${baseClass} ${activeClass}` : baseClass
              }
            >
              <MessageSquare /> Tin nhắn
            </NavLink>
            <NavLink
              to="/notifications"
              className={({ isActive }) =>
                isActive ? `${baseClass} ${activeClass}` : baseClass
              }
            >
              <Bell /> Thông báo
            </NavLink>
            <NavLink
              to="/bank-accounts"
              className={({ isActive }) =>
                isActive ? `${baseClass} ${activeClass}` : baseClass
              }
            >
              <CreditCard /> Tài khoản ngân hàng
            </NavLink>
            <NavLink
              to="/traffic-fine-search"
              className={({ isActive }) =>
                isActive ? `${baseClass} ${activeClass}` : baseClass
              }
            >
              <Receipt /> Tra Cứu Phạt Nguội
            </NavLink>

            {
              isEmailAuth &&
              <NavLink
                to="/resetpw"
                className={({ isActive }) =>
                  isActive ? `${baseClass} ${activeClass}` : baseClass
                }
              >
                <LockIcon /> Đổi mật khẩu
              </NavLink>
            }

            <NavLink
              to="/deleteaccount"
              className={({ isActive }) =>
                isActive ? `${baseClass} ${activeClass}` : baseClass
              }
            >
              <Trash2 /> Yêu cầu xóa tài khoản
            </NavLink>

            <NavLink
              to="/logout"
              className={({ isActive }) =>
                isActive
                  ? `${baseClass} ${activeClass} text-red-500`
                  : `${baseClass} text-red-400`
              }
            >
              <BiLogOut size={26} /> Đăng xuất
            </NavLink>
          </div>
        </div>
        {/* outlet */}
        <div className="col-span-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Account;
