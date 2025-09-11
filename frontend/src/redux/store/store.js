import { configureStore } from "@reduxjs/toolkit";
import UserReducer from '../features/auth/authSlice.js'

export const store = configureStore({
  reducer: {
    userStore: UserReducer
  },
});
