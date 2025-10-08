// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ✅ Vite 설정 (React + Express 프록시)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // 기본 포트
    proxy: {
      // ✅ API 요청은 Express 서버로 전달
      '/api': 'http://localhost:3000',
    },
  },
});
