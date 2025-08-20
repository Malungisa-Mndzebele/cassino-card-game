import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copy } from 'fs-extra'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-htaccess',
      closeBundle: async () => {
        await copy(
          resolve(__dirname, 'public/.htaccess'),
          resolve(__dirname, 'dist/.htaccess')
        )
      }
    }
  ],
  build: {
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    // Optimize for better performance
    target: 'es2015',
    cssCodeSplit: true,
    assetsInlineLimit: 4096
  },
  server: {
    port: 3000,
    host: true,
    strictPort: true,
    hmr: {
      host: 'localhost'
    }
  },
  base: './',
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  }
})