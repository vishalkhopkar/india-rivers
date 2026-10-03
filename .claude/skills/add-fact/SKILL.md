---
name: add-fact
description: Add a Fun Fact to a river on the India rivers map - find the right river, take the user's fact as given (no searching or re-verifying) and in their own wording (spelling and grammar fixes only), add it to data/river-facts.json, check the panel, then commit and push. Use when the user invokes /add-fact <river name> or asks to add a fun fact to a river.
argument-hint: <river name>
---

River: **$ARGUMENTS**

The fact is whatever came with the command: text in the message, a file the user points to (often
`new_facts.txt` in the repo root), or a URL given "for reference". If the argument carries more than a
name, the leading name is the river and the rest is the fact. If there is no fact at all, propose one
(step 2, last point).

Clicking a river opens a panel; under its rows a **Fun Facts** heading is followed by each fact as its
own paragraph. Only the fact text is published. Do the steps in order.

1. **Find the river.** `node .claude/skills/add-fact/find-river.mjs "<river name>"` prints every match
   with its uid, length, where it rises, what it joins, where it ends, and any facts it already has.
   - Names repeat (four Suvarnamukhis, dozens of Kharis). Pick the one the fact is about by where it is
     and what it joins. Add `--near <lat>,<lon>` (a town the fact mentions) to put the nearest first.
   - No match does not mean no river: some are recorded under another name (the Poisar was "Malad
     Creek"). Run `--near <lat>,<lon>` alone to list whatever flows there.
   - Ask the user only if two candidates remain that the fact itself cannot separate. If the river is
     not on the map, stop and say so; adding a river is a different job.
   - `build/` is gitignored. Without `build/rivers.ndjson` the lookup shows names and extents only and
     step 5 cannot run: recreate it with `npm run data:extract && npm run data:added` (needs the source
     shapefile in `river_network_shape/`, and `npm run data:fetch` if `data/raw/` is empty). If the
     shapefile is not there, stop and tell the user. Tiles are not needed for a fact.

2. **Take the user's fact as given. Do not verify it.** The owner finds these facts online before
   submitting them; searching for them again wastes tokens.
   - No WebSearch or WebFetch to confirm what the user wrote, and do not open a URL they gave: it goes
     into `sources` as it is.
   - **Do not re-check geography against OSM or any other map data.** If the user says a river forms
     a boundary, flows to X, passes Y or was diverted, that is what the fact says. No Overpass
     queries, no boundary or reverse-geocoding checks, no measuring the line.
   - Research only when the user asks for it: they tell you to verify, they ask you to add something
     they did not supply ("add some history of when the port was built"), or they give no fact at
     all. Then look up that part only, on pages you actually open, and record those URLs.
   - If something in the fact is plainly wrong from what you already know, say so in one line in the
     report and add the fact as written. Do not go searching to settle it.
   - `confidence`: `owner` for a fact taken on the owner's word; `high` or `medium` only for parts
     you researched yourself.
   - **No fact given:** research and propose up to three, each with its sources, and add the one the
     user picks (pick yourself only if they said to). A fact must not be textbook or cliché: aim for
     "I didn't know that". A long inter-state river gets a fact that matters to the whole country; a
     short river gets a local one that even people living on it may not know. If the user's own fact
     is the textbook kind, say so once, then add it; it is their call.

3. **Keep the user's wording. Correct spelling and grammar only.** The fact goes in as the user wrote
   it.
   - Allowed: spelling, capitalisation, punctuation, a missing word that grammar needs, and one
     spelling of a name used throughout. Nothing else: do not swap words for "better" ones, shorten,
     reorder, merge sentences, drop a term or change the tone, and do not apply the style points
     below.
   - If the fact is over 80 words (the build fails) or does not fit the panel in step 5, do not trim
     it yourself: stop, say by how much, and ask the user how they want it shortened.
   - List every correction you made in the report.

   **Only for a fact you write yourself** (no fact given, or a part the user asked you to research):
   - One to three sentences, plain text, one paragraph: no markdown, no "Did you know". Aim for 35-60
     words. Over 80 the build fails, and well before that the panel stops fitting a phone.
   - Plain and specific: names, dates and numbers, not adjectives. The panel heading already names the
     river, so do not repeat the name more than needed.
   - Name places as landmarks or towns people recognise ("Western Ghats near Lonavala"), never a bare
     district or village name.
   - Neutral on anything contested or sensitive (religious sites, borders, water disputes, recent
     deaths, politics): state what is undisputed, attribute the rest ("is traced to", "a claim that
     remains contested"), take no side. If it cannot be said neutrally, leave it out.
   - House style: Indian English, "27 July 2019", "620 sq km", straight quotes.

4. **Add it to `data/river-facts.json`** with the Edit tool. Shape:
   `"<uid>": { "name", "category", "fact", "sources", "confidence", "region" }`, two-space indent,
   entries in ascending uid order.
   - **River already has a fact: never replace it.** Turn `fact` into an array and append
     (`"fact": ["<old>", "<new>"]`, see `8969`), append the new URLs to `sources`, keep `name`,
     `category` and `region`, and set `confidence` to the weaker of the two (`owner` is the weakest).
   - **New river:** insert the entry at its place in uid order.
     - `name`: the name the lookup shows, or its `dataset` name. Anything else trips the name check.
     - `category`: reuse one in the file (History, Engineering, Dams and reservoirs, Wildlife,
       Disasters, Names and etymology, Pilgrimage, Culture, Geography, Geology, Transport, Sport, Film,
       Literature, Science, Environment, Beautification, Myth busters, Culture and mythology).
     - `region`: `national` for a long inter-state river, else `north`, `south`, `east` or `west`. Add
       ` (site owner)` when the fact came from the user, e.g. `"west (site owner)"`. Curation record
       only; not shown.
   - `sources`: the URLs the user gave, plus any you opened for research they asked for. The build
     needs at least one entry, so when the user gave no URL use `["site owner"]`.
   - `git diff data/river-facts.json` must show your lines and nothing else.

5. **Check.** All of these must pass before committing; if the text changes, start again from (a).
   - (a) `npm run data:facts` validates and writes `public/river-facts.json` (never edit that file by
     hand). It fails on a fact over 80 words, an entry with no source, or a uid not on the map. A
     "name mismatches" line naming your uid means the wrong river or the wrong `name`: fix it.
     Unnamed rivers are not checked; give them `"name": "(unnamed)"`.
   - (b) `npx tsc --noEmit`.
   - (c) The dev server must be on port 5174. `curl -s -o /dev/null -w "%{http_code}" http://localhost:5174/`
     should print 200; if not, start `npx vite --port 5174 --strictPort` in the background. Leave a
     server that is already running alone.
   - (d) `node .claude/skills/add-fact/panel-shots.mjs <uid>` opens the panel at 1280x860 and on a
     375x740 phone, checks it shows exactly the published facts, and checks it fits. The panel is
     sized to its content and never scrolls, so "fits" means the whole panel is on screen at both
     sizes. Then Read both screenshots (`build/shots/fact-<uid>-desktop.png`, `-phone.png`) and read
     the fact as a visitor would. If it does not fit, shorten the fact.
   - (e) `node scripts/08-verify-interaction.mjs` must end with `ALL CHECKS PASSED`. It asserts that
     the Dahisar (8654) shows exactly two facts; a third there needs that check updated in the same
     commit.

6. **Commit and push** without asking: the owner's standing rule is to commit and push after every
   verified change. Follow the `/git` skill, with one difference: stage by path, not `git add -A`.
   - `git add data/river-facts.json public/river-facts.json`, then `git diff --cached --stat` must
     list only those two files. Reference files in the repo root (`new_facts.txt`, PDFs, images) stay
     untracked; other modified files are someone else's work in progress, so leave them.
   - Anything that looks like a secret: stop and flag it, do not stage it.
   - Message: one sentence in the style of `git log --oneline -8`, e.g. "Add a second fun fact for the
     Ulhas: its creeks make Salsette an island", via heredoc with the usual `Co-Authored-By` trailer.
   - `git push` on the current branch. Pushing `master` redeploys the live site,
     https://vishalkhopkar.github.io/india-rivers/. Never force-push, never `--no-verify`. If the push
     is rejected, stop and report it.

7. **Report**, briefly:
   - the river and uid, and how it was told apart from its namesakes if there were any;
   - the final text and its word count, and each spelling or grammar correction made to the user's
     wording;
   - anything you researched because the user asked, with its source;
   - anything in the fact you believe is wrong (one line; it is still added as written);
   - the commit hash and that the push succeeded.

Never send the owner's email address to an outside service, in a header, URL or form. If a request
needs a User-Agent, use `india-rivers-map/0.1 (static map build)`.
