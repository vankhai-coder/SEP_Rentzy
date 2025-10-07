import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRightCircle, CircleQuestionMarkIcon, PenBoxIcon, X } from "lucide-react"
import { useState } from "react"

const DriverLicenseVerify = () => {

    const [toggleEdit, setToggleEdit] = useState(false)
    const [toggleEnglishNotice, setToggleEnglishNotice] = useState(false)

    return (
        <div className="bg-[#ffffff] rounded-2xl p-4 md:p-6">

            {/* giay phep lai xe :  */}
            <div className="flex items-center justify-between">
                {/* gplx , chua xac thuc */}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <span className="text-sm  sm:text-xl font-semibold">Giấy phép lái xe</span>
                    <div className="flex items-center  gap-2 bg-red-200 rounded-xl p-1 px-2">
                        <X className="text-red-500" size={12} />
                        <span className="text-xs font-normal">Chưa xác thực</span>
                    </div>
                </div>

                {/* huy , cap nhat */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center  gap-4 sm:gap-8 ">
                        {toggleEdit ?
                            <>
                                <span
                                    className="text-sm  sm:font-semibold hover:cursor-pointer"
                                    onClick={() => {
                                        setToggleEdit(!toggleEdit)
                                    }}>Hủy</span>
                                <Button className='bg-[#5fcf86] py-4 sm:py-6 text-[#fff]'>Cập nhật</Button>
                            </>
                            :
                            <Button
                                variant='outline'
                                className='border-black hover:cursor-pointer'
                                onClick={() => {
                                    setToggleEdit(!toggleEdit)
                                }}
                            >
                                <span>Chỉnh sửa</span>
                                <PenBoxIcon />
                            </Button>

                        }

                    </div>
                </div>
            </div>

            {/* For international driving permit */}
            <div>

                {toggleEnglishNotice ?
                    //   {/* English */}
                    <div>
                        <div
                            className="flex items-center justify-start gap-3 mt-6 hover:cursor-pointer"
                            onClick={() => {
                                setToggleEnglishNotice(!toggleEnglishNotice)
                            }}
                        >
                            <span className="text-[#5fcf86] font-medium text-lg "

                            >For international driving permit</span>
                            <ArrowRightCircle className="text-[#5fcf86]" />
                        </div>
                        <div className="bg-red-200 rounded p-2 text-red-500 text-sm mt-6"><span className="font-semibold">Lưu ý</span>: để tránh phát sinh vấn đề trong quá trình thuê xe, <span className="underline">người đặt xe</span> trên Mioto (đã xác thực GPLX) <span className="font-semibold">ĐỒNG THỜI</span> phải là người nhận xe.</div>

                    </div>
                    :
                    //   {/* Vietnamese */}
                    <div>
                        <div
                            className="flex items-center justify-start gap-3 mt-6 hover:cursor-pointer"
                            onClick={() => {
                                setToggleEnglishNotice(!toggleEnglishNotice)
                            }}
                        >
                            <span className="text-[#5fcf86] font-medium text-lg "

                            >Giấy phép lái xe Việt Nam</span>
                            <ArrowRightCircle className="text-[#5fcf86]" />
                        </div>
                        <div className="bg-red-200 rounded p-2 text-red-500 text-sm mt-6">
                            <span className="font-semibold">Note:</span>
                            <br />

                            1. As a foreign traveler, you need to have a valid <span className="font-semibold">International Driving Permit</span> to drive car in Vietnam.
                            <br />

                            2. Please ensure the person who books a car (who is verified car driving license on Mioto) and the driver (who is signs the contract & is legally responsible for a car) are the same ones.
                        </div>
                    </div>
                }




            </div>

            {/* hinh anh : */}
            <div className="mt-6 flex flex-col gap-6">
                <span className="text-sm sm:text-xl font-semibold">Hình ảnh</span>
                {/* hinh anh :  */}
                <div
                    className="mx-auto w-[400px] h-[250px] rounded-xl bg-gray-100 bg-cover bg-center border shadow"
                    style={{
                        // backgroundImage: preview ? `url(${preview})` : "none",
                    }}
                >
                </div>
                {/* thong tin chung :  */}
                <span className="text-sm sm:text-xl font-semibold">Thông tin chung</span>
                <div>
                    <span>Số GPLX</span>
                    <input type="text" />
                    <Input
                     disabled 
                     placeholder='Nhập số GPLX đã cấp' 
                     className='border-gray-500 mt-2 py-6'
                    
                    /> 
                </div>
                 <div>
                    <span>Họ và tên</span>
                    <input type="text" />
                    <Input
                     disabled 
                     placeholder='Nhập đầy đủ họ tên' 
                     className='border-gray-500 mt-2 py-6'
                    
                    /> 
                </div>
                 <div>
                    <span>Ngày sinh</span>
                    <input type="text" />
                    <Input
                     disabled 
                     placeholder='Nhập ngày sinh' 
                     className='border-gray-500 mt-2 py-6'
                    
                    /> 
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-light">Vì sao tôi phải xác thực GPLX</span>
                    <CircleQuestionMarkIcon size={16} className="hover:cursor-pointer" />
                </div>

                {/* chup anh khuon mat : */}
                 <span className="text-sm sm:text-xl font-semibold">Chụp ảnh khuôn mặt</span>
                {/* hinh anh :  */}
                <div
                    className="mx-auto w-[400px] h-[250px] rounded-xl bg-gray-100 bg-cover bg-center border shadow"
                    style={{
                        // backgroundImage: preview ? `url(${preview})` : "none",
                    }}
                >
                </div>
            </div>

        </div>
    )
}

export default DriverLicenseVerify