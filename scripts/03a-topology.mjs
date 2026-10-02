// Resolves each river's `Confluence` text into what it actually flows into:
//   - a specific downstream river (by uid), for tributaries
//   - a named sea, a neighbouring country, or inland drainage, for terminal rivers
//
// Confluence is only a name, and names repeat ("Pedda Vagu" x50), so every candidate
// is scored by how close its course passes to the tributary's declared end point.
// A unique name match is checked the same way: a "unique" parent 400 km away is a
// name collision with a river missing from the dataset, not the real parent.

import { writeFileSync, readFileSync } from "node:fs";
import { loadRivers, partsOf, bboxOf, pointToLineKm, pointToBboxKm, originPoint, distKm } from "./lib/geo.mjs";

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
    origin: originPoint(p, parts),
    end: [p.en_pt_long, p.en_pt_lat],
    parts,
    bbox: bboxOf(parts),
    joinUid: p.join_uid, // set on rivers added from HydroRIVERS (01b)
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
  // Rivers added by hand name the river they join by uid, which also covers joining an
  // unnamed river or another added one.
  if (r.joinUid && byUid.has(r.joinUid)) {
    out[r.uid] = { kind: "trib", into: byUid.get(r.joinUid).name, down: r.joinUid, d: 0 };
    stats.linked++;
    continue;
  }
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

// --- how each river begins -------------------------------------------------------
// Most rivers rise at a source. Three kinds do not, and get no "origin":
//   formed by    - two or more rivers meet at its start (Ganga, Mula-Mutha, Pranhita)
//   continues    - exactly one river ends at its start; it is that river renamed
//                  (Devi continues the Katjuri/Kathajodi)
//   branched off - its start lies part-way along another river (Birupa leaves the
//                  Mahanadi at Cuttack): a distributary
//
// Formers usually end exactly on the start (0.00 km), and those always count. A former
// can also be digitised a little short - the Wainganga ends 3.8 km from the Pranhita's
// start - so within 5 km a river also counts if it is at least a quarter the length of
// the longest one there. That admits the Wainganga (634 km) but not the 31 km Mota Nala
// beside it, nor the Ganga's 9 km Randi Gad.
const FORMED_EXACT_KM = 0.5;
const FORMED_NEAR_KM = 5;
const FORMED_SHARE = 0.25;
// The start must sit on the parent's line. A big river's digitised centreline can lie
// well inside a channel over a kilometre wide (the Bhagirathi leaves the Ganga 0.63 km
// from it at Farakka), so long parents get more room.
const BRANCH_ON_KM = 0.1;
const BRANCH_ON_BIG_KM = 1;
const BIG_RIVER_KM = 300;
const branchTolerance = (g) => (g.len >= BIG_RIVER_KM ? BRANCH_ON_BIG_KM : BRANCH_ON_KM);
const BRANCH_INTERIOR_KM = 1; // ...and away from the parent's own ends
const REJOIN_MIN_KM = 2; // a loop shorter than this is digitising noise, not an anabranch
const rejoined = [];
let rejoinedReversed = 0;

const feeders = new Map();
for (const [u, t] of Object.entries(out)) {
  if (!t.down) continue;
  if (!feeders.has(t.down)) feeders.set(t.down, []);
  feeders.get(t.down).push(u);
}

let formed = 0, continued = 0, branched = 0;
for (const r of rivers) {
  const [ox, oy] = r.origin;
  const near = (feeders.get(r.uid) ?? [])
    .map((u) => ({ u, d: distKm(byUid.get(u).end[0], byUid.get(u).end[1], ox, oy), len: byUid.get(u).len }))
    .filter((c) => c.d <= FORMED_NEAR_KM);
  const longest = Math.max(0, ...near.map((c) => c.len));
  // A former found short of the start must also be substantial next to the river it
  // forms, or small headwater streams near a long river's own source (the Ramganga's)
  // would be mistaken for formers.
  const formers = near.filter(
    (c) => c.d <= FORMED_EXACT_KM || (c.len >= FORMED_SHARE * longest && c.len >= 0.5 * r.len)
  );

  if (formers.length >= 2) {
    // Formers meeting exactly at the start come first, then longest first - the usual
    // phrasing: "Bhagirathi and Alaknanda", "Mula and Mutha", "Wardha and Wainganga".
    const exact = (c) => (c.d <= FORMED_EXACT_KM ? 0 : 1);
    out[r.uid].formedBy = formers.sort((a, b) => exact(a) - exact(b) || b.len - a.len).map((c) => c.u);
    formed++;
  } else if (formers.length === 1 && formers[0].d <= FORMED_EXACT_KM) {
    out[r.uid].continues = formers[0].u;
    continued++;
  }
}

// Distributaries: a start on the middle of another river. Spatial grid keeps this from
// being 30k x 30k line tests.
const GRID = 0.25;
const grid = new Map();
for (const r of rivers) {
  const [x0, y0, x1, y1] = r.bbox;
  for (let gx = Math.floor(x0 / GRID); gx <= Math.floor(x1 / GRID); gx++)
    for (let gy = Math.floor(y0 / GRID); gy <= Math.floor(y1 / GRID); gy++) {
      const k = `${gx},${gy}`;
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push(r);
    }
}
let swapped = 0;
for (const r of rivers) {
  if (out[r.uid].formedBy || out[r.uid].continues) continue;
  const [ox, oy] = r.origin;
  let parent = null, best = Infinity;
  for (const g of grid.get(`${Math.floor(ox / GRID)},${Math.floor(oy / GRID)}`) ?? []) {
    if (g === r || pointToBboxKm(ox, oy, g.bbox) > branchTolerance(g)) continue;
    // Same name: the dataset cutting one river into pieces, not a branch.
    if (g.name === r.name) continue;
    const d = pointToLineKm(ox, oy, g.parts);
    if (d > branchTolerance(g) || d >= best) continue;
    // At the parent's end it would be a confluence; at its start, a shared source.
    const gStart = g.origin, gEnd = g.end;
    if (distKm(ox, oy, gStart[0], gStart[1]) < BRANCH_INTERIOR_KM) continue;
    if (distKm(ox, oy, gEnd[0], gEnd[1]) < BRANCH_INTERIOR_KM) continue;
    best = d;
    parent = g;
  }
  if (!parent) continue;
  // Starting on the very river it flows into means the recorded start and end are
  // swapped (Banjar "starts" on the Narmada it joins). It is a tributary, and its real
  // source is the recorded end.
  //
  // Unless its end is on that river too: then it leaves the river and rejoins it lower
  // down (the Chhoti Yamuna), and its start really is where it branches off.
  const rejoins = pointToLineKm(r.end[0], r.end[1], parent.parts) <= branchTolerance(parent) &&
    distKm(ox, oy, r.end[0], r.end[1]) >= REJOIN_MIN_KM;
  if (out[r.uid].down === parent.uid && !rejoins) {
    out[r.uid].swapped = true;
    swapped++;
    continue;
  }
  if (rejoins) {
    rejoined.push(r.name);
    // Such a loop can still be digitised mouth-first. The branch point is the end farther
    // from the parent's mouth.
    const [mx, my] = parent.end;
    if (distKm(ox, oy, mx, my) < distKm(r.end[0], r.end[1], mx, my)) {
      out[r.uid].swapped = true;
      rejoinedReversed++;
    }
  }
  out[r.uid].branchedFrom = parent.uid;
  branched++;
}

// Hand-declared formers, for rivers whose confluence the dataset does not join up.
// A hand-written origin means the source is known, so it outranks "continues" and
// "branched off" (the Sharda's data shows it continuing the Kuthi Yankti, yet it rises
// at Kalapani).
const overrides = JSON.parse(readFileSync("data/river-overrides.json", "utf8"));
// Links the data gets wrong. Main Drain No 8 is digitised mouth-first, starting exactly
// where the Najafgarh Drain begins: declaring it swapped, flowing into the Najafgarh
// Drain, and the Najafgarh Drain continuing it, restores the real picture.
const badLinks = [];
for (const [uid, ov] of Object.entries(overrides)) {
  if (!out[uid]) continue;
  for (const k of ["down", "continues"]) if (ov[k] && !byUid.has(ov[k])) badLinks.push(`${uid}: ${k} ${ov[k]} is not in the data`);
  if (ov.swapped) { out[uid].swapped = true; delete out[uid].branchedFrom; }
  if (ov.down && byUid.has(ov.down)) Object.assign(out[uid], { kind: "trib", into: byUid.get(ov.down).name, down: ov.down, d: 0 });
  if (ov.continues && byUid.has(ov.continues)) {
    out[uid].continues = ov.continues;
    delete out[uid].formedBy;
    delete out[uid].branchedFrom;
  }
}
if (badLinks.length) {
  console.error(`FAIL - link overrides reference missing rivers:\n  ${badLinks.join("\n  ")}`);
  process.exit(1);
}
for (const [uid, ov] of Object.entries(overrides)) {
  if (!ov.origin || !out[uid]) continue;
  delete out[uid].continues;
  delete out[uid].branchedFrom;
}
const badFormers = [];
for (const [uid, ov] of Object.entries(overrides)) {
  if (!ov.formedBy) continue;
  const missing = ov.formedBy.filter((u) => !byUid.has(u));
  if (missing.length || !byUid.has(uid)) badFormers.push(`${uid}: unknown uid(s) ${missing.join(", ")}`);
  else {
    if (!out[uid].formedBy) formed++;
    out[uid].formedBy = ov.formedBy;
    delete out[uid].continues;
    delete out[uid].branchedFrom;
  }
}
if (badFormers.length) {
  console.error(`FAIL - formedBy overrides reference missing rivers:\n  ${badFormers.join("\n  ")}`);
  process.exit(1);
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

// Rivers added by hand were cut and snapped onto a specific river; resolving their
// Confluence name must land on that same river.
const misjoined = rivers
  .filter((r) => r.joinUid && out[r.uid]?.down !== r.joinUid)
  .map((r) => `${r.uid} ${r.name}: curated to join ${r.joinUid}, resolved to ${out[r.uid]?.down ?? out[r.uid]?.into}`);
if (misjoined.length) {
  console.error(`FAIL - added rivers linked to the wrong river:\n  ${misjoined.join("\n  ")}`);
  process.exit(1);
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
const largest = (key, n = 12) => rivers.filter((r) => out[r.uid][key]).sort((a, b) => b.len - a.len).slice(0, n);
const nm = (u) => byUid.get(u).name;
console.log(`\nformed by a confluence: ${formed} rivers. Largest:`);
for (const r of largest("formedBy")) console.log(`  ${r.name.padEnd(22)} <- ${out[r.uid].formedBy.map(nm).join(" + ")}`);
console.log(`continues another river: ${continued}. Largest:`);
for (const r of largest("continues", 8)) console.log(`  ${r.name.padEnd(22)} <- ${nm(out[r.uid].continues)}`);
console.log(`start and end swapped in the data (start sits on its own parent): ${swapped}`);
console.log(`branches that rejoin their parent: ${rejoined.length}, ${rejoinedReversed} of them digitised mouth-first (${rejoined.slice(0, 12).join(", ")}${rejoined.length > 12 ? ", ..." : ""})`);
console.log(`branched off another river: ${branched}. Largest:`);
for (const r of largest("branchedFrom", 14)) console.log(`  ${r.name.padEnd(22)} <- ${nm(out[r.uid].branchedFrom)}`);
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
