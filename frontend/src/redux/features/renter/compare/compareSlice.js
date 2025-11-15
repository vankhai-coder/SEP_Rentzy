import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Async thunk: Thêm xe vào danh sách so sánh (local action, không API)
export const addToCompare = createAsyncThunk(
  "compare/addToCompare",
  (vehicleData, { getState, rejectWithValue }) => {
    const state = getState();
    const { compareList } = state.compareStore;
    const { id, type } = vehicleData; // id = vehicle_id, type = "car" hoặc "motorbike"

    if (compareList.length >= 4) {
      return rejectWithValue("Chỉ được so sánh tối đa 4 xe!");
    }
    if (compareList.includes(id)) {
      return rejectWithValue("Xe này đã được thêm vào so sánh!");
    }

    return { id, type }; // Trả về để reducer thêm vào list
  }
);

// Async thunk: Xóa xe khỏi danh sách so sánh
export const removeFromCompare = createAsyncThunk(
  "compare/removeFromCompare",
  (id, { getState }) => {
    const state = getState();
    const { compareList } = state.compareStore;
    return { id, newList: compareList.filter((item) => item.id !== id) };
  }
);

// Async thunk: Gọi API so sánh xe (khi >=2 xe)
export const compareVehicles = createAsyncThunk(
  "compare/compareVehicles",
  async (_, { getState, rejectWithValue }) => {
    const state = getState();
    const { compareList } = state.compareStore;
    if (compareList.length < 2) {
      return rejectWithValue("Cần ít nhất 2 xe để so sánh!");
    }

    // Lấy type từ xe đầu tiên (giả sử tất cả cùng type, từ filter page)
    const type = compareList[0].type;
    const vehicle_ids = compareList.map((item) => item.id);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/renter/vehicles/compare`,
        { vehicle_ids, type }
      );
      return response.data; // { success, vehicles, comparison, type, count }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi so sánh xe!"
      );
    }
  }
);

// Clear toàn bộ list
export const clearCompareList = createAsyncThunk(
  "compare/clearCompareList",
  () => ({})
);

const compareSlice = createSlice({
  name: "compare",
  initialState: {
    compareList: [], // [{id: 1, type: "car"}, ...]
    comparisonData: null, // Kết quả API
    loading: false,
    error: null,
  },
  reducers: {
    // Có thể thêm reducer sync nếu cần
  },
  extraReducers: (builder) => {
    builder
      // Add to compare
      .addCase(addToCompare.fulfilled, (state, action) => {
        state.compareList.push(action.payload);
        state.error = null;
      })
      .addCase(addToCompare.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Remove from compare
      .addCase(removeFromCompare.fulfilled, (state, action) => {
        state.compareList = action.payload.newList;
        state.error = null;
      })
      // Compare vehicles
      .addCase(compareVehicles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(compareVehicles.fulfilled, (state, action) => {
        state.loading = false;
        state.comparisonData = action.payload;
      })
      .addCase(compareVehicles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Clear list
      .addCase(clearCompareList.fulfilled, (state) => {
        state.compareList = [];
        state.comparisonData = null;
        state.error = null;
      });
  },
});

export default compareSlice.reducer;
