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
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Strtchy",
        short_name: "Strtchy",
        description: "Your personal recovery and stretching companion",
        theme_color: "#0a0a0a",
        background_color: "#0a0a0a",
        display: "standalone",
        orientation: "portrait",
        icons: [
          {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
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
