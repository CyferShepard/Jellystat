import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'react-toastify',
    ],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  server: {
    // port for exposing frontend
    port: 3000,
    // port for exposing APIs
    proxy: {
      '/api': 'http://localhost:3000',
      '/proxy': 'http://localhost:3000',
      '/stats': 'http://localhost:3000',
      '/sync': 'http://localhost:3000',
      '/auth': 'http://localhost:3000',
      '/backup': 'http://localhost:3000',
      '/logs': 'http://localhost:3000',
      '/socket.io': 'http://localhost:3000',
      '/swagger': 'http://localhost:3000',
      '/utils': 'http://localhost:3000',
    },
  },
  target: ['es2015'],
  rollupOptions: {
    output: {
      manualChunks: {
        react: ['react'],
        'react-dom': ['react-dom'],
        'react-router-dom': ['react-router-dom'],
        axios: ['axios'],
        'react-toastify': ['react-toastify'],
      },
    },
  },
  plugins: [react(), splitVendorChunkPlugin()],
});
