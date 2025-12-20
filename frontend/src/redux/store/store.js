import { configureStore } from "@reduxjs/toolkit";
import UserReducer from "../features/auth/authSlice.js";
import vehicleReducer from "../features/renter/vehicles/vehicleSlice.js";
import brandReducer from "../features/renter/brand/brandSlice";
import favoriteReducer from "../features/renter/favorite/favoriteSlice";
import chatReducer from "../features/chat/chatOpenAiSlice.js";
import userInformationReducer from "../features/auth/userInformationSlice.js";
import bookingHistoryReducer from "../features/renter/bookingHistory/bookingHistorySlice";
import bookingReviewReducer from "../features/renter/bookingReview/bookingReviewSlice.js";
import vehicleReportReducer from "../features/renter/vehicleReport/vehicleReportSlice.js";
import compareReducer from "../features/renter/compare/compareSlice";
import recommendationReducer from "../features/renter/recommendation/recommendationSlice";
import messageReducer from "../features/admin/messageSlice.js";
export const store = configureStore({
  reducer: {
    userStore: UserReducer,
    vehicleStore: vehicleReducer,
    brandStore: brandReducer,
    favoriteStore: favoriteReducer,
    chat: chatReducer,
    userInformationStore: userInformationReducer,
    bookingHistory: bookingHistoryReducer,
    bookingReview: bookingReviewReducer,
    vehicleReport: vehicleReportReducer,
    compareStore: compareReducer,
    recommendation: recommendationReducer,
    message: messageReducer,
  },
});
