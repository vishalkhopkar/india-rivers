import { defineConfig } from "vite";

export default defineConfig({
  // MapLibre v6 loads its worker as a sibling module. Vite's dep pre-bundling rewrites
  // maplibre-gl into .vite/deps/ without copying maplibre-gl-worker.mjs next to it, so
  // the worker 404s and the map renders nothing. Serving it unbundled keeps the pair
  // together.
  optimizeDeps: { exclude: ["maplibre-gl"] },
  build: {
    target: "es2022",
    // The PMTiles archive is served as a static asset, never inlined.
    assetsInlineLimit: 4096,
  },
});
