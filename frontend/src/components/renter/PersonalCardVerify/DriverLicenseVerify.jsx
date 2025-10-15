import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { check2FaceMatch, verifyDriverLicense } from "@/redux/features/auth/userInformationSlice"
import { ArrowRightCircle, CheckCheck, CircleQuestionMarkIcon, Loader2Icon, PenBoxIcon, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { FaSpinner } from "react-icons/fa"
import { useDispatch, useSelector } from "react-redux"
import Webcam from "react-webcam"
import { toast } from "sonner"

const DriverLicenseVerify = () => {

    const [toggleEdit, setToggleEdit] = useState(false)
    const [toggleEnglishNotice, setToggleEnglishNotice] = useState(true)

    // redux : 
    const {
        isVerifyDriverLicenseOfRenterUploadSuccess,
        driverLicenseNumber,
        driverLicenseName,
        driverLicenseDob,
        driverLicenseClass,
        driverLicenseError,
        driverLicenseLoading,
        is2FaceMatch,
        is2FaceMatchError,
        is2FaceMatchLoading,
        isVerifyDriverLicenseMatchWithwebcam
    } = useSelector((state) => state.userInformationStore);

    const dispatch = useDispatch()

    // upload driver image : 
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);

    // 
    const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

    const isValidExtension = (name = "") => {
        const lower = name.toLowerCase();
        return ALLOWED_EXT.some(ext => lower.endsWith(ext));
    }

    const handleFileChange = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;

        if (!ALLOWED_MIME.includes(f.type) || !isValidExtension(f.name)) {
            toast.error("Chỉ cho phép JPG/PNG/WEBP/GIF.");
            e.target.value = "";
            return;
        }

        setFile(f);
        setPreview(URL.createObjectURL(f));
    };

    const verifyDL = async () => {
        if (!file) {
            toast.error("Vui lòng tải ảnh lên!");
            return;
        }
        await dispatch(verifyDriverLicense({ image: file }));
    };

    // chup anh khuon mat : 
    const webcamRef = useRef(null);
    const [faceImage, setFaceImage] = useState(null); // lưu base64 image
    const [startCamera, setStartCamera] = useState(false);

    // Chụp ảnh
    const capture = () => {
        // if dont verify driver yet , toast : 
        if (!isVerifyDriverLicenseOfRenterUploadSuccess) {
            toast.error('Bạn phải xác thực GPLX trước!')
            return
        }
        setStartCamera(true)
        if (!webcamRef.current) return;
        const imageSrc = webcamRef.current.getScreenshot(); // trả về base64
        if (!imageSrc) return toast.error("Không thể chụp ảnh");
        setFaceImage(imageSrc);
    };

    // Convert base64 -> Blob để gửi server
    const getBlobFromBase64 = (dataUrl) => {
        const arr = dataUrl.split(",");
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);
        return new Blob([u8arr], { type: mime });
    };

    // Gửi ảnh lên server
    const sendToServer = async () => {
        if (!faceImage) return toast.error("Chưa có ảnh để gửi!");
        const blob = getBlobFromBase64(faceImage);

        const formData = new FormData();
        formData.append("image", blob, "face.jpg");

        try {
            await dispatch(check2FaceMatch({ image_1: file, image_2: blob, driverLicenseNumber, driverLicenseClass, driverLicenseDob, driverLicenseName }))
        } catch (err) {
            console.log('error ', err.message)
        }
    };


    // toast : 
    // toast if verify success : 
    useEffect(() => {
        if (isVerifyDriverLicenseOfRenterUploadSuccess) {
            toast.success('Xác thực giấy phép lái xe thành công ,hãy xác minh khuôn mặt!')
        }
    }, [isVerifyDriverLicenseOfRenterUploadSuccess])

    // toast if fail : 
    useEffect(() => {
        if (driverLicenseError) {
            toast.error('Xác thực giấy phép lái xe thất bại!')
            setFile('')
        }
    }, [driverLicenseError])

    // clean when unmount : 
    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    // toast if 2 face match : 
    useEffect(() => {
        if (is2FaceMatch) {
            toast.success('Xác thực giấy phép lái xe thành công!')
        }
    }, [is2FaceMatch])
    // toast if 2 face not match : 
    useEffect(() => {
        if (is2FaceMatchError) {
            toast.error('Khuôn mặt không khớp, hãy thử lại!')
        }
    }, [is2FaceMatchError])


    return (
        <div className="bg-[#ffffff] rounded-2xl p-4 md:p-6">

            {/* giay phep lai xe :  */}
            <div className="flex items-center justify-between">
                {/* gplx , chua xac thuc */}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <span className="text-sm  sm:text-xl font-semibold">Giấy phép lái xe</span>
                    {!isVerifyDriverLicenseMatchWithwebcam ?
                        //   {/* chua xac thuc : */}
                        <div className="flex items-center  gap-2 bg-red-200 rounded-xl p-1 px-2">
                            <X className="text-red-500" size={12} />
                            <span className="text-xs font-normal">Chưa xác thực</span>
                        </div>
                        :
                        //    {/* da xac thuc : */}
                        <div className="flex items-center  gap-2 bg-green-200 rounded-xl p-1 px-2">
                            <CheckCheck className="text-green-500" size={12} />
                            <span className="text-xs font-normal">Đã xác thực</span>
                        </div>

                    }


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
                    className="relative mx-auto w-[300px] h-[150px] sm:w-[400px] sm:h-[250px] rounded-xl bg-gray-100 bg-cover bg-center border shadow"
                    style={{
                        backgroundImage: preview ? `url(${preview})` : "none",
                    }}
                >
                </div>
                {/* upload button :  */}
                <div className={is2FaceMatch ? 'hidden' : 'text-center block'} >
                    <label
                        htmlFor="upload"
                        className="inline-block bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-md cursor-pointer transition-colors"
                    >
                        Tải ảnh lên
                    </label>

                    <Input
                        id="upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => { handleFileChange(e) }}
                    />

                </div>

                <Button
                    onClick={verifyDL}
                    className={is2FaceMatch ? 'hidden' : 'text-center block w-1/2  sm:w-1/4 mx-auto'}
                >
                    {driverLicenseLoading ? <Loader2Icon className="mx-auto animate-spin" /> : 'Xác thực ngay'}
                </Button>

                {/* thong tin chung :  */}
                <span className="text-sm sm:text-xl font-semibold">Thông tin chung</span>
                <div>
                    <span>Số GPLX</span>
                    <input type="text" />
                    <Input
                        disabled
                        placeholder='Nhập số GPLX đã cấp'
                        value={driverLicenseNumber}
                        className='border-gray-500 mt-2 py-6'

                    />
                </div>
                <div>
                    <span>Họ và tên</span>
                    <input type="text" />
                    <Input
                        disabled
                        placeholder='Nhập đầy đủ họ tên'
                        value={driverLicenseName}
                        className='border-gray-500 mt-2 py-6'

                    />
                </div>
                <div>
                    <span>Ngày sinh</span>
                    <input type="text" />
                    <Input
                        disabled
                        placeholder='Nhập ngày sinh'
                        value={driverLicenseDob}
                        className='border-gray-500 mt-2 py-6'

                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-light">Vì sao tôi phải xác thực GPLX</span>
                    <CircleQuestionMarkIcon size={16} className="hover:cursor-pointer" />
                </div>

                <div className={is2FaceMatch ? 'hidden' : 'flex flex-col gap-4'}>
                    {/* chup anh khuon mat : */}
                    <span className="text-sm sm:text-xl font-semibold">Chụp ảnh khuôn mặt</span>
                    {/* hinh anh :  */}
                    <div className="flex flex-col items-center gap-4">
                        {/* Hiển thị webcam hoặc preview */}
                        {!faceImage && startCamera ? (
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                className="relative mx-auto w-[300px] h-[150px] sm:w-[400px] sm:h-[250px] rounded-xl bg-gray-100 bg-cover bg-center border shadow"

                            />
                        ) : (
                            <div
                                className="relative mx-auto w-[300px] h-[150px] sm:w-[400px] sm:h-[250px] rounded-xl bg-gray-100 bg-cover bg-center border shadow"
                                style={{
                                    backgroundImage: faceImage ? `url(${faceImage})` : "none",
                                }}
                            />
                        )}

                        {/* Nút chụp, gửi hoặc chụp lại */}
                        <div className="flex gap-4">
                            {!faceImage ? (
                                <Button className="bg-green-500 hover:bg-green-400" onClick={capture}>
                                    Chụp ngay
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        className="bg-blue-500 hover:bg-blue-400"
                                        onClick={sendToServer}>
                                        {is2FaceMatchLoading ? <FaSpinner className="animate-spin" /> : "Xác thực ngay"}
                                    </Button>
                                    <Button className="bg-red-500 hover:bg-red-400" onClick={() => setFaceImage(null)}>
                                        Chụp lại
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}

export default DriverLicenseVerify