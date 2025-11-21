import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte()],
  test: {
    // Use happy-dom environment for Svelte tests
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // Test file patterns - SvelteKit tests only (exclude E2E)
    include: [
      'src/**/*.{test,spec}.{js,ts}'
    ],
    // Exclude E2E and performance tests (run with Playwright)
    exclude: [
      '**/node_modules/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/tests/e2e/**',
      '**/tests/performance/**',
      '**/tests/integration/**'
    ],
    // Coverage settings
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.svelte-kit/',
        'build/',
        'dist/',
        '**/*.config.{js,ts}',
        '**/test-utils.{ts,tsx}'
      ]
    }
  },
  resolve: {
    alias: {
      // SvelteKit aliases
      $lib: path.resolve('./src/lib'),
      $components: path.resolve('./src/lib/components'),
      $stores: path.resolve('./src/lib/stores'),
      $utils: path.resolve('./src/lib/utils'),
      $types: path.resolve('./src/lib/types'),
      $app: path.resolve('./.svelte-kit/runtime/app')
    }
  }
});
