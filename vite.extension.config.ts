import { defineConfig } from 'vite';

// CI check that the extension entry bundles. Shopify does its own bundling on
// dev/deploy, so this isn't what ships.
export default defineConfig({
  build: {
    outDir: 'dist/extension',
    emptyOutDir: true,
    lib: { entry: 'extensions/free-shipping-progress/src/index.tsx', formats: ['es'], fileName: 'extension' },
  },
});
