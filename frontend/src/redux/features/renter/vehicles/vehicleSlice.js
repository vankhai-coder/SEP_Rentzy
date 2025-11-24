import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
// THAY ĐỔI: fetchVehicles - Nhận {type, page, limit=12}, gọi API với query params
// Giữ nguyên: Error handling
export const fetchVehicles = createAsyncThunk(
  "vehicles/fetchVehicles",
  async ({ type, page = 1, limit = 4 }, { rejectWithValue }) => {
    // **THAY ĐỔI: default limit=12**
    try {
      const query = new URLSearchParams({ type, page, limit }).toString(); // Build query string
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/renter/vehicles?${query}`,
        { withCredentials: true }
      );
      // Trả về full response.data.data (bao gồm vehicles + pagination)
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error fetching vehicles"
      );
    }
  }
);
// GIỮ NGUYÊN 100%: fetchVehicleById
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
// ĐỔI: searchVehicles - Return full response.data (bao gồm data, pagination, filterOptions)
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
      // ĐỔI: Return full response.data (không chỉ .data)
      return response.data;
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
    // ĐỔI: State cho kết quả tìm kiếm full (bao gồm data, pagination, filterOptions)
    searchResults: null, // Object full { data: vehicles, pagination, filterOptions }
    searchLoading: false,
    searchError: null,
    // GIỮ NGUYÊN: State cho pagination (bỏ infinite scroll state)
    totalCount: 0,
    currentPage: 1,
    totalPages: 0, // **GIỮ NGUYÊN: Lấy từ BE**
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // GIỮ NGUYÊN: fetchVehicles.pending
      .addCase(fetchVehicles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // GIỮ NGUYÊN: fetchVehicles.fulfilled - Luôn REPLACE vehicles (không merge), set pagination
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.loading = false;
        const { vehicles, pagination } = action.payload; // Destructure từ response mới
        state.vehicles = vehicles; // **GIỮ NGUYÊN: Luôn replace (không merge nữa)**
        state.totalCount = pagination.total; // Set total từ BE
        state.currentPage = pagination.page; // Update current page
        state.totalPages = pagination.totalPages; // **GIỮ NGUYÊN: Set totalPages từ BE**
      })
      // GIỮ NGUYÊN: fetchVehicles.rejected
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // GIỮ NGUYÊN 100%: Các case cho fetchVehicleById
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
      // ĐỔI: searchVehicles - Set full searchResults
      .addCase(searchVehicles.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchVehicles.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload; // Full { success, data, pagination, filterOptions }
      })
      .addCase(searchVehicles.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload;
      });
  },
});
export default vehicleSlice.reducer;
