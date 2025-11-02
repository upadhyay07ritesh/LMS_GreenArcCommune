import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../api/axios.js'

const tokenFromStorage = localStorage.getItem('token')
const userFromStorage = localStorage.getItem('user')

export const loginThunk = createAsyncThunk('auth/login', async (payload, thunkAPI) => {
  try {
    const { data } = await api.post('/auth/login', payload)
    return data
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.message || 'Login failed')
  }
})

export const signupThunk = createAsyncThunk('auth/signup', async (payload, thunkAPI) => {
  try {
    const { data } = await api.post('/auth/signup', payload)
    return data
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.message || 'Signup failed')
  }
})

export const meThunk = createAsyncThunk('auth/me', async (_, thunkAPI) => {
  try {
    const { data } = await api.get('/auth/me')
    return data.user
  } catch (e) {
    return thunkAPI.rejectWithValue('Failed to load profile')
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: tokenFromStorage || null,
    user: userFromStorage ? JSON.parse(userFromStorage) : null,
    loading: false,
    error: null,
  },
  reducers: {
    logout(state) {
      state.token = null
      state.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    setCredentials(state, action) {
      state.token = action.payload.token
      state.user = action.payload.user
      localStorage.setItem('token', action.payload.token)
      localStorage.setItem('user', JSON.stringify(action.payload.user))
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (s) => { s.loading = true; s.error = null })
      .addCase(loginThunk.fulfilled, (s, a) => { s.loading = false; s.token = a.payload.token; s.user = a.payload.user; localStorage.setItem('token', a.payload.token); localStorage.setItem('user', JSON.stringify(a.payload.user)) })
      .addCase(loginThunk.rejected, (s, a) => { s.loading = false; s.error = a.payload })
      .addCase(signupThunk.pending, (s) => { s.loading = true; s.error = null })
      .addCase(signupThunk.fulfilled, (s, a) => { s.loading = false; s.token = a.payload.token; s.user = a.payload.user; localStorage.setItem('token', a.payload.token); localStorage.setItem('user', JSON.stringify(a.payload.user)) })
      .addCase(signupThunk.rejected, (s, a) => { s.loading = false; s.error = a.payload })
      .addCase(meThunk.fulfilled, (s, a) => { s.user = a.payload })
  }
})

export const { logout, setCredentials } = authSlice.actions
export default authSlice.reducer
