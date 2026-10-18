// Reads the elevation tiles (GeoTIFF) the owner keeps in the repo root. Shared by
// elevation-profile.mjs and follows-terrain.mjs. Read-only. The tiles are reference files:
// never commit them or publish anything from them.
//
// The reader is small on purpose and handles what the owner's Cartosat (CartoDEM) 30 m
// tiles are: an uncompressed, single-band, north-up GeoTIFF in latitude and longitude. It
// says so and stops on anything else.

import { openSync, readSync, readdirSync, existsSync, statSync } from "node:fs";

const bad = (msg) => { throw new Error(msg); };

// Every *.tif under a P5_PAN_CD_* folder in `root` (a path ending in "/").
export function findTiles(root) {
  const found = [];
  const walk = (dir, depth) => {
    for (const name of readdirSync(dir)) {
      const p = `${dir}/${name}`;
      if (statSync(p).isDirectory()) { if (depth < 3) walk(p, depth + 1); }
      else if (/.tif$/i.test(name)) found.push(p);
    }
  };
  for (const name of readdirSync(root))
    if (name.startsWith("P5_PAN_CD_") && statSync(root + name).isDirectory()) walk(root + name, 0);
  return found;
}

// The one-degree square a point lies in, named by its south-west corner: "N12 E077".
export function squareOf(lon, lat) {
  const ns = lat >= 0 ? "N" : "S", ew = lon >= 0 ? "E" : "W";
  return `${ns}${String(Math.abs(Math.floor(lat))).padStart(2, "0")} ${ew}${String(Math.abs(Math.floor(lon))).padStart(3, "0")}`;
}

export function openTile(path) {
  if (!existsSync(path)) bad(`no such tile: ${path}`);
  const fd = openSync(path, "r");
  const read = (offset, length) => { const b = Buffer.alloc(length); readSync(fd, b, 0, length, offset); return b; };
  const head = read(0, 8);
  const order = head.toString("latin1", 0, 2);
  if (order !== "II" && order !== "MM") bad(`${path}: not a TIFF file`);
  const le = order === "II";
  const u16 = (b, o) => (le ? b.readUInt16LE(o) : b.readUInt16BE(o));
  const u32 = (b, o) => (le ? b.readUInt32LE(o) : b.readUInt32BE(o));
  const f64 = (b, o) => (le ? b.readDoubleLE(o) : b.readDoubleBE(o));
  if (u16(head, 2) !== 42) bad(`${path}: not a classic TIFF (BigTIFF is not supported)`);
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
  if (one(259, 1) !== 1) bad(`${path}: the tile is compressed; this reader takes uncompressed tiles only`);
  if (one(277, 1) !== 1 || !offsets) bad(`${path}: expected one band stored in strips`);
  if (!scale || !tie) bad(`${path}: no georeferencing (pixel scale and tie point) in the file`);
  const get = format === 3 && bits === 32 ? (b, o) => (le ? b.readFloatLE(o) : b.readFloatBE(o))
    : format === 2 && bits === 16 ? (b, o) => (le ? b.readInt16LE(o) : b.readInt16BE(o))
    : format === 2 && bits === 32 ? (b, o) => (le ? b.readInt32LE(o) : b.readInt32BE(o))
    : format === 1 && bits === 16 ? u16
    : bad(`${path}: unsupported sample type (format ${format}, ${bits} bits)`);
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

// Opens the tiles and returns `elevation(lon, lat)` (NaN where no tile covers the point or
// the tile has no data) and `missing`, the squares asked for that no tile covers.
export function openTiles(paths) {
  const tiles = paths.map(openTile);
  const missing = new Set();
  const elevation = (lon, lat) => {
    const tile = tiles.find((t) => t.covers(lon, lat));
    if (!tile) missing.add(squareOf(lon, lat));
    return tile ? tile.at(lon, lat) : NaN;
  };
  return { tiles, elevation, missing };
}
