import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Resolve the `@/*` import alias (mirrors tsconfig.json) so tests can import
// app modules the same way the app does.
export default defineConfig({
  // Override PostCSS so Vite doesn't try to load the app's Tailwind v4 config —
  // these are plain logic tests with no CSS to process.
  css: { postcss: { plugins: [] } },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
