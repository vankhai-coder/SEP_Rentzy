import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const createReport = createAsyncThunk(
  "vehicleReport/createReport",
  async ({ vehicleId, reason, message }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${
          import.meta.env.VITE_API_URL
        }/api/renter/reports/vehicles/${vehicleId}`,
        { reason, message },
        { withCredentials: true }
      );
      return response.data;
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

export const checkIfReported = createAsyncThunk(
  "vehicleReport/checkIfReported",
  async (vehicleId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL
        }/api/renter/reports/my?vehicle_id=${vehicleId}`,
        { withCredentials: true }
      );
      const reports = response.data.data || [];
      return { isReported: reports.length > 0, reports };
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

export const getMyVehicleReports = createAsyncThunk(
  "vehicleReport/getMyVehicleReports",
  async ({ vehicleId, page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      let url = `${import.meta.env.VITE_API_URL}/api/renter/reports/my`;
      const params = new URLSearchParams();

      if (vehicleId) {
        params.append("vehicle_id", vehicleId);
      }

      params.append("page", page.toString());
      params.append("limit", limit.toString());

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url, { withCredentials: true });
      return response.data;
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

export const getAllVehicleReports = createAsyncThunk(
  "vehicleReport/getAllVehicleReports",
  async (
    { status, vehicle_id, page = 1, limit = 10 } = {},
    { rejectWithValue }
  ) => {
    try {
      let url = `${import.meta.env.VITE_API_URL}/api/renter/reports`;
      const params = new URLSearchParams();

      if (status) params.append("status", status);
      if (vehicle_id) params.append("vehicle_id", vehicle_id);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      if (params.toString()) url += `?${params.toString()}`;

      const response = await axios.get(url, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error(
        "❌ Lỗi khi lấy báo cáo admin:",
        error.response?.data || error.message
      );
      if (error.response?.status === 401 || error.response?.status === 403) {
        return rejectWithValue("Không có quyền truy cập hoặc phiên hết hạn");
      }
      return rejectWithValue(
        error.response?.data?.message || "Lỗi khi lấy báo cáo"
      );
    }
  }
);

export const updateVehicleReport = createAsyncThunk(
  "vehicleReport/updateVehicleReport",
  async ({ report_id, status, admin_note }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/renter/reports/${report_id}`,
        { status, admin_note },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error(
        "❌ Lỗi khi cập nhật báo cáo:",
        error.response?.data || error.message
      );
      if (error.response?.status === 401 || error.response?.status === 403) {
        return rejectWithValue("Không có quyền cập nhật hoặc phiên hết hạn");
      }
      return rejectWithValue(
        error.response?.data?.message || "Lỗi khi cập nhật báo cáo"
      );
    }
  }
);

const vehicleReportSlice = createSlice({
  name: "vehicleReport",
  initialState: {
    // Renter state
    loading: false,
    error: null,
    success: false,
    isReported: false,
    reportData: null,
    myReports: [],
    myReportsCount: 0,
    myReportsLoading: false,
    myReportsTotalPages: 0,
    myReportsCurrentPage: 1,
    myReportsTotalReports: 0,

    // Admin state
    allReports: [],
    allReportsCount: 0,
    allReportsLoading: false,
    allReportsTotalPages: 0,
    allReportsCurrentPage: 1,
    allReportsTotalReports: 0,
    updateLoading: false,
    adminSuccess: false,
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
      state.myReportsCurrentPage = 1;
      state.myReportsTotalPages = 0;
      state.myReportsTotalReports = 0;
    },

    resetAdminReportState: (state) => {
      state.allReports = [];
      state.allReportsCount = 0;
      state.allReportsLoading = false;
      state.allReportsCurrentPage = 1;
      state.allReportsTotalPages = 0;
      state.allReportsTotalReports = 0;
      state.updateLoading = false;
      state.adminSuccess = false;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      /* 🟢 CREATE REPORT (Renter) */
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
        if (String(action.payload).includes("đã báo cáo")) {
          state.isReported = true;
        }
      })

      /* 🟡 CHECK REPORT (Renter) */
      .addCase(checkIfReported.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkIfReported.fulfilled, (state, action) => {
        state.loading = false;
        state.isReported = action.payload?.isReported || false;
        if (action.payload?.reports) {
          state.myReports = action.payload.reports;
        }
      })
      .addCase(checkIfReported.rejected, (state, action) => {
        state.loading = false;
        state.isReported = false;
        state.error = action.payload;
      })

      /* 📋 GET MY REPORTS (Renter) - có pagination */
      .addCase(getMyVehicleReports.pending, (state) => {
        state.myReportsLoading = true;
        state.error = null;
      })
      .addCase(getMyVehicleReports.fulfilled, (state, action) => {
        state.myReportsLoading = false;
        if (action.payload.success) {
          state.myReports = action.payload.data || [];
          state.myReportsCount = action.payload.count || 0;
          state.myReportsTotalReports = action.payload.totalReports || 0;
          state.myReportsTotalPages = action.payload.totalPages || 1;
          state.myReportsCurrentPage = action.payload.currentPage || 1;
        }
      })
      .addCase(getMyVehicleReports.rejected, (state, action) => {
        state.myReportsLoading = false;
        state.error = action.payload;
        state.myReports = [];
        state.myReportsCount = 0;
        state.myReportsTotalPages = 0;
        state.myReportsCurrentPage = 1;
      })

      /* 📋 GET ALL REPORTS (Admin) - có pagination */
      .addCase(getAllVehicleReports.pending, (state) => {
        state.allReportsLoading = true;
        state.error = null;
      })
      .addCase(getAllVehicleReports.fulfilled, (state, action) => {
        state.allReportsLoading = false;
        if (action.payload.success) {
          state.allReports = action.payload.data || [];
          state.allReportsCount = action.payload.count || 0;
          state.allReportsTotalReports = action.payload.totalReports || 0;
          state.allReportsTotalPages = action.payload.totalPages || 1;
          state.allReportsCurrentPage = action.payload.currentPage || 1;
        }
      })
      .addCase(getAllVehicleReports.rejected, (state, action) => {
        state.allReportsLoading = false;
        state.error = action.payload;
        state.allReports = [];
        state.allReportsCount = 0;
        state.allReportsTotalPages = 0;
        state.allReportsCurrentPage = 1;
      })

      /* 🔄 UPDATE REPORT (Admin) */
      .addCase(updateVehicleReport.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
        state.adminSuccess = false;
      })
      .addCase(updateVehicleReport.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.adminSuccess = true;
        const index = state.allReports.findIndex(
          (r) => r.report_id === action.payload.data.report_id
        );

        if (index !== -1) {
          state.allReports[index].status = action.payload.data.status;
          state.allReports[index].admin_note = action.payload.data.admin_note;
        }
      })
      .addCase(updateVehicleReport.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload;
      });
  },
});

export const { resetReportState, resetAdminReportState } =
  vehicleReportSlice.actions;

export default vehicleReportSlice.reducer;
