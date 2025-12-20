import { useDispatch, useSelector } from "react-redux";
import { BiLogOut } from "react-icons/bi";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
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
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import RegisterWithPhoneNumber from "@/pages/renter/auth/RegisterWithPhoneNumber";
import LoginWithPhoneNumber from "@/pages/renter/auth/LoginWithPhoneNumber";
import NotificationDropdown from "./NotificationDropdown";
import { setMessageUserDetails } from "@/redux/features/admin/messageSlice";

const Header = () => {
  const { userId, email, avatar, role } = useSelector((state) => state.userStore);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Dialog states (shared between desktop and mobile)
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [isLoginWithPhoneOpen, setIsLoginWithPhoneOpen] = useState(false);
  const [isRegisterWithPhoneOpen, setIsRegisterWithPhoneOpen] = useState(false);

  // Mobile menu (Sheet) state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="mx-auto border-b-2 fixed top-0 left-0 right-0 z-50">
      <nav className="flex items-center justify-between w-screen  py-4 md:py-5 px-8 md:px-24 lg:px-40 mx-auto bg-white">
        {/* Logo Section */}
        <div className="flex items-center space-x-2">
          <Link
            to="/"
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200"
          >
            <img
              src="/rentzy_logo.png"
              alt="rentzy-logo"
              className="size-8 md:size-12"
            />
            <span className="text-3xl font-bold hidden lg:block">RENTZY</span>
          </Link>
        </div>

        {/* Navigation Links & User Actions */}
        <div className="flex items-center gap-6 font-semibold">
          <Link to="/about" className="hover:text-green-500 hidden lg:block">
            Về Rentzy
          </Link>

          {role !== "owner" && role !== "admin" && (
            <Link to="/register_owner" className="hover:text-green-500 hidden lg:block">
              Trở thành chủ xe
            </Link>
          )}

          <Link to="/cars" className="hover:text-green-500 hidden lg:block">
            Xe Ô Tô
          </Link>

          <Link to="/motorbikes" className="hover:text-green-500 hidden lg:block">
            Xe Máy
          </Link>

          {/* Notification Bell */}
          {userId && <NotificationDropdown />}

          {/* Messages Icon */}
          {userId && (
            <button
              className="text-gray-600 hover:text-green-500 hidden lg:block cursor-pointer transition-colors"
              title="Messages"
              onClick={() => {
                // dispatch to redux store :
                dispatch(setMessageUserDetails({
                  userFullNameOrEmail: 'rentzy.vehicle@gmail.com',
                  userIdToChatWith: 4,
                  userImageURL: '/default_avt.jpg'
                }));
                navigate('/messages')
              }
              }
            >
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

          {/* Mobile Menu Trigger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="lg:hidden">
                <MenuIcon className="h-6 w-6" />
              </button>
            </SheetTrigger>

            <SheetContent side="left" className="w-full bg-[#f6f6f6]">
              <div className="flex flex-col items-center justify-center gap-8 w-full h-full text-xl font-semibold">
                {/* User Section */}
                <div className="flex flex-col w-full rounded-2xl overflow-hidden bg-white shadow">
                  {userId ? (
                    <>
                      <div className="py-8 text-center border-b flex items-center justify-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={avatar || "/default_avt.jpg"}
                            alt="User avatar"
                            className="size-10"
                          />
                        </Avatar>
                        <span>{email}</span>
                      </div>

                      <Link
                        to="/account"
                        className="py-8 text-center border-b hover:text-green-500 block"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Tài khoản của tôi
                      </Link>
                    </>
                  ) : (
                    <>
                      <div
                        className="py-8 text-center border-b hover:text-green-500 cursor-pointer"
                        onClick={() => {
                          setRegisterOpen(true);
                          setMobileMenuOpen(false);
                        }}
                      >
                        Đăng Ký
                      </div>

                      <div
                        className="py-8 text-center hover:text-green-500 cursor-pointer"
                        onClick={() => {
                          setLoginOpen(true);
                          setMobileMenuOpen(false);
                        }}
                      >
                        Đăng Nhập
                      </div>
                    </>
                  )}
                </div>

                {/* Navigation Links */}
                <div className="flex flex-col w-full rounded-2xl overflow-hidden bg-white shadow">
                  <Link
                    to="/about"
                    className="py-8 text-center border-b hover:text-green-500 block"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Về Rentzy
                  </Link>

                  {role !== "owner" && role !== "admin" && (
                    <Link
                      to="/register_owner"
                      className="py-8 text-center border-b hover:text-green-500 block"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Trở thành chủ xe
                    </Link>
                  )}
                </div>

                {/* Logout */}
                {userId && (
                  <button
                    className="flex items-center gap-3 text-red-500 font-bold text-lg"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/logout");
                    }}
                  >
                    <BiLogOut size={25} />
                    Đăng xuất
                  </button>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop: User Profile (when logged in) */}
          {userId && (
            <div className="hidden lg:flex items-center space-x-4">
              <Link
                to="/account"
                className="flex items-center gap-2 hover:opacity-70 transition-opacity"
              >
                <Avatar>
                  <AvatarImage src={avatar || "/default_avt.jpg"} alt="User" />
                </Avatar>
                <span className="text-sm font-semibold">{email}</span>
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
          )}

          {/* Desktop: Login/Register (when not logged in) */}
          {!userId && (
            <div className="hidden lg:flex items-center gap-4">
              <div className="border-r h-8" />

              <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
                <DialogTrigger asChild>
                  <button className="px-6 py-2 hover:text-green-500 font-medium">
                    Đăng Ký
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle />
                    <DialogDescription>
                      <Register
                        setRegisterOpen={setRegisterOpen}
                        setLoginOpen={setLoginOpen}
                        setIsRegisterWithPhoneOpen={setIsRegisterWithPhoneOpen}
                      />
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>

              <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="px-6 py-2 border-black">
                    Đăng Nhập
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle />
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
            </div>
          )}
        </div>
      </nav>

      {/* Hidden Dialogs for Phone Login/Register (can be triggered from Login/Register components) */}
      <Dialog open={isLoginWithPhoneOpen} onOpenChange={setIsLoginWithPhoneOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle />
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

      <Dialog open={isRegisterWithPhoneOpen} onOpenChange={setIsRegisterWithPhoneOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle />
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
    </header>
  );
};

export default Header;