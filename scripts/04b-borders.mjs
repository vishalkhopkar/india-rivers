// Builds public/borders.pmtiles from the hand-assembled border lines in data/borders/.
//
//   node scripts/04b-borders.mjs [inputDir] [outFile]      (npm run data:borders)
//
// Every *.geojson in the input directory is one "part" (the external boundary, and the
// state borders by region). The parts are checked against the data contract first; any
// error stops the build before anything is written.
//
// Unlike the rivers, borders have no tiers: every line is in every zoom. The archive is
// small enough to write directly (scripts/lib/pmtiles-writer.mjs), so this step needs
// neither MBTiles nor the go-pmtiles binary.

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createInterface } from "node:readline";
import { createReadStream } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import geojsonvt from "geojson-vt";
import vtpbf from "vt-pbf";
import { distKm, pointToLineKm, partsOf, bboxOf } from "./lib/geo.mjs";
import { buildPMTiles } from "./lib/pmtiles-writer.mjs";
import { BORDER_LAYER, BORDER_MIN_ZOOM, BORDER_MAX_ZOOM, BORDER_KINDS } from "./lib/borders.mjs";

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const IN_DIR = args[0] ?? "data/borders";
const OUT = args[1] ?? "public/borders.pmtiles";
const EXTENT = 4096;

// Where a coordinate may be (the contract's sanity box for India).
const LON = [67, 98], LAT = [5, 38];
// A river-border stretch must lie on its river; this is how far a vertex may be off it.
const ON_RIVER_KM = 0.03;

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

// --- read and validate ------------------------------------------------------------
if (!existsSync(IN_DIR)) {
  console.error(`${IN_DIR} does not exist - nothing to build`);
  process.exit(1);
}
const files = readdirSync(IN_DIR).filter((f) => f.endsWith(".geojson")).sort();
if (!files.length) {
  console.error(`no .geojson parts in ${IN_DIR} - nothing to build`);
  process.exit(1);
}

const lineKm = (c) => {
  let km = 0;
  for (let i = 1; i < c.length; i++) km += distKm(c[i - 1][0], c[i - 1][1], c[i][0], c[i][1]);
  return km;
};

const features = []; // { file, kind, name, river, rlen, coords, km }
const perFile = [];
let droppedRepeats = 0, unrounded = 0;

for (const file of files) {
  let fc;
  try {
    fc = JSON.parse(readFileSync(join(IN_DIR, file), "utf8"));
  } catch (e) {
    err(`${file}: not valid JSON (${e.message})`);
    continue;
  }
  if (fc?.type !== "FeatureCollection" || !Array.isArray(fc.features)) {
    err(`${file}: not a FeatureCollection`);
    continue;
  }
  if (!fc.features.length) warn(`${file}: no features`);
  const stats = { file, n: 0, km: 0 };
  fc.features.forEach((f, i) => {
    const p = f?.properties ?? {};
    const at = `${file} #${i}${p.name ? ` (${p.name})` : ""}`;
    const before = errors.length;

    if (!BORDER_KINDS.includes(p.kind)) err(`${at}: kind must be one of ${BORDER_KINDS.join(", ")}, got ${JSON.stringify(p.kind)}`);
    if (typeof p.name !== "string" || !p.name.trim()) err(`${at}: name is missing`);
    if (typeof p.src !== "string" || !p.src.trim()) err(`${at}: src is missing`);
    if (("river" in p) !== ("rlen" in p)) err(`${at}: river and rlen go together`);
    if ("river" in p && (typeof p.river !== "string" || !p.river)) err(`${at}: river must be the river's uid as a string`);
    if ("rlen" in p && !(Number.isInteger(p.rlen) && p.rlen > 0)) err(`${at}: rlen must be a whole number of km`);

    const g = f?.geometry;
    if (g?.type !== "LineString" || !Array.isArray(g.coordinates)) {
      err(`${at}: geometry must be a LineString, got ${g?.type}`);
      return;
    }
    const coords = [];
    for (const c of g.coordinates) {
      if (!Array.isArray(c) || !Number.isFinite(c[0]) || !Number.isFinite(c[1])) {
        err(`${at}: a coordinate is not [lon, lat]`);
        return;
      }
      if (c[0] < LON[0] || c[0] > LON[1] || c[1] < LAT[0] || c[1] > LAT[1]) {
        err(`${at}: coordinate ${c[0]}, ${c[1]} is outside ${LON[0]}-${LON[1]} E, ${LAT[0]}-${LAT[1]} N`);
        return;
      }
      if (Math.abs(c[0] * 1e5 - Math.round(c[0] * 1e5)) > 1e-4 || Math.abs(c[1] * 1e5 - Math.round(c[1] * 1e5)) > 1e-4) unrounded++;
      const last = coords[coords.length - 1];
      if (last && last[0] === c[0] && last[1] === c[1]) droppedRepeats++;
      else coords.push([c[0], c[1]]);
    }
    if (coords.length < 2) {
      err(`${at}: empty or single-point line`);
      return;
    }
    const km = lineKm(coords);
    if (km < 0.001) {
      err(`${at}: zero-length line`);
      return;
    }
    if (errors.length > before) return;

    if (p.kind === "state") {
      const pair = p.name.split("–");
      if (pair.length !== 2) warn(`${at}: a state border is named "A–B" with an en dash`);
      else if (pair[0].localeCompare(pair[1]) > 0) warn(`${at}: the two states are not in alphabetical order`);
    }
    features.push({ file, kind: p.kind, name: p.name.trim(), river: p.river, rlen: p.rlen, coords, km });
    stats.n++;
    stats.km += km;
  });
  perFile.push(stats);
}

// The same state pair drawn in two parts means two agents both took one border.
{
  const where = new Map();
  for (const f of features) {
    if (f.kind !== "state") continue;
    if (!where.has(f.name)) where.set(f.name, new Set());
    where.get(f.name).add(f.file);
  }
  for (const [name, set] of where) if (set.size > 1) warn(`"${name}" is drawn in more than one part: ${[...set].join(", ")}`);
}

// --- river-border stretches -----------------------------------------------------------
// A stretch that carries `river` has the river's own vertices and is drawn beside the
// river with a pixel offset, which goes to the right of the line's direction. Stretches
// are therefore all turned to run downstream, so the border keeps to one bank (the right
// bank) instead of hopping across wherever two stretches happen to be digitised in
// opposite directions.

// Returns a function giving a point's distance to the river's mouth, measured along the
// river. A braided river is many parts in no particular order or direction (the Sharda
// has 39), so the distance comes from a shortest-path pass over the parts, not from
// vertex order.
function kmToMouth(r) {
  const key = (c) => `${c[0]},${c[1]}`;
  const nodes = new Map(); // endpoint -> [{ to, km }]
  const partKm = r.parts.map((p) => lineKm(p));
  r.parts.forEach((p, i) => {
    const a = key(p[0]), b = key(p[p.length - 1]);
    if (!nodes.has(a)) nodes.set(a, []);
    if (!nodes.has(b)) nodes.set(b, []);
    nodes.get(a).push({ to: b, km: partKm[i] });
    nodes.get(b).push({ to: a, km: partKm[i] });
  });
  // The mouth is the part endpoint nearest the declared end; a river added without one
  // (01b) ends where its last part does.
  const lastPart = r.parts[r.parts.length - 1];
  const end = Number.isFinite(r.end?.[0]) && Number.isFinite(r.end?.[1]) ? r.end : lastPart[lastPart.length - 1];
  let mouth = null, mouthD = Infinity;
  for (const k of nodes.keys()) {
    const [x, y] = k.split(",").map(Number);
    const d = distKm(x, y, end[0], end[1]);
    if (d < mouthD) { mouthD = d; mouth = k; }
  }
  const dist = new Map([[mouth, 0]]);
  const open = new Set([mouth]);
  while (open.size) {
    let cur = null;
    for (const k of open) if (cur === null || dist.get(k) < dist.get(cur)) cur = k;
    open.delete(cur);
    for (const e of nodes.get(cur)) {
      const d = dist.get(cur) + e.km;
      if (d < (dist.get(e.to) ?? Infinity)) {
        dist.set(e.to, d);
        open.add(e.to);
      }
    }
  }
  // Every vertex: the shorter way out of its part, by either end. A part the pass never
  // reached (a gap in the river) falls back to the straight distance to the mouth.
  const flat = [];
  r.parts.forEach((p, i) => {
    const da = dist.get(key(p[0])), db = dist.get(key(p[p.length - 1]));
    let along = 0;
    p.forEach((c, j) => {
      if (j) along += distKm(p[j - 1][0], p[j - 1][1], c[0], c[1]);
      const km = da === undefined || db === undefined ? distKm(c[0], c[1], end[0], end[1]) : Math.min(da + along, db + partKm[i] - along);
      flat.push([c[0], c[1], km]);
    });
  });
  return ([x, y]) => {
    let best = 0, bestD = Infinity;
    for (const v of flat) {
      const d = distKm(x, y, v[0], v[1]);
      if (d < bestD) { bestD = d; best = v[2]; }
    }
    return best;
  };
}

function findRivers() {
  const flag = process.argv.find((a) => a.startsWith("--rivers="));
  const candidates = [flag?.slice(9), process.env.RIVERS_NDJSON, "build/rivers.ndjson"];
  try {
    // In a git worktree build/ is not copied; the main checkout's is next to its .git.
    const common = execFileSync("git", ["rev-parse", "--git-common-dir"], { encoding: "utf8" }).trim();
    candidates.push(join(dirname(resolve(common)), "build", "rivers.ndjson"));
  } catch {}
  return candidates.find((c) => c && existsSync(c));
}

const riverStretches = features.filter((f) => f.river);
if (riverStretches.length) {
  const path = findRivers();
  if (!path) {
    warn(`${riverStretches.length} river-border stretches not checked or oriented: build/rivers.ndjson not found (pass --rivers=<path>)`);
  } else {
    const wanted = new Set(riverStretches.map((f) => f.river));
    const rivers = new Map();
    const rl = createInterface({ input: createReadStream(path), crlfDelay: Infinity });
    for await (const line of rl) {
      const m = /"UID_River":"?([^",]+)"?/.exec(line);
      if (!m || !wanted.has(m[1])) continue;
      const r = JSON.parse(line);
      rivers.set(m[1], {
        parts: partsOf(r.geometry),
        len: r.properties.length_km,
        name: r.properties.rivname,
        end: [r.properties.en_pt_long, r.properties.en_pt_lat],
      });
    }
    let reversed = 0;
    for (const f of riverStretches) {
      const at = `${f.file} (${f.name})`;
      const r = rivers.get(f.river);
      if (!r) {
        err(`${at}: river ${f.river} is not in ${path}`);
        continue;
      }
      if (Math.round(r.len) !== f.rlen) warn(`${at}: rlen ${f.rlen} but river ${f.river} (${r.name}) is ${r.len.toFixed(1)} km`);
      const step = Math.max(1, Math.floor(f.coords.length / 200));
      let off = 0, worst = 0, n = 0;
      for (let i = 0; i < f.coords.length; i += step) {
        const d = pointToLineKm(f.coords[i][0], f.coords[i][1], r.parts);
        n++;
        if (d > ON_RIVER_KM) off++;
        if (d > worst) worst = d;
      }
      if (off) warn(`${at}: ${off} of ${n} sampled vertices are off river ${f.river} (${r.name}), up to ${(worst * 1000).toFixed(0)} m`);

      r.toMouth ??= kmToMouth(r);
      if (r.toMouth(f.coords[0]) < r.toMouth(f.coords[f.coords.length - 1])) {
        f.coords.reverse();
        reversed++;
      }
    }
    console.log(`river-border stretches: ${riverStretches.length} on ${rivers.size} rivers, ${reversed} turned to run downstream`);
  }
}

// --- report on the input ----------------------------------------------------------------
console.log(`\nparts in ${IN_DIR}:`);
for (const s of perFile) console.log(`  ${s.file.padEnd(34)} ${String(s.n).padStart(5)} features ${s.km.toFixed(0).padStart(7)} km`);
for (const kind of BORDER_KINDS) {
  const of = features.filter((f) => f.kind === kind);
  const onRiver = of.filter((f) => f.river);
  console.log(
    `  ${kind.padEnd(6)} ${String(of.length).padStart(5)} features ${of.reduce((s, f) => s + f.km, 0).toFixed(0).padStart(7)} km` +
      (onRiver.length ? `, of which ${onRiver.reduce((s, f) => s + f.km, 0).toFixed(0)} km along a river (${onRiver.length} stretches)` : "")
  );
}
if (droppedRepeats) console.log(`  ${droppedRepeats} repeated vertices dropped`);
if (unrounded) warn(`${unrounded} coordinates carry more than 5 decimals`);
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  WARN  ${w}`);
}
if (errors.length) {
  console.error(`\n${errors.length} error(s), nothing written:`);
  for (const e of errors) console.error(`  ERROR ${e}`);
  process.exit(1);
}
if (!features.length) {
  console.error("\nno features, nothing written");
  process.exit(1);
}

// --- tiles ----------------------------------------------------------------------------
// At the top zoom geojson-vt keeps every vertex, and the map overzooms from there. The
// rivers do the same from z11; one zoom deeper puts the borders on a finer grid than the
// river they may be drawn beside (about 2 m), and a river-border stretch, which is the
// river's own vertices, lands on the river's line at every zoom.
const index = new geojsonvt(
  {
    type: "FeatureCollection",
    features: features.map((f) => ({
      type: "Feature",
      // `src` stays in the repo's GeoJSON; the map has no use for it.
      properties: { kind: f.kind, name: f.name, ...(f.river ? { river: f.river, rlen: f.rlen } : {}) },
      geometry: { type: "LineString", coordinates: f.coords },
    })),
  },
  { maxZoom: BORDER_MAX_ZOOM, indexMaxZoom: 5, tolerance: 3, extent: EXTENT, buffer: 64, generateId: false }
);

const tiles = [];
const perZoom = new Map();
function walk(z, x, y) {
  const tile = index.getTile(z, x, y);
  if (!tile || !tile.features.length) return;
  if (z >= BORDER_MIN_ZOOM) {
    const data = gzipSync(vtpbf.fromGeojsonVt({ [BORDER_LAYER]: tile }, { version: 2, extent: EXTENT }), { level: 9 });
    tiles.push({ z, x, y, data });
    const s = perZoom.get(z) ?? { n: 0, b: 0, max: 0 };
    s.n++; s.b += data.length; s.max = Math.max(s.max, data.length);
    perZoom.set(z, s);
  }
  if (z >= BORDER_MAX_ZOOM) return;
  for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) walk(z + 1, x * 2 + dx, y * 2 + dy);
}
walk(0, 0, 0);

const bbox = bboxOf(features.map((f) => f.coords));
const archive = buildPMTiles(tiles, {
  minZoom: BORDER_MIN_ZOOM,
  maxZoom: BORDER_MAX_ZOOM,
  bounds: bbox,
  center: [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2, 4],
  metadata: {
    name: "India borders",
    description: "India's external boundary, the Line of Control and Line of Actual Control, and state/UT borders",
    attribution: "© OpenStreetMap contributors",
    type: "overlay",
    version: "1",
    vector_layers: [
      {
        id: BORDER_LAYER,
        minzoom: BORDER_MIN_ZOOM,
        maxzoom: BORDER_MAX_ZOOM,
        fields: { kind: "String", name: "String", river: "String", rlen: "Number" },
      },
    ],
  },
});
writeFileSync(OUT, archive.buffer);

console.log(`\nzoom   tiles      total      mean     largest`);
const kb = (n) => (n / 1024).toFixed(1).padStart(8) + " KB";
for (let z = BORDER_MIN_ZOOM; z <= BORDER_MAX_ZOOM; z++) {
  const s = perZoom.get(z);
  if (s) console.log(`  ${String(z).padStart(2)} ${String(s.n).padStart(7)} ${kb(s.b)} ${kb(s.b / s.n)} ${kb(s.max)}`);
}
console.log(
  `\n${archive.tiles.toLocaleString()} tiles (${archive.contents.toLocaleString()} distinct), ` +
    `${archive.leafDirectories} leaf directories, ${(archive.buffer.length / 1048576).toFixed(2)} MB -> ${OUT}`
);
