import { defineConfig } from 'vite';

// Local preview harness only (npm run preview:dev / npm run build:harness).
// The extension itself is bundled by vite.extension.config.ts.
export default defineConfig({
  root: 'harness',
  base: './',
  build: { outDir: '../dist/harness', emptyOutDir: true },
});
