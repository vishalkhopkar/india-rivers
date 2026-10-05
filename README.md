# Rivers of India

An interactive map of India's rivers. Clicking a river opens a panel with its length, where it rises, what it flows into and, for some rivers, a fun fact. It is a static site (Vite, TypeScript, MapLibre, PMTiles) published on GitHub Pages.

- Production: https://vishalkhopkar.github.io/india-rivers/ is built from the `master` branch.
- Dev: https://vishalkhopkar.github.io/india-rivers/dev/ is built from the `dev` branch.

Every river has an address of its own, made from its uid: https://vishalkhopkar.github.io/india-rivers/#river-8969 opens the Ulhas. Selecting a river puts its address in the browser's address bar, and every river named in a panel ("Merges into", "Formed by", "Branched off from" and so on) is a link to that address.

## Where river attributes are stored

Most of what the panel shows is worked out by the build, from the river lines and the dataset's own fields. Where the result is wrong, a hand-edited file corrects it. The files to edit are all in `data/`.

| The panel shows | Worked out from | Corrected with |
| --- | --- | --- |
| Name | The government (CWC) shapefile in `river_network_shape/`, which is never edited. A trailing "River" is dropped. | `rename` in `data/river-overrides.json`. For a river we added (city streams, creeks): `name` in `data/added-rivers.json`. |
| Merges into | The dataset's "Confluence" name, matched to the river whose line this river ends on. | `down` (a uid) in `data/river-overrides.json`. For an added river: `joins` (a uid) in `data/added-rivers.json`, or `into` (a sea) when `joins` is `null`. |
| Branched off from (a distributary) | Where the line starts on another river. | `branchedFrom` (a uid) and `branchesAt` (the place) in `data/river-overrides.json`. |
| Formed by a confluence, or continues another river under a new name | The rivers that end where this one starts. | `formedBy` (a list of uids) and `formedAt` (the place), or `continues` (a uid), in `data/river-overrides.json`. |
| Origin and end place | The nearest well-known town, from a gazetteer (GeoNames), with the mountain range in front of an origin. | `origin` and `end` in `data/river-overrides.json`. |
| Enters India at, flows through | The river's course beyond the border, traced in HydroRIVERS. | `entersAt` and `via` (a list of countries) in `data/river-overrides.json`; the source abroad goes in `origin`. `"abroad": false` says the river does not come from abroad. |
| Fun facts | Some of them are my personal research. Others are AI generated, approved by me. | `data/river-facts.json`. |
| Length | The dataset's own length field. For a river we added or re-routed, it is measured from the line. | Nothing. It changes only if the route does. |
| "Doubtful naturality" tag | Nothing: it is set by hand. | `doubtfulNaturality` and `naturalityInfo` in `data/river-overrides.json`; see "Doubtful naturality" below. |
| Hidden river | Nothing: it is set by hand. | `hidden` in `data/river-overrides.json`; see "Hiding a river" at the end. |

More about these files:

- Every file is keyed by the river's uid.
- `data/river-overrides.json`: every entry carries `name`, the river's name in the dataset (`""` for an unnamed river), and should carry a `why` note saying what was wrong. The build fails if `name` does not match the data, which catches an entry put under the wrong uid.
- A place text is shown after "Origin", "Confluence" and so on. Set `originNear`, `endNear`, `branchesAtNear` or `entersAtNear` to `true` for a bare town name, and the label reads "Origin near", "Confluence near" and so on.
- `"swapped": true` in `data/river-overrides.json` is for a river the dataset recorded backwards, mouth first.
- `data/river-facts.json`: an entry has `name`, `category`, `fact`, `sources` and `confidence`. `fact` is one text, or a list of texts for a river with more than one. Only the fact text is published. A fact can link another river as `[[<uid>|<name>]]`. The build fails if a fact is longer than 80 words, has no source, or sits under a uid that is not on the map.
- Route changes, which are what change a river's line and length:
  - `data/added-rivers.json`: rivers the dataset lacks.
  - `data/added-rivers-osm.json`: the lines of the added rivers that were traced from OpenStreetMap.
  - `data/course-overrides.json`: corrections to the course of a river in the dataset.

### How to edit

1. Find the river's uid: `node .claude/skills/add-fact/find-river.mjs "<name>"`. Names repeat (there are dozens of Kharis), so pick the match by its length, where it rises and what it joins.
2. Edit the file in `data/`. Never edit anything in `public/` or `build/`: both are generated.
3. Re-run the build steps for what you changed:
   - a fun fact: `npm run data:facts`
   - a naturality tag or text: `npm run data:naturality`
   - hiding a river: `npm run data:hidden`
   - anything else in `data/river-overrides.json`: `npm run data:tier && npm run data:topology && npm run data:abroad && npm run data:places && npm run data:facts && npm run data:tiles`
   - an added river or a course correction: `npm run data:added` first, then the line above.
4. Run the checks: `npm run verify:data`, then `npm run verify:ui`. The second needs the dev server on port 5174 (`npm run dev -- --port 5174`).
5. Commit the file you edited together with the regenerated files in `public/`. The deploy does not rebuild the map data; it publishes what is committed.

All the steps in 3 except `data:naturality` and `data:hidden` read `build/`, which is not in git. On a fresh checkout `npm run data:all` creates it; that needs the source shapefile in `river_network_shape/` and the go-pmtiles binary in `tools/`.

## Doubtful naturality

Some channels on the map may not be natural streams. Such a river can carry a "Doubtful naturality" tag under its name in the panel, with a "?" button that shows an explanation. No river is tagged yet.

To tag a river, add two attributes to its entry in `data/river-overrides.json` (if it has no entry, add one with `name` and `why`):

```json
"<uid>": {
  "name": "<the river's name in the dataset>",
  "why": "<why it is tagged>",
  "doubtfulNaturality": true,
  "naturalityInfo": 0
}
```

- `doubtfulNaturality`: `true` shows the tag.
- `naturalityInfo`: a whole number, 0 or more, that picks the explanation.
- The explanations are in `data/naturality-info.json`, a list of texts. `0` is the first text, `1` the second, and so on, so rivers that share an explanation share a number. To add an explanation, add it at the end of the list. Do not reorder or remove texts: rivers refer to them by position.

`npm run data:naturality` checks the two files and writes `public/river-naturality.json`. `npm run build` runs it first, so the deploy runs it too, and a mistake stops the build. It fails if:

- a river has `"doubtfulNaturality": true` but no `naturalityInfo`,
- `naturalityInfo` is not a whole number of 0 or more, or the list has no text at that number,
- `doubtfulNaturality` is anything other than `true` or `false`,
- the uid is not on the map, or
- `data/naturality-info.json` is not a list of non-empty texts.

A river with `naturalityInfo` but without `"doubtfulNaturality": true` only gets a warning, and is not tagged.

`node scripts/08b-verify-naturality.mjs` checks the tag and its tooltip in the panel; it is part of `npm run verify:ui`.

## Hiding a river

A river can be taken off the map without deleting anything. Set `hidden` on its entry in `data/river-overrides.json` (if it has no entry, add one with `name` and `why`):

```json
"<uid>": {
  "name": "<the river's name in the dataset>",
  "why": "<why it is hidden>",
  "hidden": true
}
```

- `"hidden": true` hides the river. Missing, `null` and `false` all mean it is shown, which is the default. No river is hidden yet.
- A hidden river is not drawn, cannot be hovered or clicked, and is not reachable from another river's panel: where a panel names it ("Merges into", "Formed by", a fun fact), the name is plain text, not a link. The rivers around it are not changed.
- It is a flag of its own: it does not depend on any other attribute, and sets none.
- The tiles are not rebuilt, so this needs no long build. To show the river again, remove the line or set it to `false`.

`npm run data:hidden` checks the file and writes `public/river-hidden.json` (the uids of the hidden rivers). `npm run build` runs it first, so the deploy runs it too, and a mistake stops the build. It fails if `hidden` is anything other than `true`, `false` or `null`, or if the uid is not on the map. Commit the regenerated `public/river-hidden.json` with the edit.

`node scripts/08c-verify-hidden.mjs` checks the build step and the map; it is part of `npm run verify:ui`.
