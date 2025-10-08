import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../../../api/axiosInstance";

// Fetch favorites
export const fetchFavorites = createAsyncThunk(
  "favorite/fetchFavorites",
  async () => {
    const response = await axiosInstance.get("/api/renter/favorites");
    return response.data.data;
  }
);

// Add favorite
export const addFavorite = createAsyncThunk(
  "favorite/addFavorite",
  async (thunkArg, { rejectWithValue }) => {
    const { vehicle_id, vehicle } = thunkArg;
    try {
      const response = await axiosInstance.post("/api/renter/favorites", {
        vehicle_id,
      });
      return { ...response.data.data, Vehicle: vehicle };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi không xác định"
      );
    }
  }
);

// Remove favorite
export const removeFavorite = createAsyncThunk(
  "favorite/removeFavorite",
  async (vehicle_id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/api/renter/favorites/${vehicle_id}`);
      return vehicle_id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi không xác định"
      );
    }
  }
);

const favoriteSlice = createSlice({
  name: "favorite",
  initialState: {
    favorites: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.loading = false;
        state.favorites = action.payload;
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // Add
      .addCase(addFavorite.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addFavorite.fulfilled, (state, action) => {
        state.loading = false;
        state.favorites.push(action.payload);
      })
      .addCase(addFavorite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // Remove
      .addCase(removeFavorite.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFavorite.fulfilled, (state, action) => {
        state.loading = false;
        state.favorites = state.favorites.filter(
          (fav) => fav.vehicle_id !== action.payload
        );
      })
      .addCase(removeFavorite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export default favoriteSlice.reducer;
