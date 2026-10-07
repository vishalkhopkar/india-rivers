// Says whether a river or stream follows the terrain of an elevation tile (CartoDEM): does
// it run downhill along the floor of a valley, the way water would lay it out, or does it
// climb, cut across a slope or run along a ridge, the way only a built channel can?
// Read-only. The tiles are reference files: never commit them or publish anything from them.
//
//   node .claude/skills/check-naturality/follows-terrain.mjs [<dem.tif> ...] <uid> [<uid> ...]
//   node .claude/skills/check-naturality/follows-terrain.mjs [<dem.tif> ...] --line <lat,lon> <lat,lon> ...
//   options: --json        print the results as JSON, one object per river
//            --step <km>   spacing of the sample points (default 0.1 km, at most 400 points)
//
// Without a tile, every *.tif under a P5_PAN_CD_* folder in the repo root is used. A river's
// line comes from build/rivers.ndjson (gitignored; `npm run data:extract && npm run
// data:added` recreates it). --line is for a candidate that is not on the map: give its
// points in order, source first.
//
// For each river it prints:
//   Follows terrain   true or false ("unknown" if the tiles cover less than 90% of the line)
//   Drop in elevation metres from the first point to the last, along the line as drawn
//   Rate of drop      that drop per kilometre of line
//
// "Follows terrain" is true when all of these hold:
//   - the line ends lower than it starts;
//   - it runs downhill: DOWNHILL_SHARE of its points are no higher than the lowest point
//     reached so far, give or take CLIMB_TOLERANCE_M;
//   - it never climbs more than MAX_CLIMB_M above the lowest point reached so far, or
//     MAX_CLIMB_SHARE of its whole drop if that is more (a line that does has left its valley);
//   - it lies in the low ground: at FLOOR_SHARE of its points nothing to either side, out to
//     300 m, is lower than the line. A channel cut across a slope has lower ground on one
//     side; one along a ridge has it on both.
// The limits were set on Bengaluru's rivers (tiles N12 and N13 E077): see the skill.
//
// What it cannot see: a 30 m grid does not resolve a channel a few metres wide, and on flat
// ground every line passes. A rate of drop under FLAT_M_PER_KM is flagged as weak evidence.
// Built channels that were laid along natural valleys (Bengaluru's rajakaluves) pass too:
// "follows terrain" is evidence for the naturality check, not its verdict.
//
// Heights in the tiles are above the WGS 84 ellipsoid, not above sea level, so only the
// differences are printed.

import { existsSync, createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { distKm, partsOf } from "../../../scripts/lib/geo.mjs";
import { findTiles, openTiles } from "./dem.mjs";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));

const DOWNHILL_SHARE = 0.7;
const CLIMB_TOLERANCE_M = 3;
const MAX_CLIMB_M = 12;
// ...or this share of the whole drop, if that is more: in steep ground a line drawn a cell
// off the channel is already many metres up the valley side.
const MAX_CLIMB_SHARE = 0.1;
const FLOOR_SHARE = 0.5;
// The line may be drawn a cell or two off the channel, so its height is the lowest ground
// within this distance to either side.
const CHANNEL_M = 60;
// The ground the channel is compared with, to each side.
const CROSS_M = [150, 300];
const FLOOR_TOLERANCE_M = 1;
const MIN_COVER = 0.9;
const FLAT_M_PER_KM = 0.5;
const MAX_POINTS = 400;

const fail = (msg) => { console.error(msg); process.exit(2); };

// --- arguments ------------------------------------------------------------------
const args = process.argv.slice(2);
const tilePaths = [], uids = [], linePoints = [];
let stepKm = null, json = false, debug = false;
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--json") json = true;
  else if (a === "--debug") debug = true;
  else if (a === "--step") stepKm = Number(args[++i]);
  else if (a === "--tile") tilePaths.push(args[++i]);
  else if (a === "--line") continue;
  else if (/\.tiff?$/i.test(a)) tilePaths.push(a);
  else if (/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(a)) linePoints.push(a.split(",").map(Number));
  else if (/^\d+$/.test(a)) uids.push(a);
  else fail(`unknown argument "${a}"`);
}
if ((!uids.length && linePoints.length < 2) || (stepKm !== null && !(stepKm > 0)))
  fail("usage: follows-terrain.mjs [<dem.tif> ...] <uid> [<uid> ...] | --line <lat,lon> <lat,lon> ...  [--json] [--step <km>]");

if (!tilePaths.length) tilePaths.push(...findTiles(ROOT));
if (!tilePaths.length) fail("no elevation tile: give a CartoDEM .tif, or put its P5_PAN_CD_* folder in the repo root");
let elevation, missing;
try { ({ elevation, missing } = openTiles(tilePaths)); } catch (e) { fail(e.message); }

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
    found.set(uid, { uid, name: p.rivname || "(unnamed)", parts: partsOf(JSON.parse(line).geometry) });
    if (found.size === want.size) { rl.close(); break; }
  }
  for (const uid of uids) {
    if (!found.has(uid)) fail(`no river with uid ${uid} in build/rivers.ndjson`);
    rivers.push(found.get(uid));
  }
}
if (linePoints.length >= 2) rivers.push({ uid: null, name: "the given line", parts: [linePoints.map(([lat, lon]) => [lon, lat])] });

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
// Points every `step` km along a line, each with the direction the line is heading there.
function sample(line, step) {
  const out = [];
  let walked = 0, next = 0;
  for (let i = 1; i < line.length; i++) {
    const [x0, y0] = line[i - 1], [x1, y1] = line[i];
    const seg = distKm(x0, y0, x1, y1);
    while (seg > 0 && next <= walked + seg) {
      const f = (next - walked) / seg;
      out.push({ km: next, lon: x0 + (x1 - x0) * f, lat: y0 + (y1 - y0) * f, dx: x1 - x0, dy: y1 - y0 });
      next += step;
    }
    walked += seg;
  }
  const [x, y] = line.at(-1), [px, py] = line.at(-2);
  if (!out.length || walked - out.at(-1).km > step / 4) out.push({ km: walked, lon: x, lat: y, dx: x - px, dy: y - py });
  return out;
}

// --- one line -------------------------------------------------------------------
function measure(line) {
  const lengthKm = lengthOf(line);
  const points = sample(line, stepKm ?? Math.max(0.1, lengthKm / MAX_POINTS));
  let covered = 0, downhill = 0, floors = 0, crossed = 0, lowest = Infinity, maxClimb = 0;
  let first = null, last = null;
  for (const p of points) {
    const kx = Math.cos((p.lat * Math.PI) / 180);
    // unit vector to the left of the heading, in metres
    const mx = p.dx * kx, my = p.dy, norm = Math.hypot(mx, my) || 1;
    const side = (metres) => elevation(p.lon + ((-my / norm) * metres) / (111320 * kx), p.lat + ((mx / norm) * metres) / 111320);
    const near = [elevation(p.lon, p.lat), side(CHANNEL_M / 2), side(-CHANNEL_M / 2), side(CHANNEL_M), side(-CHANNEL_M)];
    if (near.some(Number.isNaN)) continue;
    const here = Math.min(...near);
    covered++;
    if (!first) first = { km: p.km, h: here };
    last = { km: p.km, h: here };
    if (here <= lowest + CLIMB_TOLERANCE_M) downhill++;
    if (lowest !== Infinity) maxClimb = Math.max(maxClimb, here - lowest);
    lowest = Math.min(lowest, here);
    const across = CROSS_M.flatMap((m) => [side(m), side(-m)]);
    if (across.some(Number.isNaN)) continue;
    crossed++;
    if (across.every((v) => v >= here - FLOOR_TOLERANCE_M)) floors++;
  }
  return { lengthKm, points: points.length, covered, downhill, floors, crossed, maxClimb, first, last };
}

function judge(river) {
  const lines = linesOf(river.parts);
  const m = lines.map(measure);
  const sum = (k) => m.reduce((s, x) => s + x[k], 0);
  const lengthKm = sum("lengthKm"), points = sum("points"), covered = sum("covered"), crossed = sum("crossed");
  const cover = points ? covered / points : 0;
  const out = { uid: river.uid, name: river.name, lengthKm: +lengthKm.toFixed(2), parts: lines.length, coveredShare: +cover.toFixed(3) };
  if (!covered) return { ...out, followsTerrain: null, dropM: null, dropPerKm: null, reasons: ["no tile covers this line"] };
  // the stretch the tiles cover, from the first covered point to the last, part by part
  const measuredKm = m.reduce((s, x) => s + (x.first ? x.last.km - x.first.km : 0), 0);
  const dropM = m.reduce((s, x) => s + (x.first ? x.first.h - x.last.h : 0), 0);
  const dropPerKm = measuredKm > 0 ? dropM / measuredKm : 0;
  const downhillShare = sum("downhill") / covered;
  const floorShare = crossed ? sum("floors") / crossed : 0;
  const maxClimb = Math.max(...m.map((x) => x.maxClimb));
  const climbLimit = Math.max(MAX_CLIMB_M, MAX_CLIMB_SHARE * dropM);
  const tests = [
    [dropM > 0, `ends ${Math.abs(dropM).toFixed(1)} m ${dropM > 0 ? "lower" : "HIGHER"} than it starts`],
    [downhillShare >= DOWNHILL_SHARE, `runs downhill at ${Math.round(downhillShare * 100)}% of its points (needs ${DOWNHILL_SHARE * 100}%)`],
    [maxClimb <= climbLimit, `climbs at most ${maxClimb.toFixed(1)} m above the lowest point reached so far (limit ${climbLimit.toFixed(0)} m)`],
    [floorShare >= FLOOR_SHARE, `is the low ground of its cross-line at ${Math.round(floorShare * 100)}% of its points (needs ${FLOOR_SHARE * 100}%)`],
  ];
  const notes = [];
  if (cover < 1) notes.push(`the tiles cover ${Math.round(cover * 100)}% of the line; the figures are for that stretch (${measuredKm.toFixed(1)} km)`);
  if (Math.abs(dropPerKm) < FLAT_M_PER_KM) notes.push(`flat ground (under ${FLAT_M_PER_KM} m per km): a 30 m grid tells little here, so this is weak evidence`);
  return {
    ...out,
    followsTerrain: cover < MIN_COVER ? null : tests.every(([ok]) => ok),
    dropM: +dropM.toFixed(1),
    dropPerKm: +dropPerKm.toFixed(2),
    downhillShare: +downhillShare.toFixed(3),
    maxClimbM: +maxClimb.toFixed(1),
    floorShare: +floorShare.toFixed(3),
    passed: tests.filter(([ok]) => ok).map(([, t]) => t),
    failed: tests.filter(([ok]) => !ok).map(([, t]) => t),
    notes,
  };
}

// --- report ---------------------------------------------------------------------
const results = rivers.map(judge);
if (debug) {
  for (const r of results) console.log([r.uid ?? "-", r.followsTerrain, r.lengthKm, r.dropM, r.dropPerKm, r.downhillShare, r.maxClimbM, r.floorShare, r.coveredShare, r.name].join("\t"));
} else if (json) {
  console.log(JSON.stringify(results, null, 2));
} else {
  for (const r of results) {
    console.log(`${r.uid ? r.uid + " " : ""}${r.name}, ${r.lengthKm.toFixed(1)} km${r.parts > 1 ? ` in ${r.parts} separate parts` : ""}`);
    console.log(`  Follows terrain:   ${r.followsTerrain === null ? "unknown" : r.followsTerrain}`);
    console.log(`  Drop in elevation: ${r.dropM === null ? "-" : r.dropM.toFixed(1) + " m"}`);
    console.log(`  Rate of drop:      ${r.dropPerKm === null ? "-" : r.dropPerKm.toFixed(2) + " m per km"}`);
    for (const t of r.failed ?? []) console.log(`  fails: ${t}`);
    for (const t of r.passed ?? []) console.log(`  passes: ${t}`);
    for (const t of [...(r.reasons ?? []), ...(r.notes ?? [])]) console.log(`  note: ${t}`);
  }
}
if (missing.size)
  console.error(`\nNo tile covers part of ${rivers.length > 1 ? "these lines" : "this line"}. One-degree squares needed (south-west corner): ${[...missing].sort().join(", ")}. Ask the owner for them.`);
