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

// THÊM MỚI: searchVehicles với error handling
export const searchVehicles = createAsyncThunk(
  "vehicles/searchVehicles",
  async ({ type, params }, { rejectWithValue }) => {
    try {
      const queryString = new URLSearchParams({
        type,
        ...params,
        page: 1,
        limit: 12,
      }).toString();
      console.log(
        "Debug: API URL:",
        `/api/renter/vehicles/search?${queryString}`
      ); // THÊM MỚI: Log URL
      const response = await axios.get(
        `/api/renter/vehicles/search?${queryString}`
      );
      if (!response.data.success) {
        throw new Error(response.data.message || "Search failed");
      }
      return response.data;
    } catch (error) {
      console.error("Debug: API Error:", error.response?.data || error.message); // THÊM MỚI
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
    loading: false,
    detailLoading: false,
    searchLoading: false,
    error: null,
    detailError: null,
  },
  reducers: {},
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
      })
      // THÊM MỚI: For searchVehicles với rejectWithValue
      .addCase(searchVehicles.pending, (state) => {
        state.searchLoading = true;
        state.error = null; // Clear error khi start
      })
      .addCase(searchVehicles.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchVehicles = action.payload.data;
        state.error = null;
      })
      .addCase(searchVehicles.rejected, (state, action) => {
        state.searchLoading = false;
        state.error = action.payload || action.error.message; // Từ rejectWithValue
      });
  },
});

export default vehicleSlice.reducer;
