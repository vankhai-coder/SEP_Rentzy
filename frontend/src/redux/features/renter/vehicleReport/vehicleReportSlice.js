import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

/* ============================================================
   📤 TẠO BÁO CÁO MỚI (POST)
   ============================================================ */
export const createReport = createAsyncThunk(
  "vehicleReport/createReport",
  async ({ vehicleId, reason, message }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return rejectWithValue("Bạn cần đăng nhập trước khi báo cáo xe");
      }

      const response = await axios.post(
        `${
          import.meta.env.VITE_API_URL
        }/api/renter/reports/vehicles/${vehicleId}`,
        { reason, message },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true, // ✅ thêm nếu BE xác thực cookie
        }
      );

      return response.data; // { success: true, data: {...} }
    } catch (error) {
      console.error(
        "❌ Lỗi khi tạo báo cáo:",
        error.response?.data || error.message
      );

      if (error.response?.status === 401) {
        return rejectWithValue(
          "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại"
        );
      }

      return rejectWithValue(
        error.response?.data?.message || "Lỗi khi tạo báo cáo"
      );
    }
  }
);

/* ============================================================
   🔍 KIỂM TRA XE ĐÃ ĐƯỢC BÁO CÁO HAY CHƯA (GET)
   ============================================================ */
export const checkIfReported = createAsyncThunk(
  "vehicleReport/checkIfReported",
  async (vehicleId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        // nếu chưa đăng nhập thì mặc định là chưa báo cáo
        return { isReported: false };
      }

      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL
        }/api/renter/reports/vehicles/${vehicleId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      const currentUserId = localStorage.getItem("user_id");
      const userReports = response.data.data?.filter(
        (r) => r.user_id === currentUserId
      );

      return { isReported: userReports?.length > 0 };
    } catch (error) {
      if (error.response?.status === 401) {
        // Unauthorized -> chưa đăng nhập hoặc token sai
        return { isReported: false };
      }
      if (error.response?.status === 403) {
        return { isReported: false };
      }
      console.error(
        "⚠️ Lỗi khi check báo cáo:",
        error.response?.data || error.message
      );
      return rejectWithValue("Không thể kiểm tra báo cáo");
    }
  }
);

/* ============================================================
   🧩 SLICE
   ============================================================ */
const vehicleReportSlice = createSlice({
  name: "vehicleReport",
  initialState: {
    loading: false,
    error: null,
    success: false,
    isReported: false,
    reportData: null,
  },
  reducers: {
    resetReportState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.isReported = false;
      state.reportData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* 🟢 CREATE REPORT */
      .addCase(createReport.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createReport.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.reportData = action.payload?.data || null;
        state.isReported = true;
      })
      .addCase(createReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Nếu thông báo có chữ "đã báo cáo" thì vẫn đánh dấu là đã báo cáo
        if (String(action.payload).includes("đã báo cáo")) {
          state.isReported = true;
        }
      })

      /* 🟡 CHECK REPORT */
      .addCase(checkIfReported.fulfilled, (state, action) => {
        state.isReported = action.payload?.isReported || false;
      })
      .addCase(checkIfReported.rejected, (state) => {
        state.isReported = false;
      });
  },
});

export const { resetReportState } = vehicleReportSlice.actions;
export default vehicleReportSlice.reducer;
