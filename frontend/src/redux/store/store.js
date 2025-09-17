import { configureStore } from "@reduxjs/toolkit";
import UserReducer from "../features/auth/authSlice.js";
import vehicleReducer from "../features/renter/vehicles/vehicleSlice.js";
import brandReducer from "../features/renter/brand/brandSlice";
export const store = configureStore({
  reducer: {
    userStore: UserReducer,
    vehicleStore: vehicleReducer,
    brandStore: brandReducer,
  },
});
