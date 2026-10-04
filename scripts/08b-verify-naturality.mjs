// Checks the "Doubtful naturality" tag: the build step that publishes it
// (scripts/03e-naturality.mjs, run on fixture files in a temp dir) and the tag and its
// tooltip in the river panel, on a desktop and on a phone.
//
//   node scripts/08b-verify-naturality.mjs [baseUrl]
//
// The browser checks do not depend on which rivers are tagged for real: the page's request
// for river-naturality.json is answered with a fixture that tags two known rivers.

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
console.log("Build step (scripts/03e-naturality.mjs) on fixture files:");
const SEED = JSON.parse(readFileSync("data/naturality-info.json", "utf8"));
const TEXTS = [SEED[0], "Second text."];
const INDEX = { 11: ["Alpha", 8, 0, 0, 1, 1, ""], 12: ["Beta", 9, 0, 0, 1, 1, "11"], 13: ["", 11, 0, 0, 1, 1, "11"], 14: ["Delta", 9, 0, 0, 1, 1, ""] };
const tmp = mkdtempSync(join(tmpdir(), "naturality-"));
let caseNo = 0;
function build(overrides, texts = TEXTS) {
  const dir = join(tmp, String(++caseNo));
  mkdirSync(dir);
  const paths = ["overrides.json", "texts.json", "index.json", "out.json"].map((f) => join(dir, f));
  writeFileSync(paths[0], JSON.stringify(overrides));
  writeFileSync(paths[1], typeof texts === "string" ? texts : JSON.stringify(texts));
  writeFileSync(paths[2], JSON.stringify(INDEX));
  const r = spawnSync(process.execPath, ["scripts/03e-naturality.mjs", ...paths], { encoding: "utf8" });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr, out: existsSync(paths[3]) ? JSON.parse(readFileSync(paths[3], "utf8")) : null };
}
const fails = (label, overrides, texts, expect) => {
  const r = build(overrides, texts);
  const said = r.stderr.split("\n").find((l) => expect.test(l))?.trim();
  check(label, r.code !== 0 && r.code !== null && !!said && r.out === null, said ?? `exit ${r.code}: ${r.stderr.trim() || r.stdout.trim()}`);
};
{
  const r = build({
    11: { name: "Alpha River", doubtfulNaturality: true, naturalityInfo: 1, why: "fixture" },
    12: { name: "Beta", naturalityInfo: 0, why: "fixture" },
    13: { name: "", doubtfulNaturality: true, naturalityInfo: 0, why: "fixture" },
    14: { name: "Delta", doubtfulNaturality: false, why: "fixture" },
    15: { name: "Not on this map, and not tagged", end: "Somewhere", why: "fixture" },
  });
  check("valid entries: exits 0", r.code === 0, r.stderr.trim() || undefined);
  check("writes the texts and the tagged rivers", JSON.stringify(r.out) === JSON.stringify({ texts: TEXTS, rivers: { 11: 1, 13: 0 } }), JSON.stringify(r.out?.rivers));
  check("naturalityInfo without doubtfulNaturality: a warning, and no tag", /12 Beta: has "naturalityInfo" but "doubtfulNaturality" is not true/.test(r.stdout) && !("12" in (r.out?.rivers ?? {})));
  const none = build({ 11: { name: "Alpha River", end: "Somewhere", why: "fixture" } });
  check("no river tagged: exits 0 with an empty list", none.code === 0 && JSON.stringify(none.out) === JSON.stringify({ texts: TEXTS, rivers: {} }));
}
fails("doubtfulNaturality without naturalityInfo fails", { 11: { name: "Alpha River", doubtfulNaturality: true } }, TEXTS, /11 Alpha: "doubtfulNaturality" is true but there is no "naturalityInfo"/);
fails("the same on an unnamed river", { 13: { name: "", doubtfulNaturality: true } }, TEXTS, /13 \(unnamed\): "doubtfulNaturality" is true but there is no "naturalityInfo"/);
fails("naturalityInfo -1 fails", { 11: { name: "Alpha River", doubtfulNaturality: true, naturalityInfo: -1 } }, TEXTS, /11 Alpha: "naturalityInfo" must be a whole number, 0 or more, not -1/);
fails("naturalityInfo 1.5 fails", { 11: { name: "Alpha River", doubtfulNaturality: true, naturalityInfo: 1.5 } }, TEXTS, /11 Alpha: "naturalityInfo" must be a whole number, 0 or more, not 1\.5/);
fails('naturalityInfo "0" (a string) fails', { 11: { name: "Alpha River", doubtfulNaturality: true, naturalityInfo: "0" } }, TEXTS, /11 Alpha: "naturalityInfo" must be a whole number, 0 or more, not "0"/);
fails("a bad naturalityInfo fails even when the river is not tagged", { 12: { name: "Beta", naturalityInfo: -2 } }, TEXTS, /12 Beta: "naturalityInfo" must be a whole number/);
fails("naturalityInfo with no text at that index fails", { 11: { name: "Alpha River", doubtfulNaturality: true, naturalityInfo: 2 } }, TEXTS, /11 Alpha: "naturalityInfo" is 2, but .* has no text 2 \(it has 2\)/);
fails('doubtfulNaturality "yes" fails', { 11: { name: "Alpha River", doubtfulNaturality: "yes", naturalityInfo: 0 } }, TEXTS, /11 Alpha: "doubtfulNaturality" must be true or false, not "yes"/);
fails("doubtfulNaturality 1 fails", { 11: { name: "Alpha River", doubtfulNaturality: 1, naturalityInfo: 0 } }, TEXTS, /11 Alpha: "doubtfulNaturality" must be true or false, not 1/);
fails("a tagged uid that is not on the map fails", { 99: { name: "Ghost", doubtfulNaturality: true, naturalityInfo: 0 } }, TEXTS, /99 Ghost: no such river on the map/);
fails("texts that are not a list fail", {}, { 0: "a text" }, /must be a list of texts/);
fails("an empty text fails", {}, [SEED[0], "  "], /text 1 must be a non-empty string/);
fails("a text that is not a string fails", {}, [SEED[0], 7], /text 1 must be a non-empty string/);
fails("texts that are not JSON fail", {}, "[ 'not json' ]", /cannot read .*texts\.json/);
{
  // the real files: the build passes, and the published file is the one they produce
  const out = join(tmp, "real.json");
  const r = spawnSync(process.execPath, ["scripts/03e-naturality.mjs", "data/river-overrides.json", "data/naturality-info.json", "public/rivers-index.json", out], { encoding: "utf8" });
  check("the real data passes", r.status === 0, r.status === 0 ? r.stdout.trim() : r.stderr.trim());
  check("public/river-naturality.json is up to date (npm run data:naturality)", r.status === 0 && existsSync("public/river-naturality.json") && readFileSync(out, "utf8") === readFileSync("public/river-naturality.json", "utf8"));
}
rmSync(tmp, { recursive: true, force: true });

// --- 2. the panel --------------------------------------------------------------------
const LONG =
  "A second explanation, written long to try the tooltip at its largest: about eighty words, the same limit a fun fact has. " +
  "This channel is shown on the oldest survey maps as a straight cut between two tanks, which suggests it was dug rather than formed, " +
  "yet the valley it follows is a natural one and may have carried a seasonal stream before the tanks were built. " +
  "Nothing settles the question, so the river carries this tag until something does.";
const fixture = { texts: [SEED[0], LONG], rivers: {} };

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  protocolTimeout: 120000,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader", "--window-size=1280,860"],
});

// A page on the map. `answer` decides what its request for river-naturality.json gets: a
// JSON body, "404", "fail" (the network drops it), or undefined for the real file.
async function openPage(viewport, answer) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  const errors = [], asked = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 180)));
  if (answer !== undefined) {
    const cdp = await page.createCDPSession();
    await cdp.send("Fetch.enable", { patterns: [{ urlPattern: "*river-naturality.json*" }] });
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
  await wait(1200);
};
// Moves the map to a river and returns a pixel on it (nearest the screen centre, clear of
// the open panel and of the corner controls) with that river's uid.
async function locate(page, name, center, zoom) {
  await page.evaluate(({ center, zoom }) => window.__map.jumpTo({ center, zoom }), { center, zoom });
  await settle(page);
  return page.evaluate((name) => {
    const m = window.__map;
    const canvas = m.getCanvas().getBoundingClientRect();
    const boxes = [...document.querySelectorAll(".panel:not([hidden]), .maplibregl-ctrl-top-right, .maplibregl-ctrl-bottom-right")].map((e) => e.getBoundingClientRect());
    const cx = canvas.width / 2, cy = canvas.height / 2;
    let best = null, bestD = Infinity;
    for (const f of m.queryRenderedFeatures({ layers: ["river-hit"] })) {
      if (f.properties.name !== name) continue;
      const parts = f.geometry.type === "LineString" ? [f.geometry.coordinates] : f.geometry.coordinates;
      for (const part of parts)
        for (const c of part) {
          const p = m.project(c);
          if (p.x < 20 || p.y < 20 || p.x > canvas.width - 20 || p.y > canvas.height - 20) continue;
          if (boxes.some((b) => p.x >= b.left - 10 && p.x <= b.right + 10 && p.y >= b.top - 10 && p.y <= b.bottom + 10)) continue;
          const d = Math.hypot(p.x - cx, p.y - cy);
          if (d < bestD) { bestD = d; best = { x: Math.round(p.x), y: Math.round(p.y), uid: String(f.properties.uid) }; }
        }
    }
    return best;
  }, name);
}
// Everything the checks need to know about the panel and the tag, in one read.
const readTag = (page) =>
  page.evaluate(() => {
    const panel = document.querySelector(".panel");
    const h2 = panel.querySelector("h2");
    const row = panel.querySelector(".naturality");
    const box = (e) => {
      const r = e.getBoundingClientRect();
      return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height };
    };
    const res = {
      open: !panel.hidden,
      heading: h2?.textContent ?? "",
      rows: panel.querySelectorAll("dt").length,
      tagged: !!row,
      panel: box(panel),
      panelOverflow: getComputedStyle(panel).overflowY,
      panelScrolls: panel.scrollHeight > panel.clientHeight + 1,
      view: { w: innerWidth, h: innerHeight },
      pageScrollsSideways: document.documentElement.scrollWidth > innerWidth,
    };
    if (!row) return res;
    const tag = row.querySelector(".naturality-tag"), help = row.querySelector(".naturality-help"), tip = row.querySelector(".naturality-tip");
    const ts = getComputedStyle(tag), hs = getComputedStyle(h2), ps = getComputedStyle(tip);
    return {
      ...res,
      afterName: h2.nextElementSibling === row,
      beforeRows: row.nextElementSibling?.tagName === "DL",
      label: tag.textContent,
      tag: { ...box(tag), color: ts.color, bg: ts.backgroundColor, radius: parseFloat(ts.borderTopLeftRadius), font: ts.fontFamily, size: parseFloat(ts.fontSize), weight: ts.fontWeight },
      name: { ...box(h2), font: hs.fontFamily, size: parseFloat(hs.fontSize), weight: hs.fontWeight },
      help: { ...box(help), el: help.tagName, type: help.type, text: help.textContent, describedBy: help.getAttribute("aria-describedby"), focused: document.activeElement === help },
      tip: { ...box(tip), id: tip.id, role: tip.getAttribute("role"), shown: ps.display !== "none" && ps.visibility !== "hidden" && tip.getBoundingClientRect().height > 0, text: tip.textContent, color: ps.color, bg: ps.backgroundColor, size: parseFloat(ps.fontSize) },
    };
  });
const centre = (b) => [Math.round((b.l + b.r) / 2), Math.round((b.t + b.b) / 2)];
const WHITE = "rgb(255, 255, 255)", BLACK = "rgb(0, 0, 0)", DARK_PINK = "rgb(194, 24, 91)";
const round = (o) => JSON.stringify(o, (k, v) => (typeof v === "number" ? Math.round(v) : v));
// The open tooltip is on screen, inside the panel's width, and has not resized the panel.
function checkTipFits(t, closed) {
  check("tooltip: black background, white text", t.tip.bg === BLACK && t.tip.color === WHITE, `${t.tip.bg} / ${t.tip.color}`);
  check("tooltip is inside the viewport", t.tip.l >= 0 && t.tip.t >= 0 && t.tip.r <= t.view.w && t.tip.b <= t.view.h && !t.pageScrollsSideways, `${round({ l: t.tip.l, t: t.tip.t, r: t.tip.r, b: t.tip.b })} in ${t.view.w}x${t.view.h}`);
  check("tooltip is a readable width, inside the panel", t.tip.l >= t.panel.l && t.tip.r <= t.panel.r && t.tip.w >= 220 && t.tip.w <= 360, `${Math.round(t.tip.w)} px`);
  check("tooltip opens below the tag, not over it or the name", t.tip.t >= t.tag.b && t.tip.t >= t.help.b);
  check("the panel keeps its size and does not scroll", Math.abs(t.panel.h - closed.panel.h) < 0.5 && Math.abs(t.panel.w - closed.panel.w) < 0.5 && !["auto", "scroll"].includes(t.panelOverflow), `${Math.round(t.panel.w)}x${Math.round(t.panel.h)}, overflow ${t.panelOverflow}`);
}

// ---- desktop ----
console.log("\nDesktop (1280x860), fixture tagging the Vrishabhavati and the Koyna:");
const desk = await openPage({ width: 1280, height: 860 }, fixture);
{
  const { page } = desk;
  // the file is only asked for when the first panel opens, so the fixture can be filled in from the map
  const ko = await locate(page, "Koyna", [73.85, 17.4], 9);
  const vr = await locate(page, "Vrishabhavati", [77.565, 12.985], 13);
  check("both rivers are on the map", !!ko && !!vr);
  if (ko && vr) {
    Object.assign(fixture.rivers, { [vr.uid]: 0, [ko.uid]: 1 });
    await page.mouse.move(vr.x, vr.y);
    await wait(400);
    await page.mouse.click(vr.x, vr.y);
    await page.waitForSelector(".panel .naturality", { timeout: 10000 }).catch(() => {});
    await wait(500);
    const t = await readTag(page);
    check("the file is asked for under the site's base path", desk.asked.length === 1 && desk.asked[0] === `${BASE}/river-naturality.json`, desk.asked.join(", "));
    check("panel opens on the Vrishabhavati", t.open && t.heading === "Vrishabhavati", t.heading);
    check("a tagged river shows the tag", t.tagged);
    if (t.tagged) {
      check("tag reads 'Doubtful naturality'", t.label === "Doubtful naturality", t.label);
      check("tag is directly below the name, above the rows", t.afterName && t.beforeRows && t.tag.t >= t.name.b - 1 && t.tag.t - t.name.b < 12, `${Math.round(t.tag.t - t.name.b)} px below`);
      check("tag: white text on dark pink", t.tag.color === WHITE && t.tag.bg === DARK_PINK, `${t.tag.color} on ${t.tag.bg}`);
      check("tag has fully rounded ends", t.tag.radius >= t.tag.h / 2, `radius ${t.tag.radius}, height ${Math.round(t.tag.h)}`);
      check("tag: the name's font, smaller", t.tag.font === t.name.font && t.tag.weight === t.name.weight && t.tag.size < t.name.size, `${t.tag.size}px against ${t.name.size}px`);
      check("help icon is a round '?' button beside the tag", t.help.el === "BUTTON" && t.help.type === "button" && t.help.text === "?" && Math.abs(t.help.w - t.help.h) < 0.5 && t.help.l >= t.tag.r && t.help.t < t.tag.b && t.help.b > t.tag.t, round(t.help));
      const ax = await page.accessibility.snapshot({ root: await page.$(".naturality-help"), interestingOnly: false });
      check("assistive tech sees a named button, described by the text", ax?.role === "button" && ax.name === "About doubtful naturality" && ax.description === SEED[0] && t.help.describedBy === t.tip.id && t.tip.role === "tooltip", JSON.stringify({ role: ax?.role, name: ax?.name, description: ax?.description?.slice(0, 40) }));
      check("tooltip is hidden until asked for", !t.tip.shown);
      check("the panel does not scroll and fits the screen", !t.panelScrolls && !["auto", "scroll"].includes(t.panelOverflow) && t.panel.r <= t.view.w && t.panel.b <= t.view.h, `${Math.round(t.panel.w)}x${Math.round(t.panel.h)}`);

      console.log("  hover:");
      await page.mouse.move(...centre(t.help));
      await wait(300);
      const h = await readTag(page);
      check("hovering the icon shows the tooltip", h.tip.shown);
      check("with this river's text", h.tip.text === SEED[0], h.tip.text.slice(0, 50));
      checkTipFits(h, t);
      await page.screenshot({ path: `${OUT}/50-naturality-desktop.png` });
      await page.mouse.move(Math.round((h.tip.l + h.tip.r) / 2), Math.round(h.tip.t + 20), { steps: 12 });
      await wait(200);
      check("it stays while the pointer moves onto it", (await readTag(page)).tip.shown);
      await page.mouse.move(700, 500, { steps: 4 });
      await wait(300);
      check("moving away hides it", !(await readTag(page)).tip.shown);

      console.log("  keyboard:");
      await page.focus(".panel-close");
      await page.keyboard.press("Tab");
      await wait(200);
      const f = await readTag(page);
      check("Tab from the close button reaches the icon", f.help.focused);
      check("focus shows the tooltip", f.tip.shown && f.tip.text === SEED[0]);
      await page.keyboard.press("Escape");
      await wait(150);
      check("Escape hides it", !(await readTag(page)).tip.shown);
      await page.keyboard.press("Enter");
      await wait(150);
      check("Enter shows it again", (await readTag(page)).tip.shown);
      await page.evaluate(() => document.activeElement.blur());
      await wait(150);
      check("leaving the icon hides it", !(await readTag(page)).tip.shown);

      console.log("  click:");
      await page.mouse.click(...centre(t.help));
      await page.mouse.move(700, 500, { steps: 4 });
      await wait(300);
      check("a click keeps it open after the pointer leaves", (await readTag(page)).tip.shown);
      await page.mouse.click(...centre(t.name));
      await wait(200);
      check("a click elsewhere hides it", !(await readTag(page)).tip.shown);
    }

    console.log("  other rivers:");
    const k = await locate(page, "Koyna", [73.85, 17.4], 9);
    await page.mouse.click(k.x, k.y);
    await wait(700);
    const kt = await readTag(page);
    check("the Koyna, tagged with the second text, shows the tag", kt.heading === "Koyna" && kt.tagged, kt.heading);
    if (kt.tagged) {
      check("its tooltip starts hidden", !kt.tip.shown);
      await page.mouse.move(...centre(kt.help));
      await wait(300);
      const kh = await readTag(page);
      check("and shows the second, long text", kh.tip.shown && kh.tip.text === LONG, `${kh.tip.text.split(/\s+/).length} words`);
      checkTipFits(kh, kt);
    }
    const u = await locate(page, "Ulhas", [73.15, 19.15], 9);
    await page.mouse.click(u.x, u.y);
    await wait(700);
    const ut = await readTag(page);
    check("the Ulhas, not tagged, shows no tag", ut.heading === "Ulhas" && !ut.tagged && ut.rows >= 3, ut.heading);
    check("no tooltip is left behind", await page.evaluate(() => !document.querySelector(".naturality-tip, .naturality-help")));
    check("the file was fetched once", desk.asked.length === 1, `${desk.asked.length} requests`);
  }
  check("no page errors", desk.errors.length === 0, desk.errors.join(" | ") || undefined);
  await page.close();
}

// ---- phone ----
console.log("\nPhone (375x740, touch), same fixture:");
{
  const { page, errors } = await openPage({ width: 375, height: 740, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, fixture);
  const vr = await locate(page, "Vrishabhavati", [77.565, 12.985], 13);
  check("Vrishabhavati is on screen", !!vr);
  if (vr) {
    await page.touchscreen.tap(vr.x, vr.y);
    await page.waitForSelector(".panel .naturality", { timeout: 10000 }).catch(() => {});
    await wait(500);
    const t = await readTag(page);
    check("a tap opens the panel, with the tag", t.open && t.heading === "Vrishabhavati" && t.tagged, t.heading);
    if (t.tagged) {
      check("tag: white text on dark pink, on one line", t.tag.color === WHITE && t.tag.bg === DARK_PINK && t.tag.h < 30, `${Math.round(t.tag.w)}x${Math.round(t.tag.h)}`);
      check("tooltip is hidden until asked for", !t.tip.shown);
      check("the icon is big enough to tap", t.help.w >= 24 && t.help.h >= 24, `${Math.round(t.help.w)}x${Math.round(t.help.h)}`);
      const fits = await page.evaluate(() => {
        const b = (sel) => document.querySelector(sel).getBoundingClientRect();
        const p = b(".panel"), z = b(".maplibregl-ctrl-top-right .maplibregl-ctrl-group"), s = b(".borders-toggle");
        const hit = (a, c) => a.left < c.right && c.left < a.right && a.top < c.bottom && c.top < a.bottom;
        return { onScreen: p.left >= 0 && p.top >= 0 && p.right <= innerWidth && p.bottom <= innerHeight, clear: !hit(p, z) && !hit(p, s) };
      });
      check("the panel fits the screen and does not scroll", fits.onScreen && !t.panelScrolls && !["auto", "scroll"].includes(t.panelOverflow), `${Math.round(t.panel.w)}x${Math.round(t.panel.h)}`);
      check("the panel keeps clear of the switches and zoom buttons", fits.clear);

      await page.touchscreen.tap(...centre(t.help));
      await wait(400);
      const o = await readTag(page);
      check("a tap on the icon shows the tooltip", o.tip.shown && o.tip.text === SEED[0], o.tip.text.slice(0, 50));
      checkTipFits(o, t);
      await page.screenshot({ path: `${OUT}/51-naturality-phone.png` });
      await page.touchscreen.tap(...centre(t.help));
      await wait(400);
      check("a second tap hides it", !(await readTag(page)).tip.shown);
      await page.touchscreen.tap(...centre(t.help));
      await wait(400);
      check("a third tap shows it again", (await readTag(page)).tip.shown);
      await page.touchscreen.tap(...centre(t.name));
      await wait(400);
      const c = await readTag(page);
      check("a tap elsewhere hides it, and the panel stays open", !c.tip.shown && c.open && c.heading === "Vrishabhavati");
    }
    // the long text, on the narrowest panel
    await page.evaluate(() => document.querySelector(".panel-close").click());
    const ko = await locate(page, "Koyna", [73.85, 17.4], 9);
    if (ko) {
      await page.touchscreen.tap(ko.x, ko.y);
      await wait(700);
      const kt = await readTag(page);
      check("the Koyna shows the tag", kt.heading === "Koyna" && kt.tagged, kt.heading);
      if (kt.tagged) {
        await page.touchscreen.tap(...centre(kt.help));
        await wait(400);
        const kh = await readTag(page);
        check("the long text shows", kh.tip.shown && kh.tip.text === LONG);
        checkTipFits(kh, kt);
        await page.screenshot({ path: `${OUT}/52-naturality-phone-long.png` });
      }
    }
  }
  check("no page errors", errors.length === 0, errors.join(" | ") || undefined);
  await page.close();
}

// ---- the real file, a missing file, a failed request ----
const real = JSON.parse(readFileSync("public/river-naturality.json", "utf8"));
for (const [title, answer] of [["The real river-naturality.json", undefined], ["river-naturality.json missing (404)", "404"], ["river-naturality.json fails to load", "fail"]]) {
  console.log(`\n${title}:`);
  const { page, errors, asked } = await openPage({ width: 1280, height: 860 }, answer);
  const vr = await locate(page, "Vrishabhavati", [77.565, 12.985], 13);
  check("Vrishabhavati is on screen", !!vr);
  if (vr) {
    await page.mouse.click(vr.x, vr.y);
    await wait(1500);
    const t = await readTag(page);
    check("the panel opens with its rows", t.open && t.heading === "Vrishabhavati" && t.rows >= 3, `${t.rows} rows`);
    if (answer === undefined) {
      // nothing is tagged yet; once rivers are, this still holds for whichever this one is
      const tagged = real.rivers[vr.uid] !== undefined;
      check(tagged ? "it is tagged in the real file, and shows the tag" : "it is not tagged in the real file, and shows no tag", t.tagged === tagged);
      const served = await page.evaluate((url) => fetch(url).then((r) => (r.ok ? r.text() : `HTTP ${r.status}`)), `${BASE}/river-naturality.json`);
      check("the site serves the published file", served === JSON.stringify(real), served.slice(0, 60));
    } else {
      check("the request was made and got no file", asked.length === 1);
      check("no tag is shown", !t.tagged);
      check("fun facts still show", await page.evaluate(() => document.querySelectorAll(".panel .fact").length > 0));
    }
    check("the panel does not scroll and fits the screen", !t.panelScrolls && t.panel.r <= t.view.w && t.panel.b <= t.view.h);
  }
  check("no page errors", errors.length === 0, errors.join(" | ") || undefined);
  await page.close();
}

await browser.close();
console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nALL CHECKS PASSED");
process.exit(failures ? 1 : 0);
