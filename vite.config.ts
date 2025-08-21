import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true, // 避免多实例占用多个端口
    host: true,
    proxy: {
      "/api": { target: "http://localhost:3000", changeOrigin: true },
      // 如需后端代理三方 API，可继续在后端实现并在此转发
    },
  },
  build: {
    sourcemap: mode !== "production",
    target: "es2018",
  },
  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : [],
  },
}));
