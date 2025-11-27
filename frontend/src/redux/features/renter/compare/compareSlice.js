// src/redux/features/renter/compare/compareSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// ==================== HELPER: DELAY FUNCTION ====================
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ==================== 1. THÊM XE VÀO SO SÁNH ====================
export const addToCompare = createAsyncThunk(
  "compare/addToCompare",
  (vehicleData, { getState, rejectWithValue }) => {
    const state = getState();
    const { compareList } = state.compareStore;
    const { id, type, model } = vehicleData;

    if (compareList.length >= 4) {
      return rejectWithValue("Chỉ được so sánh tối đa 4 xe!");
    }
    if (compareList.some((item) => item.id === id)) {
      return rejectWithValue("Xe này đã được thêm vào so sánh!");
    }

    return { id, type, model };
  }
);

// ==================== 2. XÓA XE KHỎI SO SÁNH ====================
export const removeFromCompare = createAsyncThunk(
  "compare/removeFromCompare",
  (id, { getState }) => {
    const state = getState();
    const { compareList } = state.compareStore;
    const newList = compareList.filter((item) => item.id !== id);
    return { id, newList };
  }
);

// ==================== 3. GỌI API SO SÁNH XE ====================
export const compareVehicles = createAsyncThunk(
  "compare/compareVehicles",
  async (_, { getState, rejectWithValue }) => {
    const state = getState();
    const { compareList } = state.compareStore;

    if (compareList.length < 2) {
      return rejectWithValue("Cần ít nhất 2 xe để so sánh!");
    }

    const type = compareList[0].type;
    const vehicle_ids = compareList.map((item) => item.id);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/renter/vehicles/compare`,
        { vehicle_ids, type }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi so sánh xe!"
      );
    }
  }
);

// ==================== 4. XÓA TOÀN BỘ DANH SÁCH ====================
export const clearCompareList = createAsyncThunk(
  "compare/clearCompareList",
  () => ({})
);

// ==================== 5. GỌI GEMINI AI GỢI Ý XE TỐT NHẤT (VỚI RETRY) ====================
export const getAIRecommendation = createAsyncThunk(
  "compare/getAIRecommendation",
  async (surveyAnswers, { getState, rejectWithValue }) => {
    const { comparisonData } = getState().compareStore;

    if (!comparisonData?.vehicles || comparisonData.vehicles.length < 2) {
      return rejectWithValue("Cần ít nhất 2 xe để AI gợi ý");
    }

    const MAX_RETRIES = 2;
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`🔄 Thử gọi AI lần ${attempt}/${MAX_RETRIES}...`);

        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/renter/vehicles/ai-recommend`,
          {
            vehicles: comparisonData.vehicles,
            survey: surveyAnswers,
          },
          {
            timeout: 15000, // 15s
          }
        );

        console.log("✅ AI phản hồi thành công!");
        return response.data.recommendation;
      } catch (error) {
        lastError = error;
        console.error(`❌ Lần thử ${attempt} thất bại:`, error.message);

        // Nếu là lỗi 429 (rate limit), đợi lâu hơn
        if (error.response?.status === 429 && attempt < MAX_RETRIES) {
          console.log("⏳ Đợi 3 giây trước khi thử lại...");
          await delay(3000);
          continue;
        }

        // Nếu là lỗi khác hoặc hết retry, throw luôn
        if (attempt === MAX_RETRIES) {
          break;
        }

        // Đợi 1s trước khi retry
        await delay(1000);
      }
    }

    // Nếu tất cả retry đều fail
    const errorMsg =
      lastError?.response?.data?.message ||
      lastError?.message ||
      "Không thể kết nối với AI";

    return rejectWithValue(errorMsg);
  }
);

// ==================== SLICE CHÍNH ====================
const compareSlice = createSlice({
  name: "compare",
  initialState: {
    compareList: [],
    comparisonData: null,
    loading: false,
    error: null,

    // Trạng thái AI
    aiRecommendation: null,
    aiLoading: false,
    aiError: null,
  },
  reducers: {
    resetAI: (state) => {
      state.aiRecommendation = null;
      state.aiError = null;
      state.aiLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // ==================== ADD TO COMPARE ====================
      .addCase(addToCompare.fulfilled, (state, action) => {
        state.compareList.push(action.payload);
        state.error = null;
      })
      .addCase(addToCompare.rejected, (state, action) => {
        state.error = action.payload;
      })

      // ==================== REMOVE FROM COMPARE ====================
      .addCase(removeFromCompare.fulfilled, (state, action) => {
        state.compareList = action.payload.newList;
        state.error = null;
      })

      // ==================== COMPARE VEHICLES ====================
      .addCase(compareVehicles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(compareVehicles.fulfilled, (state, action) => {
        state.loading = false;
        state.comparisonData = action.payload;
        state.error = null;
      })
      .addCase(compareVehicles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ==================== AI RECOMMENDATION ====================
      .addCase(getAIRecommendation.pending, (state) => {
        state.aiLoading = true;
        state.aiError = null;
      })
      .addCase(getAIRecommendation.fulfilled, (state, action) => {
        state.aiLoading = false;
        state.aiRecommendation = action.payload;
      })
      .addCase(getAIRecommendation.rejected, (state, action) => {
        state.aiLoading = false;
        state.aiError = action.payload;
      })

      // ==================== CLEAR ALL ====================
      .addCase(clearCompareList.fulfilled, (state) => {
        state.compareList = [];
        state.comparisonData = null;
        state.loading = false;
        state.error = null;
        state.aiRecommendation = null;
        state.aiLoading = false;
        state.aiError = null;
      });
  },
});

export const { resetAI } = compareSlice.actions;
export default compareSlice.reducer;
