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
