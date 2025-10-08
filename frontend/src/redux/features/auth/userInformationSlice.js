import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isVerifyPhoneNumber: true,
  isVerifyNationalId: true,
  isVerifyDriverLicense: true,
};

const verificationSlice = createSlice({
  name: "verification",
  initialState,
  reducers: {
    setVerifyPhoneNumber: (state, action) => {
      state.isVerifyPhoneNumber = action.payload;
    },
    setVerifyNationalId: (state, action) => {
      state.isVerifyNationalId = action.payload;
    },
    setVerifyDriverLicense: (state, action) => {
      state.isVerifyDriverLicense = action.payload;
    },
    resetVerification: () => initialState,
  },
});

export const {
  setVerifyPhoneNumber,
  setVerifyNationalId,
  setVerifyDriverLicense,
  resetVerification,
} = verificationSlice.actions;

export default verificationSlice.reducer;
