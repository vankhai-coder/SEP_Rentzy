import axiosInstance from "@/api/axiosInstance";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const initialState = {
  // phone number 
  isVerifyPhoneNumber: true,

  // identity card : 
  isVerifyNationalId: true,

  // driver license : 
  isVerifyDriverLicense: false,
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

const userInformationSlice = createSlice({
  name: "userInformation",
  initialState,
  reducers: {

  },
  extraReducers: (builder) => {
    builder
      // verify driver license : 
      // Pending
      .addCase(verifyDriverLicense.pending, (state) => {
        state.driverLicenseLoading = true;
        state.driverLicenseError = '';
        state.isVerifyDriverLicense = false;
        state.driverLicenseNumber = '';
        state.driverLicenseName = '';
        state.driverLicenseDob = '';
      })

      // Fulfilled
      .addCase(verifyDriverLicense.fulfilled, (state, action) => {
        state.driverLicenseLoading = false;
        state.driverLicenseError = '';
        state.isVerifyDriverLicense = true;
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
        state.isVerifyDriverLicense = false;
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
      })
  }


});



export default userInformationSlice.reducer;
