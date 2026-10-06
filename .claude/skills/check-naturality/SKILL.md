---
name: check-naturality
description: Check whether one or more rivers or streams on the India rivers map (or candidate streams not yet on it) are natural, using the owner's seven-step method, and report a verdict for each. Changes no files, commits nothing. Use when the user invokes /check-naturality <river name or uid>[, ...] or asks whether a river or drain is natural.
argument-hint: <river name or uid>[, <river name or uid> ...]
---

Rivers: **$ARGUMENTS**

Decide for each river whether it is natural and show the verdicts here. **Do not change any file, run
the build, commit or push.** What to do with a verdict is the owner's call (step 4).

The site draws only natural rivers and streams. City drains, canals and built channels are left out or
flagged. The argument holds one river or several (separated by commas, "and", or new lines), each a
name or a uid. It can also describe a candidate that is not on the map, met while researching a city
for new streams: a description, a place, an OSM way or a set of coordinates. Do steps 1 and 2 for each
river, then give one reply covering all of them.

1. **Find the river.**
   - On the map: `node .claude/skills/add-fact/find-river.mjs <uid>` or `... "<river name>"` prints
     every match with its uid, length, where it rises, what it joins and where it ends. Names repeat;
     add `--near <lat>,<lon>` to put the nearest first. If two candidates remain that the request
     cannot separate, say which one you took and why, and carry on.
   - Not on the map (a candidate): there is no uid. Work from what was given and note its place and,
     if you have them, its OSM way ids and the river it would join. `--near <lat>,<lon>` alone lists
     whatever the map already draws there.
   - Also check whether the map already flags or hides it: look up its uid in
     `data/river-overrides.json` (`doubtfulNaturality`, `hidden`) and in `review/*.md`. Earlier
     decisions are written down there and must not be repeated or contradicted without saying so.

2. **Judge it, in the owner's order.** Stop at the first step that settles the question. Steps 5 to 7
   are reached only when steps 1 to 4 are not conclusive, and the report must say so.
   1. **Your own judgement.** The owner's question is: "If I ask Claude or another AI model chat
      whether X is natural or not, what would it say?" Answer it from what you already know, before
      searching.
   2. **Research.** Search the web and open the pages; a finding counts only if a page you actually
      opened says it. Record those URLs. Kinds of source worth opening: a district gazetteer, a
      municipal storm-water drain plan or lake and drain survey, an irrigation department page, a
      newspaper report on the channel, and OpenStreetMap tags on the line (`waterway=canal` or
      `waterway=drain` is a strong sign of a built channel; `waterway=stream` or `river` proves
      nothing, since the tag is often applied loosely).
   3. **Old maps.** If the river is not on an old map where other rivers of similar size are drawn,
      it was probably built later and is not likely natural. Kinds of source: old Survey of India
      sheets, the US Army Map Service 1:250,000 India series, the Imperial Gazetteer of India atlas.
      Name a map website only if you opened it and it showed the sheet; never invent a URL. Old maps
      are evidence only: do not trace from them, many are still under copyright.
   4. **Old does not mean natural.** Being on an old map does not make a river natural. Bengaluru's
      rajakaluves were built in the time of Kempegowda, before there were any maps, and are not
      natural for that reason. So a river that is on the old maps still needs one more reason to be
      called natural, from steps 1, 2 or 5 to 7.
   5. **The barren-land test.** If nothing is conclusive after steps 1 to 4, suppose the city was never
      settled and the land were barren land, grassland or forest. Would this river still exist?
   6. **Topography, if needed.** Does the river flow from high ground to low, and does it follow a
      valley? Elevation data is best supplied by the owner.
      - First look in the repo root for a tile that covers the river. They are untracked folders named
        like `P5_PAN_CD_N12_000_E077_000_30m/`, holding one Cartosat (CartoDEM) 30 m GeoTIFF, for
        example `P5_PAN_CD_N12_000_E077_000_30m/P5_PAN_CD_N12_000_E077_000_30m/P5_PAN_CD_N12_000_E077_000_DEM_30m.tif`.
        One tile is a square of one degree, and the `N12_000_E077_000` part is its south-west corner:
        12 N, 77 E, so it covers 12 to 13 N and 77 to 78 E. Only Bengaluru tiles (N12 and N13, E077)
        are there at present.
      - If none covers the area, **ask the owner for the tile**, naming the one-degree square or
        squares the river crosses (from its coordinates, rounded down to whole degrees), and wait. Do
        not give a verdict that needs elevation until it arrives; if the owner would rather not
        supply it, say the verdict rests on steps 1 to 5.
      - These tiles are reference files: read them locally, never commit them, and publish nothing
        derived from them.
      - Reading one: `node .claude/skills/check-naturality/elevation-profile.mjs <uid>` finds the
        tiles in the repo root by itself and prints the elevation at about 30 points along the
        river's line, the ground 150 m and 300 m to each side of every point, and a summary: how far
        the line falls, how many steps climb, and at how many points the line is the low point of
        its cross-line. For a candidate that is not on the map give its points in order, source
        first: `... elevation-profile.mjs --line <lat,lon> <lat,lon> ...`. `--step <km>` sets the
        spacing and `--tile <file.tif>` names a tile kept somewhere else. If part of the line has no
        tile, the last line of the output names the squares to ask the owner for. A uid needs
        `build/rivers.ndjson` (`npm run data:extract && npm run data:added` recreates it).
      - The script reads only what these tiles are: an uncompressed, single-band GeoTIFF in latitude
        and longitude. If the owner supplies a tile it cannot read, it says why; tell the owner. Do
        not install anything into the repo or add a dependency to read it.
      - The heights are above the WGS 84 ellipsoid, not above sea level: in Bengaluru they come out
        about 90 m lower than the sea-level heights other sources give. Only the differences along
        and across the line matter here, so do not quote these numbers as altitudes.
      - Look at three things: the elevation from source to mouth falls, with few climbs; the river
        sits at the low point of a few cross-lines taken across it; and the valley it follows is
        there without the river. A 30 m grid cannot see a channel a few metres wide, so treat a
        small drop in a flat city as weak evidence.
      - Fallback only, when the owner cannot supply a tile: the Open-Meteo elevation API answered on
        2026-10-05 with a 90 m grid, for example
        `https://api.open-meteo.com/v1/elevation?latitude=12.97,12.98&longitude=77.59,77.60`
        (up to 100 points per request, comma separated, send the User-Agent given below). It is coarser than
        the 30 m tile, so say in the report that a coarser source was used.
   7. **Simulated rain.** Given land with this exact topographic profile, unsettled, and 100,000
      simulated rainfalls, would you end up with at least a seasonal river following roughly this
      path? You do not need to run a simulation. Reason from step 6: does the ground collect runoff
      into this line, or is the line cut across the slope, uphill, or along a ridge?

   Rules that hold throughout: never send the owner's email address to an outside service; if a
   request needs a User-Agent, use `india-rivers-map/0.1 (static map build)`; do not scrape Google
   Maps; do not trace from copyrighted maps.

3. **Report.** For each river give its name and uid (or the description, for a candidate) and then:
   - the verdict: **natural**, **doubtful** or **not natural**, with a one-line reason;
   - what each step you actually used found, with the URLs you opened, and which step settled it;
   - if steps 5 to 7 were used, say that 1 to 4 were not conclusive and why.

   Be plain about confidence. "Doubtful" means the steps did not settle it; do not round it up or down.

4. **Show the verdicts and ask what to do.** Change nothing. The owner can ask for:
   - **Flag it as doubtful**: add `"doubtfulNaturality": true` and `"naturalityInfo": <number>` to its
     entry in `data/river-overrides.json` (an entry has `name` and `why`; add one if it has none).
     `naturalityInfo` is the position of an explanation in `data/naturality-info.json`; add a text at
     the end of that list if none fits, never reorder it. Then `npm run data:naturality`. See
     "Doubtful naturality" in `README.md`.
   - **Hide it**: add `"hidden": true` to its entry, then `npm run data:hidden`. See "Hiding a
     river" in `README.md`.
   - **Leave a candidate out**: add it, with the reason, to the "Not drawn" list of the review file for
     that city (for example `review/bengaluru-streams.md`).
   - Any of these is a verified change to commit and push on the current branch, as the owner's
     standing rule says; the `add-fact` skill's step 6 shows how.
