---
name: find-fact
description: Research 3-5 candidate Fun Facts for one or more rivers on the India rivers map and show them in the chat for the owner's approval. Changes no files, commits nothing. Use when the user invokes /find-fact <river name>[, <river name> ...] or asks to find candidate facts for a river.
argument-hint: <river name>[, <river name> ...]
---

Rivers: **$ARGUMENTS**

Find candidate facts and show them here. **Do not change any file, run the build, commit or push.**
Every candidate needs the owner's approval first; adding an approved one is step 6.

The argument holds one river or several (separated by commas, "and", or new lines). Do steps 1-4 for
each river, then give one reply covering all of them.

1. **Find the river.** `node .claude/skills/add-fact/find-river.mjs "<river name>"` prints every match
   with its uid, length, where it rises, what it joins, where it ends, and the facts it already has.
   - Names repeat. Pick by where the river is and what it joins; add `--near <lat>,<lon>` to put the
     nearest first. If two candidates remain that the request cannot separate, say which one you
     took and why, and carry on.
   - Note the facts the river already has: a candidate must not repeat them.
   - If the river is not on the map, say so for that river and go on to the next.

2. **Research.** Search the web and open the pages; a fact counts only if a page you actually opened
   says it. Record those URLs. Look along the whole river: towns, forts, temples, bridges, dams,
   ferries and borders on its banks count as much as the water itself.
   - Prefer a district gazetteer, a government or university page, a newspaper report or a book over
     an unsourced blog. Wikipedia is fine as a lead; open what it cites where you can.
   - Never send the owner's email address to an outside service. If a request needs a User-Agent,
     use `india-rivers-map/0.1 (static map build)`.

3. **What makes a good fact** (the owner's rules):
   - Not a textbook fact that an averagely well-read Indian already knows.
   - Any category, for example (not exhaustive): pilgrimage; transport; dams and reservoirs; river
     sports; history and culture; infrastructure; borders, especially where the river is or was a
     historic border.
   - A river can have several facts. If what you find is a textbook fact, find something more
     interesting about it and combine the two, so the known part only leads into the unknown part.
   - A long inter-state river gets a fact that matters beyond one town; a short river gets a local
     one that even people living on it may not know.

   Good:
   - Penganga: Historically, the river formed a boundary between Berar and Hyderabad state, then
     becoming a boundary between Hyderabad and British India, and finally Marathwada and Vidarbha in
     Maharashtra. Today, Yavatmal district's southern and eastern boundaries are just rivers, with
     Penganga to its south.
   - Kasadi: the Belapur fort located along its banks is one of the rare forts in Mumbai MMR to be
     built not by the Portuguese but the Siddis of Janjira in 1570. It changed hands between the
     Portuguese, Marathas and eventually the British who partly demolished it in 1817.

   Bad:
   - Ganga: anything just related to the holy river, ghats, the Prayag sangam, Varanasi, etc.
   - Kaveri (Cauvery): anything simply to do with the rice bowl of India, etc.

4. **Write 3 to 5 candidates per river**, each on a different subject where the river allows it. If
   fewer than three hold up, give those and say so; do not pad with weak ones.
   - One to three sentences, plain text, one paragraph. Aim for 35-60 words; over 80 the build fails.
   - Plain and specific: names, dates and numbers, not adjectives. The panel heading already names
     the river, so do not repeat the name more than needed.
   - Name places as landmarks or towns people recognise ("Western Ghats near Lonavala"), never a bare
     district or village name.
   - Neutral on anything contested or sensitive (religious sites, borders, water disputes, recent
     deaths, politics): state what is undisputed, attribute the rest, take no side.
   - House style: Indian English, "27 July 2019", "620 sq km", straight quotes.

5. **Show them in the chat and stop.** For each river: its name, uid and one line on which river it
   is (length, what it joins), then the candidates numbered 1 to 5, each with:
   - the category;
   - the text and its word count;
   - the sources (the URLs you opened);
   - confidence: `high` (two independent sources, or one authoritative one) or `medium` (one
     ordinary source), with a line on anything the sources disagree on or that may be out of date.

   End by asking which numbers to add. Nothing is written to the repo at this point.

6. **After the owner approves.** Add only the candidates they name, in the wording they approve (if
   they reword one, keep their wording; spelling and grammar fixes only). Follow steps 4 to 7 of the
   `add-fact` skill (`.claude/skills/add-fact/SKILL.md`): add to `data/river-facts.json`, run the
   checks, commit and push on the current branch, report. For a fact you researched, `sources` are
   the URLs you opened, `confidence` is `high` or `medium`, and `region` has no " (site owner)".
