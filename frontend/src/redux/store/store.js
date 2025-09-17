import { configureStore } from "@reduxjs/toolkit";
import UserReducer from "../features/auth/authSlice.js";
import vehicleReducer from "../features/vehicles/vehicleSlice.js";
export const store = configureStore({
  reducer: {
    userStore: UserReducer,
    vehicleStore: vehicleReducer,
  },
});
