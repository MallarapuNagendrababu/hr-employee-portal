import { defineConfig } from 'vite';

const proxyTarget = 'http://localhost:8787';

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
