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
        name: "مدیریار - برنامه‌ریز هوشمند مدرسه",
        short_name: "مدیریار",
        description:
          "ساخت خودکار و ویرایش برنامه هفتگی کلاس‌های ابتدایی، متوسطه اول و دوم",
        theme_color: "#1c5fe0",
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
        globPatterns: ["**/*.{js,css,html,svg,ico}"],
        navigateFallback: "/index.html",
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
