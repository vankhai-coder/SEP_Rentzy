import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Async thunk để fetch vehicles theo type (car hoặc motorbike)
export const fetchVehicles = createAsyncThunk(
  "vehicles/fetchVehicles",
  async (type, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/renter/vehicles?type=${type}`
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error fetching vehicles"
      );
    }
  }
);

// Async thunk để fetch vehicle detail theo ID
export const fetchVehicleById = createAsyncThunk(
  "vehicles/fetchVehicleById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/renter/vehicles/${id}`
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error fetching vehicle details"
      );
    }
  }
);

// FIX: Helper clean params trong thunk
const cleanParamsForQuery = (params) => {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );
};

// THÊM MỚI: searchVehicles với error handling
export const searchVehicles = createAsyncThunk(
  "vehicles/searchVehicles",
  async ({ type, params }, { rejectWithValue }) => {
    try {
      // FIX: Clean params trước khi build query (loại undefined/empty)
      const cleanParams = cleanParamsForQuery({
        ...params,
        page: 1,
        limit: 12,
      });
      const queryString = new URLSearchParams(cleanParams).toString();
      const apiUrl = `${
        import.meta.env.VITE_API_URL
      }/api/renter/vehicles/search?type=${type}&${queryString}`; // FIX: type riêng để tránh clean
      if (import.meta.env.MODE === "development") {
        console.log("Debug: API URL:", apiUrl); // THÊM MỚI: Log URL (dev only)
      }
      const response = await axios.get(apiUrl);
      if (!response.data.success) {
        throw new Error(response.data.message || "Search failed");
      }
      return response.data; // {data: vehicles, pagination: {...}}
    } catch (error) {
      if (import.meta.env.MODE === "development") {
        console.error(
          "Debug: API Error:",
          error.response?.data || error.message
        ); // THÊM MỚI (dev only)
      }
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const vehicleSlice = createSlice({
  name: "vehicles",
  initialState: {
    vehicles: [],
    currentVehicle: null,
    searchVehicles: [],
    searchPagination: null, // THÊM MỚI: Lưu pagination cho search
    loading: false,
    detailLoading: false,
    error: null,
    detailError: null,
    searchError: null, // THÊM MỚI: Error riêng cho search
  },
  reducers: {
    // Có thể thêm sau nếu cần: clearSearch: (state) => { state.searchVehicles = []; state.searchPagination = null; state.searchError = null; }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.loading = false;
        state.vehicles = action.payload;
      })
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
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
<<<<<<< HEAD
=======
      })
      // THÊM MỚI: For searchVehicles với rejectWithValue
      .addCase(searchVehicles.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null; // Clear search error khi start
      })
      .addCase(searchVehicles.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchVehicles = action.payload.data;
        state.searchPagination = action.payload.pagination; // THÊM MỚI: Lưu pagination
        state.searchError = null;
      })
      .addCase(searchVehicles.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload || action.error.message; // Từ rejectWithValue, dùng searchError riêng
>>>>>>> quangvinh
      });
  },
});

export default vehicleSlice.reducer;
