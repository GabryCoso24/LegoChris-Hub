import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const hostIp = env.VITE_HOST_IP || "localhost";
  const httpsPort = Number(env.VITE_HTTPS_PORT || 443);
  const backendPort = Number(env.VITE_API_PORT || 3001);
  const backendTarget = `http://${hostIp}:${backendPort}`;

  return {
    server: {
      host: "::",
      port: httpsPort,
      https: true,
      hmr: {
        overlay: false,
      },
      proxy: {
        "/api": {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        "/uploads": {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
