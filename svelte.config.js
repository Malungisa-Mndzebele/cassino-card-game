import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Preprocess with Vite for TypeScript, PostCSS, etc.
	preprocess: vitePreprocess(),

	kit: {
		// Static adapter for deployment to any static host
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html',
			precompress: true,
			strict: true
		}),

		// Base path for deployment (matches current /cassino/ path)
		paths: {
			base: process.env.NODE_ENV === 'production' ? '/cassino' : ''
		},

		// Path aliases for cleaner imports
		alias: {
			$lib: './src/lib',
			$components: './src/lib/components',
			$stores: './src/lib/stores',
			$utils: './src/lib/utils',
			$types: './src/lib/types'
		},

		// Prerender configuration
		prerender: {
			handleHttpError: 'warn',
			entries: ['*']
		},

		// Service worker
		serviceWorker: {
			register: false
		}
	}
};

export default config;
