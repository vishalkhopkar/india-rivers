// Publishes the river panel's "Fun Facts" from the curated list in data/river-facts.json:
//   { "<uid>": { "name", "category", "fact", "sources": [urls], "confidence" } }
// `fact` may also be a list, for a river with more than one (the Dahisar). The sources
// stay in the curated file for review; the site gets public/river-facts.json,
// { "<uid>": ["<fact>", ...] }, fetched once by the panel.
//
// Fails if a fact points at a uid that isn't on the map, has no source, or runs long. Warns
// when the name recorded with the fact doesn't match the river's name, which usually means
// the fact is attached to a different river of the same name.

import { readFileSync, writeFileSync } from "node:fs";
import { loadRivers } from "./lib/geo.mjs";

const FACTS = "data/river-facts.json";
const OUT = "public/river-facts.json";
const MAX_WORDS = 80;

const facts = JSON.parse(readFileSync(FACTS, "utf8"));
const overrides = JSON.parse(readFileSync("data/river-overrides.json", "utf8"));
const names = new Map();
for (const f of await loadRivers()) {
  const uid = String(f.properties.UID_River);
  names.set(uid, [f.properties.rivname ?? "", overrides[uid]?.rename ?? ""]);
}

const norm = (s) => s.toLowerCase().replace(/\briver\b|\bnadi\b|[^a-z]/g, "");
const problems = [], warnings = [], out = {};
for (const [uid, f] of Object.entries(facts)) {
  if (!names.has(uid)) { problems.push(`${uid} ${f.name}: no such river on the map`); continue; }
  const texts = [f.fact ?? ""].flat().map((t) => t.trim());
  for (const text of texts) {
    const words = text.split(/\s+/).length;
    if (!text) problems.push(`${uid} ${f.name}: empty fact`);
    if (words > MAX_WORDS) problems.push(`${uid} ${f.name}: ${words} words (max ${MAX_WORDS})`);
  }
  if (!f.sources?.length) problems.push(`${uid} ${f.name}: no source`);
  const known = names.get(uid).filter(Boolean).map(norm);
  const given = norm(f.name ?? "");
  // an unnamed river has no name to mismatch
  if (known.length && !known.some((n) => n.includes(given) || given.includes(n)))
    warnings.push(`${uid}: fact names "${f.name}", map has "${names.get(uid).filter(Boolean).join('" / "')}"`);
  out[uid] = texts;
}

if (warnings.length) console.log(`name mismatches (check the uid):\n  ${warnings.join("\n  ")}`);
if (problems.length) {
  console.error(`FAIL - ${problems.length} problem(s) in ${FACTS}:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
writeFileSync(OUT, JSON.stringify(Object.fromEntries(Object.entries(out).sort(([a], [b]) => +a - +b))));
console.log(`${Object.values(out).flat().length} fun facts for ${Object.keys(out).length} rivers -> ${OUT}`);
