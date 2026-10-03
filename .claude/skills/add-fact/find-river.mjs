// Finds rivers on the map by name, uid or position, so a fun fact lands on the right one.
// Many names repeat (four Suvarnamukhis, dozens of Kharis), so each match is printed with
// its length, where it rises, what it joins and where - enough to tell them apart.
// Read-only.
//
//   node .claude/skills/add-fact/find-river.mjs <name or uid>
//   node .claude/skills/add-fact/find-river.mjs <name> --near <lat>,<lon>   nearest match first
//   node .claude/skills/add-fact/find-river.mjs --near <lat>,<lon>          whatever flows there
//
// public/rivers-index.json (committed) gives display names, extents and the downstream
// river. Length, states, the dataset's own name and the origin/end descriptions come from
// build/ (gitignored); without it the listing is thinner but still usable.

import { readFileSync, existsSync, createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { pointToLineKm, pointToBboxKm, partsOf } from "../../../scripts/lib/geo.mjs";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const json = (p) => (existsSync(ROOT + p) ? JSON.parse(readFileSync(ROOT + p, "utf8")) : null);
const MAX_SHOWN = 25;
const NEAR_KM = 5;

const args = process.argv.slice(2);
const nearAt = args.indexOf("--near");
const near = nearAt >= 0 ? (args.splice(nearAt, 2)[1] ?? "").split(",").map(Number) : null;
const query = args.join(" ").trim();
if ((!query && !near) || (near && !(near.length === 2 && near.every(Number.isFinite)))) {
  console.error("usage: find-river.mjs <name or uid> [--near <lat>,<lon>]");
  process.exit(2);
}

const index = json("public/rivers-index.json");
if (!index) {
  console.error("public/rivers-index.json is missing - this is not a complete checkout.");
  process.exit(2);
}
const places = json("build/places.json") ?? {};
const topology = json("build/topology.json") ?? {};
const facts = json("data/river-facts.json") ?? {};

// Same folding as scripts/03d-facts.mjs, so a name that matches here passes its check.
const norm = (s) => (s ?? "").toLowerCase().replace(/\briver\b|\bnadi\b|[^a-z]/g, "");
// Looser: spelling variants of one name fold together (Vrishabhavathi / Vrishabhavati).
const loose = (s) => norm(s).replace(/h/g, "").replace(/w/g, "v").replace(/ee/g, "i").replace(/oo/g, "u").replace(/(.)\1+/g, "$1");
const words = (s) => (s ?? "").split(/[^A-Za-z]+/).map(loose).filter((w) => w && w !== "river" && w !== "nadi");
const q = norm(query), ql = loose(query), qw = new Set(words(query));
// Edit distance, for a last-resort "did you mean" when nothing else matches.
function editDistance(a, b) {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) next[j] = Math.min(row[j] + 1, next[j - 1] + 1, row[j - 1] + (a[i - 1] !== b[j - 1]));
    row = next;
  }
  return row[b.length];
}
// 0 exact, 1 name contains the query, 2 another spelling, 3 one river of a double name
// ("Mula-Mutha" finds the Mutha), 4 a near miss, 9 no match. Only the best tiers found
// are printed.
const rank = (name) => {
  const n = norm(name);
  if (!n || !q) return 9;
  if (n === q) return 0;
  if (n.includes(q)) return 1;
  const l = loose(name);
  if (l === ql || (ql.length >= 5 && l.includes(ql))) return 2;
  const w = words(name);
  if (qw.size > 1 && w.length && w.every((x) => qw.has(x)) && w.some((x) => x.length >= 4)) return 3;
  return ql.length >= 5 && Math.abs(l.length - ql.length) <= 2 && editDistance(l, ql) <= 2 ? 4 : 9;
};

// --- gather -------------------------------------------------------------------
const props = new Map(); // uid -> dataset attributes
const distance = new Map(); // uid -> km from --near
const haveBuild = existsSync(ROOT + "build/rivers.ndjson");
if (haveBuild) {
  const rl = createInterface({ input: createReadStream(ROOT + "build/rivers.ndjson"), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line) continue;
    // The attributes come first on every line; the geometry is parsed only when needed.
    const p = JSON.parse(line.slice(0, line.indexOf(',"geometry"')) + "}").properties;
    const uid = String(p.UID_River);
    props.set(uid, p);
    const e = index[uid];
    if (near && e && pointToBboxKm(near[1], near[0], e.slice(2, 6)) <= 50)
      distance.set(uid, pointToLineKm(near[1], near[0], partsOf(JSON.parse(line).geometry)));
  }
} else if (near) {
  for (const [uid, e] of Object.entries(index)) distance.set(uid, pointToBboxKm(near[1], near[0], e.slice(2, 6)));
}

const matches = [];
for (const [uid, e] of Object.entries(index)) {
  const r = !query ? 9 : uid === query ? 0 : Math.min(rank(e[0]), rank(props.get(uid)?.rivname));
  if (query ? r < 9 : distance.get(uid) <= NEAR_KM) matches.push({ uid, r });
}
// Weaker tiers are noise once the name itself has been found.
const best = Math.min(9, ...matches.map((m) => m.r));
if (query) for (let i = matches.length - 1; i >= 0; i--) if (matches[i].r > Math.max(best, 2)) matches.splice(i, 1);
const lengthOf = (uid) => props.get(uid)?.length_km ?? 0;
matches.sort((a, b) =>
  near ? (distance.get(a.uid) ?? 1e9) - (distance.get(b.uid) ?? 1e9) || a.r - b.r : a.r - b.r || lengthOf(b.uid) - lengthOf(a.uid)
);

// --- print --------------------------------------------------------------------
const RANK = ["", "  (name contains the query)", "  (other spelling)", "  (part of the name asked for)", "  (near miss - did you mean this?)"];
for (const { uid, r } of matches.slice(0, MAX_SHOWN)) {
  const [name, minz, w, s, e, n, down] = index[uid];
  const p = props.get(uid), pl = places[uid] ?? {}, t = topology[uid] ?? {};
  const had = [facts[uid]?.fact ?? []].flat();
  const head = [
    uid.padEnd(6),
    name || "(unnamed)",
    p ? `${p.length_km.toFixed(p.length_km < 10 ? 1 : 0)} km` : "",
    near && distance.has(uid) ? `${distance.get(uid).toFixed(1)} km ${haveBuild ? "from the point" : "to its extent"}` : "",
    had.length ? `HAS ${had.length} FACT${had.length > 1 ? "S" : ""}` : "",
  ].filter(Boolean).join("  ");
  console.log(head + (RANK[r] ?? ""));
  const row = (k, v) => v && console.log(`        ${k.padEnd(8)}${v}`);
  if (p && p.rivname !== name) row("dataset", `"${p.rivname ?? ""}"  (use the shown name, or this one, as the fact's "name")`);
  row("rises", pl.o && `${pl.on ? "near " : ""}${pl.o}`);
  const into = down
    ? `${index[down]?.[0] || "unnamed river"} (uid ${down})`
    : t.kind === "border" ? `${t.into} (leaves India)` : t.kind === "inland" ? "nothing: an inland basin" : t.into ?? p?.Confluence;
  row("joins", into);
  row("ends", pl.e && `${pl.en ? "near " : ""}${pl.e}`);
  row("states", p && [p.state_al, p.ba_name && `${p.ba_name} basin`].filter(Boolean).join("; "));
  row("extent", `${s}-${n} N, ${w}-${e} E; drawn from zoom ${minz}${p?.src ? `; course from ${p.src}` : ""}`);
  for (const f of had) row("fact", `${f.split(/\s+/).length} words: ${f.slice(0, 90)}${f.length > 90 ? "..." : ""}`);
}

const where = near ? ` within ${NEAR_KM} km of ${near.join(",")}` : "";
if (!matches.length) console.log(query ? `no river named like "${query}"${near ? " (the name filter applies even with --near; try --near alone)" : ""}` : `no river${where}`);
else if (matches.length > MAX_SHOWN) console.log(`... ${matches.length - MAX_SHOWN} more; narrow it with --near <lat>,<lon>`);
else console.log(`${matches.length} match${matches.length > 1 ? "es" : ""}${query ? "" : where}`);
if (!haveBuild)
  console.log("note: build/rivers.ndjson is missing, so lengths, states and dataset names are not shown. `npm run data:facts` needs it too.");
process.exit(matches.length ? 0 : 1);
