// Describes each river's origin and end point in words a reader recognises:
//   "Western Ghats near Lonavala, Maharashtra"   rather than   "Kune N M, Mawal, Pune"
//
// Towns come from GeoNames. For each point, the chosen town maximises
// population / distance^3 within 100 km, so a known town 3 km away beats an obscure
// village 1 km away, but a city 40 km away does not swamp a town 8 km away.
// Mountain ranges come from Natural Earth and prefix origins only.
// Hand-checked descriptions in data/river-overrides.json win over all of this.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { open } from "shapefile";
import { loadRivers, partsOf, distKm, bearing8, pointInPolygonGeom, originPoint } from "./lib/geo.mjs";

const SEARCH_KM = 100;
const NEAR_KM = 15;
// Foreign towns are allowed (a river at the Nepal border is genuinely near a Nepali
// town) but must be markedly closer to win. China and Pakistan are excluded so that
// points in disputed areas are never described relative to a town across the line.
const FOREIGN = { NP: "Nepal", BT: "Bhutan", BD: "Bangladesh", MM: "Myanmar", LK: "Sri Lanka" };
const FOREIGN_WEIGHT = 0.05;

const STATE_RENAMES = {
  "Andaman and Nicobar": "Andaman and Nicobar Islands",
  "Arunanchal Pradesh": "Arunachal Pradesh",
  "Andaman & Nicobar Island": "Andaman and Nicobar Islands",
  "Jammu & Kashmir": "Jammu and Kashmir",
  "Delhi  & NCR": "Delhi",
  "Dadara & Nagar Havelli": "Dadra and Nagar Haveli",
};
// GeoNames spellings that differ from the form most readers know, including a few
// colonial-era names it still carries.
const SPELLINGS = {
  Lonavla: "Lonavala",
  Trimbak: "Trimbakeshwar",
  Chanda: "Chandrapur",
  Bahraigh: "Bahraich",
  Darjiling: "Darjeeling",
  "Chik Ballapur": "Chikkaballapur",
  "Paradip Garh": "Paradip",
  Borivli: "Borivali",
  Kulu: "Kullu",
  "Gond Pipri": "Gondpipri",
  Kendraparha: "Kendrapara",
  Colgong: "Kahalgaon",
  Monghyr: "Munger",
  Buldana: "Buldhana",
};
// Revenue-village and survey-part names ("Niz Katigorah Pt III") have populations
// over 500 but mean nothing to a reader, so they are never chosen as a landmark.
const UNRECOGNISABLE = /^Niz\b|\bPt\.?\s*[IVX\d]+$|\bGrant\b|\bNo\.?\s*\d/i;

// Natural Earth's region polygons are drawn for small-scale maps and overshoot badly
// (its Chota Nagpur polygon covers 900+ origins in Madhya Pradesh). Each range is
// therefore only applied inside the states it genuinely spans, judged by the river's
// own recorded origin state. Polygons too loose to salvage (Vale of Kashmir) are omitted.
const RANGES = {
  "WESTERN GHATS": { name: "Western Ghats", states: ["Maharashtra", "Goa", "Karnataka", "Kerala", "Tamil Nadu", "Gujarat", "Dadra and Nagar Haveli"] },
  "Southern Ghats": { name: "Western Ghats", states: ["Kerala", "Tamil Nadu"] },
  "EASTERN GHATS": { name: "Eastern Ghats", states: ["Andhra Pradesh", "Odisha", "Tamil Nadu", "Telangana"] },
  HIMALAYAS: { name: "Himalayas", states: ["Himachal Pradesh", "Uttarakhand", "Ladakh", "Arunachal Pradesh", "Sikkim", "Jammu and Kashmir", "West Bengal"] },
  "Siwalik Hills": { name: "Siwalik Hills", states: ["Uttarakhand", "Uttar Pradesh"] },
  // The polygon spans all of Ladakh; the Karakoram proper lies north of the Ladakh Range.
  "KARAKORAM RA.": { name: "Karakoram", states: ["Ladakh"], where: (lon, lat) => lat >= 34.5 },
  "Satpura Range": { name: "Satpura Range", states: ["Madhya Pradesh", "Maharashtra"] },
  "Vindhya Range": { name: "Vindhya Range", states: ["Madhya Pradesh", "Uttar Pradesh"] },
  "Arvalli Ra.": { name: "Aravalli Range", states: ["Rajasthan"] },
  "Khasi Hills": { name: "Meghalaya Plateau", states: ["Meghalaya", "Assam"] },
  "Naga Hills": { name: "Naga Hills", states: ["Nagaland", "Manipur", "Arunachal Pradesh"] },
  "Chin Hills": { name: "Mizo Hills", states: ["Mizoram"] },
  // Northern Chhattisgarh (Surguja, Jashpur) is Chota Nagpur; the Raipur plain is not.
  "Chota Nägpur Plateau": {
    name: "Chota Nagpur Plateau",
    states: ["Jharkhand", "Odisha", "Chhattisgarh", "West Bengal", "Bihar"],
    where: (lon, lat, state) => state !== "Chhattisgarh" || lat >= 22.5,
  },
  "THAR DESERT": { name: "Thar Desert", states: ["Rajasthan"] },
  Sundarbans: { name: "Sundarbans", states: ["West Bengal"] },
};

// --- gazetteer ------------------------------------------------------------------
const admin1 = new Map();
for (const line of readFileSync("data/raw/admin1CodesASCII.txt", "utf8").split("\n")) {
  const [code, name] = line.split("\t");
  if (code?.startsWith("IN.")) admin1.set(code, STATE_RENAMES[name] ?? name);
}

const CELL = 0.5;
const grid = new Map();
const cellKey = (lon, lat) => `${Math.floor(lon / CELL)},${Math.floor(lat / CELL)}`;
let placeCount = 0;

for (const line of readFileSync("data/raw/cities500.txt", "utf8").split("\n")) {
  const c = line.split("\t");
  if (c.length < 15) continue;
  const cc = c[8];
  if (cc !== "IN" && !FOREIGN[cc]) continue;
  if (c[6] !== "P" || /^PPL[HQW]$/.test(c[7])) continue; // skip historical/abandoned/destroyed
  const lat = +c[4], lon = +c[5], pop = +c[14];
  if (lon < 66 || lon > 99 || lat < 5 || lat > 38 || !(pop >= 500)) continue;
  if (UNRECOGNISABLE.test(c[2])) continue;

  const region = cc === "IN" ? admin1.get(`IN.${c[10]}`) : FOREIGN[cc];
  const place = { name: SPELLINGS[c[2]] ?? c[2], lon, lat, pop, region, foreign: cc !== "IN" };
  const k = cellKey(lon, lat);
  if (!grid.has(k)) grid.set(k, []);
  grid.get(k).push(place);
  placeCount++;
}

function bestPlace(lon, lat, indiaOnly = false) {
  const span = Math.ceil(SEARCH_KM / 50 / CELL);
  const cx = Math.floor(lon / CELL), cy = Math.floor(lat / CELL);
  let best = null, bestScore = -1;
  for (let dx = -span; dx <= span; dx++)
    for (let dy = -span; dy <= span; dy++) {
      for (const p of grid.get(`${cx + dx},${cy + dy}`) ?? []) {
        if (indiaOnly && p.foreign) continue;
        const d = distKm(lon, lat, p.lon, p.lat);
        if (d > SEARCH_KM) continue;
        const score = (p.pop / Math.max(d, 2) ** 3) * (p.foreign ? FOREIGN_WEIGHT : 1);
        if (score > bestScore) { bestScore = score; best = { ...p, d }; }
      }
    }
  return best;
}

const label = (p) => (p.region && p.region !== p.name ? `${p.name}, ${p.region}` : p.name);

// --- gazetteer abroad -------------------------------------------------------------
// Only used to name the source of a river that rises outside India, so China is allowed
// here: the Torsa's source genuinely is in Tibet.
const ABROAD = { CN: "China", NP: "Nepal", BT: "Bhutan", BD: "Bangladesh", MM: "Myanmar" };
const abroadAdmin1 = new Map();
for (const line of readFileSync("data/raw/admin1CodesASCII.txt", "utf8").split("\n")) {
  const [code, name] = line.split("\t");
  if (code?.startsWith("CN.")) abroadAdmin1.set(code, name.replace(/ (Autonomous Region|Province|Sheng|Zizhiqu)$/i, ""));
}
const fgrid = new Map();
const fplaces = [];
for (const line of readFileSync("data/raw/cities500.txt", "utf8").split("\n")) {
  const c = line.split("\t");
  if (c.length < 15 || !ABROAD[c[8]]) continue;
  if (c[6] !== "P" || /^PPL[HQW]$/.test(c[7])) continue;
  const lat = +c[4], lon = +c[5], pop = +c[14];
  if (lon < 70 || lon > 105 || lat < 15 || lat > 40 || !(pop >= 500)) continue;
  const region = c[8] === "CN" ? [abroadAdmin1.get(`CN.${c[10]}`), "China"].filter(Boolean).join(", ") : ABROAD[c[8]];
  const place = { name: c[2], lon, lat, pop, region, country: ABROAD[c[8]] };
  fplaces.push(place);
  const k = cellKey(lon, lat);
  if (!fgrid.has(k)) fgrid.set(k, []);
  fgrid.get(k).push(place);
}

// The landmark must be in the same country as the source: "90 km NW of Thimphu, Bhutan"
// reads as Bhutan even when the point is over the line in Tibet.
function describeAbroad(lon, lat, country) {
  const span = Math.ceil(SEARCH_KM / 50 / CELL);
  const cx = Math.floor(lon / CELL), cy = Math.floor(lat / CELL);
  let best = null, bestScore = -1;
  for (let dx = -span; dx <= span; dx++)
    for (let dy = -span; dy <= span; dy++)
      for (const p of fgrid.get(`${cx + dx},${cy + dy}`) ?? []) {
        if (p.country !== country) continue;
        const d = distKm(lon, lat, p.lon, p.lat);
        if (d > SEARCH_KM) continue;
        const score = p.pop / Math.max(d, 2) ** 3;
        if (score > bestScore) { bestScore = score; best = { ...p, d }; }
      }
  if (best && best.d <= NEAR_KM) return { text: label(best), near: true };
  if (best) {
    const km = best.d < 20 ? Math.round(best.d) : Math.round(best.d / 5) * 5;
    return { text: `${km} km ${bearing8(best.lon, best.lat, lon, lat)} of ${label(best)}`, near: false };
  }
  // Remote high Tibet has no town within 100 km: name the region instead.
  const same = fplaces.filter((p) => p.country === country);
  const nearest = same.length && same.reduce((a, p) => (distKm(lon, lat, p.lon, p.lat) < distKm(lon, lat, a.lon, a.lat) ? p : a));
  return { text: nearest && distKm(lon, lat, nearest.lon, nearest.lat) < 400 ? nearest.region : country, near: false };
}

// Returns { text, near } - `near` means the text is a bare place, so the UI label can
// say "near"; otherwise the text carries its own relation ("25 km NE of ...").
function describe(lon, lat, fallback, indiaOnly = false) {
  const p = bestPlace(lon, lat, indiaOnly);
  if (!p) return { text: fallback(), near: false, how: "fallback" };
  if (p.d <= NEAR_KM) return { text: label(p), near: true, how: "near" };
  const km = p.d < 20 ? Math.round(p.d) : Math.round(p.d / 5) * 5;
  return { text: `${km} km ${bearing8(p.lon, p.lat, lon, lat)} of ${label(p)}`, near: false, how: "relative" };
}

// --- ranges ---------------------------------------------------------------------
const ranges = [];
{
  const src = await open(
    "data/raw/ne_10m_geography_regions_polys.shp",
    "data/raw/ne_10m_geography_regions_polys.dbf",
    { encoding: "utf-8" }
  );
  while (true) {
    const { done, value } = await src.read();
    if (done) break;
    const def = RANGES[value.properties.NAME];
    if (def) ranges.push({ ...def, rank: value.properties.SCALERANK, geom: value.geometry });
  }
}
// Most specific first: Siwalik Hills beats the Himalayas polygon it sits inside.
ranges.sort((a, b) => b.rank - a.rank);
const rangeAt = (lon, lat, state) =>
  ranges.find(
    (r) =>
      r.states.includes(state) &&
      (!r.where || r.where(lon, lat, state)) &&
      pointInPolygonGeom(lon, lat, r.geom)
  )?.name ?? null;

// --- overrides ------------------------------------------------------------------
const OVERRIDES_PATH = "data/river-overrides.json";
const overrides = existsSync(OVERRIDES_PATH) ? JSON.parse(readFileSync(OVERRIDES_PATH, "utf8")) : {};
const topology = JSON.parse(readFileSync("build/topology.json", "utf8"));
const abroad = JSON.parse(readFileSync("build/abroad.json", "utf8"));

// --- rivers ---------------------------------------------------------------------
const isPartial = (s) => !s || /partially/i.test(s);
const stateOf = (s) => STATE_RENAMES[s] ?? s;
const adminFallback = (sb, dst, ste) => () =>
  [!isPartial(sb) && sb !== dst ? sb : null, dst ? `${dst} district` : null, stateOf(ste)]
    .filter(Boolean)
    .join(", ");

console.log(`gazetteer: ${placeCount} places, ${ranges.length} range polygons, ${Object.keys(overrides).length} overrides`);
const rivers = await loadRivers();
const out = {};
const how = { origin: {}, end: {} };
let withRange = 0, overridden = 0;
const kinds = { formed: 0, branched: 0, abroad: 0, swapped: 0 };
const staleOverrides = [];

for (const f of rivers) {
  const p = f.properties;
  const uid = String(p.UID_River);
  const t = topology[uid] ?? {};

  // Where the river starts and ends. When the data has them swapped (91 rivers whose
  // recorded start sits on the very river they flow into), so do we.
  // Rivers whose recorded start and end coincide carry the ends topology chose; their
  // district names describe only one of those ends, so fall back to the state alone.
  let [[olon, olat], [elon, elat]] = t.ends ?? [originPoint(p, partsOf(f.geometry)), [p.en_pt_long, p.en_pt_lat]];
  let startAdmin = t.ends ? adminFallback(null, null, p.st_loc_ste) : adminFallback(p.st_loc_sb_, p.st_loc_dst, p.st_loc_ste);
  let endAdmin = t.ends ? adminFallback(null, null, p.en_loc_ste) : adminFallback(p.en_loc_sb_, p.en_loc_dst, p.en_loc_ste);
  let startState = stateOf(p.st_loc_ste);
  if (t.swapped) {
    [olon, olat, elon, elat] = [elon, elat, olon, olat];
    [startAdmin, endAdmin] = [endAdmin, startAdmin];
    startState = stateOf(p.en_loc_ste);
    kinds.swapped++;
  }

  // A river that rises in India is placed by Indian towns: "Sarpang, Bhutan" reads as a
  // Bhutanese source even when the point is on the Assam side.
  const o = describe(olon, olat, startAdmin, true);
  const range = rangeAt(olon, olat, startState);
  if (range) {
    withRange++;
    o.text = o.near ? `${range} near ${o.text}` : `${range}, ${o.text}`;
    o.near = false; // the text now reads as a full description
  }
  const e = describe(elon, elat, endAdmin);
  how.origin[o.how] = (how.origin[o.how] ?? 0) + 1;
  how.end[e.how] = (how.end[e.how] ?? 0) + 1;

  const rec = { o: o.text, on: o.near, e: e.text, en: e.near };

  // Rivers with no source of their own get the point where they begin, plainly located
  // and without a range prefix ("Western Ghats near Pune" is wrong for the Mula-Mutha).
  const formed = !!t.formedBy;
  if (formed) {
    rec.fa = describe(olon, olat, startAdmin).text;
    kinds.formed++;
  } else if (t.branchedFrom) {
    const b = describe(olon, olat, startAdmin);
    Object.assign(rec, { bat: b.text, batn: b.near });
    kinds.branched++;
  }

  // Rivers entering from abroad: the real source is beyond the border, and the CWC start
  // is where the river crosses into India.
  // An override can veto the tracer: the Tangtsa starts in Pangong Tso, whose basin
  // HydroRIVERS routes through it although the lake has no outflow.
  const ab = overrides[uid]?.abroad === false ? null : abroad[uid];
  if (ab) {
    const src = describeAbroad(ab.src[0], ab.src[1], ab.rises);
    const ent = describe(olon, olat, startAdmin, true);
    Object.assign(rec, { o: src.text, on: src.near, via: ab.via, ent: ent.text, entn: ent.near, abroad: true });
    kinds.abroad++;
  }

  const ov = overrides[uid];
  if (ov) {
    if (ov.name !== p.rivname) staleOverrides.push(`${uid}: override says "${ov.name}", data says "${p.rivname}"`);
    if (ov.origin && formed) staleOverrides.push(`${uid} ${ov.name}: has "origin" but is formed by a confluence - use "formedAt"`);
    if (ov.abroad === false && !abroad[uid]) staleOverrides.push(`${uid} ${ov.name}: has "abroad": false but the tracer no longer flags it`);
    if (ov.branchesAt && !t.branchedFrom) staleOverrides.push(`${uid} ${ov.name}: has "branchesAt" but is not a branch`);
    if (ov.formedAt && !formed) staleOverrides.push(`${uid} ${ov.name}: has "formedAt" but no formers were detected or declared`);
    if (ov.origin) Object.assign(rec, { o: ov.origin, on: !!ov.originNear });
    if (ov.formedAt) rec.fa = ov.formedAt;
    // Where a distributary leaves its parent, as a landmark (the Vennar at the Grand Anicut).
    if (ov.branchesAt) Object.assign(rec, { bat: ov.branchesAt, batn: !!ov.branchesAtNear });
    if (ov.end) Object.assign(rec, { e: ov.end, en: !!ov.endNear });
    // Declaring where it enters India marks a river as coming from abroad, even when the
    // tracer could not follow it (the Gandak starts 30 km inside the border).
    if (ov.entersAt) Object.assign(rec, { ent: ov.entersAt, entn: !!ov.entersAtNear, abroad: true });
    if (ov.via) rec.via = ov.via;
    overridden++;
  }
  out[uid] = rec;
}

writeFileSync("build/places.json", JSON.stringify(out));

console.log(`origins: ${JSON.stringify(how.origin)}, ${withRange} with a range prefix`);
console.log(`ends:    ${JSON.stringify(how.end)}`);
console.log(`overrides applied: ${overridden}`);
console.log(`start types: ${JSON.stringify(kinds)}`);
if (staleOverrides.length) {
  console.error(`\nFAIL - overrides no longer match the data:\n  ${staleOverrides.join("\n  ")}`);
  process.exit(1);
}

// The user's worked example is the acceptance test for the automatic pipeline.
const ulhas = rivers.find((f) => f.properties.rivname === "Ulhas");
const u = out[String(ulhas.properties.UID_River)];
console.log(`\nUlhas: origin "${u.o}" | mouth near "${u.e}"`);
const ok = u.o === "Western Ghats near Lonavala, Maharashtra" && /^Vasai/.test(u.e);
console.log(ok ? "matches the worked example" : "DOES NOT match the worked example");
