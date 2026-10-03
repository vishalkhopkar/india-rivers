// Adds rivers the CWC dataset lacks, from a hand-curated list (data/added-rivers.json).
//
// Courses come from one of two sources:
//   - OpenStreetMap: small urban rivers and nalas (the Vakola Nala, the Mahul creek) that
//     no elevation-derived network resolves. Their traced courses are stored in
//     data/added-rivers-osm.json, keyed by uid, with the OSM way ids in the entry.
//   - HydroRIVERS, as below.
//
// HydroRIVERS (HydroSHEDS) has courses CWC does not, the Bhogawati through Barshi among
// them, but no names. Each entry therefore names a river by hand and points at its
// HydroRIVERS reaches: the chain from `hydroSource` down to `hydroOutlet`. The course is
// cut where it reaches the river it joins and snapped onto that river's CWC line, so the
// confluence meets exactly. HydroRIVERS is traced on a 15-arc-second grid and moves in
// stair steps, so the line is lightly smoothed.
//
// Every added river must pass the conflict checks below, or the build fails:
//   - it must not run along an existing CWC river (that river is already drawn),
//   - it must not cross one (a course that crosses a river is misrouted),
//   - no CWC river nearby may carry a similar name (it may be the same river), and
//   - it must actually reach the river it is said to join.
//
// The added rivers are appended to build/rivers.ndjson, tagged with their src, so every
// later step treats them like CWC rivers. Re-running replaces the previous additions.
//
//   node scripts/01b-added-rivers.mjs                        build
//   node scripts/01b-added-rivers.mjs --check <in> <out>     report on candidates, write nothing

import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { open } from "shapefile";
import { loadRivers, partsOf, bboxOf, distKm, pointToLineKm } from "./lib/geo.mjs";

const LIST = "data/added-rivers.json";
const OSM_GEOMETRY = "data/added-rivers-osm.json";
const COURSES = "data/course-overrides.json";
const RIVERS = "build/rivers.ndjson";
const SOURCES = { hydro: "HydroSHEDS", osm: "OpenStreetMap" };

const JOIN_SNAP_KM = 0.5; // cut the course where it first comes this close to the river it joins
const JOIN_SNAP_OSM_KM = 0.15; // OSM courses are surveyed, so they can run closer before the cut
const JOIN_REACH_KM = 1.5; // ...and reject it if it never comes this close
const NEAR_JOIN_KM = 1.5; // near the confluence, closeness to other lines is expected
const OVERLAP_KM = 0.5; // a vertex this close to another CWC line is "on" that river
const OVERLAP_OSM_KM = 0.1; // ...tighter for surveyed OSM courses: city streams run close together
const OVERLAP_MAX_FRAC = 0.15;
const OVERLAP_RUN_KM = 2;
const NAME_SEARCH_KM = 40;

const checkMode = process.argv[2] === "--check";
const listPath = checkMode ? process.argv[3] : LIST;
const list = JSON.parse(readFileSync(listPath, "utf8"));

// --- CWC rivers ----------------------------------------------------------------------
const all = await loadRivers(RIVERS);
const cwc = all.filter((f) => !f.properties.src);
const osmGeometry = JSON.parse(readFileSync(OSM_GEOMETRY, "utf8"));

// --- HydroRIVERS -----------------------------------------------------------------------
const wanted = Object.values(list);
const reaches = new Map();
{
  const src = await open("data/raw/HydroRIVERS_v10_as.shp", "data/raw/HydroRIVERS_v10_as.dbf");
  while (true) {
    const { done, value } = await src.read();
    if (done) break;
    const [x, y] = value.geometry.coordinates[0];
    if (x < 66 || x > 100 || y < 5 || y > 38) continue;
    const p = value.properties;
    reaches.set(p.HYRIV_ID, { next: p.NEXT_DOWN, c: value.geometry.coordinates, upland: p.UPLAND_SKM });
  }
}
console.log(`HydroRIVERS reaches in the India window: ${reaches.size.toLocaleString()}`);

// CWC rivers whose course is corrected (data/course-overrides.json). The uid and
// attributes stay, so rivers that join them still link. Two kinds:
//   - `osmWays`: the line is redrawn from OSM (data/added-rivers-osm.json). The CWC Mithi
//     runs a kilometre past Vihar Lake into the hills; the river leaves the lake at its dam.
//   - `extend`: the CWC line stops short of the river it flows into, so it is continued
//     down the HydroRIVERS reaches `hydroSource`..`hydroOutlet`, from where they pass
//     closest to the CWC mouth to where they reach `joins`, and snapped onto that river.
//     The Jojri ends 50 km short of the Luni at Balotra. The original CWC course is kept
//     in `cwc_course` so that re-running this script starts from it again.
//   - `head`, `tailFrom`, `endsAt`: CWC drew the right channels but gave a stretch to the
//     wrong river. `head` swaps everything above the end of an OSM course (stored under
//     the uid in data/added-rivers-osm.json) for that course: CWC starts the Vrishabhavati
//     in Peenya, up the Nagarbhavi stream, where the river itself comes down from
//     Malleshwaram. `tailFrom` appends another river's course below this one's mouth, and
//     `endsAt` stops a river at another's (CWC) mouth: CWC carries the Suvarnamukhi on to
//     the Arkavati with the Vrishabhavati as its tributary, where it is the other way round.
const courseOverrides = JSON.parse(readFileSync(COURSES, "utf8"));
const lineKm = (line) => line.slice(1).reduce((s, c, i) => s + distKm(line[i][0], line[i][1], c[0], c[1]), 0);
const cwcByUid = new Map(cwc.map((f) => [String(f.properties.UID_River), f]));
for (const f of cwc) {
  const p = f.properties;
  if (p.cwc_course) {
    Object.assign(f, { geometry: p.cwc_course.geometry });
    Object.assign(p, p.cwc_course.props);
    delete p.cwc_course;
    delete p.join_uid;
  }
}
// CWC's own courses for the overrides that move a stretch between two rivers, read before
// any of them is changed. Parts must run on from one another, source to mouth.
const END_PROPS = ["en_pt_long", "en_pt_lat", "en_loc_ste", "en_loc_dst", "en_loc_sb_", "en_loc_vil", "Confluence"];
const START_PROPS = ["st_pt_long", "st_pt_lat"];
const cwcCourse = new Map();
for (const [uid, o] of Object.entries(courseOverrides)) {
  if (!(o.head || o.tailFrom || o.endsAt)) continue;
  for (const u of [uid, o.tailFrom, o.endsAt].filter(Boolean).map(String)) {
    const f = cwcByUid.get(u);
    if (!f) throw new Error(`${COURSES}: ${uid} refers to ${u}, which is not a CWC river`);
    const parts = partsOf(f.geometry);
    for (let i = 1; i < parts.length; i++) {
      const [a, b] = [parts[i - 1][parts[i - 1].length - 1], parts[i][0]];
      if (distKm(a[0], a[1], b[0], b[1]) > 0.05) throw new Error(`${COURSES}: the parts of ${u} do not run on from one another`);
    }
    cwcCourse.set(u, { line: parts.flatMap((q, i) => (i ? q.slice(1) : q)), props: { ...f.properties } });
  }
}
// Index of the vertex of `line` nearest a point, which must lie on the line.
function vertexAt(line, [x, y], what) {
  let bi = 0, bd = Infinity;
  line.forEach((c, i) => { const d = distKm(c[0], c[1], x, y); if (d < bd) { bd = d; bi = i; } });
  if (bd > 0.1) throw new Error(`${COURSES}: ${what} is ${bd.toFixed(2)} km off the line it should meet`);
  return bi;
}
for (const f of cwc) {
  const uid = String(f.properties.UID_River);
  const o = courseOverrides[uid];
  if (!o) continue;
  const p = f.properties;
  if (o.head || o.tailFrom || o.endsAt) {
    let line = cwcCourse.get(uid).line;
    const changed = { length_km: p.length_km };
    const keep = (keys) => keys.forEach((k) => (changed[k] = p[k]));
    if (o.head) {
      const head = osmGeometry[uid];
      if (!head) throw new Error(`no head course for ${uid} in ${OSM_GEOMETRY}`);
      line = [...head, ...line.slice(vertexAt(line, head[head.length - 1], `the new head of ${uid}`) + 1)];
      keep(START_PROPS);
      Object.assign(p, { st_pt_long: head[0][0], st_pt_lat: head[0][1] });
    }
    if (o.endsAt) {
      const other = cwcCourse.get(String(o.endsAt));
      const mouth = other.line[other.line.length - 1];
      line = line.slice(0, vertexAt(line, mouth, `the mouth of ${o.endsAt}`) + 1);
      keep(END_PROPS);
      Object.assign(p, Object.fromEntries(END_PROPS.map((k) => [k, other.props[k]])), { Confluence: other.props.rivname, join_uid: String(o.endsAt) });
    }
    if (o.tailFrom) {
      const other = cwcCourse.get(String(o.tailFrom));
      line = [...line, ...other.line.slice(vertexAt(other.line, line[line.length - 1], `the mouth of ${uid}`) + 1)];
      keep(END_PROPS);
      Object.assign(p, Object.fromEntries(END_PROPS.map((k) => [k, other.props[k]])));
    }
    p.cwc_course = { geometry: f.geometry, props: changed };
    f.geometry = { type: "LineString", coordinates: line };
    p.length_km = lineKm(line);
    console.log(`  ${uid} ${p.rivname}: ${changed.length_km.toFixed(1)} km -> ${p.length_km.toFixed(1)} km (${["head", "endsAt", "tailFrom"].filter((k) => o[k]).join(", ")})`);
  } else if (o.osmWays) {
    const line = osmGeometry[uid];
    if (!line) throw new Error(`no course for ${uid} in ${OSM_GEOMETRY}`);
    const [[x0, y0], [x1, y1]] = [line[0], line[line.length - 1]];
    f.geometry = { type: "LineString", coordinates: line };
    Object.assign(p, { length_km: lineKm(line), st_pt_long: x0, st_pt_lat: y0, en_pt_long: x1, en_pt_lat: y1, course_src: SOURCES.osm });
  } else if (o.extend) {
    const { hydroSource, hydroOutlet, joins } = o.extend;
    const target = cwcByUid.get(String(joins));
    if (!target) throw new Error(`${COURSES}: ${uid} extends to ${joins}, which is not a CWC river`);
    const targetParts = partsOf(target.geometry);
    const parts = partsOf(f.geometry);
    const mouth = [p.en_pt_long, p.en_pt_lat];
    if (!parts.some((q) => [q[0], q[q.length - 1]].some(([x, y]) => distKm(x, y, mouth[0], mouth[1]) < 0.5)))
      throw new Error(`${COURSES}: ${uid}'s recorded end is not an end of its line`);
    let ch = chain(hydroSource, hydroOutlet);
    const near = ch.reduce((bi, c, i) => (distKm(c[0], c[1], mouth[0], mouth[1]) < distKm(ch[bi][0], ch[bi][1], mouth[0], mouth[1]) ? i : bi), 0);
    ch = ch.slice(near);
    const cut = ch.findIndex(([x, y]) => pointToLineKm(x, y, targetParts) <= JOIN_SNAP_KM);
    if (cut === -1) throw new Error(`${COURSES}: reaches for ${uid} never come within ${JOIN_SNAP_KM} km of ${joins}`);
    const tail = ch[cut];
    const ext = smooth([mouth, ...ch.slice(1, cut)]).concat([nearestOn(tail[0], tail[1], targetParts)]);
    p.cwc_course = {
      geometry: f.geometry,
      props: { length_km: p.length_km, en_pt_long: p.en_pt_long, en_pt_lat: p.en_pt_lat, Confluence: p.Confluence },
    };
    f.geometry = { type: "MultiLineString", coordinates: [...parts, ext] };
    const [ex, ey] = ext[ext.length - 1];
    Object.assign(p, { length_km: p.length_km + lineKm(ext), en_pt_long: ex, en_pt_lat: ey, Confluence: target.properties.rivname, join_uid: String(joins) });
    console.log(`  ${uid} ${p.rivname}: extended ${lineKm(ext).toFixed(1)} km to ${target.properties.rivname}`);
  }
}
const corrected = cwc.filter((f) => courseOverrides[String(f.properties.UID_River)]).length;
if (corrected !== Object.keys(courseOverrides).length) throw new Error(`${COURSES} names a uid that is not a CWC river`);
console.log(`courses corrected: ${corrected}`);

const rivers = cwc.map((f) => {
  const parts = partsOf(f.geometry);
  return { uid: String(f.properties.UID_River), name: f.properties.rivname, props: f.properties, parts, bbox: bboxOf(parts) };
});
const byUid = new Map(rivers.map((r) => [r.uid, r]));
console.log(`CWC rivers: ${rivers.length}${all.length > cwc.length ? ` (dropped ${all.length - cwc.length} previous additions)` : ""}`);

function chain(sourceId, outletId) {
  const pts = [];
  let id = sourceId;
  for (let guard = 0; guard < 2000 && id; guard++) {
    const r = reaches.get(id);
    if (!r) throw new Error(`reach ${id} not found`);
    for (const c of r.c) {
      const last = pts[pts.length - 1];
      if (!last || last[0] !== c[0] || last[1] !== c[1]) pts.push(c);
    }
    if (id === outletId) return pts;
    id = r.next;
  }
  throw new Error(`reach ${outletId} is not downstream of ${sourceId}`);
}

// --- geometry helpers ----------------------------------------------------------------
const lengthKm = (line) => line.slice(1).reduce((s, c, i) => s + distKm(line[i][0], line[i][1], c[0], c[1]), 0);

// Nearest point on a (multi)line, in degrees. Planar maths is fine at this scale.
function nearestOn(lon, lat, parts) {
  const kx = Math.cos((lat * Math.PI) / 180);
  let best = null, bestD = Infinity;
  for (const part of parts)
    for (let i = 0; i + 1 < part.length; i++) {
      const [ax, ay] = part[i], [bx, by] = part[i + 1];
      const dx = (bx - ax) * kx, dy = by - ay;
      const len2 = dx * dx + dy * dy;
      const t = len2 ? Math.max(0, Math.min(1, (((lon - ax) * kx) * dx + (lat - ay) * dy) / len2)) : 0;
      const px = ax + t * (bx - ax), py = ay + t * (by - ay);
      const d = distKm(lon, lat, px, py);
      if (d < bestD) { bestD = d; best = [px, py]; }
    }
  return best;
}

// Chaikin corner cutting, endpoints kept exactly where they are.
function smooth(line, rounds = 2) {
  let pts = line;
  for (let k = 0; k < rounds; k++) {
    const out = [pts[0]];
    for (let i = 0; i + 1 < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
      out.push([0.75 * ax + 0.25 * bx, 0.75 * ay + 0.25 * by], [0.25 * ax + 0.75 * bx, 0.25 * ay + 0.75 * by]);
    }
    out.push(pts[pts.length - 1]);
    pts = out;
  }
  return pts.map(([x, y]) => [Math.round(x * 1e6) / 1e6, Math.round(y * 1e6) / 1e6]);
}

function segmentsCross([ax, ay], [bx, by], [cx, cy], [dx, dy]) {
  const o = (px, py, qx, qy, rx, ry) => Math.sign((qx - px) * (ry - py) - (qy - py) * (rx - px));
  return o(ax, ay, bx, by, cx, cy) * o(ax, ay, bx, by, dx, dy) < 0 && o(cx, cy, dx, dy, ax, ay) * o(cx, cy, dx, dy, bx, by) < 0;
}

const bboxesTouch = (a, b, padDeg) => a[0] - padDeg <= b[2] && b[0] - padDeg <= a[2] && a[1] - padDeg <= b[3] && b[1] - padDeg <= a[3];

// "Budhil Nadi" and "Budhil" are the same name; so, nearly, are "Nambul" and "Nambol".
const GENERIC = /\b(river|nadi|nala|nallah|nalla|nadhi|odai|vagu|vagu|khal|n|r)\b/g;
const normName = (s) => s.toLowerCase().replace(/\(.*?\)/g, " ").replace(GENERIC, " ").replace(/[^a-z]/g, "");
function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
// CWC often gives two names at once: "Korttalaiyar/Kushasthalaiar", "Bari Gandak Or Narayni".
const ALTERNATIVES = /\s*\/\s*|\s+or\s+/i;
function similarNames(a, b) {
  return a.split(ALTERNATIVES).some((x) => b.split(ALTERNATIVES).some((y) => similarName(x, y)));
}
function similarName(a, b) {
  const x = normName(a), y = normName(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (Math.min(x.length, y.length) >= 4 && (x.includes(y) || y.includes(x))) return true;
  return editDistance(x, y) / Math.max(x.length, y.length) <= 0.25;
}

// --- states, from the nearest Indian town ------------------------------------------------
const admin1 = new Map();
for (const line of readFileSync("data/raw/admin1CodesASCII.txt", "utf8").split("\n")) {
  const [code, name] = line.split("\t");
  if (code?.startsWith("IN.")) admin1.set(code, name);
}
const towns = [];
for (const line of readFileSync("data/raw/cities500.txt", "utf8").split("\n")) {
  const c = line.split("\t");
  if (c.length < 15 || c[8] !== "IN" || c[6] !== "P") continue;
  towns.push({ lon: +c[5], lat: +c[4], state: admin1.get(`IN.${c[10]}`) });
}
function stateAt(lon, lat) {
  let best = null, bestD = Infinity;
  for (const t of towns) {
    if (Math.abs(t.lon - lon) > 1.5 || Math.abs(t.lat - lat) > 1.5) continue;
    const d = distKm(lon, lat, t.lon, t.lat);
    if (d < bestD) { bestD = d; best = t; }
  }
  return best?.state ?? "";
}

// --- build each river --------------------------------------------------------------------
function build(uid, entry, addedSoFar) {
  const problems = [];
  const fromOsm = !!entry.osmWays;
  if (fromOsm && !osmGeometry[uid]) return { problems: [`no course for ${uid} in ${OSM_GEOMETRY}`] };
  let line = fromOsm ? osmGeometry[uid] : chain(entry.hydroSource, entry.hydroOutlet);
  // OSM courses are surveyed lines; only the stair-stepped HydroRIVERS ones need smoothing.
  const tidy = fromOsm ? (l) => l : smooth;
  const join = entry.joins ? byUid.get(String(entry.joins)) ?? addedRivers.get(String(entry.joins)) : null;
  if (entry.joins && !join) return { problems: [`joins uid ${entry.joins}, which is not in the data`] };
  if (join && entry.joinsName && join.name !== entry.joinsName)
    problems.push(`joins ${entry.joins} expected "${entry.joinsName}", data says "${join.name}"`);

  // `cutAt` ends a sea-bound river where it reaches a CWC line without joining it: the
  // Oshiwara meets the Malad Creek channel that the CWC draws as the Poisar's lower course.
  const meets = join ?? (entry.cutAt ? byUid.get(String(entry.cutAt)) : null);
  if (entry.cutAt && !meets) return { problems: [`cutAt uid ${entry.cutAt}, which is not in the data`] };
  if (meets) {
    const snapKm = fromOsm ? JOIN_SNAP_OSM_KM : JOIN_SNAP_KM;
    let cut = line.findIndex(([x, y]) => pointToLineKm(x, y, meets.parts) <= snapKm);
    if (cut === -1) {
      const [x, y] = line[line.length - 1];
      const d = pointToLineKm(x, y, meets.parts);
      if (d > JOIN_REACH_KM) problems.push(`ends ${d.toFixed(1)} km from ${meets.name}, which it is said to reach`);
      cut = line.length;
    }
    const tail = line[Math.min(cut, line.length - 1)];
    line = [...line.slice(0, Math.max(cut, 1)), nearestOn(tail[0], tail[1], meets.parts)];
    line = tidy(line.slice(0, -1)).concat([line[line.length - 1]]);
  } else {
    line = tidy(line);
  }
  const len = lengthKm(line);
  // A few real channels are shorter (the overflow from Powai Lake into the Mithi), so an
  // entry may lower the minimum with `minKm`.
  if (len < (entry.minKm ?? (fromOsm ? 2 : 3))) problems.push(`only ${len.toFixed(1)} km left after cutting at the confluence`);

  // Conflicts with existing rivers. The last stretch before the confluence is excused:
  // there the course naturally runs into, and up against, the river it joins.
  const box = bboxOf([line]);
  const nearby = rivers.filter((r) => bboxesTouch(r.bbox, box, 0.03));
  const [mx, my] = line[line.length - 1];
  const nearMouth = ([x, y]) => meets && distKm(x, y, mx, my) <= NEAR_JOIN_KM;

  let onKm = 0, run = 0, worstRun = 0, worstWho = null;
  for (let i = 0; i + 1 < line.length; i++) {
    const [x, y] = line[i];
    const seg = distKm(x, y, line[i + 1][0], line[i + 1][1]);
    const who = nearMouth(line[i]) ? null : nearby.find((r) => pointToLineKm(x, y, r.parts) <= (fromOsm ? OVERLAP_OSM_KM : OVERLAP_KM));
    if (who) {
      onKm += seg;
      run += seg;
      if (run > worstRun) { worstRun = run; worstWho = who; }
    } else run = 0;
  }
  if (onKm / len > OVERLAP_MAX_FRAC || worstRun >= OVERLAP_RUN_KM)
    problems.push(`runs along ${worstWho?.name ?? "existing rivers"} (uid ${worstWho?.uid}) for ${worstRun.toFixed(1)} km; ${Math.round((100 * onKm) / len)}% of it is on CWC lines`);

  const crossed = new Set();
  for (let i = 0; i + 1 < line.length; i++) {
    if (nearMouth(line[i + 1])) break;
    for (const r of nearby)
      for (const part of r.parts)
        for (let j = 0; j + 1 < part.length; j++)
          if (segmentsCross(line[i], line[i + 1], part[j], part[j + 1])) crossed.add(`${r.name} (uid ${r.uid})`);
  }
  if (crossed.size) problems.push(`crosses ${[...crossed].join(", ")}`);

  const pad = NAME_SEARCH_KM / 100;
  // `distinctFrom` lists rivers the name deliberately echoes: "Vrishabhavati Valley (V-116)"
  // is a drain of the Vrishabhavati's valley, not the river.
  const distinct = new Set((entry.distinctFrom ?? []).map(String));
  const clashes = rivers
    .filter((r) => !distinct.has(r.uid) && bboxesTouch(r.bbox, box, pad) && similarNames(r.name, entry.name))
    .map((r) => `${r.name} (uid ${r.uid})`);
  // Pieces of one river (the Desai Khadi's two branches and its main stem) share a group.
  for (const [otherUid, other] of addedSoFar)
    if (otherUid !== uid && !(entry.group && entry.group === list[otherUid].group) && similarNames(other.name, entry.name) && distKm(...line[0], ...other.at) < 100) clashes.push(`${other.name} (added ${otherUid})`);
  if (clashes.length) problems.push(`similar name nearby: ${clashes.join(", ")}`);

  const [sx, sy] = line[0];
  const feature = {
    type: "Feature",
    properties: {
      UID_River: uid,
      rivname: entry.name,
      ba_name: join?.props.ba_name ?? entry.basin ?? "",
      sub_basin: join?.props.sub_basin ?? "",
      length_km: len,
      origin: null,
      Confluence: join ? join.name : entry.into,
      state_al: stateAt(sx, sy),
      st_pt_lat: sy, st_pt_long: sx, st_loc_ste: stateAt(sx, sy),
      en_pt_lat: my, en_pt_long: mx, en_loc_ste: stateAt(mx, my),
      src: SOURCES[fromOsm ? "osm" : "hydro"],
      join_uid: join ? join.uid : "",
    },
    geometry: { type: "LineString", coordinates: line },
  };
  return { problems, feature, len };
}

const results = [];
// Added rivers that others join (the unnamed river the Somaiyya Nalla flows into), built
// first so the tributary can be cut and snapped onto them.
const addedRivers = new Map();
// Ordered by depth of the join chain (Hebbal H-200 -> H-300 -> ... -> BD-423), deepest
// target first.
const depth = (uid, seen = new Set()) =>
  list[uid]?.joins in list && !seen.has(uid) ? 1 + depth(list[uid].joins, seen.add(uid)) : 0;
const order = Object.keys(list).sort((a, b) => depth(a) - depth(b));
const addedSoFar = new Map(Object.entries(list).map(([uid, e]) => [uid, { name: e.name, at: e.osmWays ? osmGeometry[uid]?.[0] ?? [0, 0] : reaches.get(e.hydroSource)?.c[0] ?? [0, 0] }]));
for (const uid of order) {
  const entry = list[uid];
  if (!checkMode && byUid.has(uid)) throw new Error(`uid ${uid} is already a CWC river`);
  let r;
  try { r = build(uid, entry, addedSoFar); } catch (err) { r = { problems: [err.message] }; }
  results.push({ uid, name: entry.name, ...r });
  if (r.feature) {
    const parts = [r.feature.geometry.coordinates];
    addedRivers.set(uid, { uid, name: entry.name, props: r.feature.properties, parts, bbox: bboxOf(parts) });
  }
  console.log(`${r.problems.length ? "CONFLICT" : "ok      "} ${uid} ${entry.name.padEnd(20)} ${r.len ? r.len.toFixed(1).padStart(6) + " km" : ""}${r.problems.length ? "\n           " + r.problems.join("\n           ") : ""}`);
}

if (checkMode) {
  writeFileSync(process.argv[4], JSON.stringify(results.map(({ feature, ...rest }) => ({ ...rest, joins: feature?.properties.Confluence })), null, 2));
  console.log(`\n${results.filter((r) => !r.problems.length).length} of ${results.length} pass; report written to ${process.argv[4]}`);
} else {
  const bad = results.filter((r) => r.problems.length);
  if (bad.length) {
    console.error(`\nFAIL - ${bad.length} added river(s) conflict with the CWC data. Fix or remove them in ${LIST}.`);
    process.exit(1);
  }
  const lines = cwc.map((f) => JSON.stringify(f)).concat(results.map((r) => JSON.stringify(r.feature)));
  writeFileSync(RIVERS + ".tmp", lines.join("\n") + "\n");
  renameSync(RIVERS + ".tmp", RIVERS);
  console.log(`\nappended ${results.length} rivers to ${RIVERS} (${lines.length} features)`);
}
