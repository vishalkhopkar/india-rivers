// Decodes tiles back out of the MBTiles and checks real content, not just counts.
// Tile sizes looking reasonable proves nothing about whether the right rivers landed
// in the right tiles at the right zooms.

import { DatabaseSync } from "node:sqlite";
import { gunzipSync } from "node:zlib";
import { VectorTile } from "@mapbox/vector-tile";
import { PbfReader } from "pbf";

const db = new DatabaseSync("build/rivers.mbtiles", { readOnly: true });

const lonToX = (lon, z) => Math.floor(((lon + 180) / 360) * 2 ** z);
const latToY = (lat, z) => {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
};

function readTile(z, x, y) {
  const row = db
    .prepare("SELECT tile_data FROM tiles WHERE zoom_level=? AND tile_column=? AND tile_row=?")
    .get(z, x, 2 ** z - 1 - y);
  if (!row) return null;
  const layer = new VectorTile(new PbfReader(gunzipSync(row.tile_data))).layers.rivers;
  if (!layer) return null;
  const out = [];
  for (let i = 0; i < layer.length; i++) out.push(layer.feature(i));
  return { layer, features: out };
}

let failures = 0;
const check = (label, ok, detail) => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` - ${detail}` : ""}`);
  if (!ok) failures++;
};

// --- z3 and z4: the all-India view (z3 is what a phone opens at) -------------
for (const z of [3, 4]) {
  console.log(`
all-India view (z${z}):`);
  const names = new Set();
  let maxMinz = 0;
  for (const r of db.prepare("SELECT tile_column x, tile_row ry FROM tiles WHERE zoom_level=?").all(z)) {
    const t = readTile(z, r.x, 2 ** z - 1 - r.ry);
    for (const f of t.features) {
      names.add(f.properties.name);
      maxMinz = Math.max(maxMinz, f.properties.minz);
    }
  }
  check(`distinct rivers = ${names.size}`, names.size >= 20 && names.size <= 30, "expected 20-30");
  check("no river below its tier leaked in", maxMinz <= z, `max minz seen = ${maxMinz}`);
  const expectBig = ["Ganga", "Brahmaputra", "Godavari", "Yamuna", "Krishna"];
  check("major rivers present", expectBig.every((n) => names.has(n)), expectBig.filter((n) => !names.has(n)).join(", ") || "all present");
}

// --- specific rivers appear at their tier, and not before --------------------
// lon/lat sampled from each river's own course.
const cases = [
  { name: "Savitri", lon: 73.4712, lat: 17.9869, tier: 8 },
  { name: "Ulhas", lon: 73.2449, lat: 19.2148, tier: 7 },
  { name: "Vaitarna", lon: 73.1, lat: 19.65, tier: 6 },
  { name: "Dahisar", lon: 72.8564, lat: 19.2501, tier: 10 },
];

console.log("\nper-river tier behaviour:");
for (const c of cases) {
  const atTier = readTile(c.tier, lonToX(c.lon, c.tier), latToY(c.lat, c.tier));
  const present = atTier?.features.some((f) => f.properties.name === c.name) ?? false;

  const zBefore = c.tier - 1;
  const before = readTile(zBefore, lonToX(c.lon, zBefore), latToY(c.lat, zBefore));
  const leaked = before?.features.some((f) => f.properties.name === c.name) ?? false;

  check(`${c.name} visible at z${c.tier}`, present);
  check(`${c.name} absent at z${zBefore}`, !leaked);
}

// --- geometry lands at the right place on earth ------------------------------
console.log("\ngeometry placement:");
const z = 11, tx = lonToX(72.8564, z), ty = latToY(19.2501, z);
const mum = readTile(z, tx, ty);
const dah = mum?.features.find((f) => f.properties.name === "Dahisar");
if (!dah) {
  check("Dahisar geometry decodable", false);
} else {
  const gj = dah.toGeoJSON(tx, ty, z);
  const parts = gj.geometry.type === "LineString" ? [gj.geometry.coordinates] : gj.geometry.coordinates;
  const [lon, lat] = parts[0][0];
  const near = Math.abs(lon - 72.86) < 0.15 && Math.abs(lat - 19.25) < 0.15;
  check("Dahisar geometry decodes near Mumbai", near, `first vertex ${lon.toFixed(4)}, ${lat.toFixed(4)}`);
  check("properties carried through", !!dah.properties.uid && dah.properties.len > 0, `uid=${dah.properties.uid} len=${dah.properties.len}`);
}

// --- everything is present at maxzoom ----------------------------------------
console.log("\ncoverage at z11:");
const total = db.prepare("SELECT count(*) n FROM tiles WHERE zoom_level=11").get().n;
check("z11 tiles exist", total > 1000, `${total.toLocaleString()} tiles`);

db.close();
console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nALL CHECKS PASSED");
process.exit(failures ? 1 : 0);
