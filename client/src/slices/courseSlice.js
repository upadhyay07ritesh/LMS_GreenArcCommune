import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../api/axios.js'

export const fetchCourses = createAsyncThunk('courses/list', async (params = {}, thunkAPI) => {
  try {
    const { data } = await api.get('/courses', { params })
    return data
  } catch (e) {
    return thunkAPI.rejectWithValue('Failed to load courses')
  }
})

export const fetchCourse = createAsyncThunk('courses/get', async (id, thunkAPI) => {
  try {
    const { data } = await api.get(`/courses/${id}`)
    return data
  } catch (e) {
    return thunkAPI.rejectWithValue('Failed to load course')
  }
})

export const enrollCourse = createAsyncThunk('courses/enroll', async (courseId, thunkAPI) => {
  try {
    const { data } = await api.post('/courses/enroll', { courseId })
    return data
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.message || 'Enroll failed')
  }
})

export const myEnrollments = createAsyncThunk('courses/myEnrollments', async (_, thunkAPI) => {
  try {
    const { data } = await api.get('/courses/me/enrollments')
    return data
  } catch (e) {
    return thunkAPI.rejectWithValue('Failed to load enrollments')
  }
})

export const markProgress = createAsyncThunk('courses/markProgress', async ({ enrollmentId, contentId }, thunkAPI) => {
  try {
    const { data } = await api.post('/courses/progress', { enrollmentId, contentId })
    return data
  } catch (e) {
    return thunkAPI.rejectWithValue('Failed to mark progress')
  }
})

const courseSlice = createSlice({
  name: 'courses',
  initialState: {
    items: [],
    current: null,
    enrollments: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (s) => { s.loading = true })
      .addCase(fetchCourses.fulfilled, (s, a) => { s.loading = false; s.items = a.payload })
      .addCase(fetchCourses.rejected, (s, a) => { s.loading = false; s.error = a.payload })
      .addCase(fetchCourse.fulfilled, (s, a) => { s.current = a.payload })
      .addCase(myEnrollments.fulfilled, (s, a) => { s.enrollments = a.payload })
      .addCase(markProgress.fulfilled, (s, a) => {
        const idx = s.enrollments.findIndex(e => e.id === a.payload._id)
        if (idx >= 0) s.enrollments[idx].completedContentIds = a.payload.completedContentIds
      })
  }
})

export default courseSlice.reducer
