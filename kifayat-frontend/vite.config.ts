import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          if (id.includes("leaflet")) return "maps";
          if (id.includes("firebase") || id.includes("@firebase")) return "auth-firebase";
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("react-dom") || id.includes("react/") || id.includes("scheduler")) return "react";
          if (id.includes("@tanstack")) return "tanstack";
          if (id.includes("@radix-ui") || id.includes("cmdk")) return "ui-primitives";
          if (id.includes("socket.io") || id.includes("engine.io")) return "realtime";
          if (id.includes("lucide-react")) return "icons";
          return "vendor";
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      "/socket.io": {
        target: "http://localhost:3001",
        ws: true,
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: "",
        configure: (proxy) => {
          proxy.on("proxyRes", (proxyRes) => {
            // Rewrite Secure flag on Set-Cookie headers so cookies work in
            // the Vite dev proxy (HTTP → backend) even when NODE_ENV=production.
            const setCookie = proxyRes.headers["set-cookie"];
            if (setCookie) {
              proxyRes.headers["set-cookie"] = (Array.isArray(setCookie) ? setCookie : [setCookie]).map(
                (cookie) => cookie.replace(/;\s*Secure/gi, "").replace(/;\s*SameSite=None/gi, "; SameSite=Lax"),
              );
            }
          });
        },
      },
    },
  },
});
