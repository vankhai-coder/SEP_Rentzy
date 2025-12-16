import DriverLicenseVerify from "@/components/renter/PersonalCardVerify/DriverLicenseVerify"
// import IdentityCardVerify from "@/components/renter/PersonalCardVerify/IdentityCardVerify"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { CarIcon, CheckCheck, MedalIcon, Pen } from "lucide-react"
import { BiError } from "react-icons/bi"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import UpdateEmail from "@/components/renter/PersonalInformation/UpdateEmail"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { getBasicUserInformation, resetUserInformationSlice, updateAvatar, updateFullName } from "@/redux/features/auth/userInformationSlice"
import { toast } from "sonner"
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import UpdatePhone from "@/components/renter/PersonalInformation/UpdatePhone"
import { setAvatar } from "@/redux/features/auth/authSlice"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const UserInformation = () => {

  // redux : 
  const dispatch = useDispatch()
  const {
    points,
    driver_class,
    driver_license_dob,
    avatar_url,
    phone_number,
    email,
    full_name,
    isLoadingGetBasicUserInformation,
    errorGetBasicUserInformation,
    date_join,
    // update full name :
    isLoadingUpdateFullName,
    isUpdateFullNameSuccess,
    errorUpdateFullName,
    // update avatar :
    isLoadingUpdateAvatar,
    isUpdateAvatarSuccess,
    errorUpdateAvatar,
  } = useSelector((state) => state.userInformationStore);

  // open updated email dialog : 
  const [open, setOpen] = useState(false)

  // state for update full name :
  const [newFullName, setNewFullName] = useState('')
  // state for update name dialog :
  const [updateNewNameOpen, setUpdateNewNameOpen] = useState(false)

  const [previewAvatarUrl, setPreviewAvatarUrl] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  // state for open/close update avatar dialog :
  const [updateAvatarDialogOpen, setUpdateAvatarDialogOpen] = useState(false);

  // useEffect to clear preview avatar and avatar file when dialog is closed :
  useEffect(() => {
    if (!updateAvatarDialogOpen) {
      // reset preview avatar :
      setPreviewAvatarUrl(null);
      setAvatarFile(null);
    }
  }, [updateAvatarDialogOpen]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]; // use optional chaining to avoid undefined errors
    if (!file) return; // no file selected

    // validate image type
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp hình ảnh hợp lệ.");
      e.target.value = null;
      return;
    }

    // cleanup old preview (avoid memory leak)
    if (previewAvatarUrl) {
      URL.revokeObjectURL(previewAvatarUrl);
    }

    // set new file and preview
    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewAvatarUrl(objectUrl);
    console.log("Selected avatar file:", objectUrl);

    // allow reselecting same image again
    e.target.value = null;
  };


  // cleanup object url to avoid memory leak :
  useEffect(() => {
    return () => {
      if (previewAvatarUrl) {
        URL.revokeObjectURL(previewAvatarUrl);
      }
    };
  }, [previewAvatarUrl]);


  // dispatch get basic user information: 
  useEffect(() => {
    dispatch(getBasicUserInformation())
  }, [dispatch])


  // toast if error : 
  useEffect(() => {
    if (errorGetBasicUserInformation) {
      toast.error(errorGetBasicUserInformation)
    }
  }, [errorGetBasicUserInformation])


  // toast if update full name error  :
  useEffect(() => {
    if (errorUpdateFullName) {
      toast.error(errorUpdateFullName)
      // clear input :
      setNewFullName('')
      // clear success state in redux :
      dispatch(resetUserInformationSlice())
      // close dialog :
      setUpdateNewNameOpen(false)
    }
  }, [errorUpdateFullName, dispatch])

  // toast if update full name success :
  useEffect(() => {
    if (isUpdateFullNameSuccess) {
      toast.success('Cập nhật tên thành công!')
      // clear input :
      setNewFullName('')
      // clear success state in redux :
      dispatch(resetUserInformationSlice())
      // close dialog :
      setUpdateNewNameOpen(false)
    }
  }, [isUpdateFullNameSuccess, dispatch])

  // toast if update avatar error  :
  useEffect(() => {
    if (errorUpdateAvatar) {
      toast.error(errorUpdateAvatar)
      // clear preview avatar :
      setPreviewAvatarUrl(null);
      setAvatarFile(null);
      // clear success state in redux :
      dispatch(resetUserInformationSlice())
      // close dialog :
      setUpdateAvatarDialogOpen(false)
    }
  }, [errorUpdateAvatar, dispatch])

  // toast if update avatar success :
  useEffect(() => {
    if (isUpdateAvatarSuccess) {
      toast.success('Cập nhật ảnh đại diện thành công!')
      // clear preview avatar :
      setPreviewAvatarUrl(null);
      setAvatarFile(null);
      // clear success state in redux :
      dispatch(resetUserInformationSlice())
      // close dialog :
      setUpdateAvatarDialogOpen(false)
      // set new avatar in header :
      dispatch(setAvatar(avatar_url))
    }
  }, [isUpdateAvatarSuccess, dispatch, avatar_url])


  if (isLoadingGetBasicUserInformation) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-9 w-full max-w-full overflow-x-hidden box-border">
      {/* basic detail : avatar , name , email , phone .... */}
      <div className="bg-[#ffffff] rounded-2xl p-3 sm:p-4 md:p-6 w-full max-w-full box-border overflow-x-hidden">

        {/* thong tin tai khoan :  */}
        <div className="flex items-center justify-between rounded-t-2xl py-3 sm:py-4 w-full max-w-full overflow-x-hidden">
          {/* thong tin tai khoan : */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <span className="text-base sm:text-lg md:text-xl font-semibold truncate">Thông tin tài khoản</span>
            <Pen size={14} className="sm:w-4 sm:h-4 hover:cursor-pointer flex-shrink-0" />
          </div>
          {/* so chuyen xe : */}
          <div className="hidden sm:flex items-end justify-between gap-2 border p-3 sm:p-4 rounded-xl flex-shrink-0">
            <CarIcon size={32} className="sm:w-[38px] sm:h-[38px] text-green-400" />
            <span className="text-green-400 font-bold text-2xl sm:text-4xl">0</span>
            <span className="text-sm sm:text-base">chuyến</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:justify-between gap-4 w-full max-w-full overflow-x-hidden" >

          {/* avatar va thong tin ca nhan :  */}
          {/* avatar :  */}
          <div className="flex flex-col items-center gap-2">
            {/* avatar : */}
            <Dialog onOpenChange={setUpdateAvatarDialogOpen} open={updateAvatarDialogOpen} >
              <DialogTrigger asChild>
                <Avatar className='size-26' >
                  <AvatarImage src={avatar_url || '/default_avt.jpg'} alt="User avatar" className={'hover:cursor-pointer hover:opacity-60 '} />
                  <AvatarFallback>User Avatar</AvatarFallback>
                </Avatar>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle> Chọn ảnh đại diện mới</DialogTitle>
                  <DialogDescription>
                  </DialogDescription>
                </DialogHeader>

                {/* preview avatar  */}
                <Avatar className='size-40 mx-auto mt-4' >
                  <AvatarImage src={previewAvatarUrl || avatar_url || '/default_avt.jpg'} alt="Chọn ảnh đại diện mới" className={' '} />
                  <AvatarFallback>Update Avatar</AvatarFallback>
                </Avatar>
                {/* choose image button , disappear when have previewAvatarUrl */}
                <label
                  htmlFor="imageUpload"
                  className={`mt-4 w-full mx-auto ${previewAvatarUrl ? 'hidden' : ''}`}
                >
                  <div className="w-full border px-4 py-2 rounded-md text-sm text-center cursor-pointer">
                    Chọn ảnh từ thiết bị
                  </div>
                </label>
                <input
                  id="imageUpload"
                  hidden
                  type="file"
                  accept="image/*"
                  className="mt-4 w-full  "
                  onChange={handleAvatarChange}
                />
                {/* choose another image button : */}
                {previewAvatarUrl &&
                  <Button
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={() => {
                      // reset preview avatar :
                      setPreviewAvatarUrl(null);
                      setAvatarFile(null);
                    }}
                  >
                    Chọn ảnh khác
                  </Button>
                }

                {/* update avatar button */}
                {previewAvatarUrl &&
                  <Button
                    className=" w-full"
                    onClick={() => {
                      // dispatch update avatar action :
                      dispatch(updateAvatar({ avatarImage: avatarFile }));
                    }}
                  >
                    {isLoadingUpdateAvatar ? 'Đang cập nhật...' : 'Cập nhật ảnh đại diện'}
                  </Button>
                }

                <DialogFooter>
                  <DialogClose asChild>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="flex items-center gap-2 sm:gap-4 w-full max-w-full">
              {/* name : */}
              <span className="font-semibold text-sm sm:text-base md:text-lg truncate min-w-0 flex-1">{full_name || email}</span>

              {/* update pen : */}
              <Dialog onOpenChange={setUpdateNewNameOpen} open={updateNewNameOpen} >
                <DialogTrigger asChild>
                  <Pen size={16} className="ml-1 hover:cursor-pointer"
                  />
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Cập nhập tên mới </DialogTitle>
                    <DialogDescription>
                    </DialogDescription>
                  </DialogHeader>
                  {/* input to update new name : */}
                  <Input
                    type="text"
                    placeholder="Nhập tên mới"
                    className="mt-4"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                  />
                  {/* update button : disable if new name is empty or the same with last one , and loading spiner when updating */}
                  <Button
                    className="mt-4 w-full"
                    disabled={newFullName.trim() === '' || newFullName === full_name || newFullName === email}
                    onClick={() => {
                      // dispatch update full name action :
                      dispatch(updateFullName({ fullName: newFullName }))
                    }}
                  >
                    {isLoadingUpdateFullName ? 'Đang cập nhật...' : 'Cập nhật tên'}
                  </Button>


                  <DialogFooter>
                    <DialogClose asChild>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

            </div>
            {/* thoi gian tham gia : */}
            <span className="text-sm font-normal">Tham gia : {date_join}</span>

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
                <span className="font-bold">{points} điểm</span>
              </div>
            </div>

          </div>

          {/* thong tin ca nhan : */}
          <div className="">
            {/* ngay sinh gioi tinh :  */}
            <div className="bg-[#f6f6f6] rounded-2xl p-3 sm:p-4 px-4 sm:px-6 flex flex-col gap-3 sm:gap-4 w-full max-w-full box-border">
              <div className="flex justify-between gap-2 w-full">
                <span className="font-light text-xs sm:text-sm flex-shrink-0">Ngày sinh</span>
                <span className="font-semibold text-xs sm:text-sm truncate text-right">{driver_license_dob}</span>
              </div>
              <div className="flex justify-between gap-2 w-full">
                <span className="font-light text-xs sm:text-sm flex-shrink-0">Hạng GPLX</span>
                <span className="font-semibold text-xs sm:text-sm truncate text-right">{driver_class}</span>
              </div>
            </div>

            {/* sdt :  */}
            <div className="flex flex-col sm:flex-row sm:justify-between py-3 sm:py-4 border-b gap-2 sm:gap-0 w-full max-w-full overflow-x-hidden">
              {/* div ben trai  */}
              <div className="flex gap-1.5 sm:gap-2 items-center min-w-0 flex-1">
                <span className="font-light text-xs sm:text-sm flex-shrink-0">Số điện thoại</span>
                {phone_number ?
                  <div className="flex items-center gap-1 sm:gap-2 bg-green-200 rounded-xl p-0.5 sm:p-1 px-1.5 sm:px-2 flex-shrink-0">
                    <CheckCheck className="text-green-500" size={10} />
                    <span className="text-[10px] sm:text-xs font-normal whitespace-nowrap">Đã xác thực</span>
                  </div>
                  :
                  <div className="p-0.5 sm:p-1 rounded-xl text-[10px] sm:text-xs font-light bg-yellow-200 flex items-center gap-0.5 flex-shrink-0">
                    <BiError className="w-3 h-3" />
                    <span className="hidden sm:block whitespace-nowrap">Chưa xác thực</span>
                  </div>
                }
              </div>
              {/* div ben phai  */}
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="text-xs sm:text-sm md:text-base font-semibold truncate">{phone_number ? phone_number : 'Thêm số điện thoại'}</span>
                <UpdatePhone />
              </div>
            </div>

            {/* email : */}
            <div className="flex flex-col sm:flex-row sm:justify-between py-3 sm:py-4 border-b gap-2 sm:gap-4 w-full max-w-full overflow-x-hidden">
              {/* div ben trai  */}
              <div className="flex gap-1.5 sm:gap-2 items-center min-w-0 flex-1">
                <span className="font-light text-xs sm:text-sm flex-shrink-0">Email</span>
                {email ?
                  <div className="flex items-center gap-1 sm:gap-2 bg-green-200 rounded-xl p-0.5 sm:p-1 px-1.5 sm:px-2 flex-shrink-0">
                    <CheckCheck className="text-green-500" size={10} />
                    <span className="text-[10px] sm:text-xs font-normal whitespace-nowrap">Đã xác thực</span>
                  </div>
                  :
                  <div className="p-0.5 sm:p-1 rounded-xl text-[10px] sm:text-xs font-light bg-yellow-200 flex items-center gap-0.5 flex-shrink-0">
                    <BiError className="w-3 h-3" />
                    <span className="hidden sm:block whitespace-nowrap">Chưa xác thực</span>
                  </div>
                }
              </div>
              {/* div ben phai  */}
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="text-xs sm:text-sm md:text-base font-semibold truncate">{email}</span>
                {/* pop up update email form : */}
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Pen className="hover:cursor-pointer flex-shrink-0" size={14} />
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle></DialogTitle>
                    </DialogHeader>
                    <UpdateEmail setOpen={setOpen} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            {/*  */}
          </div>
        </div>

      </div>

      <Tabs defaultValue="motobike" className="">
        <TabsList>
          <TabsTrigger value="motobike">Xác thực bằng xe máy</TabsTrigger>
          <TabsTrigger value="car">Xác thực bằng xe ô tô</TabsTrigger>
        </TabsList>
        <TabsContent value="motobike">
          {/* Verify driver license : */}
          <DriverLicenseVerify typeOfDriverLicense="driver-license-for-motobike" />
        </TabsContent>
        <TabsContent value="car">
          {/* Verify driver license : */}
          <DriverLicenseVerify typeOfDriverLicense="driver-license-for-car" />
        </TabsContent>
      </Tabs>

      {/* Verify identity card : */}
      {/* <IdentityCardVerify /> */}
    </div>
  )
}

export default UserInformation