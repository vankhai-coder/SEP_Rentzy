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
const Header = () => {
  const { userId, email, avatar } = useSelector((state) => state.userStore);
  const dispatch = useDispatch();

  // set open/close for Login,Register Dialog :
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  // state for login and register with phone Dialog :
  const [isLoginWithPhoneOpen, setIsLoginWithPhoneOpen] = useState(false);
  const [isRegisterWithPhoneOpen, setIsRegisterWithPhoneOpen] = useState(false);

  return (
    <header className="mx-auto border-b-2">
      <nav className="flex items-center justify-between w-screen max-w-7xl py-4 md:py-8 px-8 md:px-24 lg:px-16 mx-auto bg-[##ffffff]">
        {/* Logo Section */}
        <div className="flex items-center space-x-2">
          <Link
            to="/"
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200"
          >
            <img
              src="./rentzy_logo.png"
              alt="rentzy-logo"
              className="size-8 md:size-12"
            />
            <span className="text-3xl font-bold hidden lg:block">RENTZY</span>
          </Link>
        </div>

        {/* navigate Section */}
        <div className="flex items-center gap-6 font-semibold">
          <Link to={"/about"} className="hover:text-green-500 hidden lg:block ">
            Về Rentzy
          </Link>
          <Link to={"/register_owner"} className="hover:text-green-500 hidden lg:block ">
            Trở thành chủ xe
          </Link>
          <Link to={"/cars"} className="hover:text-green-500 hidden lg:block ">
            Xe Ô Tô
          </Link>
          <Link
            to={"/motorbikes"}
            className="hover:text-green-500 hidden lg:block "
          >
            Xe Máy
          </Link>

          {/* Chuyen cua toi: */}
          {userId && (
            <>
              <Link to="/" className="hover:text-green-500 hidden lg:block ">
                Chuyến của tôi
              </Link>
            </>
          )}

          {/* Bell : */}
          {userId && (
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
          )}

          {/* Message */}
          {userId && (
            <button className="text-gray-600 hover:text-green-500 hidden lg:block ">
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
          )}
          {/* Menu icon for modbile screen : */}
          <Sheet className={"px-8"}>
            <SheetTrigger>
              <MenuIcon className="block lg:hidden" />
            </SheetTrigger>
            <SheetContent side="left" className={"w-full"}>
              <div className="flex flex-col items-center gap-6 justify-center w-full h-full bg-[#f6f6f6] font-semibold text-xl ">
                {/* first */}
                <div className="flex flex-col items-center justify-center rounded-2xl overflow-hidden">
                  {!userId && (
                    <div className="py-8 min-w-2xl text-center bg-[#fff] border-b-1">
                      <Dialog
                        open={registerOpen}
                        onOpenChange={setRegisterOpen}
                      >
                        <DialogTrigger>
                          <a
                            className={
                              "p-6 hover:cursor-pointer hover:text-green-500"
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
                    <div className="py-8 min-w-2xl text-center bg-[#fff]">
                      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
                        <DialogTrigger>
                          <a className="hover:cursor-pointer hover:text-green-500">
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
                    <div className="py-8 min-w-2xl text-center bg-[#fff] border-b-1 flex items-center justify-center gap-2">
                      {avatar ? (
                        <Avatar>
                          <AvatarImage
                            src={avatar || ""}
                            alt="@shadcn"
                            className="size-8"
                          />
                        </Avatar>
                      ) : (
                        <Avatar>
                          <AvatarImage
                            src={"/default_avt.jpg"}
                            alt="@shadcn"
                            className="size-8"
                          />
                        </Avatar>
                      )}
                      {email}
                    </div>
                  )}
                  {userId && (
                    <div className="py-8 min-w-2xl text-center bg-[#fff] border-b-1">
                      <SheetClose asChild>
                        <Link to="/favorites" className="hover:text-green-500">
                          Xe Yêu Thích
                        </Link>
                      </SheetClose>
                    </div>
                  )}
                  {userId && (
                    <div className="py-8 min-w-2xl text-center bg-[#fff]">
                      <SheetClose asChild>
                        <Link to="/myreward" className="hover:text-green-500">
                          Quà tặng
                        </Link>
                      </SheetClose>
                    </div>
                  )}
                </div>
                {/* second */}
                <div className="flex flex-col items-center justify-center rounded-2xl  overflow-hidden">
                  {
                    <div className="py-8 min-w-2xl text-center bg-[#fff] border-b-1">
                      <SheetClose asChild>
                        <Link to="/about" className="hover:text-green-500">
                          Về Rentzy
                        </Link>
                      </SheetClose>
                    </div>
                  }
                  {
                    <div className="py-8 min-w-2xl text-center bg-[#fff] border-b-1">
                      <SheetClose asChild>
                        <Link
                          to="/register_owner"
                          className="hover:text-green-500"
                        >
                          Trở thành chủ xe
                        </Link>
                      </SheetClose>
                    </div>
                  }
                  {userId && (
                    <div className="py-8 min-w-2xl text-center bg-[#fff]">
                      <SheetClose asChild>
                        <Link to="/mytrips" className="hover:text-green-500">
                          Chuyến của tôi
                        </Link>
                      </SheetClose>
                    </div>
                  )}
                </div>
                {/* logout : */}
                {userId && (
                  <SheetClose asChild>
                    <span
                      className="flex gap-2 items-center text-red-500 font-semibold hover:cursor-pointer"
                      onClick={() => {
                        dispatch(logoutUser());
                        setLoginOpen(false);
                        window.location.href = "/";
                      }}
                    >
                      <BiLogOut size={25} />
                      Đăng xuất
                    </span>
                  </SheetClose>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* User Actions & Profile If Login :*/}
          {userId && (
            <div className="hidden lg:flex items-center space-x-4 ">
              {/* User Profile */}
              <div className="flex cursor-pointer items-center space-x-2 rounded-full">
                {/* User Icon or initials */}
                <Link
                  to="/account"
                  className="flex  items-center gap-2 hover:cursor-pointer hover:opacity-70"
                >
                  {
                    <Avatar>
                      <AvatarImage
                        src={avatar || "/default_avt.jpg"}
                        alt="@shadcn"
                      />
                    </Avatar>
                  }
                  <span className="text-sm font-semibold">{email}</span>
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
                </Link>
              </div>
            </div>
          )}

          {/* Show Login/Register if not login : */}
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
      </nav>
    </header>
  );
};

export default Header;
