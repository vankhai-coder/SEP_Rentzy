import axiosInstance from "@/api/axiosInstance";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const initialState = {
    userId: "",
    role: "",
    avatar: "",
    email: '',
    loading: false,
    error: null,
    // for register :
    isRegisterSuccess: false,
    errorRegister: '',
    isLoadingRegister: false,
    // for verify email :
    isLoadingVerifyEmail: false,
    errorVerifyEmail: '',
    isVerifyEmailSuccess: false,


};

//check if user is logged in
export const checkAuth = createAsyncThunk(
    "user/checkAuth",
    async (_, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get(`${import.meta.env.VITE_API_URL}/api/auth/check-auth`)
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Auth check failed");
        }
    }
);

// logout : 
export const logoutUser = createAsyncThunk(
    "user/logoutUser",
    async (_, { rejectWithValue }) => {
        try {
            await axiosInstance.get(`${import.meta.env.VITE_API_URL}/api/auth/logout`)
            return true; // success
        } catch (err) {
            return rejectWithValue(err.response?.data || "Logout failed");
        }
    }
);

// register : 
export const register = createAsyncThunk(
    "user/register",
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post(
                `/api/auth/register`,
                { email, password }
            );
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Registration failed");
        }
    }
);

// verify email  :
export const verifyEmail = createAsyncThunk(
    "user/verifyEmail",
    async ({ email, verifyEmailToken }, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post(
                `${import.meta.env.VITE_API_URL}/api/auth/verify-email`,
                {
                    email,
                    verifyEmailToken,
                }
            );
            return res.data;
        } catch (err) {
            return rejectWithValue(
                err.response?.data?.message || "Email verification failed"
            );
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
        resetState: (state) => {
            state.loading = false;
            state.error = null;
            state.isRegisterSuccess = false;
            state.errorRegister = "";
            state.isLoadingRegister = false;
            state.isLoadingVerifyEmail = false;
            state.errorVerifyEmail = "";
            state.isVerifyEmailSuccess = false;
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
                state.email = ''
                state.isRegisterSuccess = false
                state.errorRegister = ''
                state.isLoadingRegister = false
            })
            .addCase(logoutUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // register
            .addCase(register.pending, (state) => {
                state.userId = "";
                state.role = "";
                state.avatar = ""
                state.isLoadingRegister = true;
                state.error = null;
                state.email = ''
                state.errorRegister = false
            })
            .addCase(register.fulfilled, (state) => {
                state.userId = "";
                state.role = "";
                state.avatar = ""
                state.isLoadingRegister = false;
                state.error = null;
                state.email = ''
                state.isRegisterSuccess = true

            })
            .addCase(register.rejected, (state, action) => {
                state.userId = "";
                state.role = "";
                state.avatar = ""
                state.isLoadingRegister = false;
                state.email = ''
                state.errorRegister = action.payload;
            })
            // verify email 
            .addCase(verifyEmail.pending, (state) => {
                state.isLoadingVerifyEmail = true;
                state.error = null;
                state.errorVerifyEmail = '';
            })
            .addCase(verifyEmail.fulfilled, (state, action) => {
                state.isLoadingVerifyEmail = false;
                state.isVerifyEmailSuccess = true

                // set user state from server response : 
                state.userId = action.payload.user.userId;
                state.role = action.payload.user.role;
                state.avatar = action.payload.user.avatar
                state.email = action.payload.user.email
            })
            .addCase(verifyEmail.rejected, (state, action) => {
                state.isLoadingVerifyEmail = false;
                state.errorVerifyEmail = action.payload;
            });
    },
});

// Actions
export const { setUser, resetState } = userSlice.actions;

export default userSlice.reducer;
