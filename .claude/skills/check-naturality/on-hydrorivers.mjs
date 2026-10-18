// Says whether a river or stream runs along a HydroRIVERS drainage line. HydroRIVERS
// (HydroSHEDS) is not a survey of channels: each line is worked out from elevation data,
// as the path water takes downhill once about 10 km2 of ground drains into it. A river that
// lies on one is in a valley the terrain made, and is not a channel built across the
// terrain. Read-only, and needs no elevation tile: it covers the whole country.
//
//   node .claude/skills/check-naturality/on-hydrorivers.mjs <uid> [<uid> ...]
//   node .claude/skills/check-naturality/on-hydrorivers.mjs --line <lat,lon> <lat,lon> ...
//   node .claude/skills/check-naturality/on-hydrorivers.mjs --lines <file.json>
//   options: --json        print the results as JSON, one object per river
//            --step <km>   spacing of the sample points (default 0.1 km, at most 400 points)
//
// A river's line comes from build/rivers.ndjson (gitignored; `npm run data:extract && npm
// run data:added` recreates it). --line is for a candidate that is not on the map: give its
// points in order, source first. --lines takes several candidates in one run, from a JSON
// file of the form { "<name>": [[lat, lon], [lat, lon], ...], ... }. HydroRIVERS is data/raw/HydroRIVERS_v10_as.shp (gitignored;
// `npm run data:fetch` downloads it). Reading it takes about half a minute.
//
// For each river it prints:
//   On a HydroRIVERS line   true or false: true when ON_SHARE of the river's points lie
//                           within NEAR_KM of a HydroRIVERS line and the river runs the same
//                           way as it, downstream
//   Share on the line       that share
//   Drains                  the ground draining to the HydroRIVERS line where the river
//                           leaves it, in km2
//
// What it cannot say:
//   - `false` does not mean built. HydroRIVERS has no line for a valley that drains less
//     than about 10 km2, so the head of every river and the whole of a small stream are off
//     it. The output says when a river is too small or too short for the answer to count.
//   - `true` does not mean the channel is natural. A drain built along a natural valley
//     (Bengaluru's rajakaluves) lies on these lines too, and the line shows where water
//     would collect, not that a stream is there today.
//   - A river the map drew from HydroRIVERS itself ("course from HydroSHEDS") is on the line
//     by construction: for it the result is no extra evidence, and the output says so.
// The lines come from a grid of about 450 m and can lie 200 to 300 m off the valley floor,
// which is why NEAR_KM is as wide as it is.

import { existsSync, readFileSync, createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { open } from "shapefile";
import { distKm, partsOf, bboxOf } from "../../../scripts/lib/geo.mjs";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const HYDRO = ROOT + "data/raw/HydroRIVERS_v10_as";

const NEAR_KM = 0.5;
const ON_SHARE = 0.5;
const MAX_POINTS = 400;
// HydroRIVERS starts a line where about this much ground drains to it...
const HYDRO_MIN_SKM = 10;
// ...so a river shorter than this may lie wholly above the first line of its valley.
const SHORT_KM = 5;

const fail = (msg) => { console.error(msg); process.exit(2); };

// --- arguments ------------------------------------------------------------------
const args = process.argv.slice(2);
const uids = [], linePoints = [], named = [];
let stepKm = null, json = false, debug = false;
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--json") json = true;
  else if (a === "--debug") debug = true;
  else if (a === "--step") stepKm = Number(args[++i]);
  else if (a === "--line") continue;
  else if (a === "--lines") {
    const file = args[++i];
    if (!file || !existsSync(file)) fail(`no such file: ${file}`);
    for (const [name, pts] of Object.entries(JSON.parse(readFileSync(file, "utf8")))) named.push({ uid: null, name, src: "", parts: [pts.map(([lat, lon]) => [lon, lat])] });
  }
  else if (/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(a)) linePoints.push(a.split(",").map(Number));
  else if (/^\d+$/.test(a)) uids.push(a);
  else fail(`unknown argument "${a}"`);
}
if ((!uids.length && !named.length && linePoints.length < 2) || (stepKm !== null && !(stepKm > 0)))
  fail("usage: on-hydrorivers.mjs <uid> [<uid> ...] | --line <lat,lon> <lat,lon> ... | --lines <file.json>  [--json] [--step <km>]");
if (!existsSync(HYDRO + ".shp")) fail("data/raw/HydroRIVERS_v10_as.shp is missing: run `npm run data:fetch`");

// --- the lines ------------------------------------------------------------------
const rivers = [];
if (uids.length) {
  const path = ROOT + "build/rivers.ndjson";
  if (!existsSync(path)) fail("build/rivers.ndjson is missing: run `npm run data:extract && npm run data:added`, or give the points with --line");
  const want = new Set(uids);
  const found = new Map();
  const rl = createInterface({ input: createReadStream(path), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line) continue;
    const p = JSON.parse(line.slice(0, line.indexOf(',"geometry"')) + "}").properties;
    const uid = String(p.UID_River);
    if (!want.has(uid)) continue;
    found.set(uid, { uid, name: p.rivname || "(unnamed)", src: p.src ?? "", parts: partsOf(JSON.parse(line).geometry) });
    if (found.size === want.size) { rl.close(); break; }
  }
  for (const uid of uids) {
    if (!found.has(uid)) fail(`no river with uid ${uid} in build/rivers.ndjson`);
    rivers.push(found.get(uid));
  }
}
if (linePoints.length >= 2) rivers.push({ uid: null, name: "the given line", src: "", parts: [linePoints.map(([lat, lon]) => [lon, lat])] });
rivers.push(...named);

// A river's parts as lines that run source to mouth. Parts that run on from one another are
// joined (the dataset sometimes stores them mouth half first); the rest stay apart.
function linesOf(parts) {
  const runOn = (ps) => ps.every((q, i) => !i || distKm(...ps[i - 1].at(-1), ...q[0]) <= 0.05);
  const join = (ps) => [ps.flatMap((q, i) => (i ? q.slice(1) : q))];
  parts = parts.filter((p) => p.length >= 2);
  if (parts.length > 1 && runOn(parts)) return join(parts);
  if (parts.length > 1 && runOn(parts.toReversed())) return join(parts.toReversed());
  return parts;
}
const lengthOf = (line) => line.slice(1).reduce((sum, p, i) => sum + distKm(line[i][0], line[i][1], p[0], p[1]), 0);
function sample(line, step) {
  const out = [];
  let walked = 0, next = 0;
  for (let i = 1; i < line.length; i++) {
    const [x0, y0] = line[i - 1], [x1, y1] = line[i];
    const seg = distKm(x0, y0, x1, y1);
    while (seg > 0 && next <= walked + seg) {
      const f = (next - walked) / seg;
      out.push([x0 + (x1 - x0) * f, y0 + (y1 - y0) * f]);
      next += step;
    }
    walked += seg;
  }
  out.push(line.at(-1));
  return out;
}
for (const r of rivers) {
  r.lines = linesOf(r.parts);
  r.lengthKm = r.lines.reduce((s, l) => s + lengthOf(l), 0);
  r.points = r.lines.flatMap((l) => sample(l, stepKm ?? Math.max(0.1, r.lengthKm / MAX_POINTS)));
  const [x0, y0, x1, y1] = bboxOf(r.lines);
  r.box = [x0 - 0.02, y0 - 0.02, x1 + 0.02, y1 + 0.02];
}

// --- HydroRIVERS reaches near the lines -------------------------------------------
const reaches = [];
{
  const all = rivers.map((r) => r.box);
  const box = [Math.min(...all.map((b) => b[0])), Math.min(...all.map((b) => b[1])), Math.max(...all.map((b) => b[2])), Math.max(...all.map((b) => b[3]))];
  const src = await open(HYDRO + ".shp", HYDRO + ".dbf");
  while (true) {
    const { done, value } = await src.read();
    if (done) break;
    const c = value.geometry.coordinates;
    if (!c.some(([x, y]) => x >= box[0] && x <= box[2] && y >= box[1] && y <= box[3])) continue;
    const xs = c.map((p) => p[0]), ys = c.map((p) => p[1]);
    reaches.push({ id: value.properties.HYRIV_ID, upland: value.properties.UPLAND_SKM, c, box: [Math.min(...xs) - 0.01, Math.min(...ys) - 0.01, Math.max(...xs) + 0.01, Math.max(...ys) + 0.01] });
  }
}

// Distance from a point to a line, with how far along the line (0 to 1) the nearest point is.
function toLine(lon, lat, c) {
  const kx = Math.cos((lat * Math.PI) / 180);
  let best = Infinity, at = 0, walked = 0, total = 0;
  const segs = c.slice(1).map((b, i) => Math.hypot((b[0] - c[i][0]) * kx, b[1] - c[i][1]));
  total = segs.reduce((s, v) => s + v, 0) || 1;
  for (let i = 0; i + 1 < c.length; i++) {
    const ax = (c[i][0] - lon) * kx, ay = c[i][1] - lat, bx = (c[i + 1][0] - lon) * kx, by = c[i + 1][1] - lat;
    const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
    const d = Math.hypot(ax + t * dx, ay + t * dy) * 111.32;
    if (d < best) { best = d; at = (walked + t * segs[i]) / total; }
    walked += segs[i];
  }
  return { d: best, at };
}

function judge(r) {
  const near = reaches.filter((h) => h.box[0] <= r.box[2] && h.box[2] >= r.box[0] && h.box[1] <= r.box[3] && h.box[3] >= r.box[1]);
  // for each point of the river, the HydroRIVERS reach it lies on, if any
  const hits = r.points.map(([x, y]) => {
    let best = null;
    for (const h of near) {
      if (x < h.box[0] || x > h.box[2] || y < h.box[1] || y > h.box[3]) continue;
      const m = toLine(x, y, h.c);
      if (m.d <= NEAR_KM && (!best || m.d < best.d)) best = { ...m, h };
    }
    return best;
  });
  const on = hits.filter(Boolean);
  const share = on.length / r.points.length;
  // Downstream, the ground draining to the line grows, and within one reach the river moves
  // on along it. The river runs the same way if it gains more often than it loses.
  let withFlow = 0, against = 0;
  for (let i = 1; i < on.length; i++) {
    const a = on[i - 1], b = on[i];
    const step = a.h === b.h ? b.at - a.at : b.h.upland - a.h.upland;
    if (step > 0) withFlow++;
    else if (step < 0) against++;
  }
  const sameWay = on.length < 2 || withFlow >= against;
  const drains = on.length ? on.at(-1).h.upland : null;
  const largest = on.length ? Math.max(...on.map((o) => o.h.upland)) : null;
  const notes = [];
  if (r.src === "HydroSHEDS") notes.push("the map drew this river from HydroRIVERS itself, so it is on the line by construction: no extra evidence");
  if (share < ON_SHARE && r.lengthKm < SHORT_KM) notes.push(`a river of ${r.lengthKm.toFixed(1)} km may lie above the first HydroRIVERS line of its valley (they start at about ${HYDRO_MIN_SKM} km2): false is weak evidence here`);
  if (share >= ON_SHARE && !sameWay) notes.push("it lies along a HydroRIVERS line but runs against it, upstream: check that the line is drawn source first");
  if (share > 0 && share < ON_SHARE) notes.push(`it meets a HydroRIVERS line for ${Math.round(share * 100)}% of its points only: it may cross a valley, or follow one for its lower course`);
  return {
    uid: r.uid, name: r.name, lengthKm: +r.lengthKm.toFixed(2),
    onHydroRivers: share >= ON_SHARE && sameWay,
    shareOnLine: +share.toFixed(3),
    runsSameWay: on.length < 2 ? null : sameWay,
    drainsSkm: drains, largestSkm: largest,
    reaches: [...new Set(on.map((o) => o.h.id))],
    notes,
  };
}

// --- report ---------------------------------------------------------------------
const results = rivers.map(judge);
if (debug) {
  for (const r of results) console.log([r.uid ?? "-", r.onHydroRivers, r.lengthKm, r.shareOnLine, r.runsSameWay, r.drainsSkm, r.name].join("\t"));
} else if (json) {
  console.log(JSON.stringify(results, null, 2));
} else {
  for (const r of results) {
    console.log(`${r.uid ? r.uid + " " : ""}${r.name}, ${r.lengthKm.toFixed(1)} km`);
    console.log(`  On a HydroRIVERS line: ${r.onHydroRivers}`);
    console.log(`  Share on the line:     ${Math.round(r.shareOnLine * 100)}% of its points within ${NEAR_KM} km${r.runsSameWay === null ? "" : r.runsSameWay ? ", running the same way" : ", running AGAINST it"}`);
    console.log(`  Drains:                ${r.drainsSkm === null ? "-" : `${r.drainsSkm} km2 where the river leaves the line (${r.reaches.length} HydroRIVERS reach${r.reaches.length === 1 ? "" : "es"})`}`);
    for (const t of r.notes) console.log(`  note: ${t}`);
  }
}
