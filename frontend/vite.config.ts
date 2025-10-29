import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const basePath = env.VITE_BASE_PATH && env.VITE_BASE_PATH.length > 0 ? env.VITE_BASE_PATH : "/";

  return {
    base: basePath,
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: env.VITE_PROXY_API ?? "http://localhost:8000",
          changeOrigin: true,
        },
      },
    },
  };
});
