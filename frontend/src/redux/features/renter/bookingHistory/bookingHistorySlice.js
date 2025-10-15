// src/redux/features/bookingHistory/bookingHistorySlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Async thunk để fetch tất cả statuses
export const fetchBookingStatuses = createAsyncThunk(
  "bookingHistory/fetchBookingStatuses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/renter/booking-history/statuses`,
        {
          method: "GET",
          credentials: "include", // Gửi cookie JWT
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch statuses");
      }
      const data = await response.json();
      return data.data; // Trả về array statuses
    } catch (error) {
      return rejectWithValue(error.message || "Error fetching statuses");
    }
  }
);

// Async thunk để fetch bookings (với optional status filter)
export const fetchBookings = createAsyncThunk(
  "bookingHistory/fetchBookings",
  async (status = "all", { rejectWithValue }) => {
    try {
      let url = `${import.meta.env.VITE_API_URL}/api/renter/booking-history`;
      if (status !== "all") {
        url += `?status=${status}`;
      }
      const response = await fetch(url, {
        method: "GET",
        credentials: "include", // Gửi cookie JWT
      });
      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }
      const data = await response.json();
      return data.data; // Trả về array bookings
    } catch (error) {
      return rejectWithValue(error.message || "Error fetching bookings");
    }
  }
);

const bookingHistorySlice = createSlice({
  name: "bookingHistory",
  initialState: {
    statuses: [],
    bookings: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Statuses
      .addCase(fetchBookingStatuses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookingStatuses.fulfilled, (state, action) => {
        state.loading = false;
        state.statuses = ["all", ...action.payload]; // Thêm 'all' đầu
      })
      .addCase(fetchBookingStatuses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Bookings
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload;
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = bookingHistorySlice.actions;
export default bookingHistorySlice.reducer;
