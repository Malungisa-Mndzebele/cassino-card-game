/// <reference types="@sveltejs/kit" />

// Explicit declarations for SvelteKit runtime modules
// These are provided by @sveltejs/kit but may not be resolved during type checking

declare module '$app/environment' {
	export const browser: boolean;
	export const building: boolean;
	export const dev: boolean;
	export const version: string;
}

declare module '$app/stores' {
	import { Readable } from 'svelte/store';
	import type { Navigation, Page } from '@sveltejs/kit';

	export const page: Readable<Page>;
	export const navigating: Readable<Navigation | null>;
	export const updated: Readable<boolean>;
}
