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
      const fuid = f.properties.uid;
      const parts = f.geometry.type === "LineString" ? [f.geometry.coordinates] : f.geometry.coordinates;
      for (const part of parts)
        for (const c of part) {
          const p = m.project(c);
          if (p.x < 20 || p.y < 20 || p.x > canvas.width - 20 || p.y > canvas.height - 20) continue;
          if (pr && p.x <= pr.right + 10 && p.y <= pr.bottom + 10) continue;
          const d = Math.hypot(p.x - cx, p.y - cy);
          if (d < bestD) { bestD = d; best = p; uid = fuid; }
        }
    }
    return best ? { x: Math.round(best.x), y: Math.round(best.y), uid } : null;
  }, name);
}

// An unnamed river is shown as "Unnamed river" and its uid.
const UNNAMED = /^Unnamed river \d+$/;

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

// --- 0. the border switches, as the page loads ------------------------------------
const BORDER_LAYERS = {
  external: ["border-intl-casing", "border-line-casing", "border-intl", "border-line"],
  states: ["border-state-casing", "border-state"],
};
const switches = () =>
  page.evaluate((layers) => {
    const box = document.querySelector(".borders-toggle");
    const ext = box?.querySelector('[data-border="external"]');
    const st = box?.querySelector('[data-border="states"]');
    if (!ext || !st) return null;
    const m = window.__map;
    const shown = (ids) => ids.filter((id) => m.getLayer(id) && m.getLayoutProperty(id, "visibility") !== "none");
    return {
      labels: [...box.querySelectorAll("label")].map((l) => l.textContent.trim()),
      roles: [ext.getAttribute("role"), st.getAttribute("role")],
      ext: ext.checked,
      st: st.checked,
      stDisabled: st.disabled,
      layersAdded: [...layers.external, ...layers.states].every((id) => !!m.getLayer(id)),
      extShown: shown(layers.external),
      stShown: shown(layers.states),
    };
  }, BORDER_LAYERS);
const setSwitch = async (which, on) => {
  const is = await page.$eval(`.borders-toggle [data-border="${which}"]`, (el) => el.checked);
  if (is !== on) await page.click(`.borders-toggle [data-border="${which}"]`);
  await new Promise((r) => setTimeout(r, 200));
};
// What assistive technology is told about a switch, from the browser's accessibility tree.
const axOf = async (which) => {
  const el = await page.$(`.borders-toggle [data-border="${which}"]`);
  const node = await page.accessibility.snapshot({ root: el, interestingOnly: false });
  return node ? { role: node.role, name: node.name, disabled: !!node.disabled, checked: node.checked } : null;
};

console.log("\nBorder switches at load:");
await page.waitForFunction(() => !!window.__map.getLayer("border-intl"), { timeout: 15000 }).catch(() => {});
{
  const sw = await switches();
  check("both switches are in the top-right corner", !!sw && (await page.evaluate(() => !!document.querySelector(".maplibregl-ctrl-top-right .borders-toggle"))));
  if (sw) {
    check("labels", sw.labels.join(" | ") === "Show external borders | Show state/UT borders", sw.labels.join(" | "));
    check("both are off", !sw.ext && !sw.st);
    check("state/UT switch is disabled while external is off", sw.stDisabled);
    const axE = await axOf("external"), axS = await axOf("states");
    check("assistive tech sees a labelled switch, off", axE?.role === "switch" && axE.name === "Show external borders" && !axE.disabled && !axE.checked, JSON.stringify(axE));
    check("assistive tech sees the state/UT switch as disabled", axS?.role === "switch" && axS.name === "Show state/UT borders" && axS.disabled, JSON.stringify(axS));
    check("border layers are in the map", sw.layersAdded);
    check("no border is drawn", sw.extShown.length === 0 && sw.stShown.length === 0, [...sw.extShown, ...sw.stShown].join(", "));
    const above = await page.evaluate(() => {
      const box = document.querySelector(".borders-toggle").getBoundingClientRect();
      const zoom = document.querySelector(".maplibregl-ctrl-zoom-in").getBoundingClientRect();
      return box.bottom <= zoom.top;
    });
    check("the switches sit above the zoom buttons", above);
    // a click on the disabled switch must do nothing
    await page.click('.borders-toggle [data-border="states"]').catch(() => {});
    const after = await switches();
    check("clicking the disabled switch does nothing", !after.st && !after.ext && after.stShown.length === 0);
  }
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
  check("Merges into is a link", koyna.panel.link === "Krishna", koyna.panel.link);
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
  check("link opens the Krishna panel", after.heading === "Krishna", after.heading);
  check("Krishna is now selected", kState.selected === true, JSON.stringify(kState));
  check("Koyna is no longer selected", !koynaState.selected, JSON.stringify(koynaState));
  check("Krishna shows its own mouth", after.rows["Mouth into"] === "Bay of Bengal", after.rows["Mouth into"]);
  await page.screenshot({ path: `${OUT}/22-followed-to-krishna.png` });
}

// --- 3. the longest descriptions still fit -------------------------------------
// Formers may appear in any order; only the set matters.
const formedBySet = (text) => (text ?? "").replace(/^Confluence of /, "").split(/, | and /).sort().join("+");

console.log("\nGanga (longest curated text):");
const ganga = await openRiver("Ganga", [84.5, 25.4], 6);
check("Ganga clickable", !!ganga);
if (ganga) {
  check("panel shows the Ganga, without 'River'", ganga.panel.heading === "Ganga", ganga.panel.heading);
  check("Formed by", formedBySet(ganga.panel.rows["Formed by"]) === "Alaknanda+Bhagirathi", ganga.panel.rows["Formed by"]);
  check("Formed at", ganga.panel.rows["Formed at"] === "Devprayag, Uttarakhand", ganga.panel.rows["Formed at"]);
  check("no Origin row on a confluence-formed river", !("Origin" in ganga.panel.rows) && !("Origin near" in ganga.panel.rows));
  check("panel does not scroll", !ganga.panel.scrolls, ganga.panel.size);
  check("panel fits the viewport", ganga.panel.fitsViewport);
  console.log(`  rows: ${Object.entries(ganga.panel.rows).map(([k, v]) => `${k}=${v}`).join(" | ")}`);
  await page.screenshot({ path: `${OUT}/23-ganga.png` });
}

// --- 4. formed by a confluence, detected automatically ---------------------------
console.log("\nMula-Mutha (formed by a confluence, no override):");
const mm = await openRiver("Mula-Mutha", [73.95, 18.53], 10);
check("Mula-Mutha clickable", !!mm);
if (mm) {
  check("Formed by", formedBySet(mm.panel.rows["Formed by"]) === "Mula+Mutha", mm.panel.rows["Formed by"]);
  check("Formed at", mm.panel.rows["Formed at"] === "Pune, Maharashtra", mm.panel.rows["Formed at"]);
  check("no Origin row", !("Origin" in mm.panel.rows) && !("Origin near" in mm.panel.rows));
  const links = await page.evaluate(() => [...document.querySelectorAll(".panel .river-link")].map((a) => a.textContent));
  check("each former is a link, plus the merge link", [...links].sort().join("|") === "Bhima|Mula|Mutha", links.join(" | "));
  await page.screenshot({ path: `${OUT}/26-mula-mutha.png` });

  await page.evaluate(() => [...document.querySelectorAll(".panel .river-link")].find((a) => a.textContent === "Mula")?.click());
  await new Promise((r) => setTimeout(r, 500));
  await settle();
  await new Promise((r) => setTimeout(r, 800));
  const mula = await readPanel();
  check("former link opens the Mula", mula.heading === "Mula", mula.heading);
  check("the Mula merges back into the Mula-Mutha", mula.rows["Merges into"] === "Mula-Mutha", mula.rows["Merges into"]);
}

// --- 5. the other ways a river can begin -----------------------------------------
console.log("\nPranhita (former found 3.8 km short of the start):");
const pr = await openRiver("Pranhitha", [79.95, 19.2], 9);
check("Pranhita clickable", !!pr);
if (pr) {
  check("Formed by", formedBySet(pr.panel.rows["Formed by"]) === "Wainganga+Wardha", pr.panel.rows["Formed by"]);
  check("no Origin row", !("Origin" in pr.panel.rows) && !("Origin near" in pr.panel.rows));
}

console.log("\nKatjuri/Kathajodi (distributary):");
const kj = await openRiver("Katjuri/Kathajodi", [85.95, 20.42], 11);
check("Katjuri clickable", !!kj);
if (kj) {
  check("Branched off from", kj.panel.rows["Branched off from"] === "Mahanadi", kj.panel.rows["Branched off from"]);
  check("it is a link", kj.panel.link === "Mahanadi", kj.panel.link);
  check("where it branches", kj.panel.rows["Branches off near"] === "Cuttack, Odisha", kj.panel.rows["Branches off near"]);
  check("no Origin row", !("Origin" in kj.panel.rows) && !("Origin near" in kj.panel.rows));
  await page.screenshot({ path: `${OUT}/27-katjuri.png` });
}

console.log("\nBhagirathi, West Bengal (leaves the Ganga 0.63 km off its centreline):");
const bh = await openRiver("Bhagirathi", [88.0, 24.6], 9);
check("Bhagirathi clickable", !!bh);
if (bh) {
  check("Branched off from the Ganga", bh.panel.rows["Branched off from"] === "Ganga", bh.panel.rows["Branched off from"]);
  check("at Farakka", /Farakka/.test(bh.panel.rows["Branches off near"] ?? ""), bh.panel.rows["Branches off near"]);
  check("no Origin row", !("Origin" in bh.panel.rows) && !("Origin near" in bh.panel.rows));
}

console.log("\nTorsa (enters India from abroad):");
const to = await openRiver("Torsa", [89.45, 26.55], 9);
check("Torsa clickable", !!to);
if (to) {
  check("Origin", to.panel.rows["Origin"] === "Chumbi Valley, Tibet, China", to.panel.rows["Origin"]);
  check("Flows through", to.panel.rows["Flows through"] === "Bhutan", to.panel.rows["Flows through"]);
  check("Enters India near", to.panel.rows["Enters India near"] === "Jaigaon, West Bengal", to.panel.rows["Enters India near"]);
  await page.screenshot({ path: `${OUT}/28-torsa.png` });
}

// Border audit corrections: a source misplaced abroad, a lake mistaken for a river from
// China, a river whose start the data puts in Nepal, and a uid the dataset reuses.
console.log("\nJaldhaka (rises in Sikkim, crosses Bhutan, re-enters India):");
const jd = await openRiver("Jaldhaka", [88.911, 26.587], 10);
check("Jaldhaka clickable", !!jd);
if (jd) {
  check("Origin", jd.panel.rows["Origin"] === "Bitang Lake near Kupup, Sikkim", jd.panel.rows["Origin"]);
  check("Flows through", jd.panel.rows["Flows through"] === "Bhutan", jd.panel.rows["Flows through"]);
  check("Enters India near", jd.panel.rows["Enters India near"] === "Bindu, West Bengal", jd.panel.rows["Enters India near"]);
}
console.log("\nTangtsa (starts in Pangong Tso, not in China):");
const tg = await openRiver("Tangtsa", [78.167, 34.038], 10);
check("Tangtsa clickable", !!tg);
if (tg) {
  check("Origin near", tg.panel.rows["Origin near"] === "Pangong Tso, Ladakh", tg.panel.rows["Origin near"]);
  check("not shown as entering India", !("Flows through" in tg.panel.rows) && !Object.keys(tg.panel.rows).some((k) => k.startsWith("Enters India")), Object.keys(tg.panel.rows).join(", "));
}
console.log("\nHardi (the data's own start point is in Nepal):");
const hd = await openRiver("Hardi", [85.778, 26.566], 11);
check("Hardi clickable", !!hd);
if (hd) {
  check("Origin near", /Nepal$/.test(hd.panel.rows["Origin near"] ?? hd.panel.rows["Origin"] ?? ""), hd.panel.rows["Origin near"] ?? hd.panel.rows["Origin"]);
  check("Enters India", Object.keys(hd.panel.rows).some((k) => k.startsWith("Enters India")), Object.keys(hd.panel.rows).join(", "));
}
console.log("\nKankai Nadi (its uid is shared with a stream in Uttarakhand):");
const kk = await openRiver("Kankai Nadi", [87.86, 26.217], 11);
check("Kankai Nadi clickable", !!kk);
if (kk) {
  const o = kk.panel.rows["Origin near"] ?? kk.panel.rows["Origin"] ?? "";
  check("origin is in Bihar", /Bihar$/.test(o), o);
}

const withSuffix = await page.evaluate(() =>
  window.__map.querySourceFeatures("rivers", { sourceLayer: "rivers" }).filter((f) => / River$/.test(f.properties.name)).length
);
check("no displayed name ends in 'River'", withSuffix === 0, `${withSuffix} features`);

// --- 6. hand-corrected names ----------------------------------------------------
// The dataset calls these "Malad Creek" and "Mahim"; both are corrected in
// data/river-overrides.json.
for (const [name, center, origin, mouth] of [
  ["Poisar", [72.865, 19.2], "Sanjay Gandhi National Park, Mumbai", "Malad Creek, opening to the sea at Versova, Mumbai"],
  ["Mithi", [72.8587, 19.0578], "Vihar Lake, Sanjay Gandhi National Park, Mumbai", "Mahim Creek, Mumbai"],
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

// --- 6b. rivers added from HydroRIVERS (data/added-rivers.json) -----------------------
console.log("\nBhogawati (added; CWC lacks it):");
const bg = await openRiver("Bhogawati", [75.776, 18.11], 10);
check("Bhogawati is on the map", !!bg);
if (bg) {
  check("Merges into", bg.panel.rows["Merges into"] === "Sina", bg.panel.rows["Merges into"]);
  check("Origin near", bg.panel.rows["Origin near"] === "Dharashiv, Maharashtra", bg.panel.rows["Origin near"]);
}
console.log("\nOshiwara (added; Mumbai):");
const os = await openRiver("Oshiwara", [72.843, 19.153], 13);
check("Oshiwara is on the map", !!os);
if (os) {
  check("Origin", os.panel.rows["Origin"] === "Aarey Milk Colony, Goregaon, Mumbai", os.panel.rows["Origin"]);
  check("Mouth into", os.panel.rows["Mouth into"] === "Arabian Sea", os.panel.rows["Mouth into"]);
  await page.screenshot({ path: `${OUT}/31-oshiwara.png` });
}

// Mumbai Metropolitan Region rivers traced from OpenStreetMap.
console.log("\nVakola Nala (joins the Mithi above Mahim Creek):");
const vk = await openRiver("Vakola Nala", [72.848, 19.085], 14);
check("Vakola Nala is on the map", !!vk);
if (vk) check("Merges into", vk.panel.rows["Merges into"] === "Mithi", vk.panel.rows["Merges into"]);
console.log("\nDesai Khadi (formed by two branches south of Ambernath):");
const dk = await openRiver("Desai Khadi", [73.106, 19.1554], 13);
check("Desai Khadi is on the map", !!dk);
if (dk) {
  check("Formed by", dk.panel.rows["Formed by"] === "Confluence of Desai Khadi (south branch) and Desai Khadi (north branch)" || dk.panel.rows["Formed by"] === "Confluence of Desai Khadi (north branch) and Desai Khadi (south branch)", dk.panel.rows["Formed by"]);
  check("Merges into", dk.panel.rows["Merges into"] === "Ulhas", dk.panel.rows["Merges into"]);
}
console.log("\nTrombay Creek (from Ghatkopar past the Deonar dumping ground; two mouths on Thane Creek):");
const un = await openRiver("Trombay Creek", [72.9175, 19.088], 14);
check("Trombay Creek runs through Ghatkopar", !!un);
if (un) {
  check("Origin", /Ghatkopar hills/.test(un.panel.rows["Origin"] ?? ""), un.panel.rows["Origin"]);
  check("Merges into Thane Creek", un.panel.rows["Merges into"] === "Thane Creek", JSON.stringify(un.panel.rows));
  check("Confluence is the southern mouth, by the Vashi Bridge", /Thane Creek at Mankhurd/.test(un.panel.rows["Confluence"] ?? ""), un.panel.rows["Confluence"]);
}
const tcs = await openRiver("Trombay Creek", [72.95, 19.063], 14);
check("Trombay Creek reaches its southern mouth", !!tcs);
const tcn = await openRiver("Trombay Creek (northern mouth)", [72.951, 19.0765], 14);
check("the northern mouth is on the map", !!tcn);
if (tcn) {
  check("Branched off from", tcn.panel.rows["Branched off from"] === "Trombay Creek", JSON.stringify(tcn.panel.rows));
  check("Merges into Thane Creek", tcn.panel.rows["Merges into"] === "Thane Creek", JSON.stringify(tcn.panel.rows));
  check("no Origin row", !("Origin" in tcn.panel.rows) && !("Origin near" in tcn.panel.rows), Object.keys(tcn.panel.rows).join(", "));
}
console.log("\nThane Creek (a branch of the Ulhas, from Kasheli to Mumbai Harbour):");
const tk = await openRiver("Thane Creek", [72.975, 19.09], 12);
check("Thane Creek is on the map", !!tk);
if (tk) {
  check("Branched off from", tk.panel.rows["Branched off from"] === "Ulhas", JSON.stringify(tk.panel.rows));
  check("Branches off at Kasheli", /Kasheli/.test(tk.panel.rows["Branches off"] ?? ""), tk.panel.rows["Branches off"]);
  check("Mouth", /Mumbai Harbour/.test(tk.panel.rows["Mouth"] ?? ""), tk.panel.rows["Mouth"]);
  check("about 26 km", /^26\.\d km$/.test(tk.panel.rows["Length"]), tk.panel.rows["Length"]);
  check("no Origin row", !("Origin" in tk.panel.rows) && !("Origin near" in tk.panel.rows), Object.keys(tk.panel.rows).join(", "));
}
const tku = await openRiver("Thane Creek", [72.99, 19.205], 13);
check("Thane Creek runs up past Thane to the Ulhas", !!tku);
console.log("\nSomaiyya Nalla (joins the Trombay Creek before Thane Creek):");
const sn = await openRiver("Somaiyya Nalla", [72.9103, 19.07], 14);
check("Somaiyya Nalla is on the map", !!sn);
if (sn) check("Merges into", sn.panel.rows["Merges into"] === "Trombay Creek", sn.panel.rows["Merges into"]);

// Mumbai region stream network (review/mumbai-streams.md).
console.log("\nThane Creek, west bank (Salsette):");
const npn = await openRiver("Nane Pada Nalla", [72.9524, 19.1639], 14);
check("Nane Pada Nalla is on the map", !!npn);
if (npn) {
  check("it merges into Thane Creek", npn.panel.rows["Merges into"] === "Thane Creek", JSON.stringify(npn.panel.rows));
  check("it meets the creek at Mulund East", /Mulund East/.test(npn.panel.rows["Confluence"] ?? ""), npn.panel.rows["Confluence"]);
}
const bdp = await openRiver("", [72.9356, 19.1392], 15);
check("the Bhandup stream is on the map", !!bdp);
if (bdp) check("it rises in Bhandup West and merges into Thane Creek", bdp.panel.heading === `Unnamed river ${bdp.pt.uid}` && /Bhandup West/.test(bdp.panel.rows["Origin"] ?? "") && bdp.panel.rows["Merges into"] === "Thane Creek", JSON.stringify(bdp.panel.rows));
const mkd = await openRiver("", [72.9251, 19.0504], 15);
check("the Mankhurd stream is on the map", !!mkd);
if (mkd) check("it merges into the Trombay Creek", mkd.panel.rows["Merges into"] === "Trombay Creek", JSON.stringify(mkd.panel.rows));
console.log("\nThane Creek, east bank (Navi Mumbai) and the Panvel Creek side:");
const gh = await openRiver("", [72.9992, 19.1118], 15);
check("the Rabale-Ghansoli stream is on the map", !!gh);
if (gh) check("it rises below the Parsik hills and merges into Thane Creek", /Parsik hills/.test(gh.panel.rows["Origin"] ?? "") && gh.panel.rows["Merges into"] === "Thane Creek" && /Ghansoli/.test(gh.panel.rows["Confluence"] ?? ""), JSON.stringify(gh.panel.rows));
const khg = await openRiver("", [73.0642, 19.0499], 15);
check("the Kharghar stream is on the map", !!khg);
if (khg) check("it merges into the Kasadi, just below the Taloje", khg.panel.rows["Merges into"] === "Kasadi" && /Kasadi at Kharghar/.test(khg.panel.rows["Confluence"] ?? ""), JSON.stringify(khg.panel.rows));
console.log("\nTaloje (two branches in Taloja MIDC; takes in the Bava Malang; joins the Kasadi):");
const tlj = await openRiver("Taloje", [73.1431, 19.0861], 15);
check("the Taloje runs through Taloja MIDC", !!tlj);
if (tlj) {
  check("it rises east of Taloja MIDC", /east of Taloja MIDC/.test(tlj.panel.rows["Origin"] ?? ""), tlj.panel.rows["Origin"]);
  check("it merges into the Kasadi", tlj.panel.rows["Merges into"] === "Kasadi" && /Kharghar and Kalamboli/.test(tlj.panel.rows["Confluence"] ?? ""), JSON.stringify(tlj.panel.rows));
}
const tljLow = await openRiver("Taloje", [73.0903, 19.0599], 15);
check("the creek below Taloja, down to the Kasadi, is the Taloje", !!tljLow && tljLow.panel.heading === "Taloje", tljLow?.panel.heading);
check("the Bava Malang no longer runs down that creek", !(await pixelOf("Bava Malang")));
const tljN = await openRiver("Taloje (northern branch)", [73.1323, 19.0953], 15);
check("the Taloje's northern branch is on the map", !!tljN);
if (tljN) check("it merges into the Taloje, east of MIDC Road", tljN.panel.rows["Merges into"] === "Taloje" && /just east of MIDC Road/.test(tljN.panel.rows["Confluence"] ?? ""), JSON.stringify(tljN.panel.rows));
const bvm = await openRiver("Bava Malang", [73.1191, 19.1116], 14);
check("the Bava Malang is clickable above Taloja", !!bvm);
if (bvm) {
  check("it merges into the Taloje at Taloja", bvm.panel.rows["Merges into"] === "Taloje" && /Taloje at Taloja/.test(bvm.panel.rows["Confluence"] ?? ""), JSON.stringify(bvm.panel.rows));
  check("it keeps its fun fact", (await page.evaluate(() => document.querySelectorAll(".panel .fact").length)) === 1);
}
console.log("\nMogara Nallah (carried up to its head in Azad Nagar, Andheri West):");
const mog = await openRiver("Mogara Nallah", [72.8391, 19.1273], 15);
check("the Mogara Nallah runs through Azad Nagar", !!mog);
if (mog) {
  check("it rises at Azad Nagar", mog.panel.rows["Origin"] === "Azad Nagar, Andheri West, Mumbai", JSON.stringify(mog.panel.rows));
  check("about 4 km", /^4\.[12] km$/.test(mog.panel.rows["Length"]), mog.panel.rows["Length"]);
}
console.log("\nMira-Bhayandar (to Vasai Creek and Manori Creek):");
const kmr = await openRiver("", [72.8826, 19.2804], 15);
check("the Kashimira stream is on the map", !!kmr);
if (kmr) check("it merges into the Ulhas at Vasai Creek", kmr.panel.rows["Merges into"] === "Ulhas" && /Vasai Creek/.test(kmr.panel.rows["Confluence"] ?? ""), JSON.stringify(kmr.panel.rows));
const byr = await openRiver("", [72.8519, 19.2799], 15);
check("the Bhayandar stream is on the map", !!byr);
if (byr) check("it merges into the Dahisar at Manori Creek", byr.panel.rows["Merges into"] === "Dahisar" && /Manori Creek/.test(byr.panel.rows["Confluence"] ?? ""), JSON.stringify(byr.panel.rows));
console.log("\nThe rest of the Mumbai region:");
const osb = await openRiver("", [72.8578, 19.1372], 15);
check("the Oshiwara's southern branch is on the map", !!osb);
if (osb) check("it merges into the Oshiwara", osb.panel.rows["Merges into"] === "Oshiwara", JSON.stringify(osb.panel.rows));
const kam = await openRiver("", [72.9012, 19.3582], 14);
check("the river through Kaman is on the map", !!kam);
if (kam) check("it rises in the Tungareshwar hills and merges into the Ulhas at Vasai Creek", /Tungareshwar/.test(kam.panel.rows["Origin"] ?? "") && kam.panel.rows["Merges into"] === "Ulhas" && /Vasai Creek/.test(kam.panel.rows["Confluence"] ?? ""), JSON.stringify(kam.panel.rows));
const wal = await openRiver("Waldhuni", [73.188, 19.1427], 14);
check("the Waldhuni runs up to the hills above Kakuli Lake", !!wal);
if (wal) check("the Waldhuni rises in the Malanggad foothills", /Malanggad foothills/.test(wal.panel.rows["Origin"] ?? "") && wal.panel.rows["Merges into"] === "Ulhas", JSON.stringify(wal.panel.rows));
const kye = await openRiver("", [73.1479, 19.2195], 15);
check("the Kalyan East stream is on the map", !!kye);
if (kye) check("it merges into the Waldhuni", kye.panel.rows["Merges into"] === "Waldhuni", JSON.stringify(kye.panel.rows));
const nhv = await openRiver("Nhava Creek", [72.9925, 18.9482], 14);
check("Nhava Creek is on the map", !!nhv);
if (nhv) check("Nhava Creek reaches Mumbai Harbour", nhv.panel.rows["Mouth into"] === "Arabian Sea" && /Mumbai Harbour/.test(nhv.panel.rows["Mouth"] ?? ""), JSON.stringify(nhv.panel.rows));
const val = await openRiver("", [73.0276, 19.242], 15);
check("the stream from Val, south-west of Bhiwandi, is on the map", !!val);
if (val) check("it merges into the Ulhas", val.panel.rows["Merges into"] === "Ulhas", JSON.stringify(val.panel.rows));
const ulw = await openRiver("Ulwe", [73.0496, 18.98], 14);
check("the Ulwe runs along the south side of the Navi Mumbai airport", !!ulw);
if (ulw) check("the Ulwe reaches Moha Creek south of Targhar", ulw.panel.rows["Mouth into"] === "Arabian Sea" && /Moha Creek, south of Targhar/.test(ulw.panel.rows["Mouth"] ?? "") && /Hills south of Panvel/.test(ulw.panel.rows["Origin"] ?? ""), JSON.stringify(ulw.panel.rows));
console.log("\nChhoti Yamuna (leaves the Yamuna and rejoins it):");
const cy = await openRiver("Chhoti Yamuna", [77.0638, 29.4398], 11);
check("Chhoti Yamuna clickable", !!cy);
if (cy) {
  check("Branched off from", cy.panel.rows["Branched off from"] === "Yamuna", cy.panel.rows["Branched off from"]);
  check("no Origin row", !("Origin" in cy.panel.rows) && !("Origin near" in cy.panel.rows), Object.keys(cy.panel.rows).join(", "));
}
console.log("\nMain Drain No 8 / Najafgarh Drain (one channel renamed, no confluence):");
const md = await openRiver("Main Drain No 8", [76.5443, 28.8666], 10);
check("Main Drain No 8 clickable", !!md);
if (md) check("Continues to", md.panel.rows["Continues to"] === "Najafgarh Drain", JSON.stringify(md.panel.rows));
const nj = await openRiver("Najafgarh Drain", [76.9674, 28.514], 10);
check("Najafgarh Drain clickable", !!nj);
if (nj) check("Continues from", nj.panel.rows["Continues from"] === "Main Drain No 8", JSON.stringify(nj.panel.rows));

console.log("\nChandansar (Virar, joins the Vaitarna):");
const cs = await openRiver("Chandansar", [72.837, 19.48], 14);
check("Chandansar is on the map", !!cs);
if (cs) check("Merges into", cs.panel.rows["Merges into"] === "Vaitarna", cs.panel.rows["Merges into"]);

console.log("\nKhari (Gujarat; the data repeats its source as its end point):");
const kh = await openRiver("Khari", [72.734, 23.0595], 11);
check("Khari is on the map", !!kh);
if (kh) {
  check("Merges into", kh.panel.rows["Merges into"] === "Sabarmati", kh.panel.rows["Merges into"]);
  check("Confluence", kh.panel.rows["Confluence"] === "Vautha, south of Ahmedabad, Gujarat", JSON.stringify(kh.panel.rows));
}

console.log("\nTerhi (recorded backwards: leaves the Sarju, joins the Ghaghara):");
const th = await openRiver("Terhi", [82.0, 27.1], 9);
check("Terhi is on the map", !!th);
if (th) {
  check("Branched off from", th.panel.rows["Branched off from"] === "Sarju", JSON.stringify(th.panel.rows));
  check("Merges into", /^Ghaghara/.test(th.panel.rows["Merges into"] ?? ""), th.panel.rows["Merges into"]);
}

console.log("\nPowai Lake overflow (unnamed, into the Mithi):");
const pw = await openRiver("", [72.8987, 19.1302], 16.5);
check("Powai channel is on the map", !!pw);
if (pw) {
  check("Origin", pw.panel.rows["Origin"] === "Powai Lake, Mumbai", JSON.stringify(pw.panel.rows));
  check("Merges into", pw.panel.rows["Merges into"] === "Mithi", pw.panel.rows["Merges into"]);
}

console.log("\nJojri and Mithari or Jojri (CWC stops both short of the Luni):");
for (const [name, center, zoom, conf] of [
  ["Jojri", [72.9, 26.15], 10, "Balotra, Rajasthan"],
  ["Mithari or Jojri", [73.5, 26.4], 10, "25 km SE of Jodhpur, Rajasthan"],
]) {
  const r = await openRiver(name, center, zoom);
  check(`${name} is on the map`, !!r);
  if (!r) continue;
  check("Merges into the Luni", /^Luni/.test(r.panel.rows["Merges into"] ?? ""), JSON.stringify(r.panel.rows));
  check("Confluence", (r.panel.rows["Confluence near"] ?? r.panel.rows["Confluence"]) === conf, r.panel.rows["Confluence near"] ?? r.panel.rows["Confluence"]);
}

console.log("\nKaveri delta (Vennar recorded backwards; Vellar is its lower course; Vettar branches off it):");
const vn = await openRiver("Vennar", [79.15, 10.8], 10);
check("Vennar is on the map", !!vn);
if (vn) {
  check("Branched off from", /^Cauvery/.test(vn.panel.rows["Branched off from"] ?? ""), JSON.stringify(vn.panel.rows));
  check("Continues to", vn.panel.rows["Continues to"] === "Vellar", vn.panel.rows["Continues to"]);
}
const vl = await openRiver("Vellar", [79.68, 10.7], 11);
if (vl) check("Vellar continues from the Vennar", vl.panel.rows["Continues from"] === "Vennar", JSON.stringify(vl.panel.rows));
const vt = await openRiver("Vettar", [79.4, 10.85], 10);
if (vt) check("Vettar branched off from the Vennar", vt.panel.rows["Branched off from"] === "Vennar", JSON.stringify(vt.panel.rows));

console.log("\nHyderabad nalas (Musi tributaries through Hussain Sagar):");
const kn = await openRiver("Kukatpally Nala", [78.47, 17.49], 13);
check("Kukatpally Nala is on the map", !!kn);
if (kn) check("Continues to the Surplus Nala", kn.panel.rows["Continues to"] === "Hussain Sagar Surplus Nala", JSON.stringify(kn.panel.rows));
const hsn = await openRiver("Hussain Sagar Surplus Nala", [78.497, 17.405], 14);
if (hsn) check("Surplus Nala merges into the Musi", hsn.panel.rows["Merges into"] === "Musi", JSON.stringify(hsn.panel.rows));
const pk = await openRiver("Picket Nala", [78.49, 17.465], 13);
if (pk) check("Picket Nala merges into the Surplus Nala", pk.panel.rows["Merges into"] === "Hussain Sagar Surplus Nala", JSON.stringify(pk.panel.rows));
// Greater Hyderabad stream network (review/hyderabad-streams.md).
console.log("\nGreater Hyderabad stream network: the Hussain Sagar catchment:");
const bkp = await openRiver("Balkapur Nala", [78.452, 17.408], 14);
check("Balkapur Nala is on the map", !!bkp);
if (bkp) check("it ends at Hussain Sagar and merges into the Kukatpally Nala", bkp.panel.rows["Merges into"] === "Kukatpally Nala" && /Hussain Sagar at Khairatabad/.test(bkp.panel.rows["Confluence"] ?? ""), JSON.stringify(bkp.panel.rows));
const fxs = await openRiver("", [78.471, 17.535], 14);
check("the stream that feeds Fox Sagar is on the map", !!fxs);
if (fxs) check("it ends at Fox Sagar and merges into the Kukatpally Nala", fxs.panel.heading === `Unnamed river ${fxs.pt.uid}` && fxs.panel.rows["Merges into"] === "Kukatpally Nala" && /Fox Sagar/.test(fxs.panel.rows["Confluence"] ?? ""), JSON.stringify(fxs.panel.rows));
console.log("\nGreater Hyderabad: the Musi and Esi headwaters and the west:");
const esi = await openRiver("Esi", [78.1711, 17.2459], 11);
check("the Esi (the dataset's \"Mosi\") is on the map under its own name", !!esi);
if (esi) check("the Esi merges into the Musi", esi.panel.rows["Merges into"] === "Musi", JSON.stringify(esi.panel.rows));
const kkp = await openRiver("", [78.3275, 17.3988], 14);
check("the Kokapet stream is on the map", !!kkp);
if (kkp) check("it rises in the Financial District and merges into the Musi", /Financial District/.test(kkp.panel.rows["Origin"] ?? "") && kkp.panel.rows["Merges into"] === "Musi", JSON.stringify(kkp.panel.rows));
const ktr = await openRiver("", [78.2648, 17.1609], 12);
check("the river through Kothur, from HydroRIVERS, is on the map", !!ktr);
if (ktr) check("it merges into the Esi", ktr.panel.rows["Merges into"] === "Esi", JSON.stringify(ktr.panel.rows));
const osv = await openRiver("", [78.2555, 17.3609], 13);
check("a stream that ends in Osman Sagar is on the map", !!osv);
if (osv) check("it merges into the Musi at Osman Sagar", osv.panel.rows["Merges into"] === "Musi" && /Osman Sagar/.test(osv.panel.rows["Confluence"] ?? ""), JSON.stringify(osv.panel.rows));
console.log("\nGreater Hyderabad: east and south, to the Musi in and below the city:");
const ocn = await openRiver("", [78.4911, 17.3434], 14);
check("the old city's nala through Yakutpura is on the map", !!ocn);
if (ocn) check("it merges into the Musi at Chaderghat", ocn.panel.rows["Merges into"] === "Musi" && /Chaderghat/.test(ocn.panel.rows["Confluence"] ?? ""), JSON.stringify(ocn.panel.rows));
const nch = await openRiver("", [78.5652, 17.4078], 14);
check("the Nacharam tank chain is on the map", !!nch);
if (nch) check("it rises at Nacharam Cheruvu and merges into the Musi", /Nacharam Cheruvu/.test(nch.panel.rows["Origin"] ?? "") && nch.panel.rows["Merges into"] === "Musi", JSON.stringify(nch.panel.rows));
const srn = await openRiver("", [78.5279, 17.3482], 14);
check("the Saroornagar valley, from HydroRIVERS, is on the map", !!srn);
if (srn) check("it merges into the Musi at Chaitanyapuri", srn.panel.rows["Merges into"] === "Musi" && /Chaitanyapuri/.test(srn.panel.rows["Confluence"] ?? ""), JSON.stringify(srn.panel.rows));
const abd = await openRiver("", [78.6885, 17.2992], 13);
check("the Abdullapurmet stream is on the map", !!abd);
if (abd) check("it merges into the Chinna Musi", /Chinna Musi/.test(abd.panel.rows["Merges into"] ?? ""), JSON.stringify(abd.panel.rows));
console.log("\nGreater Hyderabad: north and north-east:");
const chp = await openRiver("", [78.6123, 17.4752], 13);
check("the Cherlapally-Rampally tank chain is on the map", !!chp);
if (chp) check("it merges into the Ermulli Vagu at Ghatkesar", chp.panel.rows["Merges into"] === "Ermulli Vagu" && /Ghatkesar/.test(chp.panel.rows["Confluence"] ?? ""), JSON.stringify(chp.panel.rows));
const kpr = await openRiver("", [78.5615, 17.4901], 14);
check("the Kapra valley, from HydroRIVERS, is on the map", !!kpr);
if (kpr) check("it rises at Yapral and merges into the Cherlapally stream", /Yapral/.test(kpr.panel.rows["Origin"] ?? "") && UNNAMED.test(kpr.panel.rows["Merges into"]), JSON.stringify(kpr.panel.rows));
if (kpr) {
  // the "Merges into" link to an unnamed river carries that river's uid, in its text too
  const l = await page.evaluate(() => {
    const a = document.querySelector(".panel .river-link");
    return a ? { text: a.textContent, uid: a.getAttribute("href").replace("#river-", "") } : null;
  });
  check("a link to an unnamed river reads Unnamed river <its uid>", !!l && l.text === `Unnamed river ${l.uid}`, JSON.stringify(l));
  check("the unnamed river's own heading reads Unnamed river <its uid>", kpr.panel.heading === `Unnamed river ${kpr.pt.uid}`, kpr.panel.heading);
  await page.click(".panel .river-link");
  await new Promise((r) => setTimeout(r, 500));
  await settle();
  await new Promise((r) => setTimeout(r, 800));
  const to = await readPanel();
  check("following it opens a panel headed the same way", to.heading === l.text, to.heading);
}
const khd = await openRiver("Koyna", [73.85, 17.4], 9);
if (khd) check("a named river's heading is unchanged", khd.panel.heading === "Koyna", khd.panel.heading);
const mdc = await openRiver("", [78.4852, 17.6596], 13);
check("the valley north of Medchal is on the map", !!mdc);
if (mdc) check("it merges into the Shamirpet Vagu", mdc.panel.rows["Merges into"] === "Shamirpet Vagu", JSON.stringify(mdc.panel.rows));
console.log("\nGreater Hyderabad: outer areas (the Manjira side):");
const amp = await openRiver("", [78.326, 17.5177], 14);
check("the stream from Ameenpur Lake is on the map", !!amp);
if (amp) check("it rises at Ameenpur Lake", /Ameenpur Lake/.test(amp.panel.rows["Origin"] ?? "") && UNNAMED.test(amp.panel.rows["Merges into"]), JSON.stringify(amp.panel.rows));
const sul = await openRiver("", [78.3069, 17.5513], 14);
check("the Sultanpur stream is on the map", !!sul);
if (sul) check("it merges into the Pamla Vagu", sul.panel.rows["Merges into"] === "Pamla Vagu", JSON.stringify(sul.panel.rows));
const nsp = await openRiver("", [78.2286, 17.737], 12);
check("the valley from Narsapur, beyond the metro area, is on the map", !!nsp);
if (nsp) check("it merges into the Manjra", /Manj/.test(nsp.panel.rows["Merges into"] ?? ""), JSON.stringify(nsp.panel.rows));

console.log("\nBengaluru valleys (KC to Bellandur and Varthur; Hebbal to Yellamallappa Chetty):");
const k100 = await openRiver("Koramangala Valley (K-100)", [77.615, 12.94], 13);
check("K-100 is on the map", !!k100);
if (k100) check("K-100 continues below Bellandur", UNNAMED.test(k100.panel.rows["Continues to"]), JSON.stringify(k100.panel.rows));
const c100 = await openRiver("Challaghatta Valley (C-100)", [77.635, 12.975], 13);
if (c100) check("C-100 merges into the Bellandur outflow", UNNAMED.test(c100.panel.rows["Merges into"]), JSON.stringify(c100.panel.rows));
const bd = await openRiver("Hebbal Valley (BD-423)", [77.755, 13.008], 13);
if (bd) check("BD-423 merges into the Dakshina Pinakini", /Dakshina Pinakini/.test(bd.panel.rows["Merges into"] ?? ""), JSON.stringify(bd.panel.rows));

console.log("\nVrishabhavati (from Malleshwaram, on to the Arkavati) and its branches:");
const vr = await openRiver("Vrishabhavati", [77.565, 12.985], 13);
check("Vrishabhavati runs through the old city", !!vr);
if (vr) {
  check("rises near Sankey Tank", /Sankey Tank/.test(vr.panel.rows["Origin"] ?? ""), JSON.stringify(vr.panel.rows));
  check("merges into the Arkavati", vr.panel.rows["Merges into"] === "Arkavati", JSON.stringify(vr.panel.rows));
}
const nt = await openRiver("Nagarbhavi Thorai", [77.527, 12.99], 13);
check("Nagarbhavi Thorai is on the map", !!nt);
if (nt) check("Nagarbhavi Thorai merges into the Vrishabhavati", nt.panel.rows["Merges into"] === "Vrishabhavati", JSON.stringify(nt.panel.rows));
const sv = await openRiver("Suvarnamukhi", [77.47, 12.72], 11);
if (sv) check("Suvarnamukhi merges into the Vrishabhavati", sv.panel.rows["Merges into"] === "Vrishabhavati", JSON.stringify(sv.panel.rows));

console.log("\nBengaluru stream network (tributaries assembled from OSM):");
const kg = await openRiver("Kathriguppe", [77.545, 12.93], 13);
check("Kathriguppe is on the map", !!kg);
if (kg) check("Kathriguppe merges into the Vrishabhavati", kg.panel.rows["Merges into"] === "Vrishabhavati", JSON.stringify(kg.panel.rows));
const so = await openRiver("Sonnenahalli", [77.495, 12.955], 13);
if (so) check("Sonnenahalli merges into the Vrishabhavati", so.panel.rows["Merges into"] === "Vrishabhavati", JSON.stringify(so.panel.rows));
const v300 = await openRiver("Vrishabhavati Valley (V-300)", [77.545, 12.936], 14);
if (v300) check("V-300 merges into the Kathriguppe", v300.panel.rows["Merges into"] === "Kathriguppe", JSON.stringify(v300.panel.rows));
const k209 = await openRiver("Koramangala Valley (K-209)", [77.61, 12.915], 13);
check("K-209 (the Madiwala lake chain) is on the map", !!k209);
if (k209) check("K-209 merges into K-100", k209.panel.rows["Merges into"] === "Koramangala Valley (K-100)", JSON.stringify(k209.panel.rows));
const h400 = await openRiver("Hebbal Valley (H-400)", [77.645, 13.02], 13);
check("H-400 is on the map", !!h400);
if (h400) check("H-400 merges into H-300", h400.panel.rows["Merges into"] === "Hebbal Valley (H-300)", JSON.stringify(h400.panel.rows));
const yj = await openRiver("", [77.588, 13.118], 14);
check("the Yelahanka-Jakkur stream is on the map", !!yj);
if (yj) check("it merges into H-200 below Nagavara", yj.panel.heading === `Unnamed river ${yj.pt.uid}` && yj.panel.rows["Merges into"] === "Hebbal Valley (H-200)", JSON.stringify(yj.panel.rows));
const ec = await openRiver("", [77.708, 12.868], 14);
check("the Huskur lake-chain stream is on the map", !!ec);
if (ec) check("it merges into the Chinnar", /Chinnar/.test(ec.panel.rows["Merges into"] ?? ""), JSON.stringify(ec.panel.rows));
const dj = await openRiver("", [77.66, 13.186], 14);
check("the Doddajala stream is on the map", !!dj);
if (dj) check("it merges into the Dakshina Pinakini", /Dakshina Pinakini/.test(dj.panel.rows["Merges into"] ?? ""), JSON.stringify(dj.panel.rows));
// beyond the district: valleys drawn from HydroRIVERS
const bs = await openRiver("", [77.392, 12.86], 13);
check("the Bidadi valley, outside the district, is on the map", !!bs);
if (bs) check("it merges into the Vrishabhavati", bs.panel.rows["Merges into"] === "Vrishabhavati", JSON.stringify(bs.panel.rows));

console.log("\nFun facts and feature switches:");
const mu = await openRiver("Musi", [78.47, 17.37], 10);
check("Musi is on the map", !!mu);
if (mu) {
  const f = await page.evaluate(() => ({ head: document.querySelector(".panel .fact-heading")?.textContent, text: document.querySelector(".panel .fact")?.textContent ?? "" }));
  check("Fun Facts section shown", f.head === "Fun Facts" && f.text.length > 40, f.text.slice(0, 60));
}
const dh = await openRiver("Dahisar", [72.86, 19.22], 13);
if (dh) check("Dahisar shows two fun facts", (await page.evaluate(() => document.querySelectorAll(".panel .fact").length)) === 2);
// a fact can link another river: the Kali's, above Gunji, names the Kuthi Yankti
const kl = await openRiver("Kali", [80.89, 30.2], 12);
check("the Kali above Gunji is on the map", !!kl);
if (kl) {
  const link = await page.evaluate(() => document.querySelector(".panel .fact a.river-link")?.textContent);
  check("its fun fact links the Kuthi Yankti", link === "Kuthi Yankti", link);
  await page.evaluate(() => document.querySelector(".panel .fact a.river-link")?.click());
  await new Promise((r) => setTimeout(r, 500));
  await settle();
  await new Promise((r) => setTimeout(r, 800));
  const to = await readPanel();
  check("the link opens the Kuthi Yankti", to.heading === "Kuthi Yankti", to.heading);
}
check("basins switch hidden by default", await page.evaluate(() => !document.querySelector(".basins-toggle")));

// --- 6c. borders ----------------------------------------------------------------
// Border features of one kind actually on screen, plus a vertex of one of them (the one
// nearest the centre) to zoom in on next: the lines are found from the data itself, so
// this does not depend on where any border happens to run.
async function rendered(layer) {
  return page.evaluate((layer) => {
    const m = window.__map;
    const c = m.getCanvas().getBoundingClientRect();
    const feats = m.getLayer(layer) ? m.queryRenderedFeatures({ layers: [layer] }) : [];
    let best = null, bestD = Infinity;
    for (const f of feats) {
      const parts = f.geometry.type === "LineString" ? [f.geometry.coordinates] : f.geometry.coordinates;
      for (const part of parts)
        for (const pt of part) {
          const p = m.project(pt);
          const d = Math.hypot(p.x - c.width / 2, p.y - c.height / 2);
          if (d < bestD) { bestD = d; best = pt; }
        }
    }
    return { n: feats.length, kinds: [...new Set(feats.map((f) => f.properties.kind))].sort().join(","), near: best };
  }, layer);
}
async function drawnAtZooms(layer, kind) {
  let center = [80, 23];
  for (const zoom of [4, 8, 12]) {
    await page.evaluate(({ center, zoom }) => window.__map.jumpTo({ center, zoom }), { center, zoom });
    await settle();
    const r = await rendered(layer);
    check(`${kind} borders drawn at z${zoom}`, r.n > 0 && r.kinds === kind, `${r.n} features${r.kinds && r.kinds !== kind ? `, kinds ${r.kinds}` : ""}`);
    if (!r.near) break;
    center = r.near;
  }
}

console.log("\nBorders, external switch on:");
await page.evaluate(() => document.querySelector(".panel-close")?.click());
await setSwitch("external", true);
{
  const sw = await switches();
  check("external switch is on, state/UT still off", sw.ext && !sw.st);
  check("state/UT switch is now enabled", !sw.stDisabled && !(await axOf("states")).disabled);
  check("external layers shown, state layers hidden", sw.extShown.length === BORDER_LAYERS.external.length && sw.stShown.length === 0, `${sw.extShown.length}+${sw.stShown.length}`);
}
await drawnAtZooms("border-intl", "intl");
await drawnAtZooms("border-line", "line");
check("no state border is drawn", (await rendered("border-state")).n === 0);
await page.screenshot({ path: `${OUT}/40-borders-external.png` });

console.log("\nBorders, both switches on:");
await setSwitch("states", true);
{
  const sw = await switches();
  check("both switches are on", sw.ext && sw.st);
  check("all border layers shown", sw.extShown.length === BORDER_LAYERS.external.length && sw.stShown.length === BORDER_LAYERS.states.length);
}
await drawnAtZooms("border-state", "state");
// The basemap's own state lines would show as a second border beside a river; they are
// filtered out while ours are on, and only then.
const basemapStatesHidden = () =>
  page.evaluate(() => JSON.stringify(window.__map.getFilter("boundary_3") ?? null).includes('["!=",["get","admin_level"],4]'));
check("the basemap's own state lines are hidden while ours are on", await basemapStatesHidden());
await page.evaluate(() => window.__map.jumpTo({ center: [80, 23], zoom: 4 }));
await settle();
await page.screenshot({ path: `${OUT}/41-borders-both.png` });

// Rivers must answer to the pointer exactly as before: borders take no events.
const borderOrder = await page.evaluate(() => {
  const layers = window.__map.getStyle().layers ?? [];
  const firstSymbol = layers.findIndex((l) => l.type === "symbol");
  const ours = layers.map((l, i) => (l.source === "borders" ? i : -1)).filter((i) => i >= 0);
  return { n: ours.length, below: ours.every((i) => i < firstSymbol) };
});
check("border lines sit below the place names", borderOrder.n === 6 && borderOrder.below);
const ulhasB = await openRiver("Ulhas", [73.15, 19.15], 9);
check("river click opens the panel with both switches on", !!ulhasB && ulhasB.panel.visible && ulhasB.panel.heading === "Ulhas", ulhasB?.panel.heading);
// The Sharda (Kali) is the India-Nepal border: the border is drawn right beside it.
const kaliB = await openRiver("Sharda or Kali", [80.3, 29.3], 12);
check("a river with the border drawn beside it is still clickable", !!kaliB && kaliB.panel.heading === "Sharda or Kali", kaliB?.panel.heading);
if (kaliB) {
  const st = await page.evaluate((uid) => window.__map.getFeatureState({ source: "rivers", sourceLayer: "rivers", id: uid }), kaliB.pt.uid);
  check("and it highlights as selected", st.selected === true, JSON.stringify(st));
  const beside = await page.evaluate(
    () => window.__map.queryRenderedFeatures({ layers: ["border-intl"] }).filter((f) => f.properties.river === "29696").length
  );
  check("the border beside it is a river stretch (drawn offset from the river)", beside > 0, `${beside} features`);
  await page.screenshot({ path: `${OUT}/42-border-beside-kali.png` });
  // hovering the river still sets the hover state
  await page.evaluate(() => document.querySelector(".panel-close")?.click());
  await page.mouse.move(5, 400);
  await new Promise((r) => setTimeout(r, 300));
  const pt = await pixelOf("Sharda or Kali");
  await page.mouse.move(pt.x, pt.y);
  await new Promise((r) => setTimeout(r, 400));
  const hv = await page.evaluate((uid) => window.__map.getFeatureState({ source: "rivers", sourceLayer: "rivers", id: uid }), pt.uid);
  check("river hover works with both switches on", hv.hover === true, JSON.stringify(hv));
}

console.log("\nBorders, external switch off again:");
await setSwitch("external", false);
{
  const sw = await switches();
  check("turning external off turns state/UT off", !sw.ext && !sw.st);
  check("state/UT switch is disabled again", sw.stDisabled);
  check("the basemap's own state lines are back", !(await basemapStatesHidden()));
  check("no border is drawn", sw.extShown.length === 0 && sw.stShown.length === 0 && (await rendered("border-intl")).n === 0 && (await rendered("border-state")).n === 0);
}
// keyboard: Space flips the focused switch, Tab reaches the next one, Enter flips it too
await page.focus('.borders-toggle [data-border="external"]');
await page.keyboard.press("Space");
check("Space turns the external switch on", (await switches()).ext);
await page.keyboard.press("Tab");
check("Tab moves to the state/UT switch", await page.evaluate(() => document.activeElement?.getAttribute("data-border") === "states"));
await page.keyboard.press("Enter");
check("Enter turns the state/UT switch on", (await switches()).st);
await setSwitch("external", false);
const kaliOff = await openRiver("Sharda or Kali", [80.3, 29.3], 12);
check("river click works with the switches off again", !!kaliOff && kaliOff.panel.heading === "Sharda or Kali");

// --- 6d. a phone: switches, zoom buttons and the river panel keep clear of each other --
console.log("\nPhone layout (375 px wide):");
await page.evaluate(() => document.querySelector(".panel-close")?.click());
await page.setViewport({ width: 375, height: 667, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await new Promise((r) => setTimeout(r, 600));
await settle();
await setSwitch("external", true);
await setSwitch("states", true);
await page.evaluate(() => window.__map.jumpTo({ center: [84.5, 25.4], zoom: 6 }));
await settle();
{
  const pt = await pixelOf("Ganga");
  check("Ganga is on screen", !!pt);
  if (pt) {
    await page.touchscreen.tap(pt.x, pt.y);
    await new Promise((r) => setTimeout(r, 700));
    const lay = await page.evaluate(() => {
      const r = (sel) => {
        const b = document.querySelector(sel).getBoundingClientRect();
        return { l: b.left, t: b.top, r: b.right, b: b.bottom };
      };
      const hit = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
      const sw = r(".borders-toggle"), zoom = r(".maplibregl-ctrl-top-right .maplibregl-ctrl-group"), panel = r(".panel");
      return {
        open: !document.querySelector(".panel").hidden,
        heading: document.querySelector(".panel h2")?.textContent,
        swZoom: hit(sw, zoom), swPanel: hit(sw, panel), zoomPanel: hit(zoom, panel),
        inView: [sw, zoom, panel].every((b) => b.l >= 0 && b.r <= innerWidth && b.t >= 0 && b.b <= innerHeight),
        boxes: JSON.stringify({ sw, zoom, panel }, (k, v) => (typeof v === "number" ? Math.round(v) : v)),
      };
    });
    check("a tap on the Ganga opens its panel", lay.open && lay.heading === "Ganga", lay.heading);
    check("switches and zoom buttons do not overlap", !lay.swZoom, lay.boxes);
    check("panel does not cover the switches", !lay.swPanel, lay.boxes);
    check("panel does not cover the zoom buttons", !lay.zoomPanel, lay.boxes);
    check("all three fit the screen", lay.inView, lay.boxes);
    await page.screenshot({ path: `${OUT}/43-phone-borders-panel.png` });
  }
}
await page.evaluate(() => document.querySelector(".panel-close")?.click());
await setSwitch("external", false);
await page.setViewport({ width: 1280, height: 860 });
await new Promise((r) => setTimeout(r, 600));
await settle();

// --- 6e. the borders archive is missing: the app carries on ---------------------------
console.log("\nWithout borders.pmtiles:");
{
  const bare = await browser.newPage();
  await bare.setViewport({ width: 1280, height: 860 });
  const bareErrors = [];
  bare.on("pageerror", (e) => bareErrors.push(String(e).slice(0, 180)));
  const cdp = await bare.createCDPSession();
  await cdp.send("Network.enable");
  await cdp.send("Network.setBlockedURLs", { urls: ["*borders.pmtiles*"] });
  await bare.goto(BASE, { waitUntil: "networkidle2", timeout: 60000 });
  await bare.waitForFunction(() => !!window.__map && window.__map.loaded(), { timeout: 45000, polling: 250 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1500));
  await bare.click('.borders-toggle [data-border="external"]');
  await bare.click('.borders-toggle [data-border="states"]');
  await new Promise((r) => setTimeout(r, 500));
  const res = await bare.evaluate(() => ({
    rivers: window.__map.queryRenderedFeatures({ layers: ["river-lines"] }).length,
    borderLayers: (window.__map.getStyle().layers ?? []).filter((l) => l.source === "borders").length,
    ext: document.querySelector('[data-border="external"]').checked,
    st: document.querySelector('[data-border="states"]').checked,
  }));
  check("rivers still draw", res.rivers > 0, `${res.rivers} features`);
  check("no border layers were added", res.borderLayers === 0);
  check("the switches still flip, and do nothing", res.ext && res.st);
  check("no page errors", bareErrors.length === 0, bareErrors.join(" | "));
  await bare.close();
}

// --- 6f. sources: one "Sources" button in place of the attribution line -------------
console.log("\nSources button:");
const srcState = () =>
  page.evaluate(() => {
    const btn = document.querySelector(".sources-button");
    const pop = document.querySelector(".sources-popup");
    return {
      attribLine: !!document.querySelector(".maplibregl-ctrl-attrib"),
      label: btn?.textContent?.trim(),
      expanded: btn?.getAttribute("aria-expanded"),
      open: !!pop && !pop.hidden && pop.getBoundingClientRect().height > 0,
      first: pop?.querySelector("li")?.textContent ?? "",
      text: pop?.textContent ?? "",
    };
  });
let src = await srcState();
check("MapLibre's attribution line is gone", !src.attribLine);
check('the corner reads "Sources" with an i icon', src.label === "Sourcesi", src.label);
check("the list starts closed", !src.open && src.expanded === "false");
await page.click(".sources-button");
await new Promise((r) => setTimeout(r, 300));
src = await srcState();
check("clicking the icon opens the list", src.open && src.expanded === "true");
check("it starts with the government data", /^Central Water Commission/.test(src.first), src.first.slice(0, 60));
check("it credits OpenStreetMap, HydroSHEDS, GeoNames and the base map", ["OpenStreetMap", "HydroRIVERS", "GeoNames", "OpenMapTiles", "OpenFreeMap", "Terrain Tiles"].every((s) => src.text.includes(s)));
check("it lists the Bengaluru references", /Paani\.Earth/.test(src.text) && /Lake Development Authority/.test(src.text));
check("it lists no fun-fact sources", !/site owner|wikipedia\.org\/wiki\/Akluj/i.test(src.text));
await page.keyboard.press("Escape");
await new Promise((r) => setTimeout(r, 200));
check("Escape closes it", !(await srcState()).open);
await page.click(".sources-button");
await new Promise((r) => setTimeout(r, 200));
await page.mouse.click(640, 430);
await new Promise((r) => setTimeout(r, 300));
check("a click on the map closes it", !(await srcState()).open);

// --- 6g. every "Merges into" is a link by uid; a #river-<uid> address opens the river --
console.log("\nLinks by uid and #river-<uid> addresses:");
const deep = await browser.newPage();
await deep.setViewport({ width: 1280, height: 860 });
const deepPanel = async (uid) => {
  // A fresh load each time: going from one #river- address to another is only a hash change.
  await deep.goto("about:blank");
  await deep.goto(`${BASE}#river-${uid}`, { waitUntil: "networkidle2", timeout: 60000 });
  await deep.waitForFunction(() => !!window.__map, { timeout: 30000 });
  await deep.waitForFunction(() => document.querySelector(".panel") && !document.querySelector(".panel").hidden, { timeout: 60000, polling: 250 }).catch(() => {});
  return deep.evaluate(() => {
    const p = document.querySelector(".panel");
    if (!p || p.hidden) return null;
    const rows = {};
    p.querySelectorAll("dt").forEach((dt) => {
      const dd = dt.nextElementSibling;
      rows[dt.textContent] = { text: dd?.textContent ?? "", link: dd?.querySelector("a.river-link")?.getAttribute("href") ?? null };
    });
    return { heading: p.querySelector("h2")?.textContent, rows, hash: location.hash };
  });
};
// The Rongni's confluence name ("Teesta") was 18.7 km from the Teesta line: once an unlinked name.
const rongni = await deepPanel("952");
check("#river-952 opens the Rongni Chu's panel", rongni?.heading === "Rongni Chu Or Rani Khola", rongni?.heading);
check("its 'Merges into' links the Teesta by uid", rongni?.rows["Merges into"]?.link === "#river-863", JSON.stringify(rongni?.rows["Merges into"]));
check("the address keeps the river's uid", rongni?.hash === "#river-952", rongni?.hash);
// The Jamuna and the Panga each name the other: the link is for display, the chain stays open.
const jamuna = await deepPanel("929");
check("the Jamuna, in a naming loop with the Panga, still links it", jamuna?.rows["Merges into"]?.link === "#river-935", JSON.stringify(jamuna?.rows["Merges into"]));
await deep.evaluate(() => document.querySelector(".panel-close")?.click());
await new Promise((r) => setTimeout(r, 300));
check("closing the panel clears the address", (await deep.evaluate(() => location.hash)) === "");
await deep.close();

// --- 7. dismiss ----------------------------------------------------------------
await openRiver("Ulhas", [73.15, 19.15], 9);
await page.evaluate(() => document.querySelector(".panel-close")?.click());
await new Promise((r) => setTimeout(r, 300));
check("close hides the panel", await page.evaluate(() => !!document.querySelector(".panel")?.hidden));

await browser.close();
if (errors.length) console.log(`\npage errors:\n  ${[...new Set(errors)].join("\n  ")}`);
console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nALL CHECKS PASSED");
process.exit(failures ? 1 : 0);
