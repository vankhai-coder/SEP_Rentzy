import React from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { SelectGroup } from '@radix-ui/react-select'
import { Car, CheckCircle2Icon, Gift, Heart, Locate, LocationEditIcon, LockIcon, MapPinCheck, Trash2, User } from 'lucide-react'
import { BiLogOut } from 'react-icons/bi'

const Account = () => {

    const navigate = useNavigate()

    const baseClass =
        "flex items-center gap-2 py-4 text-lg hover:cursor-pointer hover:bg-gray-100 hover:opacity-70 pl-5";

    const activeClass = "border-l-4 border-l-green-500  font-semibold bg-gray-50";

    return (
        <div className=' px-8 sm:px-12 md:px-24 pt-6 md:pt-16 mb-16'>
            {/* mobile: nav list */}
            <Select onValueChange={(value) => navigate(value)}>
                <SelectTrigger className="lg:hidden w-full text-md font-medium py-4 bg-[#ffffff] mb-6 md:mb-10">
                    <SelectValue placeholder="Navigate..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem className={'border-b-1 py-2 text-md font-medium'} value="/account"><User /> Tài khoản của tôi
                        </SelectItem>
                        <SelectItem className={'border-b-1 py-2 text-md font-medium'} value="/myvehicles"><Car /> Quản lí cho thuê</SelectItem>
                        <SelectItem className={'border-b-1 py-2 text-md font-medium'} value="/favorites"><Heart /> Xe yêu thích</SelectItem>
                        <SelectItem className={'border-b-1 py-2 text-md font-medium'} value="/mytrips"><MapPinCheck /> Chuyến của tôi</SelectItem>
                        <SelectItem className={'border-b-1 py-2 text-md font-medium'} value="/longtermrenting"><CheckCircle2Icon />Đơn hàng Thuê xe dài hạn</SelectItem>
                        <SelectItem className={'border-b-1 py-2 text-md font-medium'} value="/myreward"><Gift /> Quà tặng</SelectItem>
                        <SelectItem className={'border-b-1 py-2 text-md font-medium'} value="/myaddress"><LocationEditIcon /> Địa chỉ của tôi</SelectItem>
                        <SelectItem className={'border-b-1 py-2 text-md font-medium'} value="/resetpw"><LockIcon /> Đổi mật khẩu</SelectItem>
                        <SelectItem className={'border-b-1 py-2 text-md font-medium'} value="/deleteaccount"><Trash2 />Yêu cầu xóa tài khoản</SelectItem>
                        <SelectItem className={'border-b-1 py-2 text-md font-medium text-red-500'} value="/logout"> <BiLogOut size={20} />Đăng xuất</SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>

            {/* laptop : nav list */}
            <div className='grid lg:grid-cols-3 gap-10'>
                {/* sidebar nav : */}
                <div className=' hidden lg:block col-span-1 sticky top-6 h-screen'>
                    <div>
                        <div className="text-3xl font-bold text-center pb-4 border-b-1">
                            Xin chào bạn!
                        </div>

                        <NavLink
                            to="/account"
                            className={({ isActive }) => (isActive ? `${baseClass} ${activeClass}` : baseClass)}
                        >
                            <User /> Tài khoản của tôi
                        </NavLink>

                        <NavLink
                            to="/myvehicles"
                            className={({ isActive }) => (isActive ? `${baseClass} ${activeClass}` : baseClass)}
                        >
                            <Car /> Quản lí cho thuê
                        </NavLink>

                        <NavLink
                            to="/favorites"
                            className={({ isActive }) => (isActive ? `${baseClass} ${activeClass}` : baseClass)}
                        >
                            <Heart /> Xe yêu thích
                        </NavLink>

                        <NavLink
                            to="/mytrips"
                            className={({ isActive }) => (isActive ? `${baseClass} ${activeClass}` : baseClass)}
                        >
                            <MapPinCheck /> Chuyến của tôi
                        </NavLink>

                        <NavLink
                            to="/longtermrenting"
                            className={({ isActive }) => (isActive ? `${baseClass} ${activeClass}` : baseClass)}
                        >
                            <CheckCircle2Icon /> Đơn hàng Thuê xe dài hạn
                        </NavLink>

                        <NavLink
                            to="/myreward"
                            className={({ isActive }) => (isActive ? `${baseClass} ${activeClass}` : baseClass)}
                        >
                            <Gift /> Quà tặng
                        </NavLink>

                        <NavLink
                            to="/myaddress"
                            className={({ isActive }) => (isActive ? `${baseClass} ${activeClass}` : baseClass)}
                        >
                            <LocationEditIcon /> Địa chỉ của tôi
                        </NavLink>

                        <NavLink
                            to="/resetpw"
                            className={({ isActive }) => (isActive ? `${baseClass} ${activeClass}` : baseClass)}
                        >
                            <LockIcon /> Đổi mật khẩu
                        </NavLink>

                        <NavLink
                            to="/deleteaccount"
                            className={({ isActive }) => (isActive ? `${baseClass} ${activeClass}` : baseClass)}
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
                <div className='col-span-2'>
                    <Outlet />
                </div>

            </div>

        </div>
    )
}

export default Account