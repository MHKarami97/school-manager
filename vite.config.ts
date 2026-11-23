import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig({
  base: "/",
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      manifest: {
        name: "مدیریار - سامانه مدیریت و برنامه‌ریزی هوشمند مدارس",
        short_name: "مدیریار",
        description:
          "سامانه جامع مدارس: چیدمان برنامه هفتگی، بانک ۳۴۰+ طرح درس آماده تمام پایه‌ها، بانک ۱۸,۷۰۰+ سوال و آزمون‌ساز آنلاین، حضور و غیاب و آزمایشگاه مجازی علوم",
        theme_color: "#ffffff",
        background_color: "#f6f7f9",
        display: "standalone",
        orientation: "portrait-primary",
        dir: "rtl",
        lang: "fa",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "icons/icon-48.png", sizes: "48x48", type: "image/png" },
          { src: "icons/icon-72.png", sizes: "72x72", type: "image/png" },
          { src: "icons/icon-96.png", sizes: "96x96", type: "image/png" },
          { src: "icons/icon-144.png", sizes: "144x144", type: "image/png" },
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg,avif,gif,json,webmanifest}"],
        globIgnores: [
          "**/downloads/**",
          "**/data/questions/**",
          "**/chogan/**",
          "**/fonts/webfonts/**",
        ],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/data/questions/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'curriculum-questions-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.includes('/chogan/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'chogan-games-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.includes('/fonts/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'app-fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
