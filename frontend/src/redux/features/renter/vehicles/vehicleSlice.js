import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// **SỬA: fetchVehicles - Nhận {type, page, limit}, gọi API với query params**
// **Giữ nguyên**: Error handling**
export const fetchVehicles = createAsyncThunk(
  "vehicles/fetchVehicles",
  async ({ type, page = 1, limit = 12 }, { rejectWithValue }) => {
    // **SỬA: Nhận object params, default page/limit**
    try {
      const query = new URLSearchParams({ type, page, limit }).toString(); // **SỬA: Build query string**
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/renter/vehicles?${query}`, // **SỬA: Thêm ?${query}**
        { withCredentials: true }
      );
      // **SỬA: Trả về full response.data.data (bao gồm vehicles + pagination)**
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error fetching vehicles"
      );
    }
  }
);

// **Giữ nguyên 100%**: fetchVehicleById
export const fetchVehicleById = createAsyncThunk(
  "vehicles/fetchVehicleById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/renter/vehicles/${id}`,
        { withCredentials: true }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error fetching vehicle details"
      );
    }
  }
);

// **Giữ nguyên 100%**: searchVehicles (không liên quan đến infinite scroll ở home)
export const searchVehicles = createAsyncThunk(
  "vehicles/searchVehicles",
  async ({ type, params }, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams({ ...(params || {}), type }).toString();
      // SỬA: Thêm /search vào URL để gọi đúng route backend
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/renter/vehicles/search?${query}`,
        { withCredentials: true }
      );
      // FIX: Trả về response.data.data (như fetchVehicles) để match reducer
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error searching vehicles"
      );
    }
  }
);

const vehicleSlice = createSlice({
  name: "vehicles",
  initialState: {
    vehicles: [],
    currentVehicle: null,
    loading: false,
    detailLoading: false,
    error: null,
    detailError: null,
    // thêm state cho kết quả tìm kiếm
    searchVehicles: [],
    searchLoading: false,
    searchError: null,
    // **SỬA: Thêm state cho pagination/infinite scroll**
    totalCount: 0,
    currentPage: 1,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // **SỬA: fetchVehicles.pending - Giữ nguyên**
      .addCase(fetchVehicles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // **SỬA: fetchVehicles.fulfilled - Merge vehicles (nếu page >1), set totalCount và currentPage**
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.loading = false;
        const { vehicles, pagination } = action.payload; // **SỬA: Destructure từ response mới**
        if (pagination.page > 1) {
          state.vehicles = [...state.vehicles, ...vehicles]; // **SỬA: Merge cho load more**
        } else {
          state.vehicles = vehicles; // **SỬA: Replace nếu page=1 (initial load)**
        }
        state.totalCount = pagination.total; // **SỬA: Set total từ BE**
        state.currentPage = pagination.page; // **SỬA: Update current page**
      })
      // **Giữ nguyên**: fetchVehicles.rejected
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // **Giữ nguyên 100%**: Các case cho fetchVehicleById và searchVehicles
      .addCase(fetchVehicleById.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchVehicleById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.currentVehicle = action.payload;
      })
      .addCase(fetchVehicleById.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload;
      })
      .addCase(searchVehicles.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchVehicles.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchVehicles = action.payload;
      })
      .addCase(searchVehicles.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload;
      });
  },
});

export default vehicleSlice.reducer;
