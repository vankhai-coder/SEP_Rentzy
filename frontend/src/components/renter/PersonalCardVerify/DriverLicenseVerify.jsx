import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import axiosInstance from "@/config/axiosInstance"
import { useMutation, useQuery } from "@tanstack/react-query"
import { set } from "date-fns"
import { fi } from "date-fns/locale"
import { ArrowRightCircle, CheckCheck, CircleQuestionMarkIcon, Loader, Loader2Icon, PenBoxIcon, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { FaSpinner } from "react-icons/fa"
import Webcam from "react-webcam"
import { toast } from "sonner"

const DriverLicenseVerify = ({ typeOfDriverLicense }) => {

    const [toggleEdit, setToggleEdit] = useState(false)
    const [toggleEnglishNotice, setToggleEnglishNotice] = useState(true)

    // upload driver image : 
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);

    // 
    const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

    // state for isloading veriry driver license and check 2 face match :
    const [isLoadingVerifyDriverLicense, setIsLoadingVerifyDriverLicense] = useState(false);
    const [isLoadingCheck2FaceMatch, setIsLoadingCheck2FaceMatch] = useState(false);

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

    // get user information query :
    const {
        data: userInformationData,
        isLoading: isLoadingUserInformation,
        isError: isErrorUserInformation,
        error: errorUserInformation,
        isSuccess: isSuccessUserInformation,
    } = useQuery({
        queryKey: ["basicUserInformation"],
        queryFn: async () => {
            try {
                const res = await axiosInstance.post(
                    "/api/renter/info/get-basic-user-information"
                );
                return res.data; // { success: true, user: { ... } }
            } catch (err) {
                throw new Error(
                    err.response?.data?.message ||
                    "Lỗi lấy thông tin cá nhân!"
                );
            }
        },
    });


    // veerify driver license mutation :
    const verifyDriverLicenseMutation = useMutation({
        mutationFn: async (image) => {
            try {
                setIsLoadingVerifyDriverLicense(true);
                const formData = new FormData();
                formData.append("image", image);

                const res = await axiosInstance.post(
                    `/api/renter/info/verify/driver-license-card?typeOfDriverLicense=${typeOfDriverLicense}`,
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );

                return res.data; // { data: [{ id, name, dob }] }
            } catch (err) {
                throw new Error(
                    err.response?.data?.message ||
                    "Error verifying driver license!"
                );
            }finally {
                setIsLoadingVerifyDriverLicense(false);
            }
        },
    });

    console.log('userInformationData ', userInformationData)
    console.log('verifyDriverLicenseMutation data ', verifyDriverLicenseMutation.data)

    const verifyDL = async () => {
        if (!file) {
            toast.error("Vui lòng tải ảnh lên!");
            return;
        }
        verifyDriverLicenseMutation.mutate(file);

    };

    // chup anh khuon mat : 
    const webcamRef = useRef(null);
    const [faceImage, setFaceImage] = useState(null); // lưu base64 image
    const [startCamera, setStartCamera] = useState(false);

    // Chụp ảnh
    const capture = () => {
        // if dont verify driver yet , toast : 
        if (!(typeOfDriverLicense === 'driver-license-for-car' && verifyDriverLicenseMutation?.data?.data[0])
            && !(typeOfDriverLicense === 'driver-license-for-motobike' && verifyDriverLicenseMutation?.data?.data[0])
            && !verifyDriverLicenseMutation.isSuccess
        ) {
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

    const faceMatchMutation = useMutation({
        mutationFn: async ({
            image_1,
            image_2,
            driverLicenseName,
            driverLicenseDob,
            driverLicenseNumber,
            driverLicenseClass,

        }) => {
            try {
                setIsLoadingCheck2FaceMatch(true);
                const formData = new FormData();
                formData.append("image_1", image_1);
                formData.append("image_2", image_2);

                const response = await axiosInstance.post(
                    "/api/renter/info/check-2-face-match-driver-license?typeOfDriverLicense=" + typeOfDriverLicense,
                    formData,
                    {
                        headers: { "Content-Type": "multipart/form-data" },
                        params: {
                            driverLicenseName,
                            driverLicenseDob,
                            driverLicenseNumber,
                            driverLicenseClass,
                        },
                    }
                );

                return response.data;
                // {
                //     "code" : "200",
                //     "data" : {
                //         "isMatch": false,
                //         "similarity": 21.25160789489746,
                //         "isBothImgIDCard": false
                //     },
                //     "message": "request successful."
                // }
            } catch (err) {
                throw new Error(
                    err.response?.data?.message || err.message
                );
            }finally {
                setIsLoadingCheck2FaceMatch(false);
            }
        },
    });

    // Gửi ảnh lên server
    const sendToServer = async () => {
        if (!faceImage) return toast.error("Chưa có ảnh để gửi!");
        const blob = getBlobFromBase64(faceImage);

        const formData = new FormData();
        formData.append("image", blob, "face.jpg");

        try {
            // await dispatch(check2FaceMatch({ image_1: file, image_2: blob, driverLicenseNumber, driverLicenseClass, driverLicenseDob, driverLicenseName }))
            await faceMatchMutation.mutateAsync({
                image_1: file,
                image_2: blob,
                driverLicenseName: typeOfDriverLicense === 'driver-license-for-car'
                    ? verifyDriverLicenseMutation?.data?.data[0]?.name
                    : verifyDriverLicenseMutation?.data?.data[0]?.name,
                driverLicenseDob: typeOfDriverLicense === 'driver-license-for-car'
                    ? verifyDriverLicenseMutation?.data?.data[0]?.dob
                    : verifyDriverLicenseMutation?.data?.data[0]?.dob,
                driverLicenseNumber: typeOfDriverLicense === 'driver-license-for-car'
                    ? verifyDriverLicenseMutation?.data?.data[0]?.id
                    : verifyDriverLicenseMutation?.data?.data[0]?.id,
                driverLicenseClass: typeOfDriverLicense === 'driver-license-for-car'
                    ? verifyDriverLicenseMutation?.data?.data[0]?.class
                    : verifyDriverLicenseMutation?.data?.data[0]?.class,
            });
        } catch (err) {
            console.log('error ', err.message)
        }
    };


    // toast : 
    // toast if verify success : 
    useEffect(() => {
        if (verifyDriverLicenseMutation.isSuccess) {
            toast.success('Xác thực giấy phép lái xe thành công ,hãy xác minh khuôn mặt!')
        }
    }, [verifyDriverLicenseMutation.isSuccess])

    // toast if fail : 
    useEffect(() => {
        if (verifyDriverLicenseMutation.isError) {
            toast.error(verifyDriverLicenseMutation.error.message || 'Xác thực giấy phép lái xe thất bại, hãy thử lại!')
            setFile('')
        }
    }, [verifyDriverLicenseMutation.isError])
    // clean when unmount : 
    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    // // toast if 2 face match : 
    useEffect(() => {
        if (faceMatchMutation.isSuccess) {
            toast.success('Xác thực khuôn mặt thành công!')
        }
    }, [faceMatchMutation.isSuccess])
    // // toast if 2 face not match : 
    useEffect(() => {
        if (faceMatchMutation.isError) {
            toast.error('Khuôn mặt không khớp, hãy thử lại!')
        }
    }, [faceMatchMutation.isError])

    // toast for get user information error :
    useEffect(() => {
        if (isErrorUserInformation) {
            toast.error(errorUserInformation.message)
        }
    }, [isErrorUserInformation])
    // toast for get user information success :
    useEffect(() => {
        if (isSuccessUserInformation) {
            // toast.success('Lấy thông tin cá nhân thành công!')
        }
    }, [isSuccessUserInformation])

    if (isLoadingUserInformation) {
        return <div className="flex items-center justify-center">
            <Loader className="animate-spin" />
        </div>
    }

    return (
        <div className="bg-[#ffffff] rounded-2xl p-4 md:p-6">

            {/* giay phep lai xe :  */}
            <div className="flex items-center justify-between">
                {/* gplx , chua xac thuc */}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <span className="text-sm  sm:text-xl font-semibold">Giấy phép lái {typeOfDriverLicense === 'driver-license-for-car' ? 'xe ô tô' : 'xe máy'}</span>
                    {typeOfDriverLicense === 'driver-license-for-car' && userInformationData?.user?.driver_license_number_for_car
                        || typeOfDriverLicense === 'driver-license-for-motobike' && userInformationData?.user?.driver_license_number_for_motobike
                        ?
                        //    {/* da xac thuc : */}
                        <div className="flex items-center  gap-2 bg-green-200 rounded-xl p-1 px-2">
                            <CheckCheck className="text-green-500" size={12} />
                            <span className="text-xs font-normal">Đã xác thực</span>
                        </div>
                        :
                        //   {/* chua xac thuc : */}
                        <div className="flex items-center  gap-2 bg-red-200 rounded-xl p-1 px-2">
                            <X className="text-red-500" size={12} />
                            <span className="text-xs font-normal">Chưa xác thực</span>
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
                        backgroundImage: preview
                            ? `url(${preview})`
                            : typeOfDriverLicense === 'driver-license-for-car'
                                ? userInformationData?.user?.driver_license_image_url_for_car
                                    ? `url(${userInformationData?.user?.driver_license_image_url_for_car})`
                                    : ''
                                : userInformationData?.user?.driver_license_image_url_for_motobike
                                    ? `url(${userInformationData?.user?.driver_license_image_url_for_motobike})`
                                    : '',
                    }}
                >
                </div>
                {/* upload button :  */}
                <div className={(typeOfDriverLicense === 'driver-license-for-car' && userInformationData?.user?.driver_license_for_car)
                    || (typeOfDriverLicense === 'driver-license-for-motobike' && userInformationData?.user?.driver_license_for_motobike)
                    || verifyDriverLicenseMutation.isSuccess
                    || (typeOfDriverLicense === 'driver-license-for-car' && userInformationData?.user?.driver_license_number_for_car)
                    || (typeOfDriverLicense === 'driver-license-for-motobike' && userInformationData?.user?.driver_license_number_for_motobike)

                    ? 'hidden' : 'text-center block'} >
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
                    className={
                        (typeOfDriverLicense === 'driver-license-for-car' && userInformationData?.user?.driver_license_for_car)
                            || (typeOfDriverLicense === 'driver-license-for-motobike' && userInformationData?.user?.driver_license_for_motobike)
                            || verifyDriverLicenseMutation.isSuccess
                            || (typeOfDriverLicense === 'driver-license-for-car' && userInformationData?.user?.driver_license_number_for_car)
                            || (typeOfDriverLicense === 'driver-license-for-motobike' && userInformationData?.user?.driver_license_number_for_motobike)

                            ? 'hidden' : 'text-center block w-1/2  sm:w-1/4 mx-auto'}
                >
                    {isLoadingVerifyDriverLicense ? <Loader className="mx-auto animate-spin" /> : 'Xác thực ngay'}
                </Button>

                {/* thong tin chung :  */}
                <span className="text-sm sm:text-xl font-semibold">Thông tin chung</span>
                <div>
                    <span>Số GPLX</span>
                    <Input
                        disabled
                        placeholder='Nhập số GPLX đã cấp'
                        value={typeOfDriverLicense === 'driver-license-for-car'
                            ? userInformationData?.user?.driver_license_number_for_car || verifyDriverLicenseMutation.isSuccess && verifyDriverLicenseMutation?.data?.data[0]?.id || ''
                            : userInformationData?.user?.driver_license_number_for_motobike || verifyDriverLicenseMutation.isSuccess && verifyDriverLicenseMutation?.data?.data[0]?.id || ''

                        }
                        className='border-gray-500 mt-2'

                    />
                </div>
                <div>
                    <span>Họ và tên</span>
                    <Input
                        disabled
                        placeholder='Nhập đầy đủ họ tên'
                        value={
                            typeOfDriverLicense === 'driver-license-for-car'
                                ? userInformationData?.user?.driver_license_name_for_car || verifyDriverLicenseMutation.isSuccess && verifyDriverLicenseMutation?.data?.data[0]?.name || ''
                                : userInformationData?.user?.driver_license_name_for_motobike || verifyDriverLicenseMutation.isSuccess && verifyDriverLicenseMutation?.data?.data[0]?.name || ''
                        }
                        className='border-gray-500 mt-2'

                    />
                </div>
                <div>
                    <span>Ngày sinh</span>
                    <Input
                        disabled
                        placeholder='Nhập ngày sinh'
                        value={
                            typeOfDriverLicense === 'driver-license-for-car'
                                ? userInformationData?.user?.driver_license_dob_for_car || verifyDriverLicenseMutation.isSuccess && verifyDriverLicenseMutation?.data?.data[0]?.dob || ''
                                : userInformationData?.user?.driver_license_dob_for_motobike || verifyDriverLicenseMutation.isSuccess && verifyDriverLicenseMutation?.data?.data[0]?.dob || ''
                        }
                        className='border-gray-500 mt-2'

                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-light">Vì sao tôi phải xác thực GPLX</span>
                    <CircleQuestionMarkIcon size={16} className="hover:cursor-pointer" />
                </div>

                <div className={faceMatchMutation.isSuccess
                    || typeOfDriverLicense === 'driver-license-for-car' && userInformationData?.user?.driver_license_image_url_for_car
                    || typeOfDriverLicense === 'driver-license-for-motobike' && userInformationData?.user?.driver_license_image_url_for_motobike
                    ? 'hidden' : 'flex flex-col gap-4'}>
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
                                        {isLoadingCheck2FaceMatch ? <Loader className="animate-spin" /> : "Xác thực ngay"}
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
