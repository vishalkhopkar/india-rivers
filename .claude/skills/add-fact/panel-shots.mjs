// Opens one river's panel in the running dev server, on a desktop and on a phone, and checks
// that its Fun Facts are the ones in public/river-facts.json and that the whole panel is on
// screen. The panel is sized to its content and never scrolls, so a fact that runs long
// pushes the panel off the bottom of a phone. Screenshots go to build/shots/ (gitignored).
//
//   npx vite --port 5174 --strictPort                        (if not already running)
//   node .claude/skills/add-fact/panel-shots.mjs <uid> [base url]
//
// Exits 1 if the panel shows the wrong facts or does not fit either screen.

import puppeteer from "puppeteer-core";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const uid = process.argv[2];
const BASE = (process.argv[3] ?? "http://localhost:5174").replace(/\/$/, "");
const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = `${ROOT}build/shots`;
const VIEWS = [
  ["desktop", { width: 1280, height: 860 }],
  ["phone", { width: 375, height: 740, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
];

const entry = uid && JSON.parse(readFileSync(`${ROOT}public/rivers-index.json`, "utf8"))[uid];
if (!entry) {
  console.error(uid ? `uid ${uid} is not on the map` : "usage: panel-shots.mjs <uid> [base url]");
  process.exit(2);
}
if (!existsSync(CHROME)) {
  console.error(`Chrome not found at ${CHROME}; set CHROME to its path.`);
  process.exit(2);
}
const [name, minz, w, s, e, n] = entry;
const expected = JSON.parse(readFileSync(`${ROOT}public/river-facts.json`, "utf8"))[uid] ?? [];
console.log(`${uid} ${name || "(unnamed)"}: ${expected.length} fact(s) in public/river-facts.json`);
if (!expected.length) {
  console.error("  nothing is published for this uid - add the fact and run `npm run data:facts` first.");
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  protocolTimeout: 120000,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
});
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0, shots = 0;
const fail = (view, msg) => {
  console.log(`  ${view.padEnd(8)}FAIL  ${msg}`);
  failures++;
};

try {
  for (const [view, viewport] of VIEWS) {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    const settle = async () => {
      await page.waitForFunction(() => window.__map?.loaded() && !window.__map.isMoving(), { timeout: 45000, polling: 250 }).catch(() => {});
      await pause(1200);
    };
    try {
      await page.goto(`${BASE}/`, { waitUntil: "networkidle2", timeout: 60000 });
    } catch {
      fail(view, `no dev server at ${BASE} - start it with: npx vite --port 5174 --strictPort`);
      break;
    }
    await settle();

    // Frame the river as following a "Merges into" link does: fit its extent, but never
    // stop short of the zoom at which it is first drawn.
    await page.evaluate(
      ([w, s, e, n, minz]) => {
        const m = window.__map;
        const cam = m.cameraForBounds([[w, s], [e, n]], { padding: 60 });
        m.jumpTo({ center: cam.center, zoom: Math.min(Math.max(cam.zoom ?? minz, minz + 0.3), 13) });
      },
      [w, s, e, n, minz]
    );
    await settle();

    // A pixel on this river where it, not a neighbour, is what a click would pick.
    const pt = await page.evaluate((uid) => {
      const m = window.__map, W = innerWidth, H = innerHeight;
      const mine = (f) => String(f.properties.uid) === uid;
      let best = null, bestD = Infinity;
      for (const f of m.queryRenderedFeatures({ layers: ["river-hit"] }).filter(mine)) {
        const parts = f.geometry.type === "LineString" ? [f.geometry.coordinates] : f.geometry.coordinates;
        for (const c of parts.flat()) {
          const p = m.project(c);
          if (p.x < 30 || p.y < 30 || p.x > W - 30 || p.y > H - 30) continue;
          const d = Math.hypot(p.x - W * 0.6, p.y - H * 0.7);
          if (d >= bestD) continue;
          const top = m.queryRenderedFeatures([p.x, p.y], { layers: ["river-hit"] })[0];
          if (top && mine(top)) (bestD = d), (best = { x: Math.round(p.x), y: Math.round(p.y) });
        }
      }
      return best;
    }, uid);
    if (!pt) {
      fail(view, "the river is not drawn at this view, so it could not be clicked");
      await page.close();
      continue;
    }
    if (viewport.hasTouch) await page.touchscreen.tap(pt.x, pt.y);
    else await page.mouse.click(pt.x, pt.y);
    // The facts file is fetched when the first panel opens; the panel redraws when it lands.
    await page
      .waitForFunction((k) => document.querySelectorAll(".panel:not([hidden]) .fact").length >= k, { timeout: 8000 }, Math.max(expected.length, 1))
      .catch(() => {});
    await pause(300);

    const got = await page.evaluate(() => {
      const el = document.querySelector(".panel");
      const r = el.getBoundingClientRect();
      return {
        open: !el.hidden,
        heading: el.querySelector("h2")?.textContent ?? "",
        facts: [...el.querySelectorAll(".fact")].map((p) => p.textContent),
        factsHeight: [...el.querySelectorAll(".fact-heading, .fact")].reduce((h, x) => h + x.getBoundingClientRect().height, 0),
        size: `${Math.round(r.width)}x${Math.round(r.height)}`,
        spare: Math.round(innerHeight - r.bottom),
        wide: r.right > innerWidth,
        scrolls: el.scrollHeight > el.clientHeight + 1 || document.documentElement.scrollHeight > innerHeight + 1,
      };
    });
    await page.screenshot({ path: `${OUT}/fact-${uid}-${view}.png` });
    await page.close();
    shots++;

    if (!got.open) { fail(view, "the panel did not open"); continue; }
    if (JSON.stringify(got.facts) !== JSON.stringify(expected))
      fail(view, `the panel "${got.heading}" shows ${got.facts.length} fact(s) that differ from public/river-facts.json`);
    if (got.spare < 0 || got.wide || got.scrolls)
      fail(view, `the panel does not fit: ${got.size} in ${viewport.width}x${viewport.height}, ${-got.spare} px past the bottom - shorten the fact`);
    else
      console.log(`  ${view.padEnd(8)}ok    panel ${got.size} in ${viewport.width}x${viewport.height}, ${got.spare} px to spare; Fun Facts take ${Math.round(got.factsHeight)} px`);
  }
} finally {
  await browser.close();
}
if (shots) console.log(`  screenshots: build/shots/fact-${uid}-desktop.png and fact-${uid}-phone.png - look at both`);
process.exit(failures ? 1 : 0);
