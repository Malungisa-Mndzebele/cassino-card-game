import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/cassino/',
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    // Ensure dev server matches production base path
    origin: 'http://localhost:5173',
  },
  build: {
    outDir: 'dist',
    // Ensure production build matches deployment
    assetsDir: 'assets',
    sourcemap: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  // Ensure CSS is processed the same way in dev and production
  css: {
    postcss: './postcss.config.cjs',
  },
})


