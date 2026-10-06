// Publishes the river panel's "Fun Facts" from the curated list in data/river-facts.json:
//   { "<uid>": { "category", "fact", "sources": [urls], "confidence", "region" } }
// An entry carries no river name: the uid is enough, and the name lives in the river data.
// `fact` may also be a list, for a river with more than one (the Dahisar). A fact can link
// another river as [[uid|text]]. The sources
// stay in the curated file for review; the site gets public/river-facts.json,
// { "<uid>": ["<fact>", ...] }, fetched once by the panel.
//
// Fails if a fact points at a uid that isn't on the map, has no source, runs long, or still
// carries a "name" field. Error messages show the river's name from the map data.

import { readFileSync, writeFileSync } from "node:fs";
import { loadRivers } from "./lib/geo.mjs";

const FACTS = "data/river-facts.json";
const OUT = "public/river-facts.json";
const MAX_WORDS = 80;
const LINK = /\[\[(\d+)\|([^\]]+)\]\]/g;

const facts = JSON.parse(readFileSync(FACTS, "utf8"));
const overrides = JSON.parse(readFileSync("data/river-overrides.json", "utf8"));
const names = new Map();
for (const f of await loadRivers()) {
  const uid = String(f.properties.UID_River);
  names.set(uid, [f.properties.rivname ?? "", overrides[uid]?.rename ?? ""]);
}

// the river's name for messages: its rename, else the dataset's name
const label = (uid) => `${uid} ${names.get(uid)?.[1] || names.get(uid)?.[0] || "(unnamed)"}`;
const problems = [], out = {};
for (const [uid, f] of Object.entries(facts)) {
  if ("name" in f) problems.push(`${label(uid)}: "name" is no longer used in ${FACTS}; remove it (the river's name comes from the map data)`);
  if (!names.has(uid)) { problems.push(`${uid}: no such river on the map`); continue; }
  const texts = [f.fact ?? ""].flat().map((t) => t.trim());
  for (const text of texts) {
    // [[uid|text]] links another river; only its text is shown
    for (const [, to] of text.matchAll(LINK)) if (!names.has(to)) problems.push(`${label(uid)}: links to ${to}, which is not on the map`);
    const words = text.replace(LINK, "$2").split(/\s+/).length;
    if (!text) problems.push(`${label(uid)}: empty fact`);
    if (words > MAX_WORDS) problems.push(`${label(uid)}: ${words} words (max ${MAX_WORDS})`);
  }
  if (!f.sources?.length) problems.push(`${label(uid)}: no source`);
  out[uid] = texts;
}

if (problems.length) {
  console.error(`FAIL - ${problems.length} problem(s) in ${FACTS}:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
writeFileSync(OUT, JSON.stringify(Object.fromEntries(Object.entries(out).sort(([a], [b]) => +a - +b))));
console.log(`${Object.values(out).flat().length} fun facts for ${Object.keys(out).length} rivers -> ${OUT}`);
