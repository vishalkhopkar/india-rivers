// Publishes the river panel's "Doubtful naturality" tag: for a channel that may not be a
// natural stream. A river is tagged on its entry in data/river-overrides.json:
//   "doubtfulNaturality": true, "naturalityInfo": 0
// `naturalityInfo` is an index into data/naturality-info.json, a list of explanations, so
// that rivers sharing one explanation (Bengaluru's rajakaluves) do not each repeat it. The
// site gets public/river-naturality.json, { "texts": [...], "rivers": { "<uid>": <index> } },
// fetched once by the panel.
//
//   node scripts/03e-naturality.mjs [overrides] [texts] [index] [outFile]     (npm run data:naturality)
//
// Reads committed files only, so it also runs in the deploy workflow: `npm run build` runs
// it first, and a bad entry stops the build. Fails if a tagged river has no
// `naturalityInfo`, if that is not a whole number of 0 or more or has no text, if
// `doubtfulNaturality` is not true or false, if the uid isn't on the map, or if the texts
// are not a list of non-empty strings. Warns when a river has `naturalityInfo` but is not
// tagged.

import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const OVERRIDES = args[0] ?? "data/river-overrides.json";
const TEXTS = args[1] ?? "data/naturality-info.json";
const INDEX = args[2] ?? "public/rivers-index.json";
const OUT = args[3] ?? "public/river-naturality.json";

const problems = [], warnings = [];
const read = (path) => {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    console.error(`FAIL - cannot read ${path}: ${e.message}`);
    process.exit(1);
  }
};
const overrides = read(OVERRIDES);
const index = read(INDEX);

let texts = read(TEXTS);
if (!Array.isArray(texts)) {
  problems.push(`${TEXTS}: must be a list of texts, [ "...", "..." ]`);
  texts = [];
}
texts.forEach((t, i) => {
  if (typeof t !== "string" || !t.trim()) problems.push(`${TEXTS}: text ${i} must be a non-empty string`);
});

const rivers = {};
for (const [uid, ov] of Object.entries(overrides)) {
  const doubtful = ov.doubtfulNaturality, info = ov.naturalityInfo;
  if (doubtful === undefined && info === undefined) continue;
  const who = `${uid} ${index[uid]?.[0] || ov.name || "(unnamed)"}`;
  const before = problems.length;
  if (doubtful !== undefined && typeof doubtful !== "boolean")
    problems.push(`${who}: "doubtfulNaturality" must be true or false, not ${JSON.stringify(doubtful)}`);
  if (info !== undefined && !(Number.isInteger(info) && info >= 0))
    problems.push(`${who}: "naturalityInfo" must be a whole number, 0 or more, not ${JSON.stringify(info)}`);
  else if (info !== undefined && typeof texts[info] !== "string")
    problems.push(`${who}: "naturalityInfo" is ${info}, but ${TEXTS} has no text ${info} (it has ${texts.length})`);
  if (doubtful === true && info === undefined)
    problems.push(`${who}: "doubtfulNaturality" is true but there is no "naturalityInfo" - give it the number of a text in ${TEXTS}`);
  if ((doubtful === true || info !== undefined) && !index[uid]) problems.push(`${who}: no such river on the map`);
  if (problems.length > before) continue;
  if (doubtful === true) rivers[uid] = info;
  else warnings.push(`${who}: has "naturalityInfo" but "doubtfulNaturality" is not true - not tagged`);
}

if (warnings.length) console.log(`not tagged (check the entry):\n  ${warnings.join("\n  ")}`);
if (problems.length) {
  console.error(`FAIL - ${problems.length} problem(s) with doubtful naturality:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
writeFileSync(OUT, JSON.stringify({ texts, rivers: Object.fromEntries(Object.entries(rivers).sort(([a], [b]) => +a - +b)) }));
console.log(`${Object.keys(rivers).length} rivers tagged "Doubtful naturality", ${texts.length} text(s) -> ${OUT}`);
