// src/redux/features/renter/bookingReview/bookingReviewSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify"; // Import toast để dùng trong fulfilled

// Async thunk để fetch chi tiết một booking (cho trang review)
export const fetchBookingDetail = createAsyncThunk(
  "bookingReview/fetchBookingDetail",
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/renter/booking-history/${bookingId}`, // Giả sử endpoint này tồn tại
        {
          method: "GET",
          credentials: "include", // Gửi JWT cookie
        }
      );
      if (!response.ok) {
        throw new Error("Không thể lấy thông tin booking");
      }
      const data = await response.json();
      return data.data; // Trả về object { booking, vehicle, ... }
    } catch (error) {
      return rejectWithValue(error.message || "Lỗi khi lấy thông tin booking");
    }
  }
);

// Async thunk để tạo review
export const createReview = createAsyncThunk(
  "bookingReview/createReview",
  async ({ bookingId, rating, reviewContent }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/renter/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // Gửi JWT cookie
          body: JSON.stringify({
            booking_id: bookingId,
            rating,
            review_content: reviewContent,
          }),
        }
      );
      if (!response.ok) {
        throw new Error("Không thể tạo đánh giá");
      }
      const data = await response.json();
      // Sau success, dispatch refetch booking history để update hasReview (từ slice khác)
      // Giả sử import từ bookingHistorySlice
      // const { fetchBookings } = await import("../../bookingHistory/bookingHistorySlice");
      // dispatch(fetchBookings());
      return data; // Trả về { success: true, review, vehicle, points_rewarded, new_balance }
    } catch (error) {
      return rejectWithValue(error.message || "Lỗi khi tạo đánh giá");
    }
  }
);

const bookingReviewSlice = createSlice({
  name: "bookingReview",
  initialState: {
    bookingDetail: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearBookingDetail: (state) => {
      // Clear khi navigate away
      state.bookingDetail = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Booking Detail
      .addCase(fetchBookingDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookingDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.bookingDetail = action.payload;
      })
      .addCase(fetchBookingDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Lỗi: ${action.payload}`); // Toast error
      })
      // Create Review
      .addCase(createReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.loading = false;
        toast.success(
          action.payload.message ||
            "Đánh giá thành công! Bạn được thưởng 5,000 điểm."
        ); // Toast success từ backend message
        // Clear detail sau success
        state.bookingDetail = null;
      })
      .addCase(createReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Lỗi: ${action.payload}`);
      });
  },
});

export const { clearError, clearBookingDetail } = bookingReviewSlice.actions;
export default bookingReviewSlice.reducer;
