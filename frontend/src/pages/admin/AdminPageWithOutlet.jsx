import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
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
  MessageCircle,
  Car,
  FileText,
} from "lucide-react";
import { BiLogOut } from "react-icons/bi";
import { useSelector } from "react-redux";

const AdminPage = () => {
  // check if user if logged in
  const { role } = useSelector((state) => state.userStore);

  const navigate = useNavigate();

  const baseClass =
    "flex items-center gap-2 py-2 hover:cursor-pointer hover:bg-gray-100 hover:opacity-70 pl-5";

  const activeClass = "border-l-4 border-l-green-500  font-semibold bg-gray-50";

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
    <div className="p-2 xs:px-8 sm:px-12 md:px-24 xm:pt-2 sm:pt-6 md:pt-16 mb-16">
      {/* mobile: nav list */}
      <Select onValueChange={(value) => navigate(value)}>
        <SelectTrigger className="lg:hidden w-full text-md font-medium py-4 bg-[#ffffff] mb-6 md:mb-10">
          <SelectValue placeholder="Navigate..." />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem
              className={"border-b-1 py-2 text-md font-medium"}
              value="/admin/userManagement"
            >
              <User /> Quản lí người dùng
            </SelectItem>
            <SelectItem
              className={"border-b-1 py-2 text-md font-medium"}
              value="/admin/approvalvehicle"
            >
              <List /> Chấp nhận xe
            </SelectItem>
            <SelectItem
              className={"border-b-1 py-2 text-md font-medium"}
              value="/admin/managementvehicle"
            >
              <Star /> Quản lí phương tiện
            </SelectItem>
            <SelectItem
              className={"border-b-1 py-2 text-md font-medium"}
              value="/admin/approveOwner"
            >
              <Heart /> Chấp nhận chủ xe
            </SelectItem>
            <SelectItem
              className={"border-b-1 py-2 text-md font-medium"}
              value="/admin/messages"
            >
              <MessageCircle /> Nhắn tin
            </SelectItem>
            <SelectItem
              className={"border-b-1 py-2 text-md font-medium"}
              value="/admin/reports"
            >
              <CheckCircle2Icon />
              Xử lý báo cáo
            </SelectItem>
            <SelectItem
              className={"border-b-1 py-2 text-md font-medium"}
              value="/admin/revenue-stats"
            >
              <Gift /> Thống kê doanh thu
            </SelectItem>
            <SelectItem
              className={"border-b-1 py-2 text-md font-medium"}
              value="/admin/refundManagement"
            >
              <Gift /> Quản lý hoàn tiền
            </SelectItem>
            <SelectItem
              className={"border-b-1 py-2 text-md font-medium"}
              value="/admin/payoutManagement"
            >
              <ArrowRightLeft /> Quản lý thanh toán
            </SelectItem>
            <SelectItem
              className={"border-b-1 py-2 text-md font-medium"}
              value="/admin/disburseOwner"
            >
              <LocationEditIcon /> Giải ngân chủ xe
            </SelectItem>
            <SelectItem
              className={"border-b-1 py-2 text-md font-medium"}
              value="/admin/voucherManagement"
            >
              <LockIcon /> Quản lý giảm giá
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
              Quản trị viên
            </div>

            <NavLink
              to="/admin/userManagement"
              className={({ isActive }) =>
                isActive ? `${baseClass} ${activeClass}` : baseClass
              }
            >
              <User /> Quản lí người dùng
            </NavLink>
            <NavLink
              to="/admin/approvalvehicle"
              className={({ isActive }) =>
                isActive ? `${baseClass} ${activeClass}` : baseClass
              }
            >
              <List size={20} /> Chấp nhận xe
            </NavLink>
            {/* quan li phuong tien */}
            <NavLink
              to="/admin/managementvehicle"
              className={({ isActive }) =>
                isActive ? `${baseClass} ${activeClass}` : baseClass
              }
            >
              <Car /> Quản lí phương tiện
            </NavLink>

            <NavLink
              to="/admin/approveOwner"
              className={({ isActive }) =>
                isActive ? `${baseClass} ${activeClass}` : baseClass
              }
            >
              <Heart /> Chấp nhận chủ xe
            </NavLink>
            {/* message */}
            <NavLink
              to="/admin/messages"
              className={({ isActive }) =>
                isActive ? `${baseClass} ${activeClass}` : baseClass
              }
            >
              <MessageCircle /> Nhắn tin
            </NavLink>
            <NavLink
              to="/admin/reports"
              className={({ isActive }) =>
                isActive ? `${baseClass} ${activeClass}` : baseClass
              }
            >
              <FileText /> Xử lý Báo cáo
            </NavLink>

            <NavLink
              to="/admin/revenue-stats"
              className={({ isActive }) =>
                isActive ? `${baseClass} ${activeClass}` : baseClass
              }
            >
              <Gift /> Thống kê doanh thu
            </NavLink>
            <NavLink
              to="/admin/refundManagement"
              className={({ isActive }) =>
                isActive ? `${baseClass} ${activeClass}` : baseClass
              }
            >
              <Gift /> Quản lý hoàn tiền
            </NavLink>

            <NavLink
              to="/admin/payoutManagement"
              className={({ isActive }) =>
                isActive ? `${baseClass} ${activeClass}` : baseClass
              }
            >
              <ArrowRightLeft /> Quản lý giải ngân
            </NavLink>

            <NavLink
              to="/admin/voucherManagement"
              className={({ isActive }) =>
                isActive ? `${baseClass} ${activeClass}` : baseClass
              }
            >
              <LockIcon /> Quản lý giảm giá
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

export default AdminPage;
