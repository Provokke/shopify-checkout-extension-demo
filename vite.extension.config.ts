import { defineConfig } from 'vite';

// Proves the extension entry bundles cleanly. `shopify app dev/deploy` does its
// own bundling; this is a CI sanity check, not what ships to Shopify.
export default defineConfig({
  build: {
    outDir: 'dist/extension',
    emptyOutDir: true,
    lib: { entry: 'extensions/free-shipping-progress/src/index.tsx', formats: ['es'], fileName: 'extension' },
  },
});
