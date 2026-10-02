// Finds rivers that enter India from another country, and traces each one back up to
// its real source abroad. The CWC dataset stops at India's border, so the Torsa simply
// "starts" at Jaigaon; in fact it rises in Tibet and crosses Bhutan first.
//
// A river is entering if its start sits near the border AND HydroRIVERS (a global
// network) shows the same channel continuing upstream outside India. That second test
// is what separates the Torsa from the many Himalayan streams that genuinely rise on the
// border watershed: those have no upstream course beyond it.
//
// Borders are India's own point of view (Natural Earth), matching the source dataset:
// a river rising in Aksai Chin or Gilgit-Baltistan is treated as rising in India.

import { readFileSync, writeFileSync } from "node:fs";
import { open } from "shapefile";
import { loadRivers, partsOf, distKm, pointToLineKm, originPoint } from "./lib/geo.mjs";

const COUNTRIES = { IND: "India", CHN: "China", NPL: "Nepal", BTN: "Bhutan", BGD: "Bangladesh", MMR: "Myanmar", PAK: "Pakistan", AFG: "Afghanistan", LKA: "Sri Lanka" };
const CODES = Object.keys(COUNTRIES);
const IND = 1; // index into CODES, +1

const NEAR_BORDER_CELLS = 4; // ~8 km
const MATCH_KM = 2; // HydroRIVERS reach must pass this close to the start
const ALIGN_KM = 1.5; // ...and follow the CWC line downstream this closely
const MIN_ABROAD_KM = 5; // upstream course outside India needed to count as entering
const MIN_RUN_KM = 5; // shorter stretches through a country are border noise
const START_INSIDE_CELLS = 1; // a start this deep in a foreign country (~2 km) rises there
// ...but only along the Nepal terai, where the border is settled and runs across flat
// ground. In the hills Natural Earth's line strays from the watershed (it puts Lipulekh
// and Barahoti in China and the Sharda's Kalapani source in Nepal), so starts there are
// left to the HydroRIVERS trace.
const START_ABROAD_IN = ["NPL"];

// --- country raster -------------------------------------------------------------
const X0 = 60, Y0 = 0, CELL = 0.02, W = 2500, H = 2250;
const mask = new Uint8Array(W * H);
{
  const src = await open("data/raw/ne_10m_admin_0_countries_ind.shp", "data/raw/ne_10m_admin_0_countries_ind.dbf", { encoding: "utf-8" });
  while (true) {
    const { done, value } = await src.read();
    if (done) break;
    const idx = CODES.indexOf(value.properties.ADM0_A3) + 1;
    if (!idx) continue;
    const g = value.geometry;
    const rings = (g.type === "Polygon" ? [g.coordinates] : g.coordinates).flat();
    // Scanline fill, even-odd across all rings so holes stay empty.
    const rows = Array.from({ length: H }, () => []);
    for (const ring of rings)
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xa, ya] = ring[j], [xb, yb] = ring[i];
        if (ya === yb) continue;
        const lo = Math.min(ya, yb), hi = Math.max(ya, yb);
        const r0 = Math.max(0, Math.ceil((lo - Y0) / CELL - 0.5));
        const r1 = Math.min(H - 1, Math.floor((hi - Y0) / CELL - 0.5));
        for (let r = r0; r <= r1; r++) {
          const y = Y0 + (r + 0.5) * CELL;
          if (y < lo || y >= hi) continue;
          rows[r].push(xa + ((y - ya) * (xb - xa)) / (yb - ya));
        }
      }
    for (let r = 0; r < H; r++) {
      const xs = rows[r].sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const c0 = Math.max(0, Math.ceil((xs[k] - X0) / CELL - 0.5));
        const c1 = Math.min(W - 1, Math.floor((xs[k + 1] - X0) / CELL - 0.5));
        for (let c = c0; c <= c1; c++) mask[r * W + c] = idx;
      }
    }
  }
}
const countryAt = (lon, lat) => {
  const c = Math.floor((lon - X0) / CELL), r = Math.floor((lat - Y0) / CELL);
  return c < 0 || r < 0 || c >= W || r >= H ? 0 : mask[r * W + c];
};
// The foreign country a point lies well inside (every cell within START_INSIDE_CELLS),
// or 0. Several Nepal terai channels are digitised from a start point in Nepal itself.
function foreignAt(lon, lat) {
  const c0 = Math.floor((lon - X0) / CELL), r0 = Math.floor((lat - Y0) / CELL);
  const cc = mask[r0 * W + c0];
  if (!cc || cc === IND || !START_ABROAD_IN.includes(CODES[cc - 1])) return 0;
  for (let dr = -START_INSIDE_CELLS; dr <= START_INSIDE_CELLS; dr++)
    for (let dc = -START_INSIDE_CELLS; dc <= START_INSIDE_CELLS; dc++)
      if (mask[(r0 + dr) * W + (c0 + dc)] !== cc) return 0;
  return cc;
}
function nearForeignLand(lon, lat) {
  const c0 = Math.floor((lon - X0) / CELL), r0 = Math.floor((lat - Y0) / CELL);
  for (let dr = -NEAR_BORDER_CELLS; dr <= NEAR_BORDER_CELLS; dr++)
    for (let dc = -NEAR_BORDER_CELLS; dc <= NEAR_BORDER_CELLS; dc++) {
      const v = mask[(r0 + dr) * W + (c0 + dc)];
      if (v && v !== IND) return true;
    }
  return false;
}

// --- HydroRIVERS ------------------------------------------------------------------
console.log("loading HydroRIVERS (South Asia window)...");
const reaches = new Map();
const ups = new Map();
const RGRID = 0.1;
const rgrid = new Map();
{
  const src = await open("data/raw/HydroRIVERS_v10_as.shp", "data/raw/HydroRIVERS_v10_as.dbf");
  while (true) {
    const { done, value } = await src.read();
    if (done) break;
    const c = value.geometry.coordinates;
    let x0 = 180, y0 = 90, x1 = -180, y1 = -90;
    for (const [x, y] of c) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
    if (x1 < 66 || x0 > 105 || y1 < 5 || y0 > 40) continue;
    const p = value.properties;
    reaches.set(p.HYRIV_ID, { id: p.HYRIV_ID, next: p.NEXT_DOWN, distUp: p.DIST_UP_KM, upland: p.UPLAND_SKM, c });
    if (p.NEXT_DOWN) {
      if (!ups.has(p.NEXT_DOWN)) ups.set(p.NEXT_DOWN, []);
      ups.get(p.NEXT_DOWN).push(p.HYRIV_ID);
    }
    for (let gx = Math.floor(x0 / RGRID); gx <= Math.floor(x1 / RGRID); gx++)
      for (let gy = Math.floor(y0 / RGRID); gy <= Math.floor(y1 / RGRID); gy++) {
        const k = `${gx},${gy}`;
        if (!rgrid.has(k)) rgrid.set(k, []);
        rgrid.get(k).push(p.HYRIV_ID);
      }
  }
}
console.log(`  ${reaches.size.toLocaleString()} reaches`);

function reachesNear(lon, lat, km) {
  const span = Math.ceil(km / 9 / RGRID) + 1;
  const gx = Math.floor(lon / RGRID), gy = Math.floor(lat / RGRID);
  const seen = new Set(), out = [];
  for (let dx = -span; dx <= span; dx++)
    for (let dy = -span; dy <= span; dy++)
      for (const id of rgrid.get(`${gx + dx},${gy + dy}`) ?? []) {
        if (seen.has(id)) continue;
        seen.add(id);
        const r = reaches.get(id);
        if (pointToLineKm(lon, lat, [r.c]) <= km) out.push(r);
      }
  return out;
}

function downstreamPath(r, km) {
  const pts = [...r.c];
  let len = 0, cur = r;
  while (len < km && cur.next && reaches.has(cur.next)) {
    cur = reaches.get(cur.next);
    pts.push(...cur.c);
    len += 5;
  }
  return pts;
}

// Upstream along the longest branch at every fork - the conventional "source".
function upstreamPath(r) {
  const chain = [r];
  let cur = r;
  for (let guard = 0; guard < 5000; guard++) {
    const u = (ups.get(cur.id) ?? []).map((id) => reaches.get(id)).filter(Boolean);
    if (!u.length) break;
    cur = u.reduce((a, b) => (b.distUp > a.distUp ? b : a));
    chain.push(cur);
  }
  return chain.reverse().flatMap((x) => x.c); // source first
}

// --- rivers -------------------------------------------------------------------------
const topology = JSON.parse(readFileSync("build/topology.json", "utf8"));
const rivers = await loadRivers();
const out = {};
let candidates = 0, unmatched = 0, startsAbroad = 0;
const examples = [];

for (const f of rivers) {
  const p = f.properties;
  const uid = String(p.UID_River);
  const t = topology[uid];
  if (t.formedBy || t.continues || t.branchedFrom || t.swapped) continue;

  const parts = partsOf(f.geometry);
  const [ox, oy] = originPoint(p, parts);
  if (!nearForeignLand(ox, oy)) continue;
  candidates++;

  const rec = trace(parts, ox, oy) ?? startedAbroad(ox, oy);
  if (!rec) continue;
  out[uid] = rec;
  examples.push({ name: p.rivname, len: p.length_km, ...rec });
}

// When HydroRIVERS cannot follow a river upstream but the line itself starts in another
// country, that start is the best source we have.
function startedAbroad(ox, oy) {
  const cc = foreignAt(ox, oy);
  if (!cc) return null;
  startsAbroad++;
  const name = COUNTRIES[CODES[cc - 1]];
  return { src: [ox, oy].map((n) => Math.round(n * 1e4) / 1e4), rises: name, via: [], from: name, abroadKm: 0 };
}

function trace(parts, ox, oy) {
  // CWC vertices a few km downstream of the start, to check a match runs the same way.
  const samples = parts.flat().filter(([x, y]) => {
    const d = distKm(ox, oy, x, y);
    return d >= 3 && d <= 8;
  });
  if (!samples.length) return null;

  let match = null;
  for (const r of reachesNear(ox, oy, MATCH_KM)) {
    const path = [downstreamPath(r, 15)];
    const aligned = samples.filter(([x, y]) => pointToLineKm(x, y, path) <= ALIGN_KM).length;
    if (aligned < samples.length / 2) continue;
    if (!match || r.upland > match.upland) match = r;
  }
  if (!match) { unmatched++; return null; }

  const path = upstreamPath(match);
  // Stop at the point on the traced path nearest the CWC start.
  let stopAt = 0, bestD = Infinity;
  path.forEach(([x, y], i) => { const d = distKm(x, y, ox, oy); if (d < bestD) { bestD = d; stopAt = i; } });

  const runs = [];
  for (let i = 0; i < stopAt; i++) {
    const [xa, ya] = path[i], [xb, yb] = path[i + 1];
    const cc = countryAt((xa + xb) / 2, (ya + yb) / 2);
    const km = distKm(xa, ya, xb, yb);
    if (runs.length && runs[runs.length - 1].cc === cc) runs[runs.length - 1].km += km;
    else runs.push({ cc, km });
  }
  // Drop border noise, then merge neighbouring runs of the same country it left behind.
  const real = [];
  for (const r of runs) {
    if (!r.cc || r.km < MIN_RUN_KM) continue;
    if (real.length && real[real.length - 1].cc === r.cc) real[real.length - 1].km += r.km;
    else real.push({ ...r });
  }
  const abroadKm = runs.filter((r) => r.cc && r.cc !== IND).reduce((s, r) => s + r.km, 0);
  if (abroadKm < MIN_ABROAD_KM || !real.length || real[0].cc === IND) return null;
  // The river must arrive from abroad, not dip out and back somewhere far upstream.
  const beforeIndia = real[real.length - 1].cc === IND ? real.slice(0, -1) : real;
  const arrivesFrom = beforeIndia[beforeIndia.length - 1]?.cc;
  if (!arrivesFrom || arrivesFrom === IND) return null;

  // Countries crossed after the river last leaves its country of origin. A path along
  // the Bhutan-Tibet frontier that strays over the line and back is not "via China".
  const risesCC = real[0].cc;
  let lastHome = 0;
  beforeIndia.forEach((r, i) => { if (r.cc === risesCC) lastHome = i; });
  const via = [];
  for (const r of beforeIndia.slice(lastHome + 1)) if (r.cc !== IND && !via.includes(r.cc)) via.push(r.cc);

  const name = (i) => COUNTRIES[CODES[i - 1]];
  return {
    src: path[0].map((n) => Math.round(n * 1e4) / 1e4),
    rises: name(risesCC),
    via: via.map(name),
    from: name(arrivesFrom),
    abroadKm: Math.round(abroadKm),
  };
}

writeFileSync("build/abroad.json", JSON.stringify(out));
console.log(`\nstarts near a foreign border: ${candidates} (no HydroRIVERS match: ${unmatched}; line starts abroad: ${startsAbroad})`);
console.log(`enter India from abroad: ${Object.keys(out).length}. Largest:`);
for (const e of examples.sort((a, b) => b.len - a.len).slice(0, 25))
  console.log(`  ${e.name.padEnd(22)} ${e.rises}${e.via.length ? " -> " + e.via.join(" -> ") : ""} -> India  (${e.abroadKm} km abroad)`);
