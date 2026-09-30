import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        // Keep first-load bandwidth focused on the public page. Route chunks and
        // media are cached as they are used instead of downloading the full app.
        globPatterns: ["**/*.{html,css,ico,svg,webmanifest}", "icons/*.png"],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/.*\.js$/,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "biztrack-route-chunks", expiration: { maxEntries: 180, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|webp)$/,
            handler: "CacheFirst",
            options: { cacheName: "biztrack-images", expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
        ],
      },
      manifest: {
        name: "BizTrack",
        short_name: "BizTrack",
        description: "POS, inventory, sales, expenses, debts and business reporting for growing Tanzanian and African businesses.",
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
