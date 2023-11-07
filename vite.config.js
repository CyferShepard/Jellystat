import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    // port for exposing frontend
    port: 3000,
    // port for exposing APIs
    proxy: {
      '/api': 'http://localhost:3003',
      '/proxy': 'http://localhost:3003',
      '/stats': 'http://localhost:3003',
      '/sync': 'http://localhost:3003',
      '/auth': 'http://localhost:3003',
      '/backup': 'http://localhost:3003',
      '/logs': 'http://localhost:3003',
      '/socket.io': 'http://localhost:3003',
      '/swagger': 'http://localhost:3003',
      '/utils': 'http://localhost:3003',
    },
  },
  target: ['es2015'],
  rollupOptions: {
    output: {
      manualChunks: {
        react: ['react'],
        axios: ['axios'],
        'react-router-dom': ['react-router-dom'],
        'react-toastify': ['react-toastify'],
      },
    },
  },
  plugins: [react(), splitVendorChunkPlugin()],
});
