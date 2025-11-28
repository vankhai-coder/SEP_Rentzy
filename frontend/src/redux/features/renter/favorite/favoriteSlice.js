// src/redux/features/renter/favorite/favoriteSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../../../config/axiosInstance";

// Fetch danh sách yêu thích theo trang
export const fetchFavorites = createAsyncThunk(
  "favorite/fetchFavorites",
  async (page = 1, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/api/renter/favorites?page=${page}`
      );
      return response.data; // { success: true, data: [...], pagination: { ... } }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể tải danh sách yêu thích"
      );
    }
  }
);

// Thêm vào yêu thích
// src/redux/features/renter/favorite/favoriteSlice.js

// Thêm vào yêu thích – sửa lại chỗ này
export const addFavorite = createAsyncThunk(
  "favorite/addFavorite",
  async (vehicleOrId, { rejectWithValue, getState }) => {
    try {
      const vehicle_id =
        typeof vehicleOrId === "object" && vehicleOrId !== null
          ? vehicleOrId.vehicle_id
          : vehicleOrId;

      if (!vehicle_id || isNaN(vehicle_id)) {
        throw new Error("vehicle_id không hợp lệ");
      }

      await axiosInstance.post("/api/renter/favorites", { vehicle_id });

      // Reload trang hiện tại
      const state = getState();
      const currentPage = state.favoriteStore.pagination.currentPage || 1;
      const response = await axiosInstance.get(
        `/api/renter/favorites?page=${currentPage}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Thêm yêu thích thất bại"
      );
    }
  }
);

// Xóa khỏi yêu thích
export const removeFavorite = createAsyncThunk(
  "favorite/removeFavorite",
  async (vehicle_id, { rejectWithValue, getState }) => {
    try {
      await axiosInstance.delete(`/api/renter/favorites/${vehicle_id}`);

      // Sau khi xóa, reload lại trang hiện tại
      const state = getState();
      const currentPage = state.favoriteStore.pagination.currentPage || 1;
      const response = await axiosInstance.get(
        `/api/renter/favorites?page=${currentPage}`
      );

      // Nếu trang hiện tại trống → về trang trước (nếu có)
      if (response.data.data.length === 0 && currentPage > 1) {
        const prevResponse = await axiosInstance.get(
          `/api/renter/favorites?page=${currentPage - 1}`
        );
        return prevResponse.data;
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Xóa yêu thích thất bại"
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
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Favorites
      .addCase(fetchFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.loading = false;
        state.favorites = action.payload.data;
        state.pagination = {
          currentPage: action.payload.pagination.currentPage,
          totalPages: action.payload.pagination.totalPages,
          totalItems: action.payload.pagination.totalItems,
        };
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add Favorite
      .addCase(addFavorite.pending, (state) => {
        state.loading = true;
      })
      .addCase(addFavorite.fulfilled, (state, action) => {
        state.loading = false;
        state.favorites = action.payload.data;
        state.pagination = {
          currentPage: action.payload.pagination.currentPage,
          totalPages: action.payload.pagination.totalPages,
          totalItems: action.payload.pagination.totalItems,
        };
      })
      .addCase(addFavorite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Remove Favorite
      .addCase(removeFavorite.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeFavorite.fulfilled, (state, action) => {
        state.loading = false;
        state.favorites = action.payload.data;
        state.pagination = {
          currentPage: action.payload.pagination.currentPage,
          totalPages: action.payload.pagination.totalPages,
          totalItems: action.payload.pagination.totalItems,
        };
      })
      .addCase(removeFavorite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default favoriteSlice.reducer;
