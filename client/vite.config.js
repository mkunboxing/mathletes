const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');

module.exports = defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://mathletes-backend.vercel.app',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'https://mathletes-backend.vercel.app',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    },
  },
}); 