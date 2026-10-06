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
// The reader is small on purpose and handles what the owner's Cartosat (CartoDEM) 30 m
// tiles are: an uncompressed, single-band, north-up GeoTIFF in latitude and longitude. It
// says so and stops on anything else.

import { openSync, readSync, readdirSync, existsSync, statSync, createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { distKm, partsOf } from "../../../scripts/lib/geo.mjs";

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
if (!tilePaths.length) {
  const walk = (dir, depth) => {
    for (const name of readdirSync(dir)) {
      const p = `${dir}/${name}`;
      if (statSync(p).isDirectory()) { if (depth < 3) walk(p, depth + 1); }
      else if (/\.tif$/i.test(name)) tilePaths.push(p);
    }
  };
  for (const name of readdirSync(ROOT))
    if (name.startsWith("P5_PAN_CD_") && statSync(ROOT + name).isDirectory()) walk(ROOT + name, 0);
}

function openTile(path) {
  if (!existsSync(path)) fail(`no such tile: ${path}`);
  const fd = openSync(path, "r");
  const read = (offset, length) => { const b = Buffer.alloc(length); readSync(fd, b, 0, length, offset); return b; };
  const head = read(0, 8);
  const order = head.toString("latin1", 0, 2);
  if (order !== "II" && order !== "MM") fail(`${path}: not a TIFF file`);
  const le = order === "II";
  const u16 = (b, o) => (le ? b.readUInt16LE(o) : b.readUInt16BE(o));
  const u32 = (b, o) => (le ? b.readUInt32LE(o) : b.readUInt32BE(o));
  const f64 = (b, o) => (le ? b.readDoubleLE(o) : b.readDoubleBE(o));
  if (u16(head, 2) !== 42) fail(`${path}: not a classic TIFF (BigTIFF is not supported)`);
  const ifd = u32(head, 4);
  const count = u16(read(ifd, 2), 0);
  const entries = read(ifd + 2, count * 12);
  const SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 12: 8 };
  const tags = new Map();
  for (let i = 0; i < count; i++) {
    const o = i * 12, type = u16(entries, o + 2), n = u32(entries, o + 4);
    const bytes = (SIZE[type] ?? 1) * n;
    const buf = bytes <= 4 ? entries.subarray(o + 8, o + 12) : read(u32(entries, o + 8), bytes);
    const values = type === 2 ? buf.toString("latin1").replace(/\0/g, "").trim()
      : Array.from({ length: n }, (_, k) => (type === 3 ? u16(buf, k * 2) : type === 4 ? u32(buf, k * 4) : type === 12 ? f64(buf, k * 8) : buf[k]));
    tags.set(u16(entries, o), values);
  }
  const one = (tag, fallback) => tags.get(tag)?.[0] ?? fallback;
  const width = one(256), height = one(257), bits = one(258), format = one(339, 1);
  const rowsPerStrip = one(278, height), offsets = tags.get(273);
  const scale = tags.get(33550), tie = tags.get(33922);
  if (one(259, 1) !== 1) fail(`${path}: the tile is compressed; this reader takes uncompressed tiles only`);
  if (one(277, 1) !== 1 || !offsets) fail(`${path}: expected one band stored in strips`);
  if (!scale || !tie) fail(`${path}: no georeferencing (pixel scale and tie point) in the file`);
  const get = format === 3 && bits === 32 ? (b, o) => (le ? b.readFloatLE(o) : b.readFloatBE(o))
    : format === 2 && bits === 16 ? (b, o) => (le ? b.readInt16LE(o) : b.readInt16BE(o))
    : format === 2 && bits === 32 ? (b, o) => (le ? b.readInt32LE(o) : b.readInt32BE(o))
    : format === 1 && bits === 16 ? u16
    : fail(`${path}: unsupported sample type (format ${format}, ${bits} bits)`);
  const nodata = tags.has(42113) ? Number(tags.get(42113)) : null;
  // tie point: pixel (i, j) sits at (x, y); y falls as rows go down
  const west = tie[3] - tie[0] * scale[0], north = tie[4] + tie[1] * scale[1];
  const rows = new Map();
  const row = (r) => {
    if (!rows.has(r)) rows.set(r, read(offsets[Math.floor(r / rowsPerStrip)] + (r % rowsPerStrip) * width * (bits / 8), width * (bits / 8)));
    return rows.get(r);
  };
  const cell = (c, r) => {
    const v = get(row(Math.min(height - 1, Math.max(0, r))), Math.min(width - 1, Math.max(0, c)) * (bits / 8));
    return v === nodata ? NaN : v;
  };
  return {
    path,
    covers: (lon, lat) => lon >= west && lon <= west + width * scale[0] && lat <= north && lat >= north - height * scale[1],
    // bilinear between the four nearest cell centres
    at(lon, lat) {
      const x = (lon - west) / scale[0] - 0.5, y = (north - lat) / scale[1] - 0.5;
      const c = Math.floor(x), r = Math.floor(y), fx = x - c, fy = y - r;
      const v = [cell(c, r), cell(c + 1, r), cell(c, r + 1), cell(c + 1, r + 1)];
      if (v.some(Number.isNaN)) return NaN;
      return v[0] * (1 - fx) * (1 - fy) + v[1] * fx * (1 - fy) + v[2] * (1 - fx) * fy + v[3] * fx * fy;
    },
  };
}
const tiles = tilePaths.map(openTile);
const missing = new Set();
function elevation(lon, lat) {
  const tile = tiles.find((t) => t.covers(lon, lat));
  const v = tile ? tile.at(lon, lat) : NaN;
  if (!tile) {
    const ns = lat >= 0 ? "N" : "S", ew = lon >= 0 ? "E" : "W";
    missing.add(`${ns}${String(Math.abs(Math.floor(lat))).padStart(2, "0")} ${ew}${String(Math.abs(Math.floor(lon))).padStart(3, "0")}`);
  }
  return v;
}

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
