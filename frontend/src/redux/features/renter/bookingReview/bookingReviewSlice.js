// src/redux/features/renter/bookingReview/bookingReviewSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

// 1. FETCH BOOKING DETAIL
export const fetchBookingDetail = createAsyncThunk(
  "bookingReview/fetchBookingDetail",
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/renter/booking-history/${bookingId}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Không thể lấy thông tin booking");
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || "Lỗi khi lấy thông tin booking");
    }
  }
);

// 2. CREATE REVIEW (CÓ AI MODERATION)
export const createReview = createAsyncThunk(
  "bookingReview/createReview",
  async ({ bookingId, rating, reviewContent }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/renter/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            booking_id: Number(bookingId),
            rating: Number(rating),
            review_content: (reviewContent || "").trim(),
          }),
        }
      );

      let data;
      try {
        data = await response.json();
      } catch {
        return rejectWithValue({
          isModerationError: false,
          message: "Lỗi xử lý phản hồi từ server",
        });
      }

      if (!response.ok) {
        if (data.isModerationError) {
          return rejectWithValue({
            isModerationError: true,
            reason:
              data.reason || "Nội dung không phù hợp với chính sách cộng đồng.",
            message: data.message,
          });
        }
        return rejectWithValue({
          isModerationError: false,
          message: data.message || "Không thể gửi đánh giá",
        });
      }

      return data;
    } catch {
      return rejectWithValue({
        isModerationError: false,
        message: "Lỗi kết nối mạng",
      });
    }
  }
);

// ✅ 3. FETCH MY REVIEWS với phân trang
export const fetchMyReviews = createAsyncThunk(
  "bookingReview/fetchMyReviews",
  async (
    { page = 1, limit = 3, sortBy = "created_at" } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/renter/reviews/my-reviews?page=${page}&limit=${limit}&sortBy=${sortBy}`,
        { method: "GET", credentials: "include" }
      );
      if (!response.ok) throw new Error("Không thể lấy danh sách đánh giá");
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Lỗi khi lấy đánh giá của bạn");
    }
  }
);

// 4. DELETE REVIEW
export const deleteReview = createAsyncThunk(
  "bookingReview/deleteReview",
  async (reviewId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/renter/reviews/${reviewId}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!response.ok) throw new Error("Không thể xóa đánh giá");
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Lỗi khi xóa đánh giá");
    }
  }
);

// ✅ SLICE với phân trang
const bookingReviewSlice = createSlice({
  name: "bookingReview",
  initialState: {
    bookingDetail: null,
    myReviews: [],
    totalReviews: 0,
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 3,
    loading: false,
    error: null,
    moderationError: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.moderationError = null;
    },
    clearModerationError: (state) => {
      state.moderationError = null;
    },
    clearBookingDetail: (state) => {
      state.bookingDetail = null;
    },
    clearMyReviews: (state) => {
      state.myReviews = [];
      state.totalReviews = 0;
      state.currentPage = 1;
      state.totalPages = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchBookingDetail
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
        toast.error(`Lỗi: ${action.payload}`);
      })

      // createReview
      .addCase(createReview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.moderationError = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.loading = false;
        toast.success(
          action.payload.message ||
            "Đánh giá thành công! Bạn được thưởng 5,000 điểm."
        );
      })
      .addCase(createReview.rejected, (state, action) => {
        state.loading = false;

        // LOG ĐỂ BẠN THẤY RÕ (mở F12)
        console.log("createReview.rejected → payload:", action.payload);

        if (action.payload?.isModerationError) {
          state.moderationError = action.payload.reason;
          console.log("THÔNG BÁO ĐỎ ĐÃ HIỆN:", state.moderationError);
        } else {
          state.error = action.payload?.message || "Lỗi không xác định";
          toast.error(`Lỗi: ${state.error}`);
        }
      })

      // ✅ fetchMyReviews với phân trang
      .addCase(fetchMyReviews.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.myReviews = action.payload.reviews || [];
        state.totalReviews = action.payload.totalReviews || 0;
        state.currentPage = action.payload.currentPage || 1;
        state.totalPages = action.payload.totalPages || 1;
        state.itemsPerPage = action.payload.itemsPerPage || 3;
      })
      .addCase(fetchMyReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Lỗi: ${action.payload}`);
      })

      // deleteReview
      .addCase(deleteReview.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.loading = false;
        toast.success(action.payload.message || "Xóa đánh giá thành công!");
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Lỗi: ${action.payload}`);
      });
  },
});

export const {
  clearError,
  clearModerationError,
  clearBookingDetail,
  clearMyReviews,
} = bookingReviewSlice.actions;

export default bookingReviewSlice.reducer;
