import axiosInstance from "@/api/axiosInstance";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const initialState = {
    userId: "",
    role: "",
    avatar: "",
    email : '' ,
    loading: false,
    error: null,
};

// Async thunk: check if user is logged in
export const checkAuth = createAsyncThunk(
    "user/checkAuth",
    async (_, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get(`${import.meta.env.VITE_API_URL}/api/check-auth`)
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Auth check failed");
        }
    }
);

export const logoutUser = createAsyncThunk(
    "user/logoutUser",
    async (_, { rejectWithValue }) => {
        try {
            await axiosInstance.get(`${import.meta.env.VITE_API_URL}/logout`)
            return true; // success
        } catch (err) {
            return rejectWithValue(err.response?.data || "Logout failed");
        }
    }
);

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.userId = action.payload.userId;
            state.role = action.payload.role;
            state.loading = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // check auth : 
            .addCase(checkAuth.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.userId = "";
                state.role = "";
                state.avatar = ""
            })
            .addCase(checkAuth.fulfilled, (state, action) => {
                state.loading = false;
                state.userId = action.payload.user.userId;
                state.role = action.payload.user.role;
                state.avatar = action.payload.user.avatar 
                state.email = action.payload.user.email
                state.error = null;
            })
            .addCase(checkAuth.rejected, (state, action) => {
                state.loading = false;
                state.userId = "";
                state.role = "";
                state.avatar = ""
                state.error = action.payload;
            })
            // logoutUser
            .addCase(logoutUser.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.userId = "";
                state.role = "";
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.userId = "";
                state.role = "";
                state.avatar = ""
                state.loading = false;
                state.error = null;
            })
            .addCase(logoutUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

// Actions
export const { setUser } = userSlice.actions;

export default userSlice.reducer;
