import { defineConfig, type Plugin } from "vite";
import { readFileSync } from "node:fs";
import { areaPages, homeLinks } from "./scripts/lib/seo-pages.mjs";

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

// The deploy workflow builds master at / and the dev branch at /dev/ (riversofindia.in is
// the repo's GitHub Pages custom domain), passing the path in BASE_PATH. Local builds use
// the production path.
const basePath = process.env.BASE_PATH ?? "/";

// Only the production build (served at the domain root) is for search engines. The dev build
// at /dev/ is marked noindex so it never competes with the live site, and only the production
// build ships robots.txt and sitemap.xml, which must live at the root to count.
// Both builds get the area landing pages (/bengaluru/ and so on, from data/seo-areas.json):
// they reuse the finished index.html, whose bundle names are hashed, so they can only be made
// here, at the end of the build. The dev copies inherit the noindex tag.
const SITE = "https://riversofindia.in";
function seo(): Plugin {
  const isProd = basePath === "/";
  const areas = JSON.parse(readFileSync("data/seo-areas.json", "utf8"));
  const rivers = JSON.parse(readFileSync("data/seo-areas-rivers.json", "utf8"));
  return {
    name: "seo",
    apply: "build",
    enforce: "post",
    transformIndexHtml(html) {
      const withLinks = html.replace("<!--area-links-->", homeLinks(areas, basePath));
      return isProd ? withLinks : withLinks.replace('content="index, follow, max-image-preview:large"', 'content="noindex, nofollow"');
    },
    generateBundle(_, bundle) {
      const home = bundle["index.html"];
      if (home?.type !== "asset") throw new Error("seo: index.html missing from the bundle");
      for (const page of areaPages({ html: String(home.source), areas, rivers, site: SITE, base: basePath })) {
        this.emitFile({ type: "asset", ...page });
      }
      if (!isProd) return;
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: ["User-agent: *", "Allow: /", "Disallow: /dev/", "", `Sitemap: ${SITE}/sitemap.xml`, ""].join("\n"),
      });
      const urls = ["", ...areas.map((a: { slug: string }) => `${a.slug}/`)];
      const entries = urls.map((u) => `  <url><loc>${SITE}/${u}</loc></url>`);
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...entries,
          "</urlset>",
          "",
        ].join("\n"),
      });
    },
  };
}

export default defineConfig(({ command, isPreview }) => ({
  // Data URLs in the app are built from import.meta.env.BASE_URL, so they follow this
  // automatically.
  base: command === "build" || isPreview ? basePath : "/",
  plugins: [maplibreWorker(), seo()],
  // In dev the same worker problem appears through dep pre-bundling, which rewrites
  // maplibre-gl into .vite/deps/ without its worker. Serving it unbundled keeps the
  // pair together.
  optimizeDeps: { exclude: ["maplibre-gl"] },
  // A browser download in progress in the project folder is locked by the browser, and
  // watching it crashes the dev server (EBUSY). The scratch and source data aren't served
  // from here either.
  server: { watch: { ignored: ["**/*.crdownload", "**/*.part", "**/build/**", "**/data/raw/**"] } },
  build: {
    target: "es2022",
    // The PMTiles archive is served as a static asset, never inlined.
    assetsInlineLimit: 4096,
  },
}));
