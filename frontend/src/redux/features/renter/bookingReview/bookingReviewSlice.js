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

// ✅ THÊM MỚI: Async thunk fetch my reviews (danh sách đánh giá của user)
export const fetchMyReviews = createAsyncThunk(
  "bookingReview/fetchMyReviews",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/renter/reviews/my-reviews`,
        {
          method: "GET",
          credentials: "include", // Gửi JWT cookie
        }
      );
      if (!response.ok) {
        throw new Error("Không thể lấy danh sách đánh giá");
      }
      const data = await response.json();
      return data; // Trả về { success: true, reviews: [...], totalReviews: n }
    } catch (error) {
      return rejectWithValue(error.message || "Lỗi khi lấy đánh giá của bạn");
    }
  }
);

const bookingReviewSlice = createSlice({
  name: "bookingReview",
  initialState: {
    bookingDetail: null,
    // ✅ THÊM MỚI: State cho my reviews
    myReviews: [],
    totalReviews: 0,
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
    // ✅ THÊM MỚI: Reducer clear my reviews (optional, dùng khi leave page)
    clearMyReviews: (state) => {
      state.myReviews = [];
      state.totalReviews = 0;
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
      })
      // ✅ THÊM MỚI: Cases cho fetchMyReviews
      .addCase(fetchMyReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.myReviews = action.payload.reviews || []; // Lưu array reviews
        state.totalReviews = action.payload.totalReviews || 0;
        if (action.payload.success === false) {
          state.error = action.payload.message || "Không có dữ liệu";
        }
      })
      .addCase(fetchMyReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Lỗi: ${action.payload}`);
      });
  },
});

// ✅ SỬA: Export thêm action clearMyReviews
export const { clearError, clearBookingDetail, clearMyReviews } =
  bookingReviewSlice.actions;
export default bookingReviewSlice.reducer;
