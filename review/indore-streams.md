# Indore: the Kanh and the Saraswati

Written 2026-10-06. Not a full pass over the city like Bengaluru's or Hyderabad's: only what the owner asked for, the Kanh's eastern course with its branches and the two rivers' names. The streams seen in OpenStreetMap and not drawn are listed at the end.

## What was wrong

CWC draws one river, the "Khan", from Rau north-east through the old city past Rajwada and on to the Kshipra near Ujjain, and nothing at all in the east of the city. Google Maps and OpenStreetMap (and the owner) have it the other way round:

- the river past Rajwada, from Rau, is the **Saraswati**;
- the **Kanh** is the eastern river, from Limbodi lake through Musakhedi;
- they meet at Krishnapura, by Rajwada (Riverside Road / Mahatma Gandhi Road), and the river below is the Kanh.

## Changed on rivers already on the map

| River | Change | Why |
|---|---|---|
| Kanh (25543) | Renamed from the dataset's "Khan". Head redrawn: 10.2 km from the outlet of Limbodi lake to Krishnapura, from 13 OSM ways ("Khan River", "Kanh River"), in place of CWC's 16.6 km from Rau. Below Krishnapura the course is CWC's, unchanged. 84.3 km becomes 79.5 km. | The eastern river is the Kanh. The line runs downhill, 572 m at the lake to 542 m at the confluence (SRTM). |
| Saraswati (28179) | Now merges into the Saraswati (40469) instead of the Khan. Course and name unchanged. | It is CWC's short "Saraswati", 9.1 km from Morod past Bilawali lake and Pipliyapala. The river it joins is the one CWC called the Khan, now the Saraswati. See the open question below. |

## Drawn

| uid | Name | Length | Course from | Notes |
|---|---|---|---|---|
| 40469 | Saraswati | 16.6 km | CWC | CWC's old head of the Khan, unchanged: Rau, Foota Talab, the old city, Krishnapura. OSM names the lower 9.5 km "Saraswati" / "Saraswathi". |
| 40470 | unnamed | 3.1 km | OSM way 1027657750 | The eastern of the two branches from Limbodi lake; meets the Kanh 2.5 km north of the lake. 574 m to 562 m. |
| 40471 | unnamed | 2.8 km | OSM ways 729003618, 729003619, 728945839 | The branch from the east through Musakhedi. OSM draws it mouth first; it runs downhill east to west, 564 m to 557 m. OSM stops 270 m short of the Kanh, so the last stretch is a straight line. |

A new kind of entry in `data/added-rivers.json` was needed for 40469: `cwcHeadOf`, a river made from the stretch of a CWC river that a `head` correction took away from it. Its panel has no "Course from" row, since the line is CWC's.

## Open question

The map now has two rivers named Saraswati, the short CWC one (28179) joining the long one (40469) south of the old city. Sources do not agree on which branch is the Saraswati's head (the Smart City text even places its source near Umaria, in the south-east; Wikipedia calls the joined river the Saraswati). The name of 28179 was left as CWC has it. If it should be something else, it is a `rename` in `data/river-overrides.json`.

## Not drawn

From OpenStreetMap (Overpass data of 2026-10-07, box 22.55-22.86 N, 75.72-76.00 E). "Not assessed" means no natural test was run: it was outside what was asked.

| OSM | Where | Why not |
|---|---|---|
| "Bilawali-Limbodi Pond Canal", 1.5 km | Bilawali lake to Limbodi lake | A canal, in a culvert. |
| "Nahar Bhandara", 2.4 km | Pipliyapala to the Saraswati | A canal (the Holkar-era water channel), alongside 28179, which is drawn. |
| Two streams, 0.8 and 0.7 km | Into Limbodi lake from the south | Under 2 km; the owner traces the Kanh to the lake. |
| Stream 191774909 and "Khan tributary" 191774911, 8.5 km | Pipliyahana lake north-west to the Kanh | Not assessed. Looks like a natural stream. |
| "Pilia khal Drain" and four more ways, about 10 km | Sirpur lake north-east to the Kanh | Not assessed. OSM calls the first stretch the overflow of Sirpur tank. |
| Streams 386907897 and 192299474, about 6.5 km | Khajrana north to the Kanh | Not assessed. |
| Drains 191926702 (8 km), 320856033 (4.6 km), 697582290 (1.3 km) | North-west, north-east and west of the city | Tagged `drain`. Not assessed. |
| Canals 987623603 and on, about 6 km, with drain 191990504 | South-west, near Rau | Canals. |
| Streams 703394503, 703394502, 697105562 | North of the city | Not assessed. |

## Parked on 2026-10-07: are the streams not drawn natural?

The owner asked which the other lines are and whether they are natural, then set it aside to come back to. Nothing below has been acted on.

Main source: the Madhya Pradesh Pollution Control Board's *Proposed Action Plan for Rejuvenation of River Khan* (2018), which lists two rivers and ten "tributary nalas" with where each starts and ends. Read from the Internet Archive copy: https://web.archive.org/web/2023id_/https://www.mppcb.mp.gov.in/proc/Khan_River_Rejuvenation_Report_26.10.2018y.pdf. The OSM lines were matched to it by position and length. Also read: the Free Press Journal on the city's water supply (the 1866 stone-lined canal from the Pipliyapala dam), https://www.freepressjournal.in/amp/indore/from-leather-bags-to-lifelines-the-epic-story-of-how-indore-learned-to-quench-its-thirst.

No elevation was used: no CartoDEM tile covers Indore yet. The tile needed is N22 E075 (`P5_PAN_CD_N22_000_E075_000_30m`).

| OSM | What it is | Verdict | Why |
|---|---|---|---|
| 191774909, 191774910, 191774911 "Khan tributary", 8.5 km | Palasia Nala | Natural | The plan: from Pipliyahana Talab to Bhagirathpura, 8.32 km, a tributary nala of the Kanh. |
| 370133178 "Pilia khal Drain", 192141207, 370133175, 192141206, 370141343, 370141349, 11.3 km | Piliyakhal Nala | Natural | The plan: from Sirpur Talab to Khatipura, 11.3 km, the same length as the OSM line. |
| 191499985, 386907895, 903374259, 903374258, 386907897, 192299475, 192299474, 6.9 km | Khajrana-Bhamori Nala | Natural | The plan: through Khajrana and Bhamori to the Kanh near the Kabitkhedi treatment plant, where the OSM line ends. |
| 905651611, 905651624, 0.8 and 0.7 km, into Limbodi lake | The Kanh's own headwater | Natural | The plan: the Kanh comes "from Asrawadkhurd via Limbodi Talab". OSM maps under 1 km of it. |
| 320856033 (drain, 4.6 km) with 703394503 and 703394502 north of it | Probably the Tulsi Nagar-Talawali Chanda Nala | Doubtful | Position and length (7.3 km against the plan's 7.25 km) fit, but OSM tags it a drain and the direction of fall is not checked. |
| 191926702 (drain, 8 km) and the short drains west of it | Unidentified | Doubtful | Not among the plan's ten nalas; the drain tag is the only evidence. |
| 191972115 "Nahar Bhandara" | The Holkar water-supply canal | Man made | A stone-lined canal built from the Pipliyapala dam to the city in 1866. |
| 852074205, 852074206, 852074207 "Bilawali-Limbodi Pond Canal" | A link between the two tanks | Man made | A culverted canal joining two tanks in different valleys. No document found: OSM tags and judgement only. |
| 987623603 to 987623609, 977387735, 977387734, 191990504, 988582363, near Rau | Unidentified canal | Doubtful | The OSM canal tag is the only evidence; it leans man made. |
| 697105562, 697582290, 386907896, 701890614, 701638795, 701638794, 1026691866, 727399272 | Unidentified | Not judged | Under 1.5 km each, or too little evidence. |

For the three nalas called Natural: the plan calls them tributary nalas, not "natural" in so many words. The verdict is a reading of that and of each one starting at a tank, and is not checked against elevation.

The plan also bears on what was drawn on 2026-10-06:

- It answers the open question above. The Saraswati "flows in two stretches", one from Pipliapala and one from the Machal hills through Rau Talab and Bijalpur Talab, joining at Badaribagh. Those are 28179 and 40469, so two rivers named Saraswati is right.
- 40471, the branch through Musakhedi, matches its Azad Nagar Nalla (Virat Nagar to Madina Nagar, 2.59 km).
- The Kanh rises above Limbodi lake: "from Asrawadkhurd via Limbodi Talab", and elsewhere "a hill near village Umaria" and "near Ralamandal".

Waiting on the owner:

1. Add the Palasia, Piliyakhal and Khajrana-Bhamori nalas?
2. Name 40471 "Azad Nagar Nala"?
3. Extend the Kanh above Limbodi lake towards Asrawad Khurd, if a usable line exists?
4. The CartoDEM tile N22 E075, for the Doubtful ones. With it, run `node .claude/skills/check-naturality/follows-terrain.mjs` on each line.
