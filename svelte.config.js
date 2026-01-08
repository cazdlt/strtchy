import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto supports multiple deployment platforms
		adapter: adapter(),
		prerender: {
			handleHttpError: ({ path, referrer, message }) => {
				console.warn(`${message} - ${path} (${referrer})`);
			}
		}
	}
};

export default config;
