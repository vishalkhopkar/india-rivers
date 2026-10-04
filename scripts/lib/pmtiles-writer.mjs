// Writes a PMTiles v3 archive straight from memory, with no MBTiles step and no
// go-pmtiles binary. Meant for small archives (the borders are a few thousand tiles);
// the river network still goes through scripts/04-tiles.mjs and go-pmtiles.
//
// Layout: header (127 bytes) | root directory | JSON metadata | leaf directories | tiles.
// Spec: https://github.com/protomaps/PMTiles/blob/main/spec/v3/spec.md

import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { zxyToTileId } from "pmtiles";

const HEADER_BYTES = 127;
// A reader fetches the first 16 KiB and expects the header and the whole root
// directory inside it.
const FIRST_FETCH = 16384;
const GZIP = 2;
const MVT = 1;

function varint(out, n) {
  while (n >= 0x80) {
    out.push((n % 0x80) | 0x80);
    n = Math.floor(n / 0x80);
  }
  out.push(n);
}

// entries: [{ id, offset, length, run }] sorted by id. run 0 marks a leaf directory.
function serializeDirectory(entries) {
  const out = [];
  varint(out, entries.length);
  let last = 0;
  for (const e of entries) {
    varint(out, e.id - last);
    last = e.id;
  }
  for (const e of entries) varint(out, e.run);
  for (const e of entries) varint(out, e.length);
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i], p = entries[i - 1];
    // 0 means "directly after the previous entry"; anything else is offset + 1.
    varint(out, i > 0 && e.offset === p.offset + p.length ? 0 : e.offset + 1);
  }
  return gzipSync(Buffer.from(out), { level: 9 });
}

function buildDirectories(entries) {
  const whole = serializeDirectory(entries);
  if (HEADER_BYTES + whole.length <= FIRST_FETCH) return { root: whole, leaves: Buffer.alloc(0), leafCount: 0 };
  for (let size = 4096; ; size = Math.ceil(size * 1.5)) {
    const rootEntries = [], chunks = [];
    let at = 0;
    for (let i = 0; i < entries.length; i += size) {
      const leaf = serializeDirectory(entries.slice(i, i + size));
      rootEntries.push({ id: entries[i].id, offset: at, length: leaf.length, run: 0 });
      chunks.push(leaf);
      at += leaf.length;
    }
    const root = serializeDirectory(rootEntries);
    if (HEADER_BYTES + root.length <= FIRST_FETCH) return { root, leaves: Buffer.concat(chunks), leafCount: chunks.length };
  }
}

/**
 * @param {{ z: number, x: number, y: number, data: Uint8Array }[]} tiles gzipped MVT tiles
 * @param {{ metadata: object, minZoom: number, maxZoom: number, bounds: number[], center: number[] }} info
 *        bounds is [west, south, east, north]; center is [lon, lat, zoom]
 * @returns {{ buffer: Buffer, tiles: number, contents: number, leafDirectories: number }}
 */
export function buildPMTiles(tiles, { metadata, minZoom, maxZoom, bounds, center }) {
  const sorted = tiles
    .map((t) => ({ id: zxyToTileId(t.z, t.x, t.y), data: t.data }))
    .sort((a, b) => a.id - b.id);

  // Identical tiles are stored once; a run of consecutive ids sharing one content is a
  // single entry.
  const seen = new Map();
  const blobs = [];
  const entries = [];
  let dataLength = 0;
  for (const t of sorted) {
    const key = createHash("sha1").update(t.data).digest("hex");
    let at = seen.get(key);
    if (!at) {
      at = { offset: dataLength, length: t.data.length };
      seen.set(key, at);
      blobs.push(t.data);
      dataLength += t.data.length;
    }
    const prev = entries[entries.length - 1];
    if (prev && prev.offset === at.offset && prev.id + prev.run === t.id) prev.run++;
    else entries.push({ id: t.id, offset: at.offset, length: at.length, run: 1 });
  }

  const { root, leaves, leafCount } = buildDirectories(entries);
  const meta = gzipSync(Buffer.from(JSON.stringify(metadata)), { level: 9 });

  const rootOffset = HEADER_BYTES;
  const metaOffset = rootOffset + root.length;
  const leafOffset = metaOffset + meta.length;
  const dataOffset = leafOffset + leaves.length;

  const h = Buffer.alloc(HEADER_BYTES);
  h.write("PMTiles", 0, "latin1");
  h.writeUInt8(3, 7);
  const u64 = (v, at) => h.writeBigUInt64LE(BigInt(v), at);
  u64(rootOffset, 8);
  u64(root.length, 16);
  u64(metaOffset, 24);
  u64(meta.length, 32);
  u64(leafOffset, 40);
  u64(leaves.length, 48);
  u64(dataOffset, 56);
  u64(dataLength, 64);
  u64(sorted.length, 72); // addressed tiles
  u64(entries.length, 80); // tile entries
  u64(blobs.length, 88); // distinct tile contents
  h.writeUInt8(1, 96); // clustered: tile data is in tile-id order
  h.writeUInt8(GZIP, 97); // directories and metadata
  h.writeUInt8(GZIP, 98); // tiles
  h.writeUInt8(MVT, 99);
  h.writeUInt8(minZoom, 100);
  h.writeUInt8(maxZoom, 101);
  const e7 = (deg) => Math.round(deg * 1e7);
  h.writeInt32LE(e7(bounds[0]), 102);
  h.writeInt32LE(e7(bounds[1]), 106);
  h.writeInt32LE(e7(bounds[2]), 110);
  h.writeInt32LE(e7(bounds[3]), 114);
  h.writeUInt8(center[2], 118);
  h.writeInt32LE(e7(center[0]), 119);
  h.writeInt32LE(e7(center[1]), 123);

  return {
    buffer: Buffer.concat([h, root, meta, leaves, ...blobs]),
    tiles: sorted.length,
    contents: blobs.length,
    leafDirectories: leafCount,
  };
}
