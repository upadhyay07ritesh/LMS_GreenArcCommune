import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios.js";

const tokenFromStorage =
  localStorage.getItem("adminToken") || localStorage.getItem("token");
const userFromStorage = localStorage.getItem("user");
const roleFromStorage = localStorage.getItem("userRole");

export const loginThunk = createAsyncThunk(
  "auth/login",
  async (payload, thunkAPI) => {
    try {
      const { data } = await api.post("/auth/login", payload);
      return data;
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.message || "Login failed"
      );
    }
  }
);

export const signupThunk = createAsyncThunk(
  "auth/signup",
  async (payload, thunkAPI) => {
    try {
      const { data } = await api.post("/auth/signup", payload);
      return data;
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.message || "Signup failed"
      );
    }
  }
);

export const meThunk = createAsyncThunk("auth/me", async (_, thunkAPI) => {
  try {
    const { data } = await api.get("/auth/me");
    return data.user;
  } catch (e) {
    return thunkAPI.rejectWithValue("Failed to load profile");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: tokenFromStorage || null,
    user: userFromStorage ? JSON.parse(userFromStorage) : null,
    role: roleFromStorage || null,
    loading: false,
    error: null,
  },
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.role = null;

      localStorage.removeItem("token");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("user");
      localStorage.removeItem("userRole");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(loginThunk.fulfilled, (s, a) => {
        s.loading = false;
        s.token = a.payload.token;
        s.user = a.payload.user;
        s.role = a.payload.user.role;

        // ✅ Correct token key
        if (a.payload.user.role === "admin") {
          localStorage.setItem("adminToken", a.payload.token);
        } else {
          localStorage.setItem("token", a.payload.token);
        }

        localStorage.setItem("user", JSON.stringify(a.payload.user));
        localStorage.setItem("userRole", a.payload.user.role);
      })

      .addCase(loginThunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })
      .addCase(signupThunk.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(signupThunk.fulfilled, (s, a) => {
        s.loading = false;
        s.token = a.payload.token;
        s.user = a.payload.user;
        s.role = a.payload.user.role;

        if (a.payload.user.role === "admin") {
          localStorage.setItem("adminToken", a.payload.token);
        } else {
          localStorage.setItem("token", a.payload.token);
        }

        localStorage.setItem("user", JSON.stringify(a.payload.user));
        localStorage.setItem("userRole", a.payload.user.role);
      })
      .addCase(signupThunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })
      .addCase(meThunk.fulfilled, (s, a) => {
        s.user = a.payload;
        s.role = a.payload.role;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
