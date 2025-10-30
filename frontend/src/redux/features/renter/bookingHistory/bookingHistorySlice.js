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

// Async thunk để fetch bookings với filters
export const fetchBookings = createAsyncThunk(
  "bookingHistory/fetchBookings",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const {
        status = "all",
        sortBy = "created_at",
        sortOrder = "DESC",
        dateFilter = "all",
        page = 1,
        limit = 10
      } = filters;

      const params = new URLSearchParams();
      if (status !== "all") params.append("status", status);
      if (sortBy) params.append("sortBy", sortBy);
      if (sortOrder) params.append("sortOrder", sortOrder);
      if (dateFilter !== "all") params.append("dateFilter", dateFilter);
      if (page) params.append("page", page);
      if (limit) params.append("limit", limit);

      const url = `${import.meta.env.VITE_API_URL}/api/renter/booking-history?${params.toString()}`;
      
      const response = await fetch(url, {
        method: "GET",
        credentials: "include", // Gửi cookie JWT
      });
      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }
      const data = await response.json();
      return data; // Trả về toàn bộ response (data, pagination, filters)
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
    statistics: {
      total_bookings: 0,
      completed_bookings: 0,
      active_bookings: 0,
      cancelled_bookings: 0,
      pending_bookings: 0,
    },
    pagination: {
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
      itemsPerPage: 10,
      hasNextPage: false,
      hasPrevPage: false,
    },
    filters: {
      status: "all",
      sortBy: "created_at",
      sortOrder: "DESC",
      dateFilter: "all",
      limit: 10,
    },
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
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
        state.bookings = action.payload.data;
        state.statistics = action.payload.statistics || state.statistics;
        state.pagination = action.payload.pagination;
        state.filters = action.payload.filters;
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, updateFilters } = bookingHistorySlice.actions;
export default bookingHistorySlice.reducer;
