import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow external connections
    port: 5173,      // Set explicit port
    allowedHosts: ['quick-stars-smoke.loca.lt', 'localhost', '127.0.0.1'],
    watch: {
      usePolling: true // Enable polling for file changes in Docker
    },
    proxy: {
      '/api': {
        target: 'http://localhost:6969',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      }
    }
  },
  // bitno za slike
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})
