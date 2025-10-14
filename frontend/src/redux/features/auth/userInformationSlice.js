import axiosInstance from "@/api/axiosInstance";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const initialState = {
  // phone number 
  isVerifyPhoneNumber: true,

  // identity card : 
  isVerifyNationalId: true,

  // driver license : 
  isVerifyDriverLicenseOfRenterUploadSuccess: false,
  driverLicenseNumber: '',
  driverLicenseName: '',
  driverLicenseDob: '',
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
  verifyUpdatedEmailError: ''

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
  async ({ image_1, image_2 }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("image_1", image_1);
      formData.append("image_2", image_2);

      const response = await axiosInstance.post(
        "/api/renter/info/check-2-face-match",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
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
      });
  }


});

export const { resetUserInformationSlice } = userInformationSlice.actions

export default userInformationSlice.reducer;
