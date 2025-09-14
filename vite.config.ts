import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer'),
      '@main': resolve(__dirname, 'src/main'),
      '@preload': resolve(__dirname, 'src/preload')
    }
  },
  server: {
    port: 8080,
    strictPort: false,
    host: '0.0.0.0'
  },
  clearScreen: false
})