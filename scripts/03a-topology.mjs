// Resolves each river's `Confluence` text into what it actually flows into:
//   - a specific downstream river (by uid), for tributaries
//   - a named sea, a neighbouring country, or inland drainage, for terminal rivers
//
// Confluence is only a name, and names repeat ("Pedda Vagu" x50), so every candidate
// is scored by how close its course passes to the tributary's declared end point.
// A unique name match is checked the same way: a "unique" parent 400 km away is a
// name collision with a river missing from the dataset, not the real parent.

import { writeFileSync } from "node:fs";
import { loadRivers, partsOf, bboxOf, pointToLineKm, pointToBboxKm } from "./lib/geo.mjs";

// A tributary's end point should sit on its parent. Beyond this, the match is not
// trusted enough to link to.
const LINK_MAX_KM = 3;

const SINKS = [
  [/bay of bengal|bey of bengal/i, "sea", "Bay of Bengal"],
  [/arabian sea/i, "sea", "Arabian Sea"],
  [/andaman sea/i, "sea", "Andaman Sea"],
  [/gulf of kutch/i, "sea", "Gulf of Kutch"],
  [/gulf of khambhat/i, "sea", "Gulf of Khambhat"],
  [/gulf of mannar/i, "sea", "Gulf of Mannar"],
  [/palk strait/i, "sea", "Palk Strait"],
  [/rann of kutch/i, "sea", "Rann of Kutch"],
  [/^in ?land$/i, "inland", "Inland drainage"],
  [/^in bangladesh$/i, "border", "Bangladesh"],
  [/^in pakistan$/i, "border", "Pakistan"],
  [/^in myanmar$/i, "border", "Myanmar"],
  [/^in bhutan$/i, "border", "Bhutan"],
];

function sinkOf(text) {
  for (const [re, kind, into] of SINKS) if (re.test(text.trim())) return { kind, into };
  return null;
}

console.log("loading...");
const rivers = (await loadRivers()).map((f) => {
  const parts = partsOf(f.geometry);
  const p = f.properties;
  return {
    uid: String(p.UID_River),
    name: p.rivname ?? "",
    len: p.length_km ?? 0,
    confl: (p.Confluence ?? "").trim(),
    end: [p.en_pt_long, p.en_pt_lat],
    parts,
    bbox: bboxOf(parts),
  };
});
const byUid = new Map(rivers.map((r) => [r.uid, r]));
const byName = new Map();
for (const r of rivers) {
  if (!byName.has(r.name)) byName.set(r.name, []);
  byName.get(r.name).push(r);
}
console.log(`  ${rivers.length} rivers, ${byName.size} distinct names`);

const out = {};
const stats = { sea: 0, border: 0, inland: 0, linked: 0, tooFar: 0, noCandidate: 0 };
const dists = { unique: [], ambiguous: [] };
const farExamples = [];

for (const r of rivers) {
  const sink = sinkOf(r.confl);
  if (sink) {
    out[r.uid] = { kind: sink.kind, into: sink.into };
    stats[sink.kind]++;
    continue;
  }

  const candidates = (byName.get(r.confl) ?? []).filter((c) => c.uid !== r.uid);
  if (!candidates.length) {
    out[r.uid] = { kind: "trib", into: r.confl, down: null };
    stats.noCandidate++;
    continue;
  }

  const [lon, lat] = r.end;
  let best = null, bestD = Infinity;
  for (const c of candidates) {
    if (pointToBboxKm(lon, lat, c.bbox) >= bestD) continue;
    const d = pointToLineKm(lon, lat, c.parts);
    if (d < bestD) { bestD = d; best = c; }
  }
  (candidates.length === 1 ? dists.unique : dists.ambiguous).push(bestD);

  // The 55 "<Name> River" trunks are uniquely named national rivers. When the name
  // matches one of them, it is the parent even if the digitised end point stops short
  // (e.g. Banjar is recorded 425 km from the Narmada River line, yet it does join it).
  const trunkByName = candidates.length === 1 && / River$/.test(best.name);

  if (bestD <= LINK_MAX_KM || trunkByName) {
    out[r.uid] = { kind: "trib", into: best.name, down: best.uid, d: +bestD.toFixed(2) };
    stats.linked++;
    if (bestD > LINK_MAX_KM) stats.trunkByName = (stats.trunkByName ?? 0) + 1;
  } else {
    out[r.uid] = { kind: "trib", into: r.confl, down: null, d: +bestD.toFixed(2) };
    stats.tooFar++;
    if (farExamples.length < 8 && bestD > 20)
      farExamples.push(`${r.name} -> ${r.confl}: nearest of ${candidates.length} is ${bestD.toFixed(0)} km away`);
  }
}

// --- cycles -------------------------------------------------------------------
// Name-based graphs can loop (A says it joins B, B says it joins A), usually with both
// meeting at the same point so distance cannot tell them apart. The longest river in
// the loop is the one that carries on downstream, so its link is the bad one.
let cyclesBroken = 0;
for (const r of rivers) {
  const seen = [];
  let cur = r.uid;
  while (cur && out[cur]?.down) {
    const at = seen.indexOf(cur);
    if (at !== -1) {
      const loop = seen.slice(at);
      const weakest = loop.reduce((a, b) => (byUid.get(a).len >= byUid.get(b).len ? a : b));
      out[weakest].down = null;
      out[weakest].cycle = true;
      cyclesBroken++;
      break;
    }
    seen.push(cur);
    cur = out[cur].down;
  }
}

// --- chain depth to a terminal ------------------------------------------------
let maxDepth = 0, deepest = "";
const depthHist = new Map();
for (const r of rivers) {
  let depth = 0, cur = r.uid;
  while (out[cur]?.down) { cur = out[cur].down; depth++; }
  depthHist.set(depth, (depthHist.get(depth) ?? 0) + 1);
  if (depth > maxDepth) { maxDepth = depth; deepest = r.name; }
}

writeFileSync("build/topology.json", JSON.stringify(out));

// --- report -------------------------------------------------------------------
const pct = (arr, p) => {
  const s = [...arr].sort((a, b) => a - b);
  return s.length ? s[Math.floor((s.length - 1) * p)] : NaN;
};
console.log(`\nterminal:  sea ${stats.sea}, border ${stats.border}, inland ${stats.inland}`);
console.log(`tributary: linked ${stats.linked} (${stats.trunkByName ?? 0} by trunk name despite distance), parent too far ${stats.tooFar}, no river by that name ${stats.noCandidate}`);
for (const [k, arr] of Object.entries(dists)) {
  console.log(
    `  ${k.padEnd(9)} end-point -> parent distance (n=${arr.length}): ` +
      [0.5, 0.9, 0.95, 0.99].map((p) => `p${p * 100}=${pct(arr, p).toFixed(2)}km`).join("  ")
  );
}
console.log(`cycles broken: ${cyclesBroken}`);
console.log(`chain depth to terminal: max ${maxDepth} (${deepest}); ` +
  [...depthHist].sort((a, b) => a[0] - b[0]).map(([d, n]) => `${d}:${n}`).join(" "));
if (farExamples.length) console.log(`\nfar matches (not linked):\n  ${farExamples.join("\n  ")}`);

// The user's own example, plus a few that must resolve.
console.log("\nspot checks:");
for (const name of ["Ulhas", "Dahisar", "Savitri", "Koyna", "Yamuna River", "Balijan"]) {
  const r = byName.get(name)?.[0];
  if (!r) { console.log(`  ${name}: not found`); continue; }
  const t = out[r.uid];
  console.log(`  ${name.padEnd(13)} -> ${t.kind}: ${t.into}${t.down ? ` (uid ${t.down}, ${t.d} km)` : ""}`);
}
