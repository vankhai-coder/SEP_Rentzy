import { useDispatch, useSelector } from "react-redux";
import { BiLogOut } from "react-icons/bi";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutUser } from "@/redux/features/auth/authSlice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Register from "@/pages/renter/auth/Register";
import Login from "@/pages/renter/auth/Login";

const Header = () => {
  const { userId, email } = useSelector((state) => state.userStore);
  const dispatch = useDispatch();

  return (
    <header className="bg-white p-8 ">
      <nav className="container mx-auto flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center space-x-2">
          {/* You can replace this with your actual logo component or SVG */}

          <span className="text-3xl font-bold">RENTZY</span>
        </div>

        <div className="flex items-center gap-14">
          {/* Navigation Links */}
          <div className="hidden space-x-6 font-medium text-md text-gray-700 md:flex">
            <Link to={"/"} className="hover:text-green-500">
              Về Rentzy
            </Link>
            <Link to={"/"} className="hover:text-green-500">
              Trở thành chủ xe
            </Link>
            <Link to={"/cars"} className="hover:text-green-500">
              Xe Ô Tô
            </Link>
            <Link to={"/motorbikes"} className="hover:text-green-500">
              Xe Máy
            </Link>
            {userId && (
              <Link to={"/"} className="hover:text-green-500">
                Chuyến của tôi
              </Link>
            )}
          </div>

          {/* User Actions & Profile If Login :*/}
          {userId && (
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-green-500">
                {/* Bell Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>
              <button className="text-gray-600 hover:text-green-500">
                {/* Chat Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
                  />
                </svg>
              </button>

              {/* User Profile */}
              <div className="flex cursor-pointer items-center space-x-2 rounded-full bg-green-500 p-2 px-3 text-white">
                {/* User Icon or initials */}

                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <span className="text-sm font-bold">{email}</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {/* <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Billing</DropdownMenuItem>
                <DropdownMenuItem>Team</DropdownMenuItem> */}
                    <DropdownMenuItem
                      onClick={() => {
                        dispatch(logoutUser());
                      }}
                    >
                      <BiLogOut className="size-6 text-red-500" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* Dropdown Arrow */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Show Login Button If not login : */}
          {!userId && (
            <div className="flex gap-4">
              <Dialog>
                <DialogTrigger>
                  <Button
                    variant={"outline"}
                    className={"p-6"}
                 
                  >
                    Đăng Ký
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogDescription>
                      <Register />
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger>
                  <Button
                    className={"p-6"}
                  >
                    Đăng Nhập
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogDescription>
                      <Login />
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
