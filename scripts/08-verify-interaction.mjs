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
  ["Mithi", [72.88, 19.1], "Vihar Lake, Sanjay Gandhi National Park, Mumbai", "Mahim Creek, Mumbai"],
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
const dk = await openRiver("Desai Khadi", [73.079, 19.143], 13);
check("Desai Khadi is on the map", !!dk);
if (dk) {
  check("Formed by", dk.panel.rows["Formed by"] === "Confluence of Desai Khadi (south branch) and Desai Khadi (north branch)" || dk.panel.rows["Formed by"] === "Confluence of Desai Khadi (north branch) and Desai Khadi (south branch)", dk.panel.rows["Formed by"]);
  check("Merges into", dk.panel.rows["Merges into"] === "Ulhas", dk.panel.rows["Merges into"]);
}
console.log("\nUnnamed river past the Deonar dumping ground:");
const un = await openRiver("", [72.9175, 19.088], 14);
check("unnamed river is on the map", !!un);
if (un) {
  check("heading", un.panel.heading === "Unnamed river", un.panel.heading);
  check("Mouth", /Thane Creek/.test(un.panel.rows["Mouth"] ?? ""), un.panel.rows["Mouth"]);
}
console.log("\nSomaiyya Nalla (joins the unnamed river before Thane Creek):");
const sn = await openRiver("Somaiyya Nalla", [72.9103, 19.07], 14);
check("Somaiyya Nalla is on the map", !!sn);
if (sn) check("Merges into", sn.panel.rows["Merges into"] === "Unnamed river", sn.panel.rows["Merges into"]);
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

console.log("\nBengaluru valleys (KC to Bellandur and Varthur; Hebbal to Yellamallappa Chetty):");
const k100 = await openRiver("Koramangala Valley (K-100)", [77.615, 12.94], 13);
check("K-100 is on the map", !!k100);
if (k100) check("K-100 continues below Bellandur", k100.panel.rows["Continues to"] === "Unnamed river", JSON.stringify(k100.panel.rows));
const c100 = await openRiver("Challaghatta Valley (C-100)", [77.635, 12.975], 13);
if (c100) check("C-100 merges into the Bellandur outflow", c100.panel.rows["Merges into"] === "Unnamed river", JSON.stringify(c100.panel.rows));
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

console.log("\nFun facts and feature switches:");
const mu = await openRiver("Musi", [78.47, 17.37], 10);
check("Musi is on the map", !!mu);
if (mu) {
  const f = await page.evaluate(() => ({ head: document.querySelector(".panel .fact-heading")?.textContent, text: document.querySelector(".panel .fact")?.textContent ?? "" }));
  check("Fun Facts section shown", f.head === "Fun Facts" && f.text.length > 40, f.text.slice(0, 60));
}
const dh = await openRiver("Dahisar", [72.86, 19.22], 13);
if (dh) check("Dahisar shows two fun facts", (await page.evaluate(() => document.querySelectorAll(".panel .fact").length)) === 2);
check("basins switch hidden by default", await page.evaluate(() => !document.querySelector(".basins-toggle")));

// --- 7. dismiss ----------------------------------------------------------------
await page.evaluate(() => document.querySelector(".panel-close")?.click());
await new Promise((r) => setTimeout(r, 300));
check("close hides the panel", await page.evaluate(() => !!document.querySelector(".panel")?.hidden));

await browser.close();
if (errors.length) console.log(`\npage errors:\n  ${[...new Set(errors)].join("\n  ")}`);
console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nALL CHECKS PASSED");
process.exit(failures ? 1 : 0);
