// Checks the "hidden" attribute: the build step that publishes it (scripts/03f-hidden.mjs,
// run on fixture files in a temp dir) and the map, which leaves a hidden river out of every
// layer and names it as plain text in other rivers' panels.
//
//   node scripts/08c-verify-hidden.mjs [baseUrl]
//
// The browser checks do not depend on which rivers are hidden for real: the page's request
// for river-hidden.json is answered with a fixture that hides the Koyna and the
// Vrishabhavati. (The site has no search box, so there is no search to check.)

import puppeteer from "puppeteer-core";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = (process.argv[2] ?? "http://localhost:5174").replace(/\/$/, "");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = "build/shots";
mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (label, ok, detail) => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail !== undefined ? ` - ${detail}` : ""}`);
  if (!ok) failures++;
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// --- 1. the build step ---------------------------------------------------------------
console.log("Build step (scripts/03f-hidden.mjs) on fixture files:");
const INDEX = { 11: ["Alpha", 8, 0, 0, 1, 1, ""], 12: ["Beta", 9, 0, 0, 1, 1, "11"], 13: ["", 11, 0, 0, 1, 1, "11"], 14: ["Delta", 9, 0, 0, 1, 1, ""] };
const tmp = mkdtempSync(join(tmpdir(), "hidden-"));
let caseNo = 0;
function build(overrides) {
  const dir = join(tmp, String(++caseNo));
  mkdirSync(dir);
  const paths = ["overrides.json", "index.json", "out.json"].map((f) => join(dir, f));
  writeFileSync(paths[0], JSON.stringify(overrides));
  writeFileSync(paths[1], JSON.stringify(INDEX));
  const r = spawnSync(process.execPath, ["scripts/03f-hidden.mjs", ...paths], { encoding: "utf8" });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr, out: existsSync(paths[2]) ? JSON.parse(readFileSync(paths[2], "utf8")) : null };
}
const fails = (label, overrides, expect) => {
  const r = build(overrides);
  const said = r.stderr.split("\n").find((l) => expect.test(l))?.trim();
  check(label, r.code !== 0 && r.code !== null && !!said && r.out === null, said ?? `exit ${r.code}: ${r.stderr.trim() || r.stdout.trim()}`);
};
{
  const r = build({
    11: { name: "Alpha River", hidden: true, why: "fixture" },
    12: { name: "Beta", hidden: false, why: "fixture" },
    13: { name: "", hidden: null, why: "fixture" },
    14: { name: "Delta", end: "Somewhere", why: "fixture" },
    15: { name: "Not on this map, and not hidden", hidden: false, why: "fixture" },
  });
  check("valid entries: exits 0", r.code === 0, r.stderr.trim() || undefined);
  check("true hides; false, null and missing do not", JSON.stringify(r.out) === JSON.stringify({ hidden: ["11"] }), JSON.stringify(r.out));
  const two = build({ 14: { name: "Delta", hidden: true }, 12: { name: "Beta", hidden: true, rename: "Bee", down: "13" } });
  check("several rivers hidden, in uid order, whatever their other attributes", JSON.stringify(two.out) === JSON.stringify({ hidden: ["12", "14"] }), JSON.stringify(two.out));
  const none = build({ 11: { name: "Alpha River", end: "Somewhere", why: "fixture" } });
  check("no river hidden: exits 0 with an empty list", none.code === 0 && JSON.stringify(none.out) === JSON.stringify({ hidden: [] }));
}
fails('"yes" fails', { 11: { name: "Alpha River", hidden: "yes" } }, /11 Alpha: "hidden" must be true or false, not "yes"/);
fails('"true" (a string) fails', { 11: { name: "Alpha River", hidden: "true" } }, /11 Alpha: "hidden" must be true or false, not "true"/);
fails("1 fails", { 12: { name: "Beta", hidden: 1 } }, /12 Beta: "hidden" must be true or false, not 1/);
fails("0 fails", { 12: { name: "Beta", hidden: 0 } }, /12 Beta: "hidden" must be true or false, not 0/);
fails("an unnamed river's bad value names it as unnamed", { 13: { name: "", hidden: [] } }, /13 \(unnamed\): "hidden" must be true or false, not \[\]/);
fails("a hidden uid that is not on the map fails", { 99: { name: "Ghost", hidden: true } }, /99 Ghost: no such river on the map/);
{
  const real = join(tmp, "real.json");
  const r = spawnSync(process.execPath, ["scripts/03f-hidden.mjs", "data/river-overrides.json", "public/rivers-index.json", real], { encoding: "utf8" });
  check("the real data passes", r.status === 0, r.status === 0 ? r.stdout.trim() : r.stderr.trim());
  check("public/river-hidden.json is up to date (npm run data:hidden)", r.status === 0 && existsSync("public/river-hidden.json") && readFileSync(real, "utf8") === readFileSync("public/river-hidden.json", "utf8"));
}
rmSync(tmp, { recursive: true, force: true });

// --- 2. the map ----------------------------------------------------------------------
const index = JSON.parse(readFileSync("public/rivers-index.json", "utf8"));
const KOYNA = "2694", KRISHNA = "3218", VRISHABHAVATI = "7707", ARKAVATI = "7730", NAGARBHAVI = "40051";
for (const [uid, name] of [[KOYNA, "Koyna"], [KRISHNA, "Krishna"], [VRISHABHAVATI, "Vrishabhavati"], [ARKAVATI, "Arkavati"], [NAGARBHAVI, "Nagarbhavi Thorai"]])
  if (index[uid]?.[0] !== name) throw new Error(`rivers-index.json: ${uid} is ${index[uid]?.[0]}, expected ${name}`);
check("the Koyna flows into the Krishna and the Vrishabhavati into the Arkavati", index[KOYNA][6] === KRISHNA && index[VRISHABHAVATI][6] === ARKAVATI);

const fixture = { hidden: [KOYNA, VRISHABHAVATI] };
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  protocolTimeout: 120000,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader", "--window-size=1280,860"],
});

// A page on the map. `answer` decides what its request for river-hidden.json gets: a JSON
// body, "404", "fail" (the network drops it), or undefined for the real file.
async function openPage(answer, viewport = { width: 1280, height: 860 }) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  const errors = [], asked = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 180)));
  if (answer !== undefined) {
    const cdp = await page.createCDPSession();
    await cdp.send("Fetch.enable", { patterns: [{ urlPattern: "*river-hidden.json*" }] });
    cdp.on("Fetch.requestPaused", ({ requestId, request }) => {
      asked.push(request.url);
      const reply =
        answer === "fail"
          ? cdp.send("Fetch.failRequest", { requestId, errorReason: "ConnectionRefused" })
          : cdp.send("Fetch.fulfillRequest", {
              requestId,
              responseCode: answer === "404" ? 404 : 200,
              responseHeaders: [{ name: "Content-Type", value: "application/json" }],
              body: Buffer.from(answer === "404" ? "Not found" : JSON.stringify(answer)).toString("base64"),
            });
      reply.catch(() => {});
    });
  }
  await page.goto(BASE, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForFunction(() => !!window.__map, { timeout: 30000 });
  return { page, errors, asked };
}
const settle = async (page) => {
  await page.waitForFunction(() => window.__map.loaded() && !window.__map.isMoving(), { timeout: 45000, polling: 250 }).catch(() => {});
  await wait(1500);
};
const view = async (page, center, zoom) => {
  await page.evaluate(({ center, zoom }) => window.__map.jumpTo({ center, zoom }), { center, zoom });
  await settle(page);
};
// How many features of this river each river layer draws in the current view.
const rendered = (page, uid) =>
  page.evaluate((uid) => {
    const m = window.__map;
    const n = (layer) => m.queryRenderedFeatures({ layers: [layer] }).filter((f) => String(f.properties.uid) === uid).length;
    return { lines: n("river-lines"), hit: n("river-hit") };
  }, uid);
// A pixel on a river (nearest the screen centre, clear of the panel and corner controls).
const pixelOn = (page, uid) =>
  page.evaluate((uid) => {
    const m = window.__map;
    const canvas = m.getCanvas().getBoundingClientRect();
    const boxes = [...document.querySelectorAll(".panel:not([hidden]), .maplibregl-ctrl-top-right, .maplibregl-ctrl-bottom-right")].map((e) => e.getBoundingClientRect());
    const cx = canvas.width / 2, cy = canvas.height / 2;
    let best = null, bestD = Infinity;
    for (const f of m.queryRenderedFeatures({ layers: ["river-hit"] })) {
      if (String(f.properties.uid) !== uid) continue;
      const parts = f.geometry.type === "LineString" ? [f.geometry.coordinates] : f.geometry.coordinates;
      for (const part of parts)
        for (const c of part) {
          const p = m.project(c);
          if (p.x < 20 || p.y < 20 || p.x > canvas.width - 20 || p.y > canvas.height - 20) continue;
          if (boxes.some((b) => p.x >= b.left - 10 && p.x <= b.right + 10 && p.y >= b.top - 10 && p.y <= b.bottom + 10)) continue;
          const d = Math.hypot(p.x - cx, p.y - cy);
          if (d < bestD) { bestD = d; best = { x: Math.round(p.x), y: Math.round(p.y) }; }
        }
    }
    return best;
  }, uid);
const panelState = (page) =>
  page.evaluate(() => {
    const panel = document.querySelector(".panel");
    return {
      open: !!panel && !panel.hidden,
      heading: panel?.querySelector("h2")?.textContent ?? "",
      links: [...(panel?.querySelectorAll("a.river-link") ?? [])].map((a) => a.textContent),
      text: panel?.textContent ?? "",
    };
  });
const KOYNA_VIEW = [[73.85, 17.4], 9], VR_VIEW = [[77.565, 12.985], 13], ARKA_VIEW = [[77.45, 12.75], 10], NAG_VIEW = [[77.51, 12.95], 13];

// Where the rivers are on the real map, to click on the same pixels once they are hidden.
console.log("\nThe real river-hidden.json (it hides none of the rivers used here):");
const spots = {};
{
  const { page, errors } = await openPage();
  const served = await page.evaluate((url) => fetch(url).then((r) => (r.ok ? r.text() : `HTTP ${r.status}`)), `${BASE}/river-hidden.json`);
  check("the site serves the published file, a list of uids", served === readFileSync("public/river-hidden.json", "utf8") && JSON.parse(served).hidden.every((u) => /^\d+$/.test(u)), served.slice(0, 60));
  await view(page, ...KOYNA_VIEW);
  const k = await rendered(page, KOYNA);
  check("the Koyna is drawn on both layers", k.lines > 0 && k.hit > 0, JSON.stringify(k));
  spots.koyna = await pixelOn(page, KOYNA);
  check("the Krishna is drawn too", (await rendered(page, KRISHNA)).lines > 0);
  await view(page, ...VR_VIEW);
  const v = await rendered(page, VRISHABHAVATI);
  check("the Vrishabhavati is drawn on both layers", v.lines > 0 && v.hit > 0, JSON.stringify(v));
  spots.vr = await pixelOn(page, VRISHABHAVATI);
  await view(page, ...NAG_VIEW);
  spots.nag = await pixelOn(page, NAGARBHAVI);
  check("a pixel is found on each", !!spots.koyna && !!spots.vr && !!spots.nag);
  await page.mouse.click(spots.nag.x, spots.nag.y);
  await wait(1200);
  const p = await panelState(page);
  check("the Nagarbhavi Thorai's panel links the Vrishabhavati, in 'Merges into' and in its fun fact", p.heading === "Nagarbhavi Thorai" && p.links.filter((t) => t === "Vrishabhavati").length >= 2, `${p.heading}: ${p.links.join(", ")}`);
  check("no page errors", errors.length === 0, errors.join(" | ") || undefined);
  await page.close();
}

console.log("\nDesktop, fixture hiding the Koyna and the Vrishabhavati:");
{
  const { page, errors, asked } = await openPage(fixture);
  check("the file is asked for under the site's base path, once", asked.length === 1 && asked[0] === `${BASE}/river-hidden.json`, asked.join(", "));

  await view(page, ...KOYNA_VIEW);
  const k = await rendered(page, KOYNA);
  check("the Koyna draws no features on the lines layer or the hit layer", k.lines === 0 && k.hit === 0, JSON.stringify(k));
  const kr = await rendered(page, KRISHNA);
  check("the Krishna, which the Koyna flows into, still draws", kr.lines > 0 && kr.hit > 0, JSON.stringify(kr));
  const other = await page.evaluate(() => window.__map.queryRenderedFeatures({ layers: ["river-hit"] }).length);
  check("other rivers in the view still draw", other > 0, `${other} features`);
  if (spots.koyna) {
    await page.mouse.move(spots.koyna.x, spots.koyna.y);
    await wait(500);
    const cursor = await page.evaluate(() => window.__map.getCanvas().style.cursor);
    await page.mouse.click(spots.koyna.x, spots.koyna.y);
    await wait(900);
    const p = await panelState(page);
    check("where the Koyna was: no pointer cursor, and a click does not open its panel", cursor !== "pointer" && p.heading !== "Koyna", `cursor "${cursor}", panel ${p.open ? p.heading : "closed"}`);
  }
  const hoveredFeature = await page.evaluate(() => {
    const m = window.__map;
    return m.queryRenderedFeatures({ layers: ["river-hit"] }).some((f) => String(f.properties.uid) === "2694");
  });
  check("no hit-layer feature carries its uid (nothing to hover or click)", !hoveredFeature);

  await view(page, ...VR_VIEW);
  const v = await rendered(page, VRISHABHAVATI);
  check("the Vrishabhavati draws no features", v.lines === 0 && v.hit === 0, JSON.stringify(v));
  await view(page, ...ARKA_VIEW);
  const a = await rendered(page, ARKAVATI);
  check("the Arkavati, which it flows into, still draws", a.lines > 0 && a.hit > 0, JSON.stringify(a));
  await view(page, ...VR_VIEW);
  await page.screenshot({ path: `${OUT}/60-hidden-vrishabhavati.png` });

  await view(page, ...NAG_VIEW);
  const nag = await pixelOn(page, NAGARBHAVI);
  check("the Nagarbhavi Thorai, which joins the Vrishabhavati, still draws", !!nag);
  if (nag) {
    await page.mouse.click(nag.x, nag.y);
    await wait(1200);
    const p = await panelState(page);
    check("its panel opens", p.open && p.heading === "Nagarbhavi Thorai", p.heading);
    check("the hidden Vrishabhavati is not a link anywhere in it", !p.links.includes("Vrishabhavati"), `links: ${p.links.join(", ") || "none"}`);
    check("'Merges into' still names it, as plain text", /Merges into\s*Vrishabhavati/.test(p.text), p.text.slice(0, 120));
    check("and so does the fun fact", /joining the Vrishabhavati near Bangalore University/.test(p.text));
    await page.screenshot({ path: `${OUT}/61-hidden-panel.png` });
  }
  // a panel still offers links to rivers that are shown
  await view(page, [73.15, 19.15], 9);
  const u = await pixelOn(page, "8969");
  if (u) {
    await page.mouse.click(u.x, u.y);
    await wait(900);
    check("a river that is not hidden opens as before", (await panelState(page)).heading === "Ulhas");
  }
  check("the file was fetched once", asked.length === 1, `${asked.length} requests`);
  check("no page errors", errors.length === 0, errors.join(" | ") || undefined);
  await page.close();
}

console.log("\nA fixture hiding a river that another river's link points to, following links:");
{
  const { page, errors } = await openPage({ hidden: [KRISHNA] });
  await view(page, [73.85, 17.4], 8);
  check("the Krishna draws nothing", (await rendered(page, KRISHNA)).lines === 0);
  const ko = await pixelOn(page, KOYNA);
  check("the Koyna, which flows into it, still draws", !!ko);
  if (ko) {
    await page.mouse.click(ko.x, ko.y);
    await wait(900);
    const p = await panelState(page);
    check("its panel names the Krishna without a link", p.heading === "Koyna" && !p.links.includes("Krishna") && /Krishna/.test(p.text), `${p.heading}: links ${p.links.join(", ") || "none"}`);
  }
  check("no page errors", errors.length === 0, errors.join(" | ") || undefined);
  await page.close();
}

for (const [title, answer] of [["river-hidden.json missing (404)", "404"], ["river-hidden.json fails to load", "fail"], ["river-hidden.json is not what is expected", { hidden: "2694" }]]) {
  console.log(`\n${title}:`);
  const { page, errors, asked } = await openPage(answer);
  await view(page, ...KOYNA_VIEW);
  const k = await rendered(page, KOYNA);
  check("the request was made, and nothing is hidden: the Koyna draws", asked.length === 1 && k.lines > 0 && k.hit > 0, JSON.stringify(k));
  const ko = await pixelOn(page, KOYNA);
  if (ko) {
    await page.mouse.click(ko.x, ko.y);
    await wait(1200);
    const p = await panelState(page);
    check("it can be clicked, and its panel opens with its rows", p.open && p.heading === "Koyna" && p.links.length > 0, p.heading);
  }
  check("no page errors", errors.length === 0, errors.join(" | ") || undefined);
  await page.close();
}

await browser.close();
console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nALL CHECKS PASSED");
process.exit(failures ? 1 : 0);
