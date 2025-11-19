import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import axiosInstance from "@/config/axiosInstance"
import { ArrowRightCircle, CheckCheck, CircleQuestionMarkIcon, Loader2Icon, PenBoxIcon, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { FaSpinner } from "react-icons/fa"
import Webcam from "react-webcam"
import { toast } from "sonner"

const IdentifyCardVerify = ({ refetchIdentityCard }) => {

  const [toggleEdit, setToggleEdit] = useState(false)

  // state for identity card info :
  const [identityName, setIdentityName] = useState('');
  const [identityDob, setIdentityDob] = useState('');
  const [identityNumber, setIdentityNumber] = useState('');

  // state for verify identity card :
  const [isVerifyIdentityCardSuccess, setIsVerifyIdentityCardSuccess] = useState(false);
  const [isVerifyIdentityCardLoading, setIsVerifyIdentityCardLoading] = useState(false);
  const [isVerifyIdentityCardError, setIsVerifyIdentityCardError] = useState(null);


  // state for face match :
  const [is2FaceMatch, setIs2FaceMatch] = useState(false);
  const [is2FaceMatchLoading, setIs2FaceMatchLoading] = useState(false);
  const [is2FaceMatchError, setIs2FaceMatchError] = useState(null);


  console.log(isVerifyIdentityCardError, is2FaceMatchError)


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
  // verify identity card :
  const verifyIdentityCardToCheckIfThisCardIsValid = async () => {
    if (!file) {
      toast.error("Vui lòng tải ảnh lên!");
      return;
    }
    // await dispatch(verifyDriverLicense({ image: file }));
    // prepare FormData
    const formData = new FormData();
    formData.append("image", file);

    try {
      // set state
      setIsVerifyIdentityCardLoading(true);

      const res = await axiosInstance.post(
        "/api/renter/info/verify/identify-card",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      // handle response
      console.log('res ', res.data)
      // sample response :
      //  res.data = { data: [
      //     {
      //  "id": "049203001218",
      // "name": "HUỲNH VĂN KHẢI",
      // "dob": "19/07/2003",
      //     }
      // toast success
      toast.success("Ảnh căn cước hợp lệ! Vui lòng tiếp tục xác thực khuôn mặt.");
      // set identity info :
      setIdentityName(res.data?.data[0]?.name);
      setIdentityDob(res.data?.data[0]?.dob);
      setIdentityNumber(res.data?.data[0]?.id);

      // set verify identity card success : 
      setIsVerifyIdentityCardSuccess(true);
      setIsVerifyIdentityCardError(null);
      setIsVerifyIdentityCardLoading(false);

    } catch (error) {
      console.log('error ', error?.response?.data?.message)
      // toast error
      toast.error(error?.response?.data?.message || "Xác thực thất bại, vui lòng thử lại!");
      // set state :
      setIsVerifyIdentityCardSuccess(false);
      setIsVerifyIdentityCardError(error?.response?.data?.message || "Xác thực thất bại, vui lòng thử lại!");
      setIsVerifyIdentityCardLoading(false);
    }

  };

  // chup anh khuon mat : 
  const webcamRef = useRef(null);
  const [faceImage, setFaceImage] = useState(null); // lưu base64 image
  const [startCamera, setStartCamera] = useState(false);

  // Chụp ảnh
  const capture = () => {
    // if dont verify driver yet , toast : 
    if (!isVerifyIdentityCardSuccess) {
      toast.error('Bạn phải xác thực căn cước trước!')
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
    formData.append("image_2", blob, "face.jpg");
    formData.append("image_1", file, "identity_card.jpg");
    // add other info to form data :
    formData.append("identityName", identityName);
    formData.append("identityDob", identityDob);
    formData.append("identityNumber", identityNumber);

    try {
      setIs2FaceMatchLoading(true);
      // await dispatch(check2FaceMatch({ image_1: file, image_2: blob, driverLicenseNumber, driverLicenseClass, driverLicenseDob, driverLicenseName }))
      // post to : /api/renter/info/check-2-face-match-identity-card
      const res = await axiosInstance.post(
        "/api/renter/info/check-2-face-match-identity-card",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      // handle response
      console.log('res ', res.data)
      // toast success
      toast.success("Xác thực căn cước thành công! Giờ bạn có thể tiếp tục.");

      // set state :
      setIs2FaceMatch(true);
      setIs2FaceMatchError(null);
      setIs2FaceMatchLoading(false);

      // set verify identity card success : 
      setIsVerifyIdentityCardSuccess(true);
      setIsVerifyIdentityCardError(null);
      setIsVerifyIdentityCardLoading(false);

      // reset face image : 
      setFaceImage(null);
      setStartCamera(false);

      // refetch parent state :
      if (refetchIdentityCard) {
        refetchIdentityCard();
      }

    } catch (err) {
      console.log('error ', err.response?.data?.message)
      // toast error
      toast.error(err?.response?.data?.message || "Xác thực thất bại, vui lòng thử lại!");

      // set state :
      setIs2FaceMatch(false);
      setIs2FaceMatchError(err?.response?.data?.message || "Xác thực thất bại, vui lòng thử lại!");
      setIs2FaceMatchLoading(false);
      // reset face image : 
      setFaceImage(null);
      setStartCamera(false);

    }
  };

  // clean when unmount : 
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <div className="bg-[#ffffff] rounded-2xl p-4 md:p-6">

      {/* giay phep lai xe :  */}
      <div className="flex items-center justify-between">
        {/* gplx , chua xac thuc */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <span className="text-sm  sm:text-xl font-semibold">Xác thực căn cước</span>
          {is2FaceMatch ?

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



      {/* hinh anh : */}
      <div className="mt-6 flex flex-col gap-6">
        <span className="text-sm sm:text-xl font-semibold">Hình ảnh</span>
        {/* hinh anh :  */}
        <div
          className="relative mx-auto w-[300px] h-[150px] sm:w-[400px] sm:h-[250px] rounded-xl bg-gray-100 bg-cover bg-center border shadow"
          style={{
            backgroundImage: preview ? `url(${preview})` : '',
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
          onClick={verifyIdentityCardToCheckIfThisCardIsValid}
          className={is2FaceMatch ? 'hidden' : 'text-center block w-1/2  sm:w-1/4 mx-auto px-1'}
          disabled={isVerifyIdentityCardLoading || !file}
        >
          {isVerifyIdentityCardLoading ? <Loader2Icon className="mx-auto animate-spin" /> : 'Xác thực ngay'}
        </Button>

        {/* thong tin chung :  */}
        <span className="text-sm sm:text-xl font-semibold">Thông tin chung</span>
        <div>
          <span>Số GPLX</span>
          <input type="text" />
          <Input
            disabled
            placeholder='Nhập số căn cước đã cấp'
            value={identityNumber}
            className='border-gray-500 mt-2 py-6'

          />
        </div>
        <div>
          <span>Họ và tên</span>
          <input type="text" />
          <Input
            disabled
            placeholder='Nhập đầy đủ họ tên'
            value={identityName}
            className='border-gray-500 mt-2 py-6'

          />
        </div>
        <div>
          <span>Ngày sinh</span>
          <input type="text" />
          <Input
            disabled
            placeholder='Nhập ngày sinh'
            value={identityDob}
            className='border-gray-500 mt-2 py-6'

          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-light">Vì sao tôi phải xác thực</span>
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
                <Button
                  className="bg-green-500 hover:bg-green-400"
                  onClick={capture}
                  disabled={!isVerifyIdentityCardSuccess || is2FaceMatchLoading || isVerifyIdentityCardLoading || !file}
                >
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

export default IdentifyCardVerify