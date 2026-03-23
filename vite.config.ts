import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types/index.ts'),
      '@context': path.resolve(__dirname, './src/context'),
      // '@firebase': path.resolve(__dirname, './src/firebase'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/yoco': {
        target: 'https://payments.yoco.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/yoco/, '/api'),
        secure: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
