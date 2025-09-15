import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts')
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload/index.ts')
        }
      }
    }
  },
  renderer: {
    root: '.',
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'index.html')
        },
        output: {
          manualChunks: {
            echarts: ['echarts']
          }
        }
      }
    },
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer'),
        '@main': resolve(__dirname, 'src/main'),
        '@preload': resolve(__dirname, 'src/preload')
      }
    },
    optimizeDeps: {
      include: ['echarts']
    },
    server: {
      port: 8080,
      host: '0.0.0.0',
      strictPort: false
    }
  }
})