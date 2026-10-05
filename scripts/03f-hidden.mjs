// Publishes the list of hidden rivers. A river is hidden by setting, on its entry in
// data/river-overrides.json (keyed by uid):
//   "hidden": true
// Missing, null or false mean the river is shown. The flag stands alone: it does not depend
// on, and does not change, any other attribute. The site gets public/river-hidden.json,
// { "hidden": ["<uid>", ...] }, fetched once at start-up; a hidden river is filtered out of
// every river layer, so setting the flag needs no tile rebuild.
//
//   node scripts/03f-hidden.mjs [overrides] [index] [outFile]     (npm run data:hidden)
//
// Reads committed files only, so it also runs in the deploy workflow: `npm run build` runs
// it first, and a bad entry stops the build. Fails if "hidden" is anything but true, false
// or null, or if a hidden uid is not a river on the map.

import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const OVERRIDES = args[0] ?? "data/river-overrides.json";
const INDEX = args[1] ?? "public/rivers-index.json";
const OUT = args[2] ?? "public/river-hidden.json";

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

const problems = [], hidden = [];
for (const [uid, ov] of Object.entries(overrides)) {
  const flag = ov?.hidden;
  if (flag === undefined || flag === null || flag === false) continue;
  const who = `${uid} ${index[uid]?.[0] || ov.name || "(unnamed)"}`;
  if (flag !== true) problems.push(`${who}: "hidden" must be true or false, not ${JSON.stringify(flag)}`);
  else if (!index[uid]) problems.push(`${who}: no such river on the map`);
  else hidden.push(uid);
}

if (problems.length) {
  console.error(`FAIL - ${problems.length} problem(s) with hidden rivers:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
writeFileSync(OUT, JSON.stringify({ hidden: hidden.sort((a, b) => +a - +b) }));
console.log(`${hidden.length} hidden river(s) -> ${OUT}`);
