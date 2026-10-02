// Drives real mouse events at real rivers to confirm hover, click, the panel contents,
// and following a "Merges into" link. Targets are located by querying rendered
// geometry and projecting it to a screen pixel, rather than guessing coordinates.

import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:5174";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = "build/shots";
mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (label, ok, detail) => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail !== undefined ? ` - ${detail}` : ""}`);
  if (!ok) failures++;
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  protocolTimeout: 120000,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader", "--window-size=1280,860"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 860 });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 180)));
page.on("console", (m) => m.type() === "error" && !/favicon/.test(m.text()) && errors.push(m.text().slice(0, 180)));

await page.goto(BASE, { waitUntil: "networkidle2", timeout: 60000 });
await page.waitForFunction(() => !!window.__map, { timeout: 30000 });

const settle = async () => {
  await page.waitForFunction(() => window.__map.loaded() && !window.__map.isMoving(), { timeout: 45000, polling: 250 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1200));
};

// Picks the point on the river nearest the screen centre that is not hidden behind the
// open panel - a click there would land on the panel, not the map.
async function pixelOf(name) {
  return page.evaluate((name) => {
    const m = window.__map;
    const canvas = m.getCanvas().getBoundingClientRect();
    const panel = document.querySelector(".panel");
    const pr = panel && !panel.hidden ? panel.getBoundingClientRect() : null;
    const cx = canvas.width / 2, cy = canvas.height / 2;
    let best = null, bestD = Infinity, uid = null;
    for (const f of m.queryRenderedFeatures({ layers: ["river-hit"] })) {
      if (f.properties.name !== name) continue;
      uid = f.properties.uid;
      const parts = f.geometry.type === "LineString" ? [f.geometry.coordinates] : f.geometry.coordinates;
      for (const part of parts)
        for (const c of part) {
          const p = m.project(c);
          if (p.x < 20 || p.y < 20 || p.x > canvas.width - 20 || p.y > canvas.height - 20) continue;
          if (pr && p.x <= pr.right + 10 && p.y <= pr.bottom + 10) continue;
          const d = Math.hypot(p.x - cx, p.y - cy);
          if (d < bestD) { bestD = d; best = p; }
        }
    }
    return best ? { x: Math.round(best.x), y: Math.round(best.y), uid } : null;
  }, name);
}

const readPanel = () =>
  page.evaluate(() => {
    const el = document.querySelector(".panel");
    const dts = [...el.querySelectorAll("dt")];
    const rows = Object.fromEntries(dts.map((dt) => [dt.textContent, dt.nextElementSibling.textContent]));
    const r = el.getBoundingClientRect();
    return {
      visible: !el.hidden,
      heading: el.querySelector("h2")?.textContent ?? "",
      rows,
      link: el.querySelector(".river-link")?.textContent ?? null,
      scrolls: el.scrollHeight > el.clientHeight + 1,
      overflowY: getComputedStyle(el).overflowY,
      fitsViewport: r.bottom <= innerHeight && r.right <= innerWidth,
      size: `${Math.round(r.width)}x${Math.round(r.height)}`,
    };
  });

async function openRiver(name, center, zoom) {
  await page.evaluate(({ center, zoom }) => window.__map.jumpTo({ center, zoom }), { center, zoom });
  await settle();
  const pt = await pixelOf(name);
  if (!pt) return null;
  await page.mouse.move(pt.x, pt.y);
  await new Promise((r) => setTimeout(r, 400));
  await page.mouse.click(pt.x, pt.y);
  await new Promise((r) => setTimeout(r, 700));
  return { pt, panel: await readPanel() };
}

// --- 1. the user's worked example ----------------------------------------------
console.log("\nUlhas (sea-bound, the worked example):");
const ulhas = await openRiver("Ulhas", [73.15, 19.15], 9);
check("Ulhas clickable", !!ulhas);
if (ulhas) {
  const r = ulhas.panel.rows;
  check("Origin", r["Origin"] === "Western Ghats near Lonavala, Maharashtra", r["Origin"]);
  check("Mouth near", r["Mouth near"] === "Vasai, Maharashtra", r["Mouth near"]);
  check("Mouth into", r["Mouth into"] === "Arabian Sea", r["Mouth into"]);
  check("Length", /^145\.9 km$/.test(r["Length"]), r["Length"]);
  check("basin etc. hidden while flag is off", !("Basin" in r) && !("States" in r) && !("Sub-basin" in r));
  check("no merge link on a sea-bound river", ulhas.panel.link === null);
  check("panel does not scroll", !ulhas.panel.scrolls && ulhas.panel.overflowY !== "auto", ulhas.panel.size);
  await page.screenshot({ path: `${OUT}/20-ulhas.png` });
}

// --- 2. a tributary, then follow its link ----------------------------------------
console.log("\nKoyna (tributary of the Krishna):");
const koyna = await openRiver("Koyna", [73.85, 17.4], 9);
check("Koyna clickable", !!koyna);
if (koyna) {
  const r = koyna.panel.rows;
  check("Merges into is a link", koyna.panel.link === "Krishna River", koyna.panel.link);
  check("Confluence row present", "Confluence near" in r || "Confluence" in r, r["Confluence near"] ?? r["Confluence"]);
  check("Origin row present", "Origin" in r || "Origin near" in r, r["Origin"] ?? r["Origin near"]);
  check("no mouth rows on a tributary", !("Mouth into" in r) && !("Mouth near" in r));
  await page.screenshot({ path: `${OUT}/21-koyna.png` });

  await page.click(".river-link");
  await new Promise((r) => setTimeout(r, 500));
  await settle();
  await new Promise((r) => setTimeout(r, 800));
  const after = await readPanel();
  const kState = await page.evaluate(() =>
    window.__map.getFeatureState({ source: "rivers", sourceLayer: "rivers", id: "3218" })
  );
  const koynaState = await page.evaluate(
    (uid) => window.__map.getFeatureState({ source: "rivers", sourceLayer: "rivers", id: uid }),
    koyna.pt.uid
  );
  check("link opens the Krishna River panel", after.heading === "Krishna River", after.heading);
  check("Krishna River is now selected", kState.selected === true, JSON.stringify(kState));
  check("Koyna is no longer selected", !koynaState.selected, JSON.stringify(koynaState));
  check("Krishna shows its own mouth", after.rows["Mouth into"] === "Bay of Bengal", after.rows["Mouth into"]);
  await page.screenshot({ path: `${OUT}/22-followed-to-krishna.png` });
}

// --- 3. the longest descriptions still fit -------------------------------------
console.log("\nGanga River (longest curated text):");
const ganga = await openRiver("Ganga River", [84.5, 25.4], 6);
check("Ganga clickable", !!ganga);
if (ganga) {
  check("panel shows the Ganga", ganga.panel.heading === "Ganga River", ganga.panel.heading);
  check("Ganga origin is Devprayag", /^Devprayag/.test(ganga.panel.rows["Origin"] ?? ""), ganga.panel.rows["Origin"]);
  check("panel does not scroll", !ganga.panel.scrolls, ganga.panel.size);
  check("panel fits the viewport", ganga.panel.fitsViewport);
  console.log(`  rows: ${Object.entries(ganga.panel.rows).map(([k, v]) => `${k}=${v}`).join(" | ")}`);
  await page.screenshot({ path: `${OUT}/23-ganga.png` });
}

// --- 4. hand-corrected names ----------------------------------------------------
// The dataset calls these "Malad Creek" and "Mahim"; both are corrected in
// data/river-overrides.json.
for (const [name, center, origin, mouth] of [
  ["Poisar", [72.865, 19.2], "Sanjay Gandhi National Park, Mumbai", "Malad Creek, opening to the sea at Versova, Mumbai"],
  ["Mithi", [72.88, 19.1], "Near Vihar Lake, Sanjay Gandhi National Park, Mumbai", "Mahim Creek, Mumbai"],
]) {
  console.log(`\n${name} (renamed from the dataset):`);
  const r = await openRiver(name, center, 13);
  check(`${name} is on the map under its corrected name`, !!r);
  if (!r) continue;
  check("panel heading", r.panel.heading === name, r.panel.heading);
  check("origin", r.panel.rows["Origin"] === origin, r.panel.rows["Origin"]);
  check("mouth", r.panel.rows["Mouth"] === mouth, r.panel.rows["Mouth"]);
  check("mouth into", r.panel.rows["Mouth into"] === "Arabian Sea", r.panel.rows["Mouth into"]);
  await page.screenshot({ path: `${OUT}/25-${name.toLowerCase()}.png` });
}
const oldNames = await page.evaluate(() =>
  window.__map.querySourceFeatures("rivers", { sourceLayer: "rivers" }).filter((f) => ["Malad Creek", "Mahim"].includes(f.properties.name)).length
);
check("old dataset names no longer appear", oldNames === 0, `${oldNames} features`);

// --- 5. dismiss ----------------------------------------------------------------
await page.evaluate(() => document.querySelector(".panel-close")?.click());
await new Promise((r) => setTimeout(r, 300));
check("close hides the panel", await page.evaluate(() => !!document.querySelector(".panel")?.hidden));

await browser.close();
if (errors.length) console.log(`\npage errors:\n  ${[...new Set(errors)].join("\n  ")}`);
console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nALL CHECKS PASSED");
process.exit(failures ? 1 : 0);
