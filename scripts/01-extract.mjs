// Reads the source shapefile, reprojects LCC -> WGS84, writes newline-delimited GeoJSON.
//
// The .prj declares a custom Lambert Conformal Conic with no EPSG code. Rather than
// trusting a WKT parse, the proj4 string below is transcribed from River_Network.qmd
// and every feature is checked against its own st_pt_lat/st_pt_long attributes, which
// the source already stores in degrees. A transcription error would show up immediately
// as a large position error rather than a silently shifted map.

import { open } from "shapefile";
import proj4 from "proj4";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";

const SHP = "river_network_shape/River_Network.shp";
const DBF = "river_network_shape/River_Network.dbf";
const OUT = "build/rivers.ndjson";

const SRC =
  "+proj=lcc +lat_0=24 +lon_0=80 +lat_1=12.4729444 +lat_2=35.17280555 " +
  "+x_0=4000000 +y_0=4000000 +datum=WGS84 +units=m +no_defs";
const WGS84 = "+proj=longlat +datum=WGS84 +no_defs";

const project = proj4(SRC, WGS84);

const KEEP = [
  "UID_River", "rivname", "ba_name", "sub_basin", "length_km", "origin",
  "Confluence", "state_al",
  "st_pt_lat", "st_pt_long", "st_loc_ste", "st_loc_dst", "st_loc_sb_", "st_loc_vil",
  "en_pt_lat", "en_pt_long", "en_loc_ste", "en_loc_dst", "en_loc_sb_", "en_loc_vil",
];

const round6 = (n) => Math.round(n * 1e6) / 1e6;

function reproject(coords) {
  const out = new Array(coords.length);
  for (let i = 0; i < coords.length; i++) {
    const [x, y] = project.forward(coords[i]);
    out[i] = [round6(x), round6(y)];
  }
  return out;
}

// Rough great-circle distance in km, good enough for a sanity check.
function haversineKm(lon1, lat1, lon2, lat2) {
  const R = 6371;
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const write = (stream, chunk) =>
  stream.write(chunk) ? Promise.resolve() : new Promise((r) => stream.once("drain", r));

await mkdir("build", { recursive: true });
const out = createWriteStream(OUT);

const source = await open(SHP, DBF, { encoding: "utf-8" });

let count = 0;
let vertices = 0;
let geomTypes = new Map();
const badFeatures = [];

// Projection check: how far is the declared start point from the nearest endpoint of
// any part? A wrong CRS puts this in the hundreds of km for every feature. Individual
// outliers are source-data errors, so the build gates on the 99th percentile.
//
// Orientation is tracked separately: some lines are digitised mouth-to-source, and
// MultiLineString parts are not in downstream order at all. Neither affects rendering,
// but both matter for the downstream tracing in 03-topology.
const startErrors = [];
let reversed = 0;
let maxParts = 0;

// UID_River is not unique: 7 ids are each shared by two unrelated rivers (30407 is both
// the Kankai Nadi in Bihar and the Siyar Gad in Uttarakhand). Every later table is keyed
// by uid, so the second river of each pair gets a fresh id above the dataset's range.
// File order is fixed, so the reassignment is stable across rebuilds.
const DUP_UID_BASE = 31001;
const seenUids = new Set();
const reassigned = [];

while (true) {
  const { done, value } = await source.read();
  if (done) break;

  const props = value.properties ?? {};
  const geom = value.geometry;
  if (!geom) {
    badFeatures.push({ uid: props.UID_River, reason: "null geometry" });
    continue;
  }

  let coordinates;
  if (geom.type === "LineString") {
    coordinates = reproject(geom.coordinates);
    vertices += coordinates.length;
  } else if (geom.type === "MultiLineString") {
    coordinates = geom.coordinates.map(reproject);
    for (const part of coordinates) vertices += part.length;
  } else {
    badFeatures.push({ uid: props.UID_River, reason: `unexpected ${geom.type}` });
    continue;
  }
  geomTypes.set(geom.type, (geomTypes.get(geom.type) ?? 0) + 1);

  // Validate against the source's own start-point attributes.
  const stLat = props.st_pt_lat;
  const stLon = props.st_pt_long;
  if (Number.isFinite(stLat) && Number.isFinite(stLon)) {
    const parts = geom.type === "LineString" ? [coordinates] : coordinates;
    if (parts.length > maxParts) maxParts = parts.length;

    let best = Infinity;
    for (const part of parts) {
      for (const p of [part[0], part[part.length - 1]]) {
        const d = haversineKm(p[0], p[1], stLon, stLat);
        if (d < best) best = d;
      }
    }
    startErrors.push(best);

    if (geom.type === "LineString") {
      const head = haversineKm(coordinates[0][0], coordinates[0][1], stLon, stLat);
      const tail = haversineKm(
        coordinates[coordinates.length - 1][0],
        coordinates[coordinates.length - 1][1],
        stLon, stLat
      );
      if (tail < head) reversed++;
    }
  }

  const kept = {};
  for (const k of KEEP) if (props[k] !== undefined) kept[k] = props[k];
  if (seenUids.has(kept.UID_River)) {
    const uid = String(DUP_UID_BASE + reassigned.length);
    reassigned.push(`${kept.UID_River} -> ${uid} (${kept.rivname})`);
    kept.UID_River = uid;
  }
  seenUids.add(kept.UID_River);

  await write(
    out,
    JSON.stringify({ type: "Feature", properties: kept, geometry: { type: geom.type, coordinates } }) + "\n"
  );
  count++;
}

await new Promise((r) => out.end(r));

console.log(`features written : ${count}`);
console.log(`vertices         : ${vertices.toLocaleString()}`);
console.log(`geometry types   : ${[...geomTypes].map(([t, n]) => `${t}=${n}`).join(", ")}`);
startErrors.sort((a, b) => a - b);
const pct = (p) => startErrors[Math.floor((startErrors.length - 1) * p)];

console.log(`\nprojection check - declared start point to nearest part endpoint (n=${startErrors.length}):`);
for (const p of [0.5, 0.9, 0.99, 0.999, 1]) {
  console.log(`  p${(p * 100).toFixed(1).padStart(5)} : ${pct(p).toFixed(4)} km`);
}
console.log(`  over 1km : ${startErrors.filter((e) => e > 1).length} features`);

console.log(`\norientation:`);
console.log(`  single-part digitised mouth-to-source : ${reversed}`);
console.log(`  max parts in a MultiLineString        : ${maxParts}`);
if (reassigned.length) console.log(`\nduplicate UID_River reassigned: ${reassigned.join(", ")}`);
if (badFeatures.length) {
  console.log(`\nskipped ${badFeatures.length}:`, badFeatures.slice(0, 10));
}

if (pct(0.99) > 1) {
  console.error(`\nFAIL: p99 start-point error ${pct(0.99).toFixed(3)} km exceeds 1 km - check the CRS.`);
  process.exit(1);
}
console.log(`\nOK`);
