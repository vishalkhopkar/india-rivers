// Drives the real page in Chrome and captures views at several zooms, so rendering
// problems that every data-level check passes - blank map, failed protocol handler,
// layers in the wrong order - actually surface.
//
// Usage: node scripts/07-screenshot.mjs [baseUrl]

import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:5174";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = "build/shots";

const VIEWS = [
  { name: "00-initial", note: "whatever the app opens on - checks the default framing" },
  { name: "01-india", center: [81, 22.5], zoom: 4, note: "all-India, major rivers only" },
  { name: "02-maharashtra", center: [74.5, 18.5], zoom: 7, note: "Ulhas tier" },
  { name: "03-satara", center: [73.9, 17.7], zoom: 9, note: "Savitri should be visible" },
  { name: "04-mumbai", center: [72.87, 19.2], zoom: 11.5, note: "Dahisar should be visible" },
];

mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  protocolTimeout: 120000,
  args: [
    "--no-sandbox",
    "--enable-unsafe-swiftshader",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--window-size=1280,860",
  ],
});

const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 1 });

const errors = [];
const failedRequests = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
page.on("requestfailed", (r) => failedRequests.push(`${r.failure()?.errorText} ${r.url().slice(0, 90)}`));
page.on("response", (r) => r.status() >= 400 && failedRequests.push(`HTTP ${r.status()} ${r.url().slice(0, 100)}`));

await page.goto(BASE, { waitUntil: "networkidle2", timeout: 60000 });

// Wait for MapLibre to exist and finish its first render.
await page.waitForFunction(() => !!window.__map, { timeout: 30000 }).catch(() => {});

for (const v of VIEWS) {
  if (v.center) {
    await page.evaluate(({ center, zoom }) => window.__map.jumpTo({ center, zoom }), v);
  }
  // Poll rather than awaiting an "idle" event: if the map is already idle when the
  // listener attaches, that event never fires again and the wait deadlocks.
  await page
    .waitForFunction(() => window.__map.loaded(), { timeout: 30000, polling: 250 })
    .catch(() => console.log(`  (${v.name}: map never reported loaded, capturing anyway)`));
  await new Promise((r) => setTimeout(r, 2000)); // let DEM rasters settle

  const stats = await page.evaluate(() => {
    const m = window.__map;
    const feats = m.queryRenderedFeatures({ layers: ["river-lines"] });
    const names = [...new Set(feats.map((f) => f.properties.name))];
    const b = m.getBounds();
    return {
      rendered: feats.length,
      distinct: names.length,
      sample: names.slice(0, 6),
      bounds: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].map((n) => +n.toFixed(2)),
      zoom: +m.getZoom().toFixed(2),
    };
  });

  await page.screenshot({ path: `${OUT}/${v.name}.png` });
  console.log(`${v.name.padEnd(16)} z${String(stats.zoom).padEnd(6)} ${String(stats.distinct).padStart(4)} rivers  view=[${stats.bounds.join(", ")}]`);
  if (stats.distinct === 0) console.log(`  ^ WARNING: nothing rendered - ${v.note}`);
}

await browser.close();

if (failedRequests.length) {
  console.log(`\nfailed requests (${failedRequests.length}):`);
  for (const f of [...new Set(failedRequests)].slice(0, 8)) console.log(`  ${f}`);
}
if (errors.length) {
  console.log(`\npage errors (${errors.length}):`);
  for (const e of [...new Set(errors)].slice(0, 8)) console.log(`  ${e}`);
}
console.log(`\nscreenshots in ${OUT}/`);
