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
    // for login : 
    isLoadingLogin: false,
    isNotVerifyEmailError: false,
    errorLogin: '',
    isLoginSuccess: false,
    // for request create verify email : 
    isLoadingRequest: false,
    isRequestSuccess: false,
    errorRequest: '',
    // for request create reset password : 
    isLoadingRequestReset: false,
    isRequestResetSuccess: false,
    errorRequestReset: '',
    // for reset password : 
    isLoadingResetPassword: false,
    isResetPasswordSuccess: false,
    errorResetPassword: ''

};

//check if user is logged in
export const checkAuth = createAsyncThunk(
    "user/checkAuth",
    async (_, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get(`/api/auth/check-auth`)
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

// login : 
export const loginUser = createAsyncThunk(
    "user/loginUser",
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post("/api/auth/login", { email, password });
            return res.data; // { success, user : {userId , role , email , avatar} }
        } catch (err) {
            return rejectWithValue({
                message: err.response?.data?.message || 'Error when login!',
                isNotVerifyEmailError: err.response?.data?.isNotVerifyEmailError
            });
        }
    }
);

// request to create verify email : 
export const requestVerifyEmail = createAsyncThunk(
    "user/requestVerifyEmail",
    async (email, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post("/api/auth/request-create-verify-email", { email });
            return res.data; // { success: true, message: 'Verification email sent!' }
        } catch (err) {
            return rejectWithValue(err.response?.data || { message: "Error sending verification email" });
        }
    }
);

// request to create reset password :
export const requestResetPassword = createAsyncThunk(
    "user/requestResetPassword",
    async (email, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post("/api/auth/request-reset-password", { email });
            return res.data; // { success: true, message: '...' }
        } catch (err) {
            return rejectWithValue(
                err.response?.data?.message || "Error sending reset password email"
            );
        }
    }
);

// reset password : 
export const resetPassword = createAsyncThunk(
    "user/resetPassword",
    async ({ email, resetPasswordToken, password }, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post("/api/auth/reset-password", {
                email,
                resetPasswordToken,
                password,
            });
            return res.data; // e.g. { success: true, message: "Password reset!" }
        } catch (err) {
            return rejectWithValue(
                err.response?.data?.message || "Error resetting password"
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
            state.isLoginSuccess = false
            state.isNotVerifyEmailError = false
            state.errorLogin = ''
            state.isLoadingRequest = false
            state.isRequestSuccess = false
            state.errorRequest = ''
            state.isLoadingRequestReset = false
            state.isRequestResetSuccess = false
            state.errorRequestReset = ''
            state.isLoadingResetPassword = false;
            state.isResetPasswordSuccess = false;
            state.errorResetPassword = ''
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
                state.avatar = action.payload.user?.avatar
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
                state.loading = false;
                state.error = null;
                state.isRegisterSuccess = false;
                state.errorRegister = "";
                state.isLoadingRegister = false;
                state.isLoadingVerifyEmail = false;
                state.errorVerifyEmail = "";
                state.isVerifyEmailSuccess = false;
                state.isLoginSuccess = false
                state.isNotVerifyEmailError = false
                state.errorLogin = ''
                state.isLoadingRequest = false
                state.isRequestSuccess = false
                state.errorRequest = ''
                state.isLoadingRequestReset = false
                state.isRequestResetSuccess = false
                state.errorRequestReset = ''
                state.isLoadingResetPassword = false;
                state.isResetPasswordSuccess = false;
                state.errorResetPassword = ''

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
            })
            // login : 
            .addCase(loginUser.pending, (state) => {
                state.isLoadingLogin = true;
                state.error = null;
                state.isNotVerifyEmailError = false;
                state.errorLogin = ''
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.isLoadingLogin = false;
                state.isLoginSuccess = true;
                state.userId = action.payload.user.userId;
                state.email = action.payload.user.email;
                state.role = action.payload.user.role;
                state.avatar = action.payload.user.avatar;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.isLoadingLogin = false;
                state.isLoginSuccess = false;
                state.isNotVerifyEmailError = !!action.payload?.isNotVerifyEmailError;
                state.errorLogin = action.payload?.message
            })
            // Verification email
            .addCase(requestVerifyEmail.pending, (state) => {
                state.errorLogin = ''
                state.isLoadingRequest = true;
                state.isRequestSuccess = false;
                state.errorRequest = ''
            })
            .addCase(requestVerifyEmail.fulfilled, (state) => {
                state.isLoadingRequest = false;
                state.isRequestSuccess = true;
            })
            .addCase(requestVerifyEmail.rejected, (state, action) => {
                state.isLoadingRequest = false;
                state.isRequestSuccess = false;
                state.errorRequest = action.payload?.message || "Failed to send verification email";
            })
            // request reset password
            .addCase(requestResetPassword.pending, (state) => {
                state.isLoadingRequestReset = true;
                state.isRequestResetSuccess = false;
                state.errorRequestReset = ''
            })
            .addCase(requestResetPassword.fulfilled, (state) => {
                state.isLoadingRequestReset = false;
                state.isRequestResetSuccess = true;
                state.errorRequestReset = ''
            })
            .addCase(requestResetPassword.rejected, (state, action) => {
                state.isLoadingRequestReset = false;
                state.errorRequestReset = action.payload
                state.isRequestResetSuccess = false;
            })
            // resetPassword
            .addCase(resetPassword.pending, (state) => {
                state.isLoadingResetPassword = true;
                state.isResetPasswordSuccess = false;
                state.errorResetPassword = "";
            })
            .addCase(resetPassword.fulfilled, (state) => {
                state.isLoadingResetPassword = false;
                state.isResetPasswordSuccess = true;
                state.errorResetPassword = "";
            })
            .addCase(resetPassword.rejected, (state, action) => {
                state.isLoadingResetPassword = false;
                state.isResetPasswordSuccess = false;
                state.errorResetPassword =
                    action.payload || "Failed to reset password.";
            });
    },
});

// Actions
export const { setUser, resetState } = userSlice.actions;

export default userSlice.reducer;
