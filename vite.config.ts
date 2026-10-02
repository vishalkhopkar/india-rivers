import { defineConfig, type Plugin } from "vite";
import { readFileSync } from "node:fs";

// MapLibre v6 finds its worker by resolving "./maplibre-gl-worker.mjs" next to its own
// module. Once Vite folds MapLibre into the app bundle that file no longer exists, so
// the worker 404s and nothing renders. This copies the worker, and the shared module it
// imports, verbatim into the build; src/map.ts points setWorkerUrl at the copy.
function maplibreWorker(): Plugin {
  const files = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];
  return {
    name: "maplibre-worker",
    apply: "build",
    generateBundle() {
      for (const f of files) {
        this.emitFile({
          type: "asset",
          fileName: `maplibre/${f}`,
          source: readFileSync(`node_modules/maplibre-gl/dist/${f}`),
        });
      }
    },
  };
}

// The deploy workflow builds master at /india-rivers/ and the dev branch at
// /india-rivers/dev/, passing the path in BASE_PATH. Local builds use the production path.
const basePath = process.env.BASE_PATH ?? "/india-rivers/";

export default defineConfig(({ command, isPreview }) => ({
  // GitHub Pages serves a project site from /<repo>/. Dev keeps "/" so local URLs and
  // the verification scripts stay simple; `vite preview` mirrors Pages. Data URLs in
  // the app are built from import.meta.env.BASE_URL, so they follow this automatically.
  base: command === "build" || isPreview ? basePath : "/",
  plugins: [maplibreWorker()],
  // In dev the same worker problem appears through dep pre-bundling, which rewrites
  // maplibre-gl into .vite/deps/ without its worker. Serving it unbundled keeps the
  // pair together.
  optimizeDeps: { exclude: ["maplibre-gl"] },
  build: {
    target: "es2022",
    // The PMTiles archive is served as a static asset, never inlined.
    assetsInlineLimit: 4096,
  },
}));
