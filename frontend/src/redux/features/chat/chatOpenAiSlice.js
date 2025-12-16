import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async (message, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/chat/openai`,
        { message },
        { withCredentials: true }
      );
      return {
        user: message,
        bot: res.data.reply,
        vehicles: res.data.vehicles || null, // Nhận danh sách xe từ backend
        vehicleCount: res.data.vehicleCount || 0,
      };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || "Lỗi khi gửi tin nhắn"
      );
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    messages: [],
    loading: false,
    error: null,
  },
  reducers: {
    addUserMessage: (state, action) => {
      state.messages.push({ role: "user", text: action.payload });
      state.messages.push({ role: "bot", text: "...", pending: true });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        const botMsg = state.messages.find(
          (m) => m.role === "bot" && m.pending
        );
        if (botMsg) {
          botMsg.text = action.payload.bot;
          botMsg.vehicles = action.payload.vehicles; // Lưu danh sách xe
          botMsg.vehicleCount = action.payload.vehicleCount;
          delete botMsg.pending;
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        const botMsg = state.messages.find(
          (m) => m.role === "bot" && m.pending
        );
        if (botMsg) {
          botMsg.text = "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.";
          delete botMsg.pending;
        }
        state.error = action.payload;
      });
  },
});

export const { addUserMessage } = chatSlice.actions;
export default chatSlice.reducer;
