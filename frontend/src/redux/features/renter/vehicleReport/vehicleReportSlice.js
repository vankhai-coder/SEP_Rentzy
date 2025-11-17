import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

/* ============================================================
   📤 TẠO BÁO CÁO MỚI (POST) - Không check local token, rely cookie
   ============================================================ */
export const createReport = createAsyncThunk(
  "vehicleReport/createReport",
  async ({ vehicleId, reason, message }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${
          import.meta.env.VITE_API_URL
        }/api/renter/reports/vehicles/${vehicleId}`,
        { reason, message },
        {
          withCredentials: true, // Gửi cookie cho BE
        }
      );

      return response.data; // { success: true, data: {...} }
    } catch (error) {
      console.error(
        "❌ Lỗi khi tạo báo cáo:",
        error.response?.data || error.message
      );

      if (error.response?.status === 401) {
        // BE reject → logout
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
   🔍 KIỂM TRA XE ĐÃ BÁO CÁO (GET /my?vehicle_id) - Không check local token
   ============================================================ */
export const checkIfReported = createAsyncThunk(
  "vehicleReport/checkIfReported",
  async (vehicleId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL
        }/api/renter/reports/my?vehicle_id=${vehicleId}`,
        {
          withCredentials: true, // Gửi cookie
        }
      );

      const reports = response.data.data || [];
      return {
        isReported: reports.length > 0,
        reports, // Trả về reports để dùng nếu cần
      };
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { isReported: false, reports: [] };
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
   📋 LẤY TẤT CẢ BÁO CÁO CỦA USER (GET /my) - Không check local token
   ============================================================ */
export const getMyVehicleReports = createAsyncThunk(
  "vehicleReport/getMyVehicleReports",
  async ({ vehicleId } = {}, { rejectWithValue }) => {
    try {
      // Build URL: Nếu có vehicleId thì filter, không thì lấy tất cả
      const url = vehicleId
        ? `${
            import.meta.env.VITE_API_URL
          }/api/renter/reports/my?vehicle_id=${vehicleId}`
        : `${import.meta.env.VITE_API_URL}/api/renter/reports/my`;

      const response = await axios.get(url, {
        withCredentials: true, // Gửi cookie
      });

      return response.data; // { success: true, data: [...], count: N }
    } catch (error) {
      console.error(
        "❌ Lỗi khi lấy báo cáo:",
        error.response?.data || error.message
      );

      if (error.response?.status === 401) {
        return rejectWithValue(
          "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại"
        );
      }

      return rejectWithValue(
        error.response?.data?.message || "Lỗi khi lấy báo cáo"
      );
    }
  }
);

/* ============================================================
   🧩 SLICE - Không thay đổi
   ============================================================ */
const vehicleReportSlice = createSlice({
  name: "vehicleReport",
  initialState: {
    loading: false,
    error: null,
    success: false,
    isReported: false,
    reportData: null,
    myReports: [], // Danh sách báo cáo của user
    myReportsCount: 0,
    myReportsLoading: false, // Loading riêng cho getMyReports
  },
  reducers: {
    resetReportState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.isReported = false;
      state.reportData = null;
      state.myReports = [];
      state.myReportsCount = 0;
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
      .addCase(checkIfReported.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkIfReported.fulfilled, (state, action) => {
        state.loading = false;
        state.isReported = action.payload?.isReported || false;
        // Nếu cần, lưu reports tạm
        if (action.payload?.reports) {
          state.myReports = action.payload.reports;
        }
      })
      .addCase(checkIfReported.rejected, (state, action) => {
        state.loading = false;
        state.isReported = false;
        state.error = action.payload;
      })

      /* 📋 GET MY REPORTS */
      .addCase(getMyVehicleReports.pending, (state) => {
        state.myReportsLoading = true;
        state.error = null;
      })
      .addCase(getMyVehicleReports.fulfilled, (state, action) => {
        state.myReportsLoading = false;
        if (action.payload.success) {
          state.myReports = action.payload.data || [];
          state.myReportsCount = action.payload.count || 0;
        }
      })
      .addCase(getMyVehicleReports.rejected, (state, action) => {
        state.myReportsLoading = false;
        state.error = action.payload;
        state.myReports = [];
        state.myReportsCount = 0;
      });
  },
});

export const { resetReportState } = vehicleReportSlice.actions;
export default vehicleReportSlice.reducer;
