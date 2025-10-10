import DriverLicenseVerify from "@/components/renter/PersonalCardVerify/DriverLicenseVerify"
import IdentityCardVerify from "@/components/renter/PersonalCardVerify/IdentityCardVerify"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Cake, CarIcon, MedalIcon, Pen } from "lucide-react"
import { BiError } from "react-icons/bi"

const UserInformation = () => {
  return (
   <div className="flex flex-col gap-9 ">
    {/* basic detail : avatar , name , email , phone .... */}
     <div className="bg-[#ffffff] rounded-2xl p-4 md:p-6">

      {/* thong tin tai khoan :  */}
      <div className="flex items-center justify-between rounded-t-2xl py-4">
        {/* thong tin tai khoan : */}
        <div className="flex items-center justify-between gap-4">
          <span className="text-xl font-semibold">Thông tin tài khoản</span>
          <Pen size={16} className="hover:cursor-pointer" />
        </div>
        {/* so chuyen xe : */}
        <div className="hidden sm:flex items-end justify-between gap-2 border p-4 rounded-xl">
          <CarIcon size={38} className="text-green-400" />
          <span className="text-green-400 font-bold text-4xl">0</span>
          <span>chuyến</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between gap-4" >

        {/* avatar va thong tin ca nhan :  */}
        {/* avatar :  */}
        <div className="flex flex-col items-center gap-2">
          {/* avatar : */}
          <Avatar className='size-26' >
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          {/* name : */}
          <span className="font-semibold text-lg">khai huynh</span>
          {/* thoi gian tham gia : */}
          <span className="text-sm font-normal">Tham gia : 10/9/2005</span>

          <div className="flex gap-4">
            {/* so chuyen xe : */}
            <div className="flex sm:hidden items-center justify-between gap-2 border p-1 rounded-xl">
              <CarIcon size={26} className="text-green-400" />
              <span className="text-green-400 font-bold text-xl">0</span>
              <span>chuyến</span>
            </div>
            {/* diem so : */}
            <div className="flex p-2 border rounded-xl gap-2">
              <MedalIcon className="text-yellow-500" />
              <span className="font-bold">0 điểm</span>
            </div>
          </div>

        </div>

        {/* thong tin ca nhan : */}
        <div className="">
          {/* ngay sinh gioi tinh :  */}
          <div className="bg-[#f6f6f6] rounded-2xl p-4 px-6 flex flex-col gap-4">
            <div className="flex justify-between">
              <span className="font-light text-sm">Ngày sinh</span>
              <span className="font-semibold">19/7/2003</span>
            </div>
            <div className="flex justify-between">
              <span className="font-light text-sm">Giới tính</span>
              <span className="font-semibold">Nam</span>
            </div>
          </div>

          {/* sdt :  */}
          <div className="flex justify-between py-4 border-b ">
            {/* div ben trai  */}
            <div className="flex gap-2">
              <span className="font-light text-sm">Số điện thoại</span>
              <div className="p-1 rounded-xl text-xs font-light bg-yellow-200 flex  items-center gap-0.5">
                <BiError />
                <span className="hidden sm:block">Chưa xác thực</span>
              </div>
            </div>
            {/* div ben phai  */}
            <div className="flex items-center gap-2 ">
                <span className="text-xs xs:text-base font-semibold">Thêm số điện thoại</span>
              <Pen className="hover:cursor-pointer" size={16} />
            </div>
          </div>

          {/* email : */}
          <div className="flex justify-between py-4 border-b gap-4">
            {/* div ben trai  */}
            <div className="flex gap-2 items-center">
              <span className="font-light text-sm">Email</span>
              <div className="p-1 rounded-xl text-xs font-light bg-yellow-200 flex  items-center gap-0.5">
                <BiError />
                <span className="hidden sm:block">Chưa xác thực</span>
              </div>
            </div>
            {/* div ben phai  */}
            <div className="flex items-center gap-2 ">
              <span className="text-xs xs:text-base font-semibold">huynhvankhai198@gmail.com</span>
              <Pen className="hover:cursor-pointer" size={16} />
            </div>
          </div>
          {/*  */}
        </div>
      </div>

    </div>

    {/* Verify driver license : */}
    <DriverLicenseVerify />


    {/* Verify identity card : */}
    <IdentityCardVerify />
   </div>
  )
}

export default UserInformation