// Reports the zoom-tier distribution. The tier itself is applied in 04-tiles via
// lib/tiers.mjs - rewriting the 143MB extract just to add one integer field would be
// pointless I/O, so this script only verifies the thresholds land where intended.

import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { minzFor, MIN_ZOOM, MAX_ZOOM } from "./lib/tiers.mjs";

const WATCH = ["Savitri", "Ulhas", "Vaitarna", "Dahisar", "Koyna", "Ganga River"];

const perZoom = new Map();
const found = new Map();
let total = 0;

const rl = createInterface({
  input: createReadStream("build/rivers.ndjson"),
  crlfDelay: Infinity,
});

for await (const line of rl) {
  if (!line) continue;
  const p = JSON.parse(line).properties;
  const z = minzFor(p.length_km);
  perZoom.set(z, (perZoom.get(z) ?? 0) + 1);
  total++;
  if (WATCH.includes(p.rivname) && !found.has(p.rivname)) {
    found.set(p.rivname, { len: p.length_km, z });
  }
}

console.log(`total features: ${total}\n`);
console.log("zoom  threshold   new    cumulative visible");
const thresholds = { 4: "≥600 km", 5: "≥300 km", 6: "≥150 km", 7: "≥100 km", 8: "≥50 km", 9: "≥30 km", 10: "≥15 km", 11: "all" };
let cum = 0;
for (let z = MIN_ZOOM; z <= MAX_ZOOM; z++) {
  const n = perZoom.get(z) ?? 0;
  cum += n;
  console.log(`  ${String(z).padStart(2)}  ${thresholds[z].padEnd(9)} ${String(n).padStart(6)}   ${cum.toLocaleString().padStart(9)}`);
}

console.log(`\nspot checks:`);
for (const name of WATCH) {
  const f = found.get(name);
  console.log(f ? `  ${name.padEnd(12)} ${f.len.toFixed(1).padStart(7)} km  -> z${f.z}` : `  ${name.padEnd(12)} NOT FOUND`);
}

const atZ4 = perZoom.get(4) ?? 0;
if (atZ4 < 20 || atZ4 > 30) {
  console.error(`\nFAIL: all-India view shows ${atZ4} rivers, expected 20-30.`);
  process.exit(1);
}
console.log(`\nOK - all-India view shows ${atZ4} rivers`);
