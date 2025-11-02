import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../slices/authSlice.js'
import courseReducer from '../slices/courseSlice.js'
import profileReducer from '../slices/profileSlice.js'
import notificationReducer from '../slices/notificationSlice.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: courseReducer,
    profile: profileReducer,
    notifications: notificationReducer,
  }
})
