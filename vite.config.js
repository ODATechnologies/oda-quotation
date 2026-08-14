import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    assetsInlineLimit: 1024 * 1024, // 1MB 이하 파일은 모두 base64 inline
  },
})
