import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.svg",
        "apple-touch-icon.png",
        "icon-192.png",
        "icon-512.png",
        "maskable-512.png",
      ],
      manifest: {
        name: "Strtchy",
        short_name: "Strtchy",
        description: "Your personal recovery and stretching companion",
        theme_color: "#151515",
        background_color: "#151515",
        display: "standalone",
        orientation: "portrait",
        icons: [
          {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
          },
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*/,
            handler: "NetworkFirst",
            options: {
              cacheName: "offline-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 24 * 60 * 60,
              },
            },
          },
        ],
      },
    }),
  ],
  ssr: {
    noExternal: ["phosphor-svelte"],
  },
  preview: {
    allowedHosts: [
      "localhost",
      "floresta.local",
      "floresta",
      "strtchy.zamoradelatorre.com",
      "*.zamoradelatorre.com",
    ],
  },
});
