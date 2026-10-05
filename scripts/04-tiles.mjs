// Builds the vector tile pyramid and writes it as MBTiles.
//
// geojson-vt has no per-feature minzoom, so the whole network is indexed once and each
// tile is filtered at extraction time to the features whose tier allows them at that
// zoom. Pruning has to test the UNFILTERED tile: a z4 tile can be empty after filtering
// while its z5 children are not, so descending on the filtered result would cut off
// every small river.

import { createReadStream, mkdirSync, rmSync, existsSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { gzipSync } from "node:zlib";
import { DatabaseSync } from "node:sqlite";
import geojsonvt from "geojson-vt";
import vtpbf from "vt-pbf";
import { minzFor, MIN_ZOOM, MAX_ZOOM } from "./lib/tiers.mjs";
import { partsOf, bboxOf } from "./lib/geo.mjs";

const IN = "build/rivers.ndjson";
const OUT = "build/rivers.mbtiles";
const INDEX_OUT = "public/rivers-index.json";
const LAYER = "rivers";
const EXTENT = 4096;

const topology = JSON.parse(readFileSync("build/topology.json", "utf8"));
const places = JSON.parse(readFileSync("build/places.json", "utf8"));
// Display names corrected by hand (the dataset names some Mumbai rivers after the
// creek they drain into). Topology is resolved on the original names, so renames are
// applied only here, at the point names are written out for display.
const overrides = JSON.parse(readFileSync("data/river-overrides.json", "utf8"));
// Names are shown without a trailing "River": the dataset's "Ganga River" reads as "Ganga".
const plain = (name) => name.replace(/\s+River$/i, "");
const displayName = (uid, fallback) => plain(overrides[uid]?.rename ?? fallback);
const nameByUid = new Map();
const rawNameByUid = new Map();

// Where a river's start is described from. A river the dataset merely cut in two
// ("Banas" continuing "Banas") takes its description from the head of that chain,
// not "Continues from: Banas".
function startUid(uid) {
  let cur = uid;
  for (let guard = 0; guard < 50; guard++) {
    const up = topology[cur]?.continues;
    if (!up || rawNameByUid.get(up) !== rawNameByUid.get(cur)) return cur;
    cur = up;
  }
  return cur;
}

// --- load -------------------------------------------------------------------
console.log("loading extract...");
const raw = [];
{
  const rl0 = createInterface({ input: createReadStream(IN), crlfDelay: Infinity });
  for await (const line of rl0) if (line) raw.push(line);
}
// Formers are referenced by uid, so every name must be known before any feature is built.
for (const line of raw) {
  const p = JSON.parse(line).properties;
  nameByUid.set(String(p.UID_River), displayName(String(p.UID_River), p.rivname ?? ""));
  rawNameByUid.set(String(p.UID_River), p.rivname ?? "");
}
const features = [];
// Per-river lookup for jumping to a river that is not on screen yet: following a
// "Merges into" link needs the target's extent and the zoom at which it is drawn.
const riverIndex = {};
let bbox = [180, 90, -180, -90];
const r3 = (n) => Math.round(n * 1000) / 1000;

for (const line of raw) {
  const f = JSON.parse(line);
  const p = f.properties;
  // Attributes for the click panel ride along in the tile rather than in a side file:
  // MVT dictionary-encodes values per layer, so these mostly-repeated strings cost
  // very little, and it saves a second request on every click.
  const uid = String(p.UID_River);
  const topo = topology[uid];
  const place = places[uid];
  const minz = minzFor(p.length_km);
  const name = displayName(uid, p.rivname ?? "");
  const head = startUid(uid);
  const st = topology[head]; // how the river begins
  const sp = places[head];
  f.properties = {
    uid,
    name,
    len: Math.round(p.length_km * 10) / 10,
    minz,
    // Shown in the panel.
    kind: topo.kind, // trib | sea | border | inland
    // `link`: a river caught in a naming loop still links the river it names, though its
    // `down` is left empty so chains (and the index's downstream uid) cannot loop.
    into: topo.down || topo.link ? displayName(topo.down ?? topo.link, topo.into) : plain(topo.into),
    down: topo.down ?? topo.link ?? "",
    ct: !!topo.down && topology[topo.down]?.continues === uid, // continues to, under a new name
    o: sp.o,
    on: sp.on,
    e: place.e,
    en: place.en,
    // How the river begins, when it is not simply a source. MVT has no array type, so
    // lists travel as joined strings with uids and names in step.
    fb: (st.formedBy ?? []).join(","), // formed by a confluence of...
    fbn: (st.formedBy ?? []).map((u) => nameByUid.get(u)).join("|"),
    fa: sp.fa ?? "",
    bf: st.branchedFrom ?? "", // branched off (a distributary of)...
    bfn: st.branchedFrom ? nameByUid.get(st.branchedFrom) : "",
    bat: sp.bat ?? "",
    batn: !!sp.batn,
    cf: st.continues ?? "", // continues another river under a new name
    cfn: st.continues ? nameByUid.get(st.continues) : "",
    ab: !!sp.abroad, // enters India from abroad
    via: (sp.via ?? []).join(", "),
    ent: sp.ent ?? "",
    entn: !!sp.entn,
    // Kept in the data, shown only behind the showExtendedAttributes flag.
    basin: p.ba_name ?? "",
    sub: p.sub_basin ?? "",
    states: p.state_al ?? "",
    origin: p.origin ?? "",
    confl: p.Confluence ?? "",
    from: [p.st_loc_dst, p.st_loc_ste].filter(Boolean).join(", "),
    to: [p.en_loc_dst, p.en_loc_ste].filter(Boolean).join(", "),
    src: p.src ?? "", // "HydroSHEDS" or "OpenStreetMap" for rivers added in 01b
  };
  const fb = bboxOf(partsOf(f.geometry));
  if (fb[0] < bbox[0]) bbox[0] = fb[0];
  if (fb[1] < bbox[1]) bbox[1] = fb[1];
  if (fb[2] > bbox[2]) bbox[2] = fb[2];
  if (fb[3] > bbox[3]) bbox[3] = fb[3];
  riverIndex[uid] = [name, minz, ...fb.map(r3), topo.down ?? ""];
  features.push(f);
}
writeFileSync(INDEX_OUT, JSON.stringify(riverIndex));
console.log(`  ${features.length} features, bbox ${bbox.map((n) => n.toFixed(3)).join(", ")}`);

// --- index ------------------------------------------------------------------
console.log("building tile index...");
const t0 = Date.now();
const index = new geojsonvt(
  { type: "FeatureCollection", features },
  { maxZoom: MAX_ZOOM, indexMaxZoom: 5, tolerance: 3, extent: EXTENT, buffer: 64, generateId: false }
);
console.log(`  indexed in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

// --- output -----------------------------------------------------------------
if (existsSync(OUT)) rmSync(OUT);
mkdirSync("build", { recursive: true });
const db = new DatabaseSync(OUT);
db.exec(`
  PRAGMA journal_mode=OFF;
  PRAGMA synchronous=OFF;
  CREATE TABLE metadata (name text, value text);
  CREATE TABLE tiles (zoom_level integer, tile_column integer, tile_row integer, tile_data blob);
  CREATE UNIQUE INDEX tile_index on tiles (zoom_level, tile_column, tile_row);
`);
const insert = db.prepare("INSERT INTO tiles VALUES (?, ?, ?, ?)");

const lonToX = (lon, z) => Math.floor(((lon + 180) / 360) * 2 ** z);
const latToY = (lat, z) => {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
};

let written = 0, empty = 0, bytes = 0;
const perZoom = new Map();

function emit(z, x, y, tile) {
  const kept = tile.features.filter((f) => f.tags.minz <= z);
  if (!kept.length) {
    empty++;
    return;
  }
  const buf = gzipSync(
    vtpbf.fromGeojsonVt({ [LAYER]: { ...tile, features: kept } }, { version: 2, extent: EXTENT }),
    { level: 9 }
  );
  // MBTiles rows are TMS, so y is flipped.
  insert.run(z, x, 2 ** z - 1 - y, buf);
  written++;
  bytes += buf.length;
  const s = perZoom.get(z) ?? { n: 0, b: 0, max: 0 };
  s.n++; s.b += buf.length; s.max = Math.max(s.max, buf.length);
  perZoom.set(z, s);
}

function walk(z, x, y) {
  const tile = index.getTile(z, x, y);
  if (!tile || !tile.features.length) return; // prune on the unfiltered tile
  emit(z, x, y, tile);
  if (z >= MAX_ZOOM) return;
  for (let dx = 0; dx < 2; dx++)
    for (let dy = 0; dy < 2; dy++) walk(z + 1, x * 2 + dx, y * 2 + dy);
}

console.log(`tiling z${MIN_ZOOM}-z${MAX_ZOOM}...`);
const t1 = Date.now();
db.exec("BEGIN");
for (let x = lonToX(bbox[0], MIN_ZOOM); x <= lonToX(bbox[2], MIN_ZOOM); x++)
  for (let y = latToY(bbox[3], MIN_ZOOM); y <= latToY(bbox[1], MIN_ZOOM); y++) walk(MIN_ZOOM, x, y);
db.exec("COMMIT");
console.log(`  tiled in ${((Date.now() - t1) / 1000).toFixed(1)}s`);

// --- metadata ---------------------------------------------------------------
const center = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2, MIN_ZOOM];
const meta = {
  name: "India river network",
  format: "pbf",
  type: "overlay",
  version: "1",
  minzoom: String(MIN_ZOOM),
  maxzoom: String(MAX_ZOOM),
  bounds: bbox.join(","),
  center: center.join(","),
  json: JSON.stringify({
    vector_layers: [
      {
        id: LAYER,
        minzoom: MIN_ZOOM,
        maxzoom: MAX_ZOOM,
        fields: {
          uid: "String", name: "String", len: "Number", minz: "Number",
          kind: "String", into: "String", down: "String",
          o: "String", on: "Boolean", e: "String", en: "Boolean",
          fb: "String", fbn: "String", fa: "String",
          bf: "String", bfn: "String", bat: "String", batn: "Boolean",
          cf: "String", cfn: "String",
          ab: "Boolean", via: "String", ent: "String", entn: "Boolean",
          basin: "String", sub: "String", states: "String", origin: "String",
          confl: "String", from: "String", to: "String",
        },
      },
    ],
  }),
};
const mins = db.prepare("INSERT INTO metadata VALUES (?, ?)");
for (const [k, v] of Object.entries(meta)) mins.run(k, v);
db.close();

// --- report -----------------------------------------------------------------
console.log(`\nzoom   tiles      total      mean     largest`);
for (let z = MIN_ZOOM; z <= MAX_ZOOM; z++) {
  const s = perZoom.get(z);
  if (!s) continue;
  const kb = (n) => (n / 1024).toFixed(1).padStart(8) + " KB";
  console.log(`  ${String(z).padStart(2)} ${String(s.n).padStart(7)} ${kb(s.b)} ${kb(s.b / s.n)} ${kb(s.max)}`);
}
console.log(`\ntiles written : ${written.toLocaleString()}  (${empty.toLocaleString()} empty after tier filter)`);
console.log(`archive       : ${(bytes / 1048576).toFixed(1)} MB of tile data`);
const idxBytes = readFileSync(INDEX_OUT);
console.log(`river index   : ${(idxBytes.length / 1048576).toFixed(2)} MB raw, ${(gzipSync(idxBytes).length / 1024).toFixed(0)} KB gzipped`);

// --- MBTiles -> PMTiles -------------------------------------------------------
// No JavaScript PMTiles writer exists, so this shells out to the go-pmtiles binary.
// Invoked from Node rather than the npm script because cmd.exe misreads "tools/x.exe".
const PMTILES_BIN = join("tools", process.platform === "win32" ? "pmtiles.exe" : "pmtiles");
if (!existsSync(PMTILES_BIN)) {
  console.error(`\n${PMTILES_BIN} not found - download go-pmtiles from github.com/protomaps/go-pmtiles/releases`);
  process.exit(1);
}
execFileSync(PMTILES_BIN, ["convert", OUT, "public/rivers.pmtiles"], { stdio: ["ignore", "ignore", "ignore"] });
console.log(`pmtiles       : ${(statSync("public/rivers.pmtiles").size / 1048576).toFixed(1)} MB -> public/rivers.pmtiles`);
