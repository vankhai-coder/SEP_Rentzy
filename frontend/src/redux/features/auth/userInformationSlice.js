import axiosInstance from "@/config/axiosInstance";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const initialState = {
  // phone number 
  isVerifyPhoneNumber: false,

  // identity card : 
  isVerifyNationalId: true,

  // driver license : 
  isVerifyDriverLicenseOfRenterUploadSuccess: false,
  driverLicenseNumber: '',
  driverLicenseName: '',
  driverLicenseDob: '',
  driverLicenseClass: '',
  driverLicenseError: '',
  driverLicenseLoading: false,
  isVerifyDriverLicenseMatchWithwebcam: '',

  // check 2 face match : 
  is2FaceMatch: '',
  is2FaceMatchError: '',
  is2FaceMatchLoading: '',

  // request send update new email : 
  isSendUpdateEmailSuccess: false,
  isLoadingSendUpdateEmail: false,
  errorWhenSendUpdateEmail: '',

  // verify updated email : 
  isVerifyUpdatedEmailSuccess: false,
  isVerifyUpdatedEmailLoading: false,
  verifyUpdatedEmailError: '',

  // get basic user information : 
  points: 0,
  driver_class: '',
  driver_license_image_url: '',
  driver_license_dob: '',
  driver_license_name: '',
  driver_license_number: '',
  avatar_url: '',
  phone_number: '',
  date_join: '',
  email: '',
  full_name: '',
  isLoadingGetBasicUserInformation: false,
  errorGetBasicUserInformation: '',

  // update full name :
  isLoadingUpdateFullName: false,
  isUpdateFullNameSuccess: false,
  errorUpdateFullName: '',

  // update avatar :
  isLoadingUpdateAvatar: false,
  isUpdateAvatarSuccess: false,
  errorUpdateAvatar: '',

  // send request to send otp to phone number :
  sendOtpToPhoneNumberSuccess: false,
  isLoadingSendOtpToPhoneNumber: false,
  errorWhenSendOtpToPhoneNumber: '',

  // verify otp for phone number :
  verifyOtpForPhoneNumberSuccess: false,
  isLoadingVerifyOtpForPhoneNumber: false,
  errorWhenVerifyOtpForPhoneNumber: '',

};


// verify driver license : 
export const verifyDriverLicense = createAsyncThunk(
  "renter/verifyDriverLicense",
  async ({ image }, { rejectWithValue }) => {
    try {
      // prepare FormData
      const formData = new FormData();
      formData.append("image", image);

      const res = await axiosInstance.post(
        "/api/renter/info/verify/driver-license-card",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return res.data; // { data : [{id , name , dob}]}
    } catch (err) {
      console.log('error in verifyDriverLicense : ', err.message);
      return rejectWithValue({

        message:
          err.response?.data?.message ||
          "Error verifying driver license!",
      });
    }
  }
)

// check 2 image match (from one person)
export const check2FaceMatch = createAsyncThunk(
  "faceMatch/check2FaceMatch",
  async ({ image_1, image_2, driverLicenseName, driverLicenseDob, driverLicenseNumber, driverLicenseClass }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("image_1", image_1);
      formData.append("image_2", image_2);

      const response = await axiosInstance.post(
        `/api/renter/info/check-2-face-match-driver-license`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          params: {
            driverLicenseName,
            driverLicenseDob,
            driverLicenseNumber,
            driverLicenseClass
          },
        }
      );

      return response.data; // {data : {isMatch}}
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// send update email request : 
export const sendUpdateEmail = createAsyncThunk(
  "auth/sendUpdateEmail",
  async ({ updatedEmail }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        "/api/auth/request-update-email",
        { updatedEmail }
      );

      return response.data; // backend should return { message: "..." }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi khi cập nhật email!');
    }
  }
);

// send update email request : 
export const verifyUpdatedEmail = createAsyncThunk(
  "auth/verifyUpdatedEmail",
  async ({ updatedEmail, verifyEmailToken }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        "/api/auth/verify-updated-email",
        { updatedEmail, verifyEmailToken }
      );

      return response.data; // backend should return { message: "..." }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi khi cập nhật email!');
    }
  }
);

// getBasicUserInformation : 
export const getBasicUserInformation = createAsyncThunk(
  "user/getBasicUserInformation",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/renter/info/get-basic-user-information");

      // expect: { success: true, user : { points, driver_class, ... } }
      return res.data;
    } catch (err) {
      console.error("Error in getBasicUserInformation:", err.message);
      return rejectWithValue({
        message:
          err.response?.data?.message ||
          "Lỗi lấy thông tin cá nhân!",
      });
    }
  }
);

// update full name :
export const updateFullName = createAsyncThunk(
  "user/updateFullName",
  async ({ fullName }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/renter/info/update-full-name", { fullName });

      // expect: { success: true, fullName: "..." }
      return res.data;
    }
    catch (err) {
      console.error("Error in updateFullName:", err.message);
      return rejectWithValue({
        message:
          err.response?.data?.message ||
          "Lỗi cập nhật tên đầy đủ!",
      });
    }
  }
);

// update avatar :
export const updateAvatar = createAsyncThunk(
  "user/updateAvatar",
  async ({ avatarImage }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("avatarImage", avatarImage);

      const res = await axiosInstance.post(
        "/api/renter/info/update-avatar",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // expect: { success: true, avatarUrl: "..." }
      return res.data;
    } catch (err) {
      console.error("Error in updateAvatar:", err.message);
      return rejectWithValue({
        message:
          err.response?.data?.message ||
          "Lỗi cập nhật ảnh đại diện!",
      });
    }
  }
);

// request to send otp to phone number :
export const sendOtpToPhoneNumber = createAsyncThunk(
  "user/sendOtpToPhoneNumber",
  async ({ phoneNumber }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/api/renter/info/send-otp",
        { phoneNumber }
      );

      // expect: { success: true, message: "..." }
      return res.data;
    } catch (err) {
      console.error("Error in sendOtpToPhoneNumber:", err.message);
      return rejectWithValue({
        message:
          err.response?.data?.message ||
          "Lỗi gửi mã OTP đến số điện thoại!",
      });
    }
  }
);

// verify otp for phone number :
export const verifyOtpForPhoneNumber = createAsyncThunk(
  "user/verifyOtpForPhoneNumber",
  async ({ phoneNumber, otpCode }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/api/renter/info/verify-otp",
        { phoneNumber, otpCode }
      );

      // expect: { success: true, message: "..." , phone_number: "..." }
      return res.data;
    } catch (err) {
      console.error("Error in verifyOtpForPhoneNumber:", err.message);
      return rejectWithValue({
        message:
          err.response?.data?.message ||
          "Lỗi xác thực mã OTP cho số điện thoại!",
      });
    }
  }
);


const userInformationSlice = createSlice({
  name: "userInformation",
  initialState,
  reducers: {
    resetUserInformationSlice: (state) => {
      // send request update new email : 
      state.isSendUpdateEmailSuccess = false;
      state.isLoadingSendUpdateEmail = false;
      state.errorWhenSendUpdateEmail = '';
      // verify updated email : 
      state.isVerifyUpdatedEmailSuccess = false;
      state.isVerifyUpdatedEmailLoading = false;
      state.verifyUpdatedEmailError = '';
      // update full name :
      state.isLoadingUpdateFullName = false;
      state.isUpdateFullNameSuccess = false;
      state.errorUpdateFullName = '';
      // update avatar :
      state.isLoadingUpdateAvatar = false;
      state.isUpdateAvatarSuccess = false;
      state.errorUpdateAvatar = '';
      // reset phone number otp state :
      state.sendOtpToPhoneNumberSuccess = false;
      state.isLoadingSendOtpToPhoneNumber = false;
      state.errorWhenSendOtpToPhoneNumber = '';
      // verify otp for phone number :
      state.verifyOtpForPhoneNumberSuccess = false;
      state.isLoadingVerifyOtpForPhoneNumber = false;
      state.errorWhenVerifyOtpForPhoneNumber = '';
      // check 2 face match :
      state.is2FaceMatch = '';
      state.is2FaceMatchError = '';
      state.is2FaceMatchLoading = '';
      // driver license :
      state.isVerifyDriverLicenseOfRenterUploadSuccess = false;
      state.driverLicenseError = '';
      state.driverLicenseLoading = false;
      state.isVerifyDriverLicenseMatchWithwebcam = '';
      // get basic user information :
      state.isLoadingGetBasicUserInformation = false;
      state.errorGetBasicUserInformation = '';
    },
  },
  extraReducers: (builder) => {
    builder
      // verify driver license : 
      // Pending
      .addCase(verifyDriverLicense.pending, (state) => {
        state.driverLicenseLoading = true;
        state.driverLicenseError = '';
        state.isVerifyDriverLicenseOfRenterUploadSuccess = false;
        state.driverLicenseNumber = '';
        state.driverLicenseName = '';
        state.driverLicenseDob = '';
      })

      // Fulfilled
      .addCase(verifyDriverLicense.fulfilled, (state, action) => {
        state.driverLicenseLoading = false;
        state.driverLicenseError = '';
        state.isVerifyDriverLicenseOfRenterUploadSuccess = true;
        // backend returns:
        // { data: { id: "...", name: "...", dob: "..." } }
        const data = action.payload.data;
        state.driverLicenseNumber = data[0]?.id || '';
        state.driverLicenseName = data[0]?.name || '';
        state.driverLicenseDob = data[0]?.dob || '';
        state.driverLicenseClass = data[0]?.class || '';
      })

      // Rejected
      .addCase(verifyDriverLicense.rejected, (state, action) => {
        state.driverLicenseLoading = false;
        state.isVerifyDriverLicenseOfRenterUploadSuccess = false;
        state.driverLicenseError = action.payload?.message || 'Verification failed';
        state.driverLicenseNumber = '';
        state.driverLicenseName = '';
        state.driverLicenseDob = '';
      })

      // check 2 face match : 
      .addCase(check2FaceMatch.pending, (state) => {
        state.is2FaceMatchLoading = true;
        state.is2FaceMatchError = null;
        state.is2FaceMatch = null;
        state.isVerifyDriverLicenseMatchWithwebcam = false;

      })
      .addCase(check2FaceMatch.fulfilled, (state) => {
        state.is2FaceMatchLoading = false;
        state.is2FaceMatch = true;
        state.isVerifyDriverLicenseMatchWithwebcam = true;
        state.is2FaceMatchError = null;
      })
      .addCase(check2FaceMatch.rejected, (state, action) => {
        state.is2FaceMatchLoading = false;
        state.is2FaceMatchError = action.payload || "Lỗi khi kiểm tra khớp khuôn mặt";
        state.is2FaceMatch = null;
        state.isVerifyDriverLicenseMatchWithwebcam = false;
      })
      // send verify email request : 
      // --- PENDING ---
      .addCase(sendUpdateEmail.pending, (state) => {
        state.isLoadingSendUpdateEmail = true;
        state.errorWhenSendUpdateEmail = null;
        state.isSendUpdateEmailSuccess = null;
      })
      // --- FULFILLED ---
      .addCase(sendUpdateEmail.fulfilled, (state) => {
        state.isLoadingSendUpdateEmail = false;
        state.errorWhenSendUpdateEmail = null;
        state.isSendUpdateEmailSuccess = true
      })
      // --- REJECTED ---
      .addCase(sendUpdateEmail.rejected, (state, action) => {
        state.isLoadingSendUpdateEmail = false;
        state.errorWhenSendUpdateEmail = action.payload
        state.isSendUpdateEmailSuccess = false
      })

      // verify updated email : 
      // --- PENDING ---
      .addCase(verifyUpdatedEmail.pending, (state) => {
        state.isVerifyUpdatedEmailLoading = true;
        state.verifyUpdatedEmailError = null;
        state.isVerifyUpdatedEmailSuccess = null;
      })
      // --- FULFILLED ---
      .addCase(verifyUpdatedEmail.fulfilled, (state) => {
        state.isVerifyUpdatedEmailLoading = false;
        state.verifyUpdatedEmailError = null;
        state.isVerifyUpdatedEmailSuccess = true
      })
      // --- REJECTED ---
      .addCase(verifyUpdatedEmail.rejected, (state, action) => {
        state.isVerifyUpdatedEmailLoading = false;
        state.verifyUpdatedEmailError = action.payload
        state.isVerifyUpdatedEmailSuccess = false
      })
      // getBasicUserInformation
      // Pending
      .addCase(getBasicUserInformation.pending, (state) => {
        state.isLoadingGetBasicUserInformation = true;
        state.errorGetBasicUserInformation = null;

        state.points = 0;
        state.driver_class = "";
        state.driver_license_image_url = "";
        state.driver_license_dob = "";
        state.driver_license_name = "";
        state.driver_license_number = "";
        state.avatar_url = "";
        state.phone_number = "";
        state.email = "";
        state.full_name = "";
        state.date_join = ''
      })
      // Fulfilled
      .addCase(getBasicUserInformation.fulfilled, (state, action) => {
        state.isLoadingGetBasicUserInformation = false;
        state.errorGetBasicUserInformation = null;

        const user = action.payload?.user || {};

        state.points = user.points || 0;
        state.driver_class = user.driver_class || "";
        state.driver_license_image_url = user.driver_license_image_url || "";
        state.driver_license_dob = user.driver_license_dob || "";
        state.driver_license_name = user.driver_license_name || "";
        state.driver_license_number = user.driver_license_number || "";
        state.avatar_url = user.avatar_url || "";
        state.phone_number = user.phone_number || "";
        state.email = user.email || "";
        state.full_name = user.full_name || "";
        state.date_join = user.date_join || "";
        state.isVerifyDriverLicenseMatchWithwebcam = Boolean(user.driver_license_image_url)
        state.isVerifyPhoneNumber = Boolean(user.phone_number)

      })

      // Rejected
      .addCase(getBasicUserInformation.rejected, (state, action) => {
        state.isLoadingGetBasicUserInformation = false;
        state.errorGetBasicUserInformation = action.payload?.message || "Failed to load user info";

        // Reset all fields when request fails
        state.points = 0;
        state.driver_class = "";
        state.driver_license_image_url = "";
        state.driver_license_dob = "";
        state.driver_license_name = "";
        state.driver_license_number = "";
        state.avatar_url = "";
        state.phone_number = "";
        state.email = "";
        state.full_name = "";
        state.date_join = ''
      })

      // update full name :
      // Pending
      .addCase(updateFullName.pending, (state) => {
        state.isLoadingUpdateFullName = true;
        state.isUpdateFullNameSuccess = false;
        state.errorUpdateFullName = '';
      })
      // Fulfilled
      .addCase(updateFullName.fulfilled, (state, action) => {
        state.isLoadingUpdateFullName = false;
        state.isUpdateFullNameSuccess = true;
        state.errorUpdateFullName = '';

        // update full name in state
        state.full_name = action.payload.fullName || state.full_name;
      })
      // Rejected
      .addCase(updateFullName.rejected, (state, action) => {
        state.isLoadingUpdateFullName = false;
        state.isUpdateFullNameSuccess = false;
        state.errorUpdateFullName = action.payload?.message || 'Cập nhật tên thất bại!';
      })

      // update avatar :
      // Pending
      .addCase(updateAvatar.pending, (state) => {
        state.isLoadingUpdateAvatar = true;
        state.isUpdateAvatarSuccess = false;
        state.errorUpdateAvatar = '';
      })
      // Fulfilled
      .addCase(updateAvatar.fulfilled, (state, action) => {
        state.isLoadingUpdateAvatar = false;
        state.isUpdateAvatarSuccess = true;
        state.errorUpdateAvatar = '';

        // update avatar url in state
        state.avatar_url = action.payload.avatarUrl || state.avatar_url;
      })
      // Rejected
      .addCase(updateAvatar.rejected, (state, action) => {
        state.isLoadingUpdateAvatar = false;
        state.isUpdateAvatarSuccess = false;
        state.errorUpdateAvatar = action.payload?.message || 'Cập nhật ảnh đại diện thất bại!';
      })
      // send otp to phone number :
      // --- PENDING ---
      .addCase(sendOtpToPhoneNumber.pending, (state) => {
        state.isLoadingSendOtpToPhoneNumber = true;
        state.errorWhenSendOtpToPhoneNumber = null;
        state.sendOtpToPhoneNumberSuccess = null;
      })
      // --- FULFILLED ---
      .addCase(sendOtpToPhoneNumber.fulfilled, (state, action) => {
        state.isLoadingSendOtpToPhoneNumber = false;
        state.errorWhenSendOtpToPhoneNumber = null;
        state.sendOtpToPhoneNumberSuccess = action.payload.message
      })
      // --- REJECTED ---
      .addCase(sendOtpToPhoneNumber.rejected, (state, action) => {
        state.isLoadingSendOtpToPhoneNumber = false;
        state.errorWhenSendOtpToPhoneNumber = action.payload.message
        state.sendOtpToPhoneNumberSuccess = false
      })
      // verify otp for phone number :
      // --- PENDING ---
      .addCase(verifyOtpForPhoneNumber.pending, (state) => {
        state.isLoadingVerifyOtpForPhoneNumber = true;
        state.errorWhenVerifyOtpForPhoneNumber = null;
        state.verifyOtpForPhoneNumberSuccess = null;
      })
      // --- FULFILLED ---
      .addCase(verifyOtpForPhoneNumber.fulfilled, (state, action) => {
        state.isLoadingVerifyOtpForPhoneNumber = false;
        state.errorWhenVerifyOtpForPhoneNumber = null;
        state.verifyOtpForPhoneNumberSuccess = action.payload.message
        state.isVerifyPhoneNumber = true;
        state.phone_number = action.payload.phone_number
      })
      // --- REJECTED ---
      .addCase(verifyOtpForPhoneNumber.rejected, (state, action) => {
        state.isLoadingVerifyOtpForPhoneNumber = false;
        state.errorWhenVerifyOtpForPhoneNumber = action.payload.message
        state.verifyOtpForPhoneNumberSuccess = false
      });

  },
});

export const { resetUserInformationSlice } = userInformationSlice.actions

export default userInformationSlice.reducer;