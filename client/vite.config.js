import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ✅ Vite configuration for both local dev & Netlify build
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'build', // 👈 ensures Netlify can find your production build
    chunkSizeWarningLimit: 1000, // optional, avoids large bundle warnings
  },
})
