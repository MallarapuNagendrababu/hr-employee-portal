import { defineConfig } from 'vite';

const proxyTarget = 'http://localhost:3000';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true
      }
    }
  }
});
