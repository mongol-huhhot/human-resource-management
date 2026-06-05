import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  base: './',

  plugins: [vue()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  define: {
    global: 'globalThis',
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '^/[^/]+/dataEngine/.*': {
        target: 'https://surupas-run.native365.net',
        changeOrigin: true,
        secure: false
      }
    }
    // },
  },

  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main.js'),
      name: 'GenericMasterSystem',
      fileName: 'generic-master-system',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})