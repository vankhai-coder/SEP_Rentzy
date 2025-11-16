// src/redux/features/renter/recommendation/recommendationSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
// Async thunk: Fetch recommendations (luôn fetch, BE handle guest/fallback)
export const fetchRecommendations = createAsyncThunk(
  "recommendation/fetchRecommendations",
  async (limit = 8, { rejectWithValue }) => {
    // Mặc định 8
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL
        }/api/renter/recommendations?limit=${limit}`,
        { withCredentials: true } // Gửi cookie JWT nếu có
      );
      return response.data.data; // Array xe từ BE
    } catch (error) {
      console.error("Redux error fetchRecommendations:", error);
      return rejectWithValue(
        error.response?.data?.message || "Lỗi tải gợi ý xe"
      );
    }
  }
);
const recommendationSlice = createSlice({
  name: "recommendation",
  initialState: {
    recommendations: [], // Array xe
    loading: false,
    error: null,
  },
  reducers: {
    // Optional: Clear recommendations (e.g., logout)
    clearRecommendations: (state) => {
      state.recommendations = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecommendations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.loading = false;
        state.recommendations = action.payload; // Set data
      })
      .addCase(fetchRecommendations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.recommendations = []; // Fallback empty
      });
  },
});
// Export actions & reducer
export const { clearRecommendations } = recommendationSlice.actions;
export default recommendationSlice.reducer;
