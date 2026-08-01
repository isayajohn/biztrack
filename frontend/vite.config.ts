import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        // The app ships as a single large JS bundle today; raise the default 2 MiB
        // Workbox precache limit so it isn't silently excluded from offline caching.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
      manifest: {
        name: "BizTrack",
        short_name: "BizTrack",
        description: "BizTrack is the business operating system for growing African businesses — sales, inventory, finance, customers, debts, reports, and AI insights in real time.",
        theme_color: "#18bd97",
        background_color: "#eef5f2",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icons/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/pwa-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
});
