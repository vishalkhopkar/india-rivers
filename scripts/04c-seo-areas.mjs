// Collects, for each area in data/seo-areas.json, the rivers a landing page lists
// (name, length, start, end, what it merges into) and which of them pass near each named
// neighbourhood. It writes data/seo-areas-rivers.json. The text is built from the same
// properties the click panel shows, read back out of the finished tiles, so the two cannot
// disagree, and "near Chembur" comes from measured distance to the drawn course.
//
// The tiles live in build/, which CI does not have, so this runs locally and its output is
// committed; vite.config.ts turns it into pages at build time.

import { DatabaseSync } from "node:sqlite";
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { VectorTile } from "@mapbox/vector-tile";
import { PbfReader } from "pbf";

const Z = 11; // every river is present at the deepest zoom
const NEAR_KM = 3; // a stream is "near" a neighbourhood within this distance of its course
const areas = JSON.parse(readFileSync("data/seo-areas.json", "utf8"));
const hidden = new Set(JSON.parse(readFileSync("public/river-hidden.json", "utf8")).hidden.map(String));
const db = new DatabaseSync(process.argv[2] ?? "build/rivers.mbtiles", { readOnly: true });

const lonToX = (lon) => Math.floor(((lon + 180) / 360) * 2 ** Z);
const latToY = (lat) => {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** Z);
};
const tileLon = (x, px, ext) => ((x + px / ext) / 2 ** Z) * 360 - 180;
const tileLat = (y, py, ext) => {
  const n = Math.PI - (2 * Math.PI * (y + py / ext)) / 2 ** Z;
  return (180 / Math.PI) * Math.atan(Math.sinh(n));
};
const get = db.prepare("SELECT tile_data FROM tiles WHERE zoom_level=? AND tile_column=? AND tile_row=?");

// Distance in km from a point to the nearest vertex of a course (planar, fine at city scale).
// Tile vertices are far closer together than NEAR_KM, so vertices stand in for segments.
const kmBetween = (lon1, lat1, lon2, lat2) => {
  const dx = (lon2 - lon1) * 111.32 * Math.cos((lat1 * Math.PI) / 180);
  const dy = (lat2 - lat1) * 110.57;
  return Math.hypot(dx, dy);
};

const out = {};
for (const area of areas) {
  const [w, s, e, n] = area.bbox;
  const rivers = new Map(); // uid -> { p, pts }
  for (let x = lonToX(w); x <= lonToX(e); x++) {
    for (let y = latToY(n); y <= latToY(s); y++) {
      const row = get.get(Z, x, 2 ** Z - 1 - y);
      if (!row) continue;
      const layer = new VectorTile(new PbfReader(gunzipSync(row.tile_data))).layers.rivers;
      for (let i = 0; layer && i < layer.length; i++) {
        const f = layer.feature(i);
        const uid = String(f.properties.uid);
        const entry = rivers.get(uid) ?? { p: f.properties, pts: [] };
        for (const ring of f.loadGeometry()) {
          for (const pt of ring) entry.pts.push([tileLon(x, pt.x, layer.extent), tileLat(y, pt.y, layer.extent)]);
        }
        rivers.set(uid, entry);
      }
    }
  }

  const inArea = [...rivers.entries()]
    .filter(([uid, { p, pts }]) => p.name && !hidden.has(uid) && pts.some(([lo, la]) => lo >= w && lo <= e && la >= s && la <= n))
    .sort((a, b) => b[1].p.len - a[1].p.len);

  const places = {};
  for (const [place, [lon, lat]] of Object.entries(area.places ?? {})) {
    const near = inArea
      .map(([uid, { p, pts }]) => ({ uid, name: p.name, d: Math.min(...pts.map(([lo, la]) => kmBetween(lon, lat, lo, la))) }))
      .filter((r) => r.d <= NEAR_KM)
      .sort((a, b) => a.d - b.d);
    if (near.length) places[place] = near.map((r) => r.uid);
  }

  out[area.slug] = {
    rivers: inArea.map(([uid, { p }]) => ({
      uid,
      name: p.name,
      len: p.len,
      from: p.o || "",
      to: p.e || "",
      into: p.into || "",
      kind: p.kind,
    })),
    places,
  };
  console.log(`${area.slug}: ${inArea.length} rivers, ${Object.keys(places).length} neighbourhoods with a stream nearby`);
}
writeFileSync("data/seo-areas-rivers.json", JSON.stringify(out, null, 1) + "\n");
