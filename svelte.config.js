import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { VitePWA } from "vite-plugin-pwa";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(), // Ya no usa adapter-auto
    prerender: {
      handleHttpError: ({ path, referrer, message }) => {
        console.warn(`${message} - ${path} (${referrer})`);
      },
    },
  },
};

export default config;
