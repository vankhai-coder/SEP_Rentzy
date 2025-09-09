import { configureStore } from "@reduxjs/toolkit";
import UserReducer from '../features/UserSlice'

export const store = configureStore({
  reducer: {
    userStore: UserReducer
  },
});
