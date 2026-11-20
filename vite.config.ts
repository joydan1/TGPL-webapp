import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor',
              test: /node_modules[\\/](react|react-dom|react-router|react-router-dom)([\\/]|$)/,
              priority: 2,
            },
            {
              name: 'ui',
              test: /node_modules[\\/]lucide-react([\\/]|$)/,
              priority: 1,
            },
          ],
        },
      },
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@components': path.resolve(import.meta.dirname, 'src/components'),
      '@pages': path.resolve(import.meta.dirname, 'src/pages'),
      '@hooks': path.resolve(import.meta.dirname, 'src/hooks'),
      '@services': path.resolve(import.meta.dirname, 'src/services'),
      '@constants': path.resolve(import.meta.dirname, 'src/constants'),
      '@types': path.resolve(import.meta.dirname, 'src/types'),
      '@store': path.resolve(import.meta.dirname, 'src/store'),
      '@styles': path.resolve(import.meta.dirname, 'src/styles'),
      '@layouts': path.resolve(import.meta.dirname, 'src/layouts'),
      '@assets': path.resolve(import.meta.dirname, 'src/assets'),
    },
  },

  server: {
    proxy: {
      '/api': {
        target: 'https://tgpl-webapp-backend-staging.up.railway.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})