import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Fetch brands theo category (car / motorbike / both)
export const fetchBrands = createAsyncThunk(
  "brands/fetchBrands",
  async (category, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        `${
          import.meta.env.VITE_API_URL
        }/api/renter/brands/category/${category}`,
        { withCredentials: true }
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Error fetching brands"
      );
    }
  }
);

// SỬA MỚI: Hỗ trợ truyền thêm vehicle_type từ query
export const fetchVehiclesByBrand = createAsyncThunk(
  "brands/fetchVehiclesByBrand",
  async (
    { brandId, page = 1, limit = 8, vehicle_type },
    { rejectWithValue }
  ) => {
    try {
      // Tạo query params
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", limit);
      if (vehicle_type && ["car", "motorbike"].includes(vehicle_type)) {
        params.append("vehicle_type", vehicle_type);
      }

      const res = await axios.get(
        `${
          import.meta.env.VITE_API_URL
        }/api/renter/brands/${brandId}/vehicles?${params.toString()}`,
        { withCredentials: true }
      );

      return res.data; // { brand, vehicles, count, totalCount }
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Không thể tải danh sách xe"
      );
    }
  }
);

const brandSlice = createSlice({
  name: "brandStore",
  initialState: {
    brands: [],
    vehiclesByBrand: [],
    brandInfo: null,
    vehiclesCount: 0,
    totalCount: 0,
    loading: false,
    vehiclesLoading: false,
    error: null,
  },
  reducers: {
    clearVehiclesByBrand: (state) => {
      state.vehiclesByBrand = [];
      state.brandInfo = null;
      state.vehiclesCount = 0;
      state.totalCount = 0;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // === Fetch Brands ===
      .addCase(fetchBrands.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.loading = false;
        state.brands = action.payload;
      })
      .addCase(fetchBrands.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // === Fetch Vehicles By Brand ===
      .addCase(fetchVehiclesByBrand.pending, (state) => {
        state.vehiclesLoading = true;
        state.error = null;
      })
      .addCase(fetchVehiclesByBrand.fulfilled, (state, action) => {
        state.vehiclesLoading = false;
        state.vehiclesByBrand = action.payload.vehicles || [];
        state.brandInfo = action.payload.brand;
        state.vehiclesCount = action.payload.count || 0;
        state.totalCount = action.payload.totalCount || 0;
      })
      .addCase(fetchVehiclesByBrand.rejected, (state, action) => {
        state.vehiclesLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearVehiclesByBrand } = brandSlice.actions;
export default brandSlice.reducer;
