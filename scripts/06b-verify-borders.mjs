// Checks public/borders.pmtiles against the GeoJSON it was built from: reads the archive
// with the same library the browser uses, decodes every tile, and confirms that each
// border in data/borders/ is in the tiles, with the right kind, at every zoom.
//
//   node scripts/06b-verify-borders.mjs [archive | url] [inputDir]     (npm run verify:borders)
//
// The archive may be a file (default public/borders.pmtiles) or an http(s) URL, in which
// case it is read over range requests exactly as the map reads it.

import { openSync, readSync, fstatSync, readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { PMTiles, FetchSource, tileIdToZxy } from "pmtiles";
import { VectorTile } from "@mapbox/vector-tile";
import { PbfReader } from "pbf";
import { distKm } from "./lib/geo.mjs";
import { BORDER_LAYER, BORDER_KINDS, BORDER_MIN_ZOOM, BORDER_MAX_ZOOM } from "./lib/borders.mjs";

const ARCHIVE = process.argv[2] ?? "public/borders.pmtiles";
const IN_DIR = process.argv[3] ?? "data/borders";

let failures = 0;
const check = (label, ok, detail) => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` - ${detail}` : ""}`);
  if (!ok) failures++;
};

// pmtiles ships a FileSource for browser File objects only; this is the same idea on a
// file descriptor.
class NodeFileSource {
  constructor(path) {
    this.path = path;
    this.fd = openSync(path, "r");
  }
  getKey() {
    return this.path;
  }
  async getBytes(offset, length) {
    const buf = Buffer.alloc(length);
    const n = readSync(this.fd, buf, 0, length, offset);
    return { data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + n) };
  }
}

const remote = /^https?:/.test(ARCHIVE);
if (!remote && !existsSync(ARCHIVE)) {
  console.error(`${ARCHIVE} not found - run npm run data:borders`);
  process.exit(1);
}
const source = remote ? new FetchSource(ARCHIVE) : new NodeFileSource(ARCHIVE);
const p = new PMTiles(source);
const header = await p.getHeader();
const size = remote ? null : fstatSync(source.fd).size;
console.log(`archive: ${ARCHIVE}${size ? ` (${(size / 1048576).toFixed(2)} MB)` : ""}`);
console.log(`  zoom ${header.minZoom}-${header.maxZoom}, ${header.numAddressedTiles.toLocaleString()} tiles`);
console.log(`  bounds ${[header.minLon, header.minLat, header.maxLon, header.maxLat].map((n) => n.toFixed(2)).join(", ")}\n`);

check(`zoom range is ${BORDER_MIN_ZOOM}-${BORDER_MAX_ZOOM}`, header.minZoom === BORDER_MIN_ZOOM && header.maxZoom === BORDER_MAX_ZOOM);
check("has tiles", header.numAddressedTiles > 0);
check("covers India and nothing else", header.minLon >= 67 && header.maxLon <= 98 && header.minLat >= 5 && header.maxLat <= 38);
check("tiles are gzipped vector tiles", header.tileType === 1 && header.tileCompression === 2);
const meta = await p.getMetadata();
const vl = meta.vector_layers;
check("declares one vector layer, 'borders'", Array.isArray(vl) && vl.length === 1 && vl[0].id === BORDER_LAYER, vl?.[0]?.id);
check("declares its fields", !!vl?.[0]?.fields?.kind && !!vl?.[0]?.fields?.name);

// --- what the tiles should hold -----------------------------------------------------------
const expected = new Map(); // "kind|name" -> km in the source
const expectRiver = new Map(); // "kind|name|river" -> rlen
if (existsSync(IN_DIR)) {
  for (const file of readdirSync(IN_DIR).filter((f) => f.endsWith(".geojson"))) {
    for (const f of JSON.parse(readFileSync(join(IN_DIR, file), "utf8")).features) {
      const c = f.geometry.coordinates;
      let km = 0;
      for (let i = 1; i < c.length; i++) km += distKm(c[i - 1][0], c[i - 1][1], c[i][0], c[i][1]);
      const key = `${f.properties.kind}|${f.properties.name}`;
      expected.set(key, (expected.get(key) ?? 0) + km);
      if (f.properties.river) expectRiver.set(`${key}|${f.properties.river}`, f.properties.rlen);
    }
  }
} else {
  console.log(`  (${IN_DIR} not found: the tiles are checked on their own, not against the source)`);
}

// --- decode every tile ----------------------------------------------------------------------
// The directory is walked through the reader itself, so leaf directories are exercised.
const perZoom = new Map(); // zoom -> { tiles, keys: Set, kinds: Set, km per key, vertices }
let decoded = 0, bad = [];
const lon = (x, z) => (x / 2 ** z) * 360 - 180;
const lat = (y, z) => (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / 2 ** z))) * 180) / Math.PI;

async function entriesOf(offset, length) {
  const dir = await p.cache.getDirectory(p.source, offset, length, header);
  const out = [];
  for (const e of dir) {
    if (e.runLength === 0) out.push(...(await entriesOf(header.leafDirectoryOffset + e.offset, e.length)));
    else for (let i = 0; i < e.runLength; i++) out.push(e.tileId + i);
  }
  return out;
}
const ids = await entriesOf(header.rootDirectoryOffset, header.rootDirectoryLength);
check("directory lists every addressed tile", ids.length === header.numAddressedTiles, `${ids.length} of ${header.numAddressedTiles}`);

for (const id of ids) {
  const [z, x, y] = tileIdToZxy(id);
  const r = await p.getZxy(z, x, y);
  if (!r) {
    bad.push(`${z}/${x}/${y}: listed but not readable`);
    continue;
  }
  let buf = new Uint8Array(r.data);
  if (buf[0] === 0x1f && buf[1] === 0x8b) buf = gunzipSync(buf);
  const layer = new VectorTile(new PbfReader(buf)).layers[BORDER_LAYER];
  if (!layer || !layer.length) {
    bad.push(`${z}/${x}/${y}: no '${BORDER_LAYER}' features`);
    continue;
  }
  decoded++;
  const s = perZoom.get(z) ?? { tiles: 0, km: new Map(), kinds: new Set(), rivers: new Map(), vertices: 0 };
  s.tiles++;
  for (let i = 0; i < layer.length; i++) {
    const f = layer.feature(i);
    const pr = f.properties;
    if (f.type !== 2) bad.push(`${z}/${x}/${y}: a feature is not a line`);
    if (!BORDER_KINDS.includes(pr.kind) || !pr.name) bad.push(`${z}/${x}/${y}: bad properties ${JSON.stringify(pr)}`);
    if ("src" in pr) bad.push(`${z}/${x}/${y}: src should not be in the tiles`);
    if ("river" in pr !== "rlen" in pr) bad.push(`${z}/${x}/${y}: river without rlen`);
    const key = `${pr.kind}|${pr.name}`;
    s.kinds.add(pr.kind);
    if (pr.river) s.rivers.set(`${key}|${pr.river}`, pr.rlen);
    // Length inside the tile proper: the buffer round each tile repeats its neighbours.
    let km = 0;
    for (const ring of f.loadGeometry()) {
      s.vertices += ring.length;
      for (let j = 1; j < ring.length; j++) {
        const a = ring[j - 1], b = ring[j];
        const clip = clipToExtent(a.x, a.y, b.x, b.y, layer.extent);
        if (!clip) continue;
        const [ax, ay, bx, by] = clip.map((v) => v / layer.extent);
        km += distKm(lon(x + ax, z), lat(y + ay, z), lon(x + bx, z), lat(y + by, z));
      }
    }
    s.km.set(key, (s.km.get(key) ?? 0) + km);
  }
  perZoom.set(z, s);
}

// Liang-Barsky: the part of a segment inside the tile's own square, or null.
function clipToExtent(x0, y0, x1, y1, e) {
  let t0 = 0, t1 = 1;
  const dx = x1 - x0, dy = y1 - y0;
  for (const [p_, q] of [[-dx, x0], [dx, e - x0], [-dy, y0], [dy, e - y0]]) {
    if (p_ === 0) {
      if (q < 0) return null;
    } else {
      const t = q / p_;
      if (p_ < 0) {
        if (t > t1) return null;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return null;
        if (t < t1) t1 = t;
      }
    }
  }
  return [x0 + t0 * dx, y0 + t0 * dy, x0 + t1 * dx, y0 + t1 * dy];
}

check("every tile decodes and holds valid border features", bad.length === 0, bad.length ? `${bad.length} problems, first: ${bad[0]}` : `${decoded.toLocaleString()} tiles`);

console.log(`\nzoom  tiles  vertices   intl km   line km  state km`);
for (let z = header.minZoom; z <= header.maxZoom; z++) {
  const s = perZoom.get(z);
  if (!s) continue;
  const kmOf = (kind) => [...s.km].filter(([k]) => k.startsWith(`${kind}|`)).reduce((a, [, v]) => a + v, 0);
  console.log(
    `  ${String(z).padStart(2)} ${String(s.tiles).padStart(6)} ${String(s.vertices).padStart(9)} ` +
      BORDER_KINDS.map((k) => kmOf(k).toFixed(0).padStart(9)).join(" ")
  );
}

const top = perZoom.get(header.maxZoom);
const present = [...BORDER_KINDS].filter((k) => top?.kinds.has(k));
check("all three kinds are present", present.length === BORDER_KINDS.length, present.join(", "));

if (expected.size) {
  console.log("\nagainst the source:");
  // At the top zoom nothing is simplified, so every border must be there at its full length.
  const missing = [...expected.keys()].filter((k) => !top.km.has(k));
  const extra = [...top.km.keys()].filter((k) => !expected.has(k));
  check(`all ${expected.size} named borders are in the z${header.maxZoom} tiles`, missing.length === 0, missing.slice(0, 5).join("; "));
  check("and nothing else is", extra.length === 0, extra.slice(0, 5).join("; "));
  const off = [...expected].filter(([k, km]) => top.km.has(k) && Math.abs(top.km.get(k) - km) > Math.max(0.5, km * 0.01));
  check(`each is its full length at z${header.maxZoom} (within 1%)`, off.length === 0, off.slice(0, 5).map(([k, km]) => `${k}: ${top.km.get(k).toFixed(1)} of ${km.toFixed(1)} km`).join("; "));
  const riversOk = [...expectRiver].every(([k, rlen]) => top.rivers.get(k) === rlen);
  check(`river stretches carry river and rlen (${expectRiver.size} border/river pairs)`, riversOk && top.rivers.size === expectRiver.size, `${top.rivers.size} in tiles`);
  // Lower zooms are simplified, and a stretch shorter than a fraction of a pixel is dropped,
  // but each kind must keep nearly all of its length right down to the whole-world tile.
  const total = (m, kind) => [...m].filter(([k]) => k.startsWith(`${kind}|`)).reduce((a, [, v]) => a + v, 0);
  for (const z of [0, 3, 4, 8]) {
    const s = perZoom.get(z);
    if (!s) {
      check(`z${z} tiles exist`, false);
      continue;
    }
    const share = BORDER_KINDS.map((k) => total(s.km, k) / (total(expected, k) || 1));
    // simplification shortens a wiggly line a great deal at small scales; a missing border would be far worse
    const floor = z >= 8 ? 0.9 : z >= 3 ? 0.6 : 0.3;
    check(`z${z}: every kind is drawn`, share.every((v) => v > floor && v < 1.02), BORDER_KINDS.map((k, i) => `${k} ${(share[i] * 100).toFixed(0)}%`).join(", ") + " of full length");
  }
}

console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nALL CHECKS PASSED");
process.exit(failures ? 1 : 0);
