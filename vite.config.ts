import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      // Proxy API requests to staging backend to avoid CORS in dev
      '/api': {
        target: 'https://tgpl-backend-staging.onrender.com',
        changeOrigin: true,
        secure: true,
        // keep the full path (e.g. /api/v1/auth/signup/)
      },
    },
  },
})