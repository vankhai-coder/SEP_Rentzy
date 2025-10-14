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

// Async thunk để search vehicles theo nhiều tiêu chí (type + params từ URL)
export const searchVehicles = createAsyncThunk(
  "vehicles/searchVehicles",
  async ({ type, params }, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams({ ...(params || {}), type }).toString();
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/renter/vehicles?${query}`
      );
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
