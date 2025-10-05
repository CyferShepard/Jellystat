import { defineConfig, splitVendorChunkPlugin } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  envPrefix: "JS_",
  base: "",
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "axios", "react-toastify"],
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
    },
  },
  server: {
    // port for exposing frontend
    port: 3000,
    // port for exposing APIs
    proxy: {
      "/api": "http://127.0.0.1:3000",
      "/proxy": "http://127.0.0.1:3000",
      "/stats": "http://127.0.0.1:3000",
      "/sync": "http://127.0.0.1:3000",
      "/auth": "http://127.0.0.1:3000",
      "/backup": "http://127.0.0.1:3000",
      "/logs": "http://127.0.0.1:3000",
      "/socket.io": "http://127.0.0.1:3000",
      "/swagger": "http://127.0.0.1:3000",
      "/utils": "http://127.0.0.1:3000",
      "/webhooks": "http://127.0.0.1:3000",
    },
  },
  target: ["es2015"],
  rollupOptions: {
    output: {
      manualChunks: {
        react: ["react"],
        "react-dom": ["react-dom"],
        "react-router-dom": ["react-router-dom"],
        axios: ["axios"],
        "react-toastify": ["react-toastify"],
      },
    },
  },
  plugins: [react(), splitVendorChunkPlugin()],
  envDir: "backend",
});
