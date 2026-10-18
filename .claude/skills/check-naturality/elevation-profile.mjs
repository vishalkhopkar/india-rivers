// Prints the ground elevation along a river's line and across it, read from the elevation
// tiles (GeoTIFF) the owner keeps in the repo root, to help judge whether the line follows
// a natural valley: does it run downhill, and is it the low point of the ground around it?
// Read-only. The tiles are reference files: never commit them or publish anything from them.
//
//   node .claude/skills/check-naturality/elevation-profile.mjs <uid>
//   node .claude/skills/check-naturality/elevation-profile.mjs --line <lat,lon> <lat,lon> ...
//   options: --tile <file.tif>   use this tile too (repeat for several); without it, every
//                                *.tif under a P5_PAN_CD_* folder in the repo root is used
//            --step <km>         spacing of the sample points (default: 30 points, 0.1 km at least)
//
// A river's line comes from build/rivers.ndjson (gitignored; `npm run data:extract && npm
// run data:added` recreates it). --line is for a candidate that is not on the map: give
// its points in order, source first.
//
// The tiles are read by dem.mjs, which says what kind of GeoTIFF it takes.

import { existsSync, createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { distKm, partsOf } from "../../../scripts/lib/geo.mjs";
import { findTiles, openTiles } from "./dem.mjs";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
// How far to each side the ground is sampled across the line, in metres.
const CROSS_M = [150, 300];
// The line counts as the low point if no cross sample is lower than it by more than this.
// A 30 m grid cannot see a channel a few metres wide, so an exact minimum is too strict.
const FLOOR_TOLERANCE_M = 1;

const fail = (msg) => { console.error(msg); process.exit(2); };

// --- arguments ------------------------------------------------------------------
const args = process.argv.slice(2);
const tilePaths = [];
let stepKm = null, uid = null;
const linePoints = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--tile") tilePaths.push(args[++i]);
  else if (a === "--step") stepKm = Number(args[++i]);
  else if (a === "--line") continue;
  else if (/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(a)) linePoints.push(a.split(",").map(Number));
  else if (/^\d+$/.test(a)) uid = a;
  else fail(`unknown argument "${a}"`);
}
if ((!uid && linePoints.length < 2) || (stepKm !== null && !(stepKm > 0)))
  fail("usage: elevation-profile.mjs <uid> | --line <lat,lon> <lat,lon> ...  [--tile <file.tif>] [--step <km>]");

// --- tiles ----------------------------------------------------------------------
if (!tilePaths.length) tilePaths.push(...findTiles(ROOT));
let tiles, elevation, missing;
try { ({ tiles, elevation, missing } = openTiles(tilePaths)); } catch (e) { fail(e.message); }

// --- the line -------------------------------------------------------------------
let parts, title;
if (uid) {
  const path = ROOT + "build/rivers.ndjson";
  if (!existsSync(path)) fail("build/rivers.ndjson is missing: run `npm run data:extract && npm run data:added`, or give the points with --line");
  const rl = createInterface({ input: createReadStream(path), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line) continue;
    const p = JSON.parse(line.slice(0, line.indexOf(',"geometry"')) + "}").properties;
    if (String(p.UID_River) !== uid) continue;
    parts = partsOf(JSON.parse(line).geometry);
    title = `${uid} ${p.rivname || "(unnamed)"}`;
    rl.close();
    break;
  }
  if (!parts) fail(`no river with uid ${uid} in build/rivers.ndjson`);
} else {
  parts = [linePoints.map(([lat, lon]) => [lon, lat])];
  title = "the given line";
}

const lengthOf = (part) => part.slice(1).reduce((sum, p, i) => sum + distKm(part[i][0], part[i][1], p[0], p[1]), 0);
// Points every `step` km along a part, each with the direction the line is heading there.
function sample(part, step) {
  const out = [];
  let walked = 0, next = 0;
  for (let i = 1; i < part.length; i++) {
    const [x0, y0] = part[i - 1], [x1, y1] = part[i];
    const seg = distKm(x0, y0, x1, y1);
    while (seg > 0 && next <= walked + seg) {
      const f = (next - walked) / seg;
      out.push({ km: next, lon: x0 + (x1 - x0) * f, lat: y0 + (y1 - y0) * f, dx: x1 - x0, dy: y1 - y0 });
      next += step;
    }
    walked += seg;
  }
  const [x, y] = part.at(-1), [px, py] = part.at(-2);
  if (!out.length || walked - out.at(-1).km > step / 4) out.push({ km: walked, lon: x, lat: y, dx: x - px, dy: y - py });
  return out;
}

const fmt = (v) => (Number.isNaN(v) ? "   -  " : v.toFixed(1).padStart(6));
console.log(`${title}: ${parts.length} part(s), ${parts.reduce((s, p) => s + lengthOf(p), 0).toFixed(1)} km. Tiles: ${tiles.length ? tiles.map((t) => t.path.split("/").at(-1)).join(", ") : "none found"}`);
console.log(`Elevation in metres. "across" is the ground ${CROSS_M.at(-1)} m and ${CROSS_M[0]} m to the left of the line, then the same to the right.`);

parts.forEach((part, n) => {
  if (part.length < 2) return;
  const length = lengthOf(part);
  const points = sample(part, stepKm ?? Math.max(0.1, length / 30));
  if (parts.length > 1) console.log(`\npart ${n + 1} of ${parts.length}, ${length.toFixed(1)} km`);
  console.log("    km      lat       lon    line   across (left ... right)          low point?");
  let rises = 0, biggestRise = 0, floors = 0, known = 0, previous = NaN;
  const heights = [];
  for (const p of points) {
    const here = elevation(p.lon, p.lat);
    // unit vector to the left of the heading, in metres
    const mx = p.dx * Math.cos((p.lat * Math.PI) / 180), my = p.dy, norm = Math.hypot(mx, my) || 1;
    const side = (metres) => elevation(p.lon + ((-my / norm) * metres) / (111320 * Math.cos((p.lat * Math.PI) / 180)), p.lat + ((mx / norm) * metres) / 111320);
    const across = [...CROSS_M.toReversed().map((m) => side(m)), ...CROSS_M.map((m) => side(-m))];
    const ok = !Number.isNaN(here) && !across.some(Number.isNaN);
    const floor = ok && across.every((v) => v >= here - FLOOR_TOLERANCE_M);
    if (!Number.isNaN(here)) {
      heights.push(here);
      if (here > previous + FLOOR_TOLERANCE_M) { rises++; biggestRise = Math.max(biggestRise, here - previous); }
      previous = here;
    }
    if (ok) { known++; if (floor) floors++; }
    console.log(`${p.km.toFixed(2).padStart(6)}  ${p.lat.toFixed(4).padStart(7)}  ${p.lon.toFixed(4).padStart(8)}  ${fmt(here)}   ${across.map(fmt).join(" ")}    ${ok ? (floor ? "yes" : "no") : "-"}`);
  }
  if (!heights.length) { console.log("  no elevation for this part: no tile covers it"); return; }
  console.log(
    `  first point ${heights[0].toFixed(1)} m, last point ${heights.at(-1).toFixed(1)} m: ${heights[0] >= heights.at(-1) ? "falls" : "RISES"} ${Math.abs(heights[0] - heights.at(-1)).toFixed(1)} m along the line as drawn. ` +
    `${rises} of ${heights.length - 1} steps climb by more than ${FLOOR_TOLERANCE_M} m (largest ${biggestRise.toFixed(1)} m). ` +
    `The line is the low point of its cross-line at ${floors} of ${known} points.`
  );
});

if (missing.size)
  console.log(`\nNo tile covers part of this line. One-degree squares needed (south-west corner): ${[...missing].sort().join(", ")}. Ask the owner for them.`);
