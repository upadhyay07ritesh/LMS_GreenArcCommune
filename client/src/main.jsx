import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { store } from './store/index.js'
import { meThunk } from './slices/authSlice.js'
import { DarkModeProvider } from './contexts/DarkModeContext.jsx'
import './index.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      {/* Try to rehydrate user if token exists but user is not loaded */}
      {(() => {
        const state = store.getState()
        if (state.auth?.token && !state.auth?.user) {
          store.dispatch(meThunk())
        }
      })()}
      <DarkModeProvider>
        <BrowserRouter>
          <App />
          <ToastContainer 
            position="top-right" 
            autoClose={2500}
            theme="colored"
            className="mt-16"
          />
        </BrowserRouter>
      </DarkModeProvider>
    </Provider>
  </React.StrictMode>
)
