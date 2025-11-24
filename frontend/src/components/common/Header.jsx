import { useDispatch, useSelector } from "react-redux";
import { BiLogOut } from "react-icons/bi";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { logoutUser } from "@/redux/features/auth/authSlice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Register from "@/pages/renter/auth/Register";
import Login from "@/pages/renter/auth/Login";
import { useState } from "react";
import { MenuIcon } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import RegisterWithPhoneNumber from "@/pages/renter/auth/RegisterWithPhoneNumber";
import LoginWithPhoneNumber from "@/pages/renter/auth/LoginWithPhoneNumber";
import NotificationDropdown from "./NotificationDropdown";
const Header = () => {
  const { userId, email, avatar } = useSelector((state) => state.userStore);
  const { full_name } = useSelector((state) => state.userInformationStore);
  const dispatch = useDispatch();

  // set open/close for Login,Register Dialog :
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  // state for login and register with phone Dialog :
  const [isLoginWithPhoneOpen, setIsLoginWithPhoneOpen] = useState(false);
  const [isRegisterWithPhoneOpen, setIsRegisterWithPhoneOpen] = useState(false);

  return (
    <header className="mx-auto border-b-2">
      <nav className="flex items-center w-full max-w-7xl py-3 sm:py-4 md:py-6 lg:py-8 px-4 sm:px-6 md:px-12 lg:px-16 mx-auto bg-white">
        {/* Logo Section - Bên trái */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Link
            to="/"
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200"
          >
            <img
              src="./rentzy_logo.png"
              alt="rentzy-logo"
              className="size-7 sm:size-8 md:size-10 lg:size-12"
            />
            <span className="text-xl sm:text-2xl md:text-3xl font-bold hidden sm:block">RENTZY</span>
          </Link>
        </div>

        {/* Spacer - Khoảng trống giữa logo và navigation */}
        <div className="flex-1"></div>

        {/* Right Section - Mobile: Icons (Bell + Menu) | Desktop: Navigation + Icons + User */}
        <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0">
          {/* Icons Section - Mobile: Bell + Menu */}
          <div className="flex items-center gap-3 sm:gap-4 lg:hidden">
            {/* Bell Notification Dropdown - Hiện trên mobile */}
            {userId && <NotificationDropdown />}

            {/* Menu icon for mobile screen */}
            <Sheet>
              <SheetTrigger>
                <MenuIcon className="block text-gray-600" />
              </SheetTrigger>
              <SheetContent side="left" className={"w-full sm:w-80"}>
                <div className="flex flex-col items-center gap-4 sm:gap-6 justify-start w-full h-full bg-[#f6f6f6] font-semibold text-base sm:text-lg md:text-xl pt-4 sm:pt-8 overflow-y-auto">
                  {/* first */}
                  <div className="flex flex-col items-center justify-center rounded-2xl overflow-hidden">
                    {!userId && (
                      <div className="py-4 sm:py-6 w-full text-center bg-[#fff] border-b-1">
                        <Dialog
                          open={registerOpen}
                          onOpenChange={setRegisterOpen}
                        >
                          <DialogTrigger>
                            <a
                              className={
                                "block w-full py-2 hover:cursor-pointer hover:text-green-500"
                              }
                            >
                              Đăng Ký
                            </a>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle></DialogTitle>
                              <DialogDescription>
                                <Register
                                  setRegisterOpen={setRegisterOpen}
                                  setLoginOpen={setLoginOpen}
                                  setIsRegisterWithPhoneOpen={
                                    setIsRegisterWithPhoneOpen
                                  }
                                />
                              </DialogDescription>
                            </DialogHeader>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                    {!userId && (
                      <div className="py-4 sm:py-6 w-full text-center bg-[#fff]">
                        <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
                          <DialogTrigger>
                            <a className="block w-full py-2 hover:cursor-pointer hover:text-green-500">
                              Đăng Nhập
                            </a>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle></DialogTitle>
                              <DialogDescription>
                                <Login
                                  setIsLoginWithPhoneOpen={
                                    setIsLoginWithPhoneOpen
                                  }
                                  setRegisterOpen={setRegisterOpen}
                                  setLoginOpen={setLoginOpen}
                                />
                              </DialogDescription>
                            </DialogHeader>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                    {userId && (
                      <div className="py-4 sm:py-6 w-full text-center bg-[#fff] border-b-1 flex items-center justify-center gap-2 px-4">
                        {avatar ? (
                          <Avatar>
                            <AvatarImage
                              src={avatar || ""}
                              alt="@shadcn"
                              className="size-8 sm:size-10"
                            />
                          </Avatar>
                        ) : (
                          <Avatar>
                            <AvatarImage
                              src={"/default_avt.jpg"}
                              alt="@shadcn"
                              className="size-8 sm:size-10"
                            />
                          </Avatar>
                        )}
                        <span className="text-sm sm:text-base truncate max-w-[200px]">{email}</span>
                      </div>
                    )}
                    {userId && (
                      <div className="py-4 sm:py-6 w-full text-center bg-[#fff] border-b-1">
                        <SheetClose asChild>
                          <Link to="/account" className="hover:text-green-500 block w-full py-2">
                            Trang cá nhân
                          </Link>
                        </SheetClose>
                      </div>
                    )}
                    {userId && (
                      <div className="py-4 sm:py-6 w-full text-center bg-[#fff] border-b-1">
                        <SheetClose asChild>
                          <Link to="/favorites" className="hover:text-green-500 block w-full py-2">
                            Xe Yêu Thích
                          </Link>
                        </SheetClose>
                      </div>
                    )}
                    {userId && (
                      <div className="py-4 sm:py-6 w-full text-center bg-[#fff] border-b-1">
                        <SheetClose asChild>
                          <Link to="/myreward" className="hover:text-green-500 block w-full py-2">
                            Quà tặng
                          </Link>
                        </SheetClose>
                      </div>
                    )}
                  </div>
                  {/* second */}
                  <div className="flex flex-col items-center justify-center rounded-2xl overflow-hidden w-full">
                    <div className="py-4 sm:py-6 w-full text-center bg-[#fff] border-b-1">
                      <SheetClose asChild>
                        <Link to="/about" className="hover:text-green-500 block w-full py-2">
                          Về Rentzy
                        </Link>
                      </SheetClose>
                    </div>
                    <div className="py-4 sm:py-6 w-full text-center bg-[#fff] border-b-1">
                      <SheetClose asChild>
                        <Link to="/cars" className="hover:text-green-500 block w-full py-2">
                          Xe Ô Tô
                        </Link>
                      </SheetClose>
                    </div>
                    <div className="py-4 sm:py-6 w-full text-center bg-[#fff] border-b-1">
                      <SheetClose asChild>
                        <Link to="/motorbikes" className="hover:text-green-500 block w-full py-2">
                          Xe Máy
                        </Link>
                      </SheetClose>
                    </div>
                    <div className="py-4 sm:py-6 w-full text-center bg-[#fff] border-b-1">
                      <SheetClose asChild>
                        <Link
                          to="/register_owner"
                          className="hover:text-green-500 block w-full py-2"
                        >
                          Trở thành chủ xe
                        </Link>
                      </SheetClose>
                    </div>
                    {userId && (
                      <div className="py-4 sm:py-6 w-full text-center bg-[#fff] border-b-1">
                        <SheetClose asChild>
                          <Link to="/mytrips" className="hover:text-green-500 block w-full py-2">
                            Chuyến của tôi
                          </Link>
                        </SheetClose>
                      </div>
                    )}
                  </div>
                  {/* logout : */}
                  {userId && (
                    <div className="mt-auto w-full py-4 sm:py-6">
                      <SheetClose asChild>
                        <span
                          className="flex gap-2 items-center justify-center text-red-500 font-semibold hover:cursor-pointer w-full py-2"
                          onClick={() => {
                            dispatch(logoutUser());
                            setLoginOpen(false);
                            window.location.href = "/";
                          }}
                        >
                          <BiLogOut size={20} className="sm:w-6 sm:h-6" />
                          <span>Đăng xuất</span>
                        </span>
                      </SheetClose>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Navigation Links - Chỉ hiện trên desktop */}
          <div className="hidden lg:flex items-center gap-6">
            <Link to={"/about"} className="text-gray-900 hover:text-gray-600 transition-colors font-normal text-sm">
              Về Rentzy
            </Link>
            <Link to={"/register_owner"} className="text-gray-900 hover:text-gray-600 transition-colors font-normal text-sm">
              Trở thành chủ xe
            </Link>
            <Link to={"/cars"} className="text-gray-900 hover:text-gray-600 transition-colors font-normal text-sm">
              Xe Ô Tô
            </Link>
            <Link to={"/motorbikes"} className="text-gray-900 hover:text-gray-600 transition-colors font-normal text-sm">
              Xe Máy
            </Link>
            {userId && (
              <Link to="/" className="text-gray-900 hover:text-gray-600 transition-colors font-normal text-sm">
                Chuyến của tôi
              </Link>
            )}
          </div>

          {/* Vertical Separator - chỉ hiện trên desktop khi có icons hoặc user */}
          {userId && (
            <div className="hidden lg:block w-px h-7 bg-gray-300"></div>
          )}

          {/* Icons Section - Desktop: Bell + Message + User */}
          <div className="hidden lg:flex items-center gap-3 sm:gap-4">
            {/* Bell Notification Dropdown - Hiện trên desktop */}
            {userId && <NotificationDropdown />}

            {/* Message - Chỉ hiện trên desktop */}
            {userId && (
              <button className="text-gray-600 hover:text-gray-900 transition-colors">
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
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </button>
            )}

            {/* User Profile - Chỉ hiện trên desktop */}
            {userId && (
              <div className="flex items-center">
                <Link
                  to="/account"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={avatar || "/default_avt.jpg"}
                      alt="avatar"
                    />
                  </Avatar>
                  <span className="text-sm font-semibold text-gray-900">
                    {full_name || email}
                  </span>
                  {/* Dropdown Arrow */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-600"
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
                </Link>
              </div>
            )}

            {/* Show Login/Register if not login - Chỉ hiện trên desktop */}
            {!userId && (
              <div className="hidden lg:flex items-center gap-4">
                {/* border : */}
                <div className="border-1 h-7"></div>
              {/* Register button: */}
              <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
                <DialogTrigger>
                  <a className={"p-6"}>Đăng Ký</a>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle></DialogTitle>
                    <DialogDescription>
                      <Register
                        setIsRegisterWithPhoneOpen={setIsRegisterWithPhoneOpen}
                        setRegisterOpen={setRegisterOpen}
                        setLoginOpen={setLoginOpen}
                      />
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>

              {/* Login Button */}
              <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
                <DialogTrigger asChild>
                  <Button
                    className={"p-6 border border-black"}
                    variant={"outline"}
                  >
                    Đăng Nhập
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle></DialogTitle>
                    <DialogDescription>
                      <Login
                        setIsLoginWithPhoneOpen={setIsLoginWithPhoneOpen}
                        setRegisterOpen={setRegisterOpen}
                        setLoginOpen={setLoginOpen}
                      />
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>

              {/* Login,Register with Phone , this is dialog so can put here : */}
              {/* Login with Phone */}
              <Dialog
                open={isLoginWithPhoneOpen}
                onOpenChange={setIsLoginWithPhoneOpen}
              >
                <DialogTrigger asChild>
                  {/* <Button
                    className={"p-6 border border-black"}
                    variant={"outline"}

                  >
                    Đăng nhập với số điện thoại
                  </Button> */}
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle></DialogTitle>
                    <DialogDescription>
                      <LoginWithPhoneNumber
                        setIsRegisterWithPhoneOpen={setIsRegisterWithPhoneOpen}
                        setIsLoginWithPhoneOpen={setIsLoginWithPhoneOpen}
                        setLoginOpen={setLoginOpen}
                      />
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>

              {/* Register with Phone */}
              <Dialog
                open={isRegisterWithPhoneOpen}
                onOpenChange={setIsRegisterWithPhoneOpen}
              >
                <DialogTrigger asChild>
                  {/* <Button
                    className={"p-6 border border-black"}
                    variant={"outline"}

                  >
                    Đăng ký với số điện thoại
                  </Button> */}
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle></DialogTitle>
                    <DialogDescription>
                      <RegisterWithPhoneNumber
                        setRegisterOpen={setRegisterOpen}
                        setIsRegisterWithPhoneOpen={setIsRegisterWithPhoneOpen}
                        setIsLoginWithPhoneOpen={setIsLoginWithPhoneOpen}
                      />
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
