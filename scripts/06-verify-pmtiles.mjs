// Reads the published archive over HTTP exactly as the browser will - same library,
// same range requests - so this catches a corrupt archive or a bad metadata block
// before it shows up as an empty map.

import { PMTiles, FetchSource } from "pmtiles";
import { VectorTile } from "@mapbox/vector-tile";
import { PbfReader } from "pbf";
import { gunzipSync } from "node:zlib";

const URL_ = process.argv[2] ?? "http://localhost:5174/rivers.pmtiles";

let failures = 0;
const check = (label, ok, detail) => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` - ${detail}` : ""}`);
  if (!ok) failures++;
};

const p = new PMTiles(new FetchSource(URL_));

const header = await p.getHeader();
console.log(`archive: ${URL_}`);
console.log(`  zoom ${header.minZoom}-${header.maxZoom}, ${header.numAddressedTiles.toLocaleString()} tiles`);
console.log(
  `  bounds ${[header.minLon, header.minLat, header.maxLon, header.maxLat].map((n) => n.toFixed(2)).join(", ")}\n`
);

check("zoom range is 4-11", header.minZoom === 4 && header.maxZoom === 11);
check("covers India", header.minLon > 60 && header.maxLon < 100 && header.minLat > 5 && header.maxLat < 40);

const meta = await p.getMetadata();
const layers = meta.vector_layers;
check("declares vector_layers", Array.isArray(layers) && layers.length === 1, layers?.[0]?.id);
check("declares its fields", !!layers?.[0]?.fields?.name && !!layers?.[0]?.fields?.len);

// Pull the same tiles the map will request first.
const lonToX = (lon, z) => Math.floor(((lon + 180) / 360) * 2 ** z);
const latToY = (lat, z) => {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
};

async function namesAt(z, lon, lat) {
  const r = await p.getZxy(z, lonToX(lon, z), latToY(lat, z));
  if (!r) return null;
  let buf = new Uint8Array(r.data);
  if (buf[0] === 0x1f && buf[1] === 0x8b) buf = gunzipSync(buf);
  const layer = new VectorTile(new PbfReader(buf)).layers.rivers;
  if (!layer) return [];
  const out = [];
  for (let i = 0; i < layer.length; i++) out.push(layer.feature(i).properties.name);
  return out;
}

const z4 = await namesAt(4, 81, 22.5);
check("z4 tile fetches over range requests", z4 !== null, z4 ? `${z4.length} features` : "no tile");
check("z4 holds trunk rivers", !!z4?.some((n) => n.includes("River")), z4?.slice(0, 3).join(", "));

const mumbai = await namesAt(11, 72.8564, 19.2501);
check("z11 Mumbai tile fetches", mumbai !== null, mumbai ? `${mumbai.length} features` : "no tile");
check("Dahisar present at z11", !!mumbai?.includes("Dahisar"));

const satara = await namesAt(9, 73.4712, 17.9869);
check("Savitri present at z9 over Satara", !!satara?.includes("Savitri"));

console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nALL CHECKS PASSED");
process.exitCode = failures ? 1 : 0;
