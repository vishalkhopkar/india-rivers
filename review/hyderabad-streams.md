# Greater Hyderabad streams

Written 2026-10-04. The same job as for Bengaluru (`review/bengaluru-streams.md`) and Mumbai (`review/mumbai-streams.md`), for Greater Hyderabad and the country round it, in five steps:

1. Hussain Sagar catchment: 4 streams, 15 km.
2. The Musi and Esi headwaters and the west: 31 streams, 236 km.
3. East and south: to the Musi in and below the city: 28 streams, 195 km.
4. North and north-east: the Shamirpet Vagu, Ermulli Vagu and Chinnaeru: 20 streams, 130 km.
5. Outer areas: the Manjira side, the Aler and the far south: 31 streams, 215 km.

In all **114 streams and 792 km** were added: 15 from OpenStreetMap waterways (80 km) and 99 valleys from HydroRIVERS (712 km). The dataset's "Mosi" was renamed Esi. The area covered is the box the data was fetched for: 17.05-17.80 N, 78.05-78.90 E (about 80 km by 90 km, from Sangareddy to Bhongir and from Shadnagar to Mulugu), with no administrative limit.

Everything doubtful is in a separate file, `review/hyderabad-low-confidence.md`: read that first.

Already on the map before this job, and not touched: the Musi and the Esi with their CWC tributaries (the Chinna Musi, Shamirpet Vagu, Ermulli Vagu, Chinnaeru, Yelimineti Vagu, Aler; on the Manjira side the Nakka Vagu, Pamla Vagu, Maisamma Vagu and Haldi), and the five streams of the earlier Hyderabad pass: the Kukatpally Nala (40039), the Hussain Sagar Surplus Nala (40040), the Picket Nala (40041) and two unnamed feeders (40042, 40043).

## References used

These decided **what** to look for and what to call it. No line was traced from them: every course is from OpenStreetMap (ODbL), fetched through Overpass on 2026-10-04 (`overpass-api.de`, data of 2026-10-04 05:43 UTC), or from HydroRIVERS.

- Wikipedia, *Hussainsagar Lake and Catchment Area Improvement Project* (after HMDA): the lake's four feeder nalas (the Picket Nala from the north-east, the Kukatpally Nala from the north, the Banjara Nala from the north-west, the Balkapur Nala from the west) and its 240 km² catchment. https://en.wikipedia.org/wiki/Hussainsagar_Lake_and_Catchment_Area_Improvement_Project
- Google Arts & Culture / Wikipedia, *Hussain Sagar*: the lake was made in 1562 and first filled with Musi water brought by the "Balkapur canal". This is why the Balkapur Nala is in the low-confidence file. https://artsandculture.google.com/entity/m03s_rl
- Wikipedia, *Musi River (India)*, *Lakes in Hyderabad*, *Geography of Hyderabad*: the Esi as the Musi's tributary, with Himayat Sagar built on it in 1927 and Osman Sagar on the Musi in 1920; the names and places of the main lakes (Hussain Sagar, Fox Sagar, Shamirpet, Durgam Cheruvu, Saroornagar, Ameenpur, Mir Alam Tank). https://en.wikipedia.org/wiki/Musi_River_(India) https://en.wikipedia.org/wiki/Lakes_in_Hyderabad
- Sakshi Post, "Hyderabad: list of SNDP projects to be completed by July" (GHMC's Strategic Nala Development Programme): nala works named by the tanks they link (Bandlaguda Cheruvu-Nagole Cheruvu, Appa Cheruvu-Mulgund Cheruvu, Nagireddy Cheruvu-Kapra Cheruvu, Fox Sagar-Kolkalva, the Picket Nala, Isukavagu-Nakkavagu, Neknampur Nala-Musi, Bathula Cheruvu-Injapur Nala). Used to confirm that the tank chains found are real nalas, not to draw them. https://www.sakshipost.com/news/telangana/hyderabad-list-sndp-projects-be-completed-july-156734
- The News Minute, "Satellite images show how Hyderabad lakes have shrunk" and "Hyd has a plan to fix nalas": Durgam Cheruvu's outflow runs to Malkam Cheruvu; flooding along the nalas of Saroornagar, Meerpet, LB Nagar, Chandrayangutta and Rajendranagar (Appa Cheruvu). https://www.thenewsminute.com/telangana/exclusive-satellite-images-show-how-hyderabad-lakes-have-shrunk-upto-83-1967-156774 https://www.thenewsminute.com/telangana/hyd-has-plan-fix-nalas-city-flooded-thanks-delay-implementation-156451
- News reports on the Kirloskar committee (2003) and on the Yakutpura-Dabeerpura-Chaderghat nalas (Deccan Chronicle, Siasat): that the nalas exist and flood; no courses.
- HydroRIVERS v1.0 (HydroSHEDS): drainage lines for catchments of about 10 km² and more. Evidence for the OSM streams, and the course itself for the 99 valleys where OSM has no connected waterway.
- AWS Terrain Tiles (SRTM-based elevation), for the terrain tests. Nothing from them is published.

**What the references did not give.** No reference found places a nala well enough to name the unnamed ones. GHMC's nala lists, the Kirloskar report itself, HMDA's lake maps and the Hyderabad Urban Lab maps were looked for and not found in a readable form; searches for "Murki Nala" found nothing usable. So only one stream carries a name (the Balkapur Nala). OpenStreetMap names almost nothing here: apart from the rivers, only the "Ashoknagar Nala" (the Surplus Nala, already drawn) and a 1.2 km "Laxmi Nagar Nala" at Langar Houz.

## The rule, as adapted for Hyderabad

The owner's rule is unchanged: natural streams, drains and rivers, even if polluted or lined with concrete; no canals or channels made for irrigation or water supply. An administrative boundary is not a reason to leave a stream out.

The test is Bengaluru's, with Mumbai's fourth evidence. A course is drawn if it is not tagged `waterway=canal` in OSM, is not named as a diversion, bypass, pipe, sewer, channel, aqueduct, feeder, outfall or tunnel, **runs downhill** (70% or more of it at or below the lowest point reached so far, 3 m tolerance; a course that climbs 12 m has left its valley and is started at the top of the climb), and has at least one of:

1. **HydroRIVERS:** half or more of it lies within 0.5 km of a HydroRIVERS drainage line.
2. **Valley floor:** at 45% or more of points along it the ground 250 m to either side is higher.
3. **Tank chain:** it runs through, starts at or ends at a lake of 2 ha or more that is not a man-made basin. This is the main evidence in Hyderabad, as in Bengaluru: the cheruvus and kuntas are dams across natural valleys.
4. **Mapped as a natural watercourse:** OSM tags nine tenths of it `river` or `stream`. On its own this was not accepted (one stream that passed on it alone is in the low-confidence file).

A HydroRIVERS drainage line passes by definition: it is a valley traced from elevation data. Each one drawn is also scored on the valley-floor test and for tanks within 250 m, and those figures are in the tables.

**Calibration**, on streams already on the map: the Kukatpally Nala scores 70% on the valley floor and 82% on HydroRIVERS; the Picket Nala 65% and 100%, with three tanks; the stream from Jagadgirigutta (40042) 88% and 100%; the Surplus Nala 93% and 70%. The Musi's CWC tributaries score 77-94% on the valley floor (the Sovati Vagu and Nakka Vagu, on the flat ground by the Manjira, 48%) and 68-92% on HydroRIVERS, with up to six tanks each. Of the 18 OSM canals of 1.5 km or more, the median valley-floor score is 23% and half do not run downhill; the four that score 45% or more are the Surplus Nala and two stretches of the Kukatpally Nala, which OSM tags as canals although the references call them nalas (they were drawn in the earlier pass), and one 1.6 km canal. Of the HydroRIVERS reaches of 2 km or more in the area, 56-77% score 45% or more on the valley floor and 89-96% score 30% or more, on the raw grid line, which sits up to 300 m off the real valley floor.

How the network was assembled:

- **OSM.** The waterways were joined into one graph, with gaps of up to 80 m (culverts) bridged and a piece that stops within 0.5 km of the network or of a lake on a drawn river joined at its closest point. Each stream is followed **upstream** from where it meets a river already on the map; at a junction the longer branch carries on. Where OSM maps a tank only as an area, the course through it is the area's computed centre line. A stream that reaches a small tank on a drawn river runs on through it to the river's line; one that reaches a big reservoir ends on its shore (`shoreKm`: the Balkapur Nala at Hussain Sagar).
- **OSM is thin in Hyderabad.** In the whole box it has 464 usable waterway pieces (about 500 km tagged river, most of it the Musi, the Esi and the Manjira themselves, 130 km stream, 90 km drain and 220 km canal). Only 15 streams of 2 km or more could be assembled from it. Most tanks are mapped, but the channels between them are not.
- **HydroRIVERS.** So, as in Bengaluru's third pass, every HydroRIVERS valley that no drawn river and no OSM stream follows is drawn from HydroRIVERS itself, from its head to the river it joins (within 0.55 km of a drawn line counts as followed). These lines are coarser than OSM's: they come from a 450 m grid, are smoothed, and can lie 200-300 m off the real channel and cut a corner where they join a river. A valley is left out if more than half of it lies under a reservoir, if it is a stretch of a river already drawn, or if more than half of it lies outside the box.
- Minimum length: 2 km.

## Changed on a river already on the map

| River | Change | Why |
|---|---|---|
| Esi (3219) | Renamed: the dataset calls it "Mosi". | It runs through Himayat Sagar, which was built on the Esi, and meets the Musi at Langar Houz (Bapu Ghat). Course, length and links are unchanged. |

## Drawn

**Hussain Sagar catchment (4 streams, 15 km):**

| UID | Name | From → to | km | Source | Evidence | Joins |
|---|---|---|---|---|---|---|
| 40336 | Balkapur Nala | Mehdipatnam, Hyderabad → Hussain Sagar at Khairatabad, Hyderabad | 4.2 | OSM | valley floor 52%; 3.28 km mapped as covered **(low-confidence file)** | Kukatpally Nala (40039) |
| 40337 | Unnamed | Near Kompally, north of Hyderabad → Fox Sagar, Jeedimetla, Hyderabad | 5 | HydroRIVERS | HydroRIVERS line (84 km²); valley floor 56%; tank chain (Fox Sagar + 2 unnamed) **(low-confidence file)** | Kukatpally Nala (40039) |
| 40338 | Unnamed | Ram Nagar, Hyderabad → The Hussain Sagar Surplus Nala at Nallakunta, Hyderabad | 2.4 | OSM | valley floor 81%; tank chain (1 unnamed tank); 0.45 km across gaps in OSM **(low-confidence file)** | Hussain Sagar Surplus Nala (40040) |
| 40339 | Unnamed | Ramaram Cheruvu, Gajularamaram, Hyderabad → Jagadgirigutta, Hyderabad | 3.7 | HydroRIVERS | HydroRIVERS line (25 km²); valley floor 70%; tank chain (Ramaram Cheruvu) **(low-confidence file)** | unnamed (40042) |

**The Musi and Esi headwaters and the west (31 streams, 236 km):**

| UID | Name | From → to | km | Source | Evidence | Joins |
|---|---|---|---|---|---|---|
| 40340 | Unnamed | Near Shadnagar, south-west of Hyderabad → The Esi near Moinabad, west of Hyderabad | 31.2 | HydroRIVERS | HydroRIVERS line (461 km²); valley floor 64%; tank chain (2 unnamed tanks) | Esi (3219) |
| 40341 | Unnamed | Near Shabad, south-west of Hyderabad → The Esi near Chevella, west of Hyderabad | 13.8 | HydroRIVERS | HydroRIVERS line (84 km²); valley floor 47%; tank chain (Shabd Lake + 1 unnamed) | Esi (3219) |
| 40342 | Unnamed | Near Shamshabad, south-west of Hyderabad → Himayat Sagar, south-west of Hyderabad | 13.6 | HydroRIVERS | HydroRIVERS line (86 km²); valley floor 58%; tank chain (Himayat Sagar + 1 unnamed) | Esi (3219) |
| 40343 | Unnamed | Near Shabad, south-west of Hyderabad → The Esi near Chevella, west of Hyderabad | 13.4 | HydroRIVERS | HydroRIVERS line (76 km²); valley floor 78% | Esi (3219) |
| 40344 | Unnamed | Near Chevella, west of Hyderabad → The Musi near Shankarpally, west of Hyderabad | 11.7 | HydroRIVERS | HydroRIVERS line (79 km²); valley floor 65% | Musi (3220) |
| 40345 | Unnamed | Near Chevella, west of Hyderabad → The Musi at Mokila, west of Hyderabad | 10.7 | HydroRIVERS | HydroRIVERS line (37 km²); valley floor 71% | Musi (3220) |
| 40346 | Unnamed | Near Chevella, west of Hyderabad → The Musi near Mokila, west of Hyderabad | 9.5 | HydroRIVERS | HydroRIVERS line (55 km²); valley floor 83% | Musi (3220) |
| 40347 | Unnamed | Near Chevella, west of Hyderabad → The Musi near Shankarpally, west of Hyderabad | 8.8 | HydroRIVERS | HydroRIVERS line (51 km²); valley floor 71% | Musi (3220) |
| 40348 | Unnamed | Near Shamshabad, south-west of Hyderabad → The Esi near Shamshabad, south-west of Hyderabad | 6.8 | HydroRIVERS | HydroRIVERS line (37 km²); valley floor 39%; tank chain (3 unnamed tanks) | Esi (3219) |
| 40349 | Unnamed | Financial District, Hyderabad → The Musi at Manchirevula, west of Hyderabad | 6 | OSM | HydroRIVERS 59%; valley floor 84%; tank chain (Kokapet Lake); OSM river/stream; 0.39 km mapped as covered | Musi (3220) |
| 40350 | Unnamed | Manikonda Cheruvu, Khajaguda, Hyderabad → The Musi near Narsingi, Hyderabad | 6 | HydroRIVERS | HydroRIVERS line (31 km²); valley floor 75%; tank chain (Pedda Cheruvu, Manikonda Cheruvu) **(low-confidence file)** | Musi (3220) |
| 40351 | Unnamed | Near Moinabad, west of Hyderabad → Osman Sagar (Gandipet), west of Hyderabad | 5.6 | HydroRIVERS | HydroRIVERS line (26 km²); valley floor 79%; tank chain (Osman Sagar) | Musi (3220) |
| 40352 | Unnamed | Near Shabad, south-west of Hyderabad → The Esi near Chevella, west of Hyderabad | 5.6 | HydroRIVERS | HydroRIVERS line (23 km²); valley floor 71% | Esi (3219) |
| 40353 | Unnamed | Near Chevella, west of Hyderabad → The Esi near Chevella, west of Hyderabad | 4.7 | OSM | HydroRIVERS 91%; valley floor 94%; OSM river/stream | Esi (3219) |
| 40354 | Unnamed | Near Shankarpally, west of Hyderabad → The Musi near Shankarpally, west of Hyderabad | 4.2 | OSM | valley floor 83%; OSM river/stream | Musi (3220) |
| 40355 | Unnamed | Near Chevella, west of Hyderabad → The Esi near Chevella, west of Hyderabad | 5.2 | HydroRIVERS | HydroRIVERS line (28 km²); valley floor 57% | Esi (3219) |
| 40356 | Unnamed | Near Chevella, west of Hyderabad → The Esi near Chevella, west of Hyderabad | 3.5 | OSM | HydroRIVERS 84%; valley floor 92%; OSM river/stream | Esi (3219) |
| 40357 | Unnamed | Near Moinabad, west of Hyderabad → The Esi near Moinabad, west of Hyderabad | 4.1 | HydroRIVERS | HydroRIVERS line (20 km²); valley floor 69% | Esi (3219) |
| 40358 | Unnamed | Mulagund Lake, Rajendra Nagar, Hyderabad → The Esi at Kismatpur, south-west of Hyderabad | 3.7 | HydroRIVERS | HydroRIVERS line (27 km²); valley floor 50%; tank chain (Mulagund Lake) **(low-confidence file)** | Esi (3219) |
| 40359 | Unnamed | Near Kothur, south-west of Hyderabad → The Esi near Moinabad, west of Hyderabad | 3.6 | HydroRIVERS | HydroRIVERS line (23 km²); valley floor 50% | Esi (3219) |
| 40360 | Unnamed | Near Maheshwaram, south of Hyderabad → Near Kothur, south-west of Hyderabad | 18.2 | HydroRIVERS | HydroRIVERS line (207 km²); valley floor 41%; tank chain (2 unnamed tanks) | unnamed (40340) |
| 40361 | Unnamed | Near Shabad, south-west of Hyderabad → Near Kothur, south-west of Hyderabad | 9.7 | HydroRIVERS | HydroRIVERS line (46 km²); valley floor 63%; tank chain (3 unnamed tanks) | unnamed (40340) |
| 40362 | Unnamed | Near Shadnagar, south-west of Hyderabad → Near Nandigama, south-west of Hyderabad | 6.9 | HydroRIVERS | HydroRIVERS line (37 km²); valley floor 62%; tank chain (1 unnamed tank) | unnamed (40340) |
| 40363 | Unnamed | Near Nandigama, south-west of Hyderabad → Nandigama, south-west of Hyderabad | 5 | HydroRIVERS | HydroRIVERS line (22 km²); valley floor 73%; tank chain (1 unnamed tank) | unnamed (40340) |
| 40364 | Unnamed | Near Shamshabad, south-west of Hyderabad → Shamshabad, south-west of Hyderabad | 3.7 | HydroRIVERS | HydroRIVERS line (19 km²); valley floor 59%; tank chain (2 unnamed tanks) | unnamed (40342) |
| 40365 | Unnamed | Near Chevella, west of Hyderabad → Near Chevella, west of Hyderabad | 2.8 | HydroRIVERS | HydroRIVERS line (21 km²); valley floor 60% | unnamed (40344) |
| 40366 | Unnamed | Kothur, south-west of Hyderabad → Near Kothur, south-west of Hyderabad | 6.9 | HydroRIVERS | HydroRIVERS line (24 km²); valley floor 66% | unnamed (40360) |
| 40367 | Unnamed | Near Maheshwaram, south of Hyderabad → Near Maheshwaram, south of Hyderabad | 3.9 | HydroRIVERS | HydroRIVERS line (27 km²); valley floor 59%; tank chain (1 unnamed tank) | unnamed (40360) |
| 40368 | Unnamed | Near Kothur, south-west of Hyderabad → Near Kothur, south-west of Hyderabad | 2.9 | HydroRIVERS | HydroRIVERS line (23 km²); valley floor 80% | unnamed (40360) |
| 40369 | Unnamed | Near Maheshwaram, south of Hyderabad → Near Kothur, south-west of Hyderabad | 2.3 | HydroRIVERS | HydroRIVERS line (17 km²); valley floor 40% | unnamed (40360) |
| 40370 | Unnamed | Near Kothur, south-west of Hyderabad → Near Kothur, south-west of Hyderabad | 2.2 | HydroRIVERS | HydroRIVERS line (16 km²); valley floor 83% | unnamed (40360) |

**East and south: to the Musi in and below the city (28 streams, 195 km):**

| UID | Name | From → to | km | Source | Evidence | Joins |
|---|---|---|---|---|---|---|
| 40371 | Unnamed | Near Manchal, south-east of Hyderabad → The Chinna Musi near Batasingaram, east of Hyderabad | 20.8 | HydroRIVERS | HydroRIVERS line (137 km²); valley floor 66% | Chinna Musi (2440) |
| 40372 | Unnamed | Near Kandukur, south of Hyderabad → The Yelimineti Vagu near Ibrahimpatnam, south-east of Hyderabad | 20 | HydroRIVERS | HydroRIVERS line (155 km²); valley floor 49% | Yelimineti Vagu (2954) |
| 40373 | Unnamed | Near Manchal, south-east of Hyderabad → The Chinna Musi at Batasingaram, east of Hyderabad | 9.4 | HydroRIVERS | HydroRIVERS line (55 km²); valley floor 86%; tank chain (1 unnamed tank) | Chinna Musi (2440) |
| 40374 | Unnamed | Falaknuma, Hyderabad → The Musi at Chaderghat, Hyderabad | 8.1 | OSM | HydroRIVERS 96%; valley floor 76%; tank chain (1 unnamed tank); OSM river/stream | Musi (3220) |
| 40375 | Unnamed | Near Abdullapurmet, east of Hyderabad → The Chinna Musi at Batasingaram, east of Hyderabad | 8.1 | OSM | HydroRIVERS 100%; valley floor 90%; OSM river/stream | Chinna Musi (2440) |
| 40376 | Unnamed | Near Bibinagar, east of Hyderabad → The Musi near Bibinagar, east of Hyderabad | 8.4 | HydroRIVERS | HydroRIVERS line (42 km²); valley floor 72%; tank chain (2 unnamed tanks) | Musi (3220) |
| 40377 | Unnamed | Nacharam Cheruvu, Hyderabad → The Musi at Peerzadiguda, Hyderabad | 7.5 | OSM | HydroRIVERS 91%; valley floor 67%; tank chain (Nacharam Cheruvu, Pedda Cheruvu, Nallacheruvu + 1 unnamed) | Musi (3220) |
| 40378 | Unnamed | Near Pedda Amberpet, east of Hyderabad → The Musi near Abdullapurmet, east of Hyderabad | 6.8 | OSM | HydroRIVERS 100%; valley floor 96%; tank chain (1 unnamed tank) | Musi (3220) |
| 40379 | Unnamed | Talla Cheruvu, Meerpet, south-east of Hyderabad → The Musi at Chaitanyapuri, Hyderabad | 7.4 | HydroRIVERS | HydroRIVERS line (48 km²); valley floor 44%; tank chain (Saroor Nagar Lake, Talla Cheruvu, Mantrala Cheruvu) **(low-confidence file)** | Musi (3220) |
| 40380 | Unnamed | Near Raviryal, south of Hyderabad → The Yelimineti Vagu near Raviryal, south of Hyderabad | 6.1 | HydroRIVERS | HydroRIVERS line (29 km²); valley floor 60%; tank chain (1 unnamed tank) | Yelimineti Vagu (2954) |
| 40381 | Unnamed | Near Raviryal, south of Hyderabad → The Chinna Musi near Adibatla, south-east of Hyderabad | 5.7 | HydroRIVERS | HydroRIVERS line (28 km²); valley floor 53% | Chinna Musi (2440) |
| 40382 | Unnamed | Near Ibrahimpatnam, south-east of Hyderabad → The Yelimineti Vagu at Ibrahimpatnam, south-east of Hyderabad | 4.8 | HydroRIVERS | HydroRIVERS line (23 km²); valley floor 41%; tank chain (Ibrahimpatnam Cheruvu) | Yelimineti Vagu (2954) |
| 40383 | Unnamed | Pochampally, east of Hyderabad → The Chinna Musi at Pochampally, east of Hyderabad | 4.6 | HydroRIVERS | HydroRIVERS line (30 km²); valley floor 71%; tank chain (Pochampally Cheruvu) | Chinna Musi (2440) |
| 40384 | Unnamed | Near Abdullapurmet, east of Hyderabad → The Chinna Musi near Batasingaram, east of Hyderabad | 4 | HydroRIVERS | HydroRIVERS line (17 km²); valley floor 75%; tank chain (1 unnamed tank) | Chinna Musi (2440) |
| 40385 | Unnamed | Kandukur, south of Hyderabad → The Yelimineti Vagu near Kandukur, south of Hyderabad | 4.7 | HydroRIVERS | HydroRIVERS line (25 km²); valley floor 69% | Yelimineti Vagu (2954) |
| 40386 | Unnamed | Near Kandukur, south of Hyderabad → The Yelimineti Vagu near Kandukur, south of Hyderabad | 4 | HydroRIVERS | HydroRIVERS line (23 km²); valley floor 62%; tank chain (1 unnamed tank) | Yelimineti Vagu (2954) |
| 40387 | Unnamed | Near Pochampally, east of Hyderabad → The Chinna Musi near Pochampally, east of Hyderabad | 2.9 | HydroRIVERS | HydroRIVERS line (16 km²); valley floor 41% | Chinna Musi (2440) |
| 40388 | Unnamed | Jalpally, south of Hyderabad → Falaknuma, Hyderabad | 7.5 | HydroRIVERS | HydroRIVERS line (41 km²); valley floor 81%; tank chain (Umda Sagar, Palle Cheruvu + 1 unnamed) **(low-confidence file)** | unnamed (40374) |
| 40389 | Unnamed | Near Manchal, south-east of Hyderabad → Near Manchal, south-east of Hyderabad | 6.9 | HydroRIVERS | HydroRIVERS line (30 km²); valley floor 75% | unnamed (40371) |
| 40390 | Unnamed | Near Manchal, south-east of Hyderabad → Near Manchal, south-east of Hyderabad | 6.4 | HydroRIVERS | HydroRIVERS line (25 km²); valley floor 55%; tank chain (1 unnamed tank) | unnamed (40371) |
| 40391 | Unnamed | Near Ibrahimpatnam, south-east of Hyderabad → Near Ibrahimpatnam, south-east of Hyderabad | 4.6 | HydroRIVERS | HydroRIVERS line (30 km²); valley floor 51%; tank chain (1 unnamed tank) | unnamed (40372) |
| 40392 | Unnamed | Pedda Amberpet, east of Hyderabad → Near Abdullapurmet, east of Hyderabad | 2.9 | OSM | HydroRIVERS 100%; valley floor 100%; OSM river/stream | unnamed (40375) |
| 40393 | Unnamed | Rama Cheruvu, Boduppal, Hyderabad → Boduppal, Hyderabad | 3.2 | HydroRIVERS | HydroRIVERS line (14 km²); valley floor 64%; tank chain (Rama Cheruvu) **(low-confidence file)** | unnamed (40377) |
| 40394 | Unnamed | Near Pedda Amberpet, east of Hyderabad → Near Pedda Amberpet, east of Hyderabad | 3 | HydroRIVERS | HydroRIVERS line (16 km²); valley floor 70%; tank chain (1 unnamed tank) | unnamed (40378) |
| 40395 | Unnamed | Abdullapurmet, east of Hyderabad → Batasingaram, east of Hyderabad | 2.8 | HydroRIVERS | HydroRIVERS line (14 km²); valley floor 50%; tank chain (1 unnamed tank) | unnamed (40375) |
| 40396 | Unnamed | Anatula Cheruvu, near Nadergul, south-east of Hyderabad → Pedda Amberpet, east of Hyderabad | 17.1 | HydroRIVERS | HydroRIVERS line (98 km²); valley floor 63%; tank chain (Injapur Cheruvu, Eedula Cheruvu, Anatula Cheruvu + 1 unnamed) | unnamed (40392) |
| 40397 | Unnamed | Near Turkayamjal, south-east of Hyderabad → Pedda Amberpet, east of Hyderabad | 4.7 | HydroRIVERS | HydroRIVERS line (21 km²); valley floor 52%; tank chain (Eedula Cheruvu) | unnamed (40396) |
| 40398 | Unnamed | Turkayamjal, south-east of Hyderabad → Turkayamjal, south-east of Hyderabad | 2.4 | HydroRIVERS | HydroRIVERS line (17 km²); valley floor 40%; tank chain (Injapur Cheruvu) | unnamed (40396) |

**North and north-east: the Shamirpet Vagu, Ermulli Vagu and Chinnaeru (20 streams, 130 km):**

| UID | Name | From → to | km | Source | Evidence | Joins |
|---|---|---|---|---|---|---|
| 40399 | Unnamed | Nagaram, Hyderabad → The Ermulli Vagu at Ghatkesar, east of Hyderabad | 10.8 | OSM | HydroRIVERS 100%; valley floor 61%; tank chain (1 unnamed tank); OSM river/stream | Ermulli Vagu (2478) |
| 40400 | Unnamed | Near Ghatkesar, east of Hyderabad → The Chinnaeru at Bibinagar, east of Hyderabad | 11.3 | HydroRIVERS | HydroRIVERS line (64 km²); valley floor 59%; tank chain (3 unnamed tanks) | Chinnaeru (2441) |
| 40401 | Unnamed | Near Medchal, north of Hyderabad → The Shamirpet Vagu at Medchal, north of Hyderabad | 9.1 | HydroRIVERS | HydroRIVERS line (50 km²); valley floor 57% | Shamirpet Vagu (2874) |
| 40402 | Unnamed | Near Bommalaramaram, north-east of Hyderabad → The Shamirpet Vagu near Bommalaramaram, north-east of Hyderabad | 9.2 | HydroRIVERS | HydroRIVERS line (42 km²); valley floor 84%; tank chain (2 unnamed tanks) | Shamirpet Vagu (2874) |
| 40403 | Unnamed | Near Kolthur, north-east of Hyderabad → The Shamirpet Vagu near Kolthur, north-east of Hyderabad | 8.9 | HydroRIVERS | HydroRIVERS line (47 km²); valley floor 61%; tank chain (Lalgadi Malakpet Lake) | Shamirpet Vagu (2874) |
| 40404 | Unnamed | Near Kolthur, north-east of Hyderabad → The Shamirpet Vagu near Kolthur, north-east of Hyderabad | 8.1 | HydroRIVERS | HydroRIVERS line (65 km²); valley floor 56% | Shamirpet Vagu (2874) |
| 40405 | Unnamed | Thumkunta, north-east of Hyderabad → The Shamirpet Vagu at Shamirpet, north-east of Hyderabad | 7.8 | HydroRIVERS | HydroRIVERS line (43 km²); valley floor 64% | Shamirpet Vagu (2874) |
| 40406 | Unnamed | Near Kolthur, north-east of Hyderabad → The Shamirpet Vagu near Kolthur, north-east of Hyderabad | 7.5 | HydroRIVERS | HydroRIVERS line (37 km²); valley floor 56% | Shamirpet Vagu (2874) |
| 40407 | Unnamed | Near Bibinagar, east of Hyderabad → The Chinnaeru near Bibinagar, east of Hyderabad | 5.8 | HydroRIVERS | HydroRIVERS line (24 km²); valley floor 71% | Chinnaeru (2441) |
| 40408 | Unnamed | Near Bommalaramaram, north-east of Hyderabad → The Shamirpet Vagu near Bhongir, east of Hyderabad | 7 | HydroRIVERS | HydroRIVERS line (24 km²); valley floor 64% | Shamirpet Vagu (2874) |
| 40409 | Unnamed | Near Bommalaramaram, north-east of Hyderabad → The Shamirpet Vagu near Bommalaramaram, north-east of Hyderabad | 5.6 | HydroRIVERS | HydroRIVERS line (26 km²); valley floor 59% | Shamirpet Vagu (2874) |
| 40410 | Unnamed | Near Medchal, north of Hyderabad → The Shamirpet Vagu near Medchal, north of Hyderabad | 3.6 | OSM | valley floor 50%; tank chain (1 unnamed tank); OSM river/stream | Shamirpet Vagu (2874) |
| 40411 | Unnamed | Near Bhongir, east of Hyderabad → The Shamirpet Vagu near Bhongir, east of Hyderabad | 4.1 | HydroRIVERS | HydroRIVERS line (20 km²); valley floor 69% | Shamirpet Vagu (2874) |
| 40412 | Unnamed | Keesara, north-east of Hyderabad → The Ermulli Vagu near Ghatkesar, east of Hyderabad | 4.8 | HydroRIVERS | HydroRIVERS line (23 km²); valley floor 72% | Ermulli Vagu (2478) |
| 40413 | Unnamed | Near Medchal, north of Hyderabad → The Shamirpet Vagu near Medchal, north of Hyderabad | 3.4 | HydroRIVERS | HydroRIVERS line (23 km²); valley floor 50%; tank chain (1 unnamed tank) | Shamirpet Vagu (2874) |
| 40414 | Unnamed | Bommalaramaram, north-east of Hyderabad → The Shamirpet Vagu at Bommalaramaram, north-east of Hyderabad | 3.5 | HydroRIVERS | HydroRIVERS line (19 km²); valley floor 89% | Shamirpet Vagu (2874) |
| 40415 | Unnamed | Near Bommalaramaram, north-east of Hyderabad → The Shamirpet Vagu near Bommalaramaram, north-east of Hyderabad | 2.7 | HydroRIVERS | HydroRIVERS line (19 km²); valley floor 73% | Shamirpet Vagu (2874) |
| 40416 | Unnamed | Yapral, Hyderabad → Nagaram, Hyderabad | 8.1 | HydroRIVERS | HydroRIVERS line (74 km²); valley floor 73%; tank chain (Kapra lake + 2 unnamed) **(low-confidence file)** | unnamed (40399) |
| 40417 | Unnamed | Near Kolthur, north-east of Hyderabad → Near Kolthur, north-east of Hyderabad | 5.4 | HydroRIVERS | HydroRIVERS line (29 km²); valley floor 80% | unnamed (40404) |
| 40418 | Unnamed | Near Bibinagar, east of Hyderabad → Bibinagar, east of Hyderabad | 3.5 | HydroRIVERS | HydroRIVERS line (23 km²); valley floor 44%; tank chain (1 unnamed tank) | unnamed (40400) |

**Outer areas: the Manjira side, the Aler and the far south (31 streams, 215 km):**

| UID | Name | From → to | km | Source | Evidence | Joins |
|---|---|---|---|---|---|---|
| 40419 | Unnamed | Near Narsapur, north-west of Hyderabad → The Manjra near Sangareddy, north-west of Hyderabad | 19.4 | HydroRIVERS | HydroRIVERS line (122 km²); valley floor 48%; tank chain (narsapur lake + 1 unnamed) | Manjra (5657) |
| 40420 | Unnamed | Near Narsapur, north-west of Hyderabad → The Manjra near Sangareddy, north-west of Hyderabad | 16.8 | HydroRIVERS | HydroRIVERS line (64 km²); valley floor 44%; tank chain (4 unnamed tanks) | Manjra (5657) |
| 40421 | Unnamed | Near Shankarpally, west of Hyderabad → The Nakka Vagu near Rudraram, north-west of Hyderabad | 15.4 | HydroRIVERS | HydroRIVERS line (61 km²); valley floor 49%; tank chain (1 unnamed tank) | Nakka Vagu (6692) |
| 40422 | Unnamed | Near Medchal, north of Hyderabad → The Haldi near Mulugu, north of Hyderabad | 12.1 | HydroRIVERS | HydroRIVERS line (76 km²); valley floor 52% | Haldi (5026) |
| 40423 | Unnamed | Near Jinnaram, north-west of Hyderabad → The Nakka Vagu near Rudraram, north-west of Hyderabad | 10.7 | HydroRIVERS | HydroRIVERS line (76 km²); valley floor 44% | Nakka Vagu (6692) |
| 40424 | Unnamed | Near Narsapur, north-west of Hyderabad → The Nakka Vagu near Rudraram, north-west of Hyderabad | 9 | HydroRIVERS | HydroRIVERS line (42 km²); valley floor 33%; tank chain (2 unnamed tanks) | Nakka Vagu (6692) |
| 40425 | Unnamed | Near Isnapur, north-west of Hyderabad → The Nakka Vagu near Patancheru, Hyderabad | 8.4 | HydroRIVERS | HydroRIVERS line (42 km²); valley floor 46% | Nakka Vagu (6692) |
| 40426 | Unnamed | Lingampally, Hyderabad → The Pamla Vagu near Patancheru, Hyderabad | 10.1 | HydroRIVERS | HydroRIVERS line (87 km²); valley floor 42%; tank chain (Ushkabavi Pond, Shambuni Kunta + 2 unnamed) **(low-confidence file)** | Pamla Vagu (5932) |
| 40427 | Unnamed | Near Kandi, north-west of Hyderabad → The Sovati Vagu at Kandi, north-west of Hyderabad | 8.2 | HydroRIVERS | HydroRIVERS line (47 km²); valley floor 56%; tank chain (1 unnamed tank) | Sovati Vagu (6300) |
| 40428 | Unnamed | Near Medchal, north of Hyderabad → The Haldi near Mulugu, north of Hyderabad | 7.2 | HydroRIVERS | HydroRIVERS line (52 km²); valley floor 40%; tank chain (2 unnamed tanks) | Haldi (5026) |
| 40429 | Unnamed | Near Mulugu, north of Hyderabad → The Haldi near Mulugu, north of Hyderabad | 6.9 | HydroRIVERS | HydroRIVERS line (50 km²); valley floor 60%; tank chain (1 unnamed tank) | Haldi (5026) |
| 40430 | Unnamed | Near Shabad, south-west of Hyderabad → The Bhimawaram near Shadnagar, south-west of Hyderabad | 6.6 | HydroRIVERS | HydroRIVERS line (33 km²); valley floor 62%; tank chain (1 unnamed tank) | Bhimawaram (2390) |
| 40431 | Unnamed | Near Sangareddy, north-west of Hyderabad → The Manjra near Sangareddy, north-west of Hyderabad | 7.5 | HydroRIVERS | HydroRIVERS line (45 km²); valley floor 49%; tank chain (1 unnamed tank) | Manjra (5657) |
| 40432 | Unnamed | Near Mokila, west of Hyderabad → The Maisamma Vagu near Patancheru, Hyderabad | 5.5 | HydroRIVERS | HydroRIVERS line (25 km²); valley floor 64% | Maisamma Vagu (5625) |
| 40433 | Unnamed | Near Ameenpur, north-west of Hyderabad → The Pamla Vagu near Patancheru, Hyderabad | 4.8 | OSM | HydroRIVERS 94%; valley floor 50%; tank chain (1 unnamed tank); OSM river/stream | Pamla Vagu (5932) |
| 40434 | Unnamed | Near Narsapur, north-west of Hyderabad → The Manjra near Sangareddy, north-west of Hyderabad | 5.2 | HydroRIVERS | HydroRIVERS line (25 km²); valley floor 26%; tank chain (1 unnamed tank) **(low-confidence file)** | Manjra (5657) |
| 40435 | Unnamed | Near Sangareddy, north-west of Hyderabad → The Manjra near Sangareddy, north-west of Hyderabad | 4.9 | HydroRIVERS | HydroRIVERS line (29 km²); valley floor 19%; tank chain (2 unnamed tanks) **(low-confidence file)** | Manjra (5657) |
| 40436 | Unnamed | Near Kandi, north-west of Hyderabad → The Nakka Vagu near Rudraram, north-west of Hyderabad | 4.8 | HydroRIVERS | HydroRIVERS line (29 km²); valley floor 56%; tank chain (1 unnamed tank) | Nakka Vagu (6692) |
| 40437 | Unnamed | Near Shabad, south-west of Hyderabad → The Bhimawaram near Shabad, south-west of Hyderabad | 4.5 | HydroRIVERS | HydroRIVERS line (21 km²); valley floor 90%; tank chain (1 unnamed tank) | Bhimawaram (2390) |
| 40438 | Unnamed | Near Bhongir, east of Hyderabad → The Aler near Bhongir, east of Hyderabad | 3.5 | HydroRIVERS | HydroRIVERS line (21 km²); valley floor 79% | Aler (2324) |
| 40439 | Unnamed | Near Mulugu, north of Hyderabad → The Kodil near Mulugu, north of Hyderabad | 3.5 | HydroRIVERS | HydroRIVERS line (17 km²); valley floor 43%; tank chain (1 unnamed tank) | Kodil (5412) |
| 40440 | Unnamed | Near Jinnaram, north-west of Hyderabad → The Pamla Vagu near Patancheru, Hyderabad | 3.6 | HydroRIVERS | HydroRIVERS line (14 km²); valley floor 37%; tank chain (2 unnamed tanks) | Pamla Vagu (5932) |
| 40441 | Unnamed | Patancheru, Hyderabad → The Nakka Vagu near Patancheru, Hyderabad | 2.5 | OSM | valley floor 92%; OSM river/stream | Nakka Vagu (6692) |
| 40442 | Unnamed | Near Bommalaramaram, north-east of Hyderabad → The Aler near Bommalaramaram, north-east of Hyderabad | 3.4 | HydroRIVERS | HydroRIVERS line (24 km²); valley floor 48% | Aler (2324) |
| 40443 | Unnamed | Near Bommalaramaram, north-east of Hyderabad → The Kandukura Vagu near Bhongir, east of Hyderabad | 2.8 | HydroRIVERS | HydroRIVERS line (16 km²); valley floor 61% | Kandukura Vagu (2618) |
| 40444 | Unnamed | Bowrampet, Hyderabad → Near Ameenpur, north-west of Hyderabad | 8.7 | HydroRIVERS | HydroRIVERS line (67 km²); valley floor 43%; tank chain (Mallampet Cheruvu + 2 unnamed) | unnamed (40433) |
| 40445 | Unnamed | Near Mulugu, north of Hyderabad → Near Mulugu, north of Hyderabad | 5.6 | HydroRIVERS | HydroRIVERS line (28 km²); valley floor 60%; tank chain (1 unnamed tank) | unnamed (40422) |
| 40446 | Unnamed | Near Narsapur, north-west of Hyderabad → Near Narsapur, north-west of Hyderabad | 4 | HydroRIVERS | HydroRIVERS line (31 km²); valley floor 29%; tank chain (1 unnamed tank) **(low-confidence file)** | unnamed (40419) |
| 40447 | Unnamed | Ameenpur Lake, north-west of Hyderabad → Ameenpur, north-west of Hyderabad | 3.5 | HydroRIVERS | HydroRIVERS line (20 km²); valley floor 40%; tank chain (Ameenpur Lake, BANDAMKOMMU LAKE) **(low-confidence file)** | unnamed (40426) |
| 40448 | Unnamed | Near Isnapur, north-west of Hyderabad → Isnapur, north-west of Hyderabad | 3.5 | HydroRIVERS | HydroRIVERS line (16 km²); valley floor 47% | unnamed (40425) |
| 40449 | Unnamed | Gangaram Cheruvu, Madinaguda, Hyderabad → Chandanagar, Hyderabad | 2.6 | HydroRIVERS | HydroRIVERS line (18 km²); valley floor 38%; tank chain (Gangaram Cheruvu) **(low-confidence file)** | unnamed (40426) |

Names: "Balkapur Nala" is from the references (HMDA's four feeders of Hussain Sagar; it is the only drain that reaches the lake from the west). Every other stream is unnamed, because no reference both names a nala and says where it runs, and OSM names none.

## Not drawn

### 1. Man-made channels

| Channel | km | Near | Reason |
|---|---|---|---|
| (unnamed) near Mulugu (15 OSM ways) | 76.6 | Mulugu | Tagged `waterway=canal` in OSM. Irrigation and water-supply canals north of Shamirpet, on level lines (probably the Kondapochamma Sagar system). |
| (unnamed) near Batasingaram (OSM way 570232147) | 35.7 | Batasingaram | Tagged `waterway=canal` in OSM. One long canal that starts near Tupranpet and runs east, mostly outside the box. |
| (unnamed) near Bommalaramaram (12 OSM ways) | 24.3 | Bommalaramaram | Tagged `waterway=canal` in OSM. Irrigation canals. |
| (unnamed) near Ghatkesar (3 OSM ways) | 17.2 | Ghatkesar | Tagged `waterway=canal` in OSM. The Musi's irrigation channels on its north bank. |
| (unnamed) near Bhongir (2 OSM ways) | 13.8 | Bhongir | Tagged `waterway=canal` in OSM. Irrigation canals. |
| (unnamed) near Jeedimetla (OSM way 28476533) | 8.5 | Jeedimetla | Tagged `waterway=canal` in OSM. This is the Kukatpally Nala (40039), on the map since the earlier pass: OSM tags it as a canal, the references call it a nala. |
| (unnamed) near Kolthur (OSM way 1231010877) | 7.3 | Kolthur | Tagged `waterway=canal` in OSM. Irrigation canal. |
| (unnamed) near Sanath Nagar (5 OSM ways) | 6.8 | Sanath Nagar | Tagged `waterway=canal` in OSM. The Kukatpally Nala's lower course (40039), on the map since the earlier pass. |
| (unnamed) near Peerzadiguda (OSM way 1454136280) | 6.5 | Peerzadiguda | Tagged `waterway=canal` in OSM. A Musi irrigation channel on the south bank. |
| (unnamed) near Tukkuguda (14 OSM ways) | 6.1 | Tukkuguda | Tagged `waterway=canal` in OSM. Short straight drains in a planned layout. |
| Ashoknagar Nala (3 OSM ways) | 6.0 | Kavadiguda | Tagged `waterway=canal` in OSM. This is the Hussain Sagar Surplus Nala (40040), on the map since the earlier pass: a natural outflow that OSM tags as a canal. |
| (unnamed) near Hayathnagar (10 OSM ways) | 2.4 | Hayathnagar | Tagged `waterway=canal` in OSM. Short straight pieces. |
| (unnamed) near Chaderghat (OSM way 238233522) | 1.4 | Chaderghat | Tagged `waterway=canal` in OSM. Lies along the Musi itself. |
| (unnamed) near Turkayamjal (7 OSM ways) | 1.3 | Turkayamjal | Tagged `waterway=canal` in OSM. Short straight pieces. |
| Laxmi Nagar Nala (2 OSM ways) | 1.2 | Langar Houz | Tagged `waterway=canal` in OSM. Runs from below Golconda to the Musi at Langar Houz; under 2 km in any case. |
| Unnamed (OSM ways 318598243, 318505359) | 3.1 | Hussain Sagar | Taken out by hand: drains mapped across the open water of Hussain Sagar, from the Khairatabad corner and from the north shore to the lake's southern outlet: interception lines that carry dry-weather flow round or through the lake, not streams. |
| Unnamed (OSM drain), near Pochampally (17.3622 N, 78.7548 E) | 8.1 | Batasingaram | Left out by eye: an irrigation channel, not a stream: the same OSM drain runs north to the Musi and south to the Chinna Musi from one point on the watershed near Pochampally, so it links the two rivers across the divide (it also fails the downhill test: 68%). |
| Bhongir Kaluva (OSM name; "kaluva" is Telugu for canal) | 11.2 | Bhongir | An irrigation channel from the Shamirpet Vagu to Bhongir's tank, tagged as a stream in OSM. It did not come into any stream drawn. |
| Drains of Rajiv Gandhi International Airport, Shamshabad (17.2313 N, 78.4113 E) | 13.6 | Shamshabad | A grid of straight drains along the runways and aprons, joined to nothing. |

OSM canals under 1 km in total are not listed (10 of them, 4.0 km). The Krishna, Godavari, Manjira and Singur water-supply pipelines are not waterways in OSM and never entered the network.

### 2. Fail the test, do not run downhill, or are a river already drawn

| Stream | km | Would join | Reason |
|---|---|---|---|
| Unnamed, Near Batasingaram, east of Hyderabad (17.3639 N, 78.7521 E) | 7.9 | Musi (3220) | Already on the map as Musi (3220). |
| Unnamed, Uppal, Hyderabad (17.3925 N, 78.5530 E) | 4.6 | an unnamed stream | Low confidence: mapped in OSM as a river, but on level ground (480 m to 475 m) with no valley in the elevation data and no HydroRIVERS line; it runs from beside the Musi at Ramanthapur to Nalla Cheruvu at Uppal and may be an old supply channel taking Musi water to the tank (see review/hyderabad-low-confidence.md). |
| Unnamed, Near Peerzadiguda, Hyderabad (17.3805 N, 78.6452 E) | 4.4 | Musi (3220) | Already on the map as Musi (3220). |

The two "already on the map as Musi" lines are irrigation channels that leave the Musi and run beside it east of Uppal; OSM tags them as drains.

### 3. HydroRIVERS valleys not drawn

| Valley | km | Catchment | Reason |
|---|---|---|---|
| Near Choutuppal, east of Hyderabad (17.1938 N, 78.8479 E) | 25.1 | 331 km² | Lies mostly outside the area the data covers. |
| Near Manchal, south-east of Hyderabad (17.1250 N, 78.8292 E) | 21.8 | 69 km² | Joins a valley that is not drawn. |
| Near Gummadidala, north of Hyderabad (17.7417 N, 78.3625 E) | 21 | 181 km² | Lies mostly outside the area the data covers. |
| Near Gummadidala, north of Hyderabad (17.7333 N, 78.4021 E) | 11.8 | 65 km² | Joins a valley that is not drawn. |
| Near Choutuppal, east of Hyderabad (17.1438 N, 78.8583 E) | 11 | 34 km² | Joins a valley that is not drawn. |
| Near Gummadidala, north of Hyderabad (17.7583 N, 78.4313 E) | 3.3 | 24 km² | Joins a valley that is not drawn. |
| Near Batasingaram, east of Hyderabad (17.3208 N, 78.7500 E) | 2 | 15 km² | Low confidence: a 2 km HydroRIVERS line with no valley in the elevation data (24%), no tank on it and no OSM waterway (see review/hyderabad-low-confidence.md). |
| Chilkur, west of Hyderabad (17.3604 N, 78.2833 E) | 2.8 | 26 km² | Drowned: 87% of it lies under the water of Osman Sagar. |
| Near Choutuppal, east of Hyderabad (17.2271 N, 78.8812 E) | 7.6 | 76 km² | A stretch of China Vagu (2434), already on the map, where the map's line strays from the valley. |

### 4. OSM has no channel linking them to a drawn river

Pieces of 2 km or more that end more than 0.5 km from the network. Drawing them would mean inventing the missing stretch. They may well be natural.

| Lowest point near | km | Gap to the network | Note |
|---|---|---|---|
| Shamshabad (17.2313 N, 78.4113 E) | 13.6 | 12.32 km | The airport's drains (section 1). |
| Pedda Amberpet (17.3067 N, 78.6290 E) | 4.8 | 1.83 km | A stretch of the Injapur-Kuntloor tank chain. The valley is on the map from HydroRIVERS (the 17 km stream to Pedda Amberpet), so nothing is missing, but OSM's own line here is the truer course. |
| Narsingi (17.4005 N, 78.3611 E) | 4.3 | 2.13 km | From Khajaguda's tanks west and south to a tank at Narsingi; no mapped channel from there to the Musi, 1.5 km on. See the low-confidence file. |
| Chandanagar (17.4984 N, 78.3165 E) | 2.5 | 5.72 km | At Lingampally and Chandanagar. The valley is on the map from HydroRIVERS (the stream to the Pamla Vagu). |
| Banjara Hills (17.4116 N, 78.4463 E) | 2.2 | 0.67 km | **The Banjara Nala's upper course**, from KBR Park in Jubilee Hills to Banjara Lake (Hamed Khan Kunta). OSM has nothing from the lake to Hussain Sagar. See the low-confidence file. |

### 5. Nalas and tank chains named in the references that are not on the map

- **Banjara Nala** (one of Hussain Sagar's four feeders): OSM has its upper 2.2 km only (section 4) and a 0.8 km covered piece near Punjagutta; nothing reaches the lake.
- **Yousufguda Nala** and the **Begumpet Nala**: OSM has 1.5 km of a stream from Ameerpet to the Kukatpally Nala at Begumpet (in the ready list below), which is probably the Yousufguda Nala's lower end; the rest is unmapped.
- **Durgam Cheruvu → Malkam Cheruvu**: both tanks are mapped, the outflow channel between them is not, and the valley is too small for HydroRIVERS (under 10 km²). The same holds for most of the IT corridor's tanks: Gopanpally, Nallagandla, Khajaguda, the Gachibowli tanks.
- **Mir Alam Tank's outflow** to the Musi at Kishan Bagh: mapped, 1.5 km, in the ready list below.
- **Saroornagar Lake's outflow** to the Musi: mapped, 1.1 km, in the ready list; the valley above and below it is drawn from HydroRIVERS.
- **Bandlaguda Cheruvu → Nagole Cheruvu**, **Safilguda, Moula Ali (RK Puram) and Ramanthapur tanks**, **Shamirpet Lake's feeders**, **Alwal's tanks** above the Picket Nala: tanks mapped, no channels, no HydroRIVERS line.
- **Murki Nala**: named in the brief for this job; no reference found says where it runs, so the name is not used. It may be the old city's nala through Yakutpura, which is on the map unnamed.

### 6. Under 2 km

The 2 km minimum was kept. Of the OSM streams of 1-2 km, **7 are complete**: they pass the test and reach a drawn river. With them are **20 HydroRIVERS valleys of 1-2 km**. Their courses, test results and OSM way ids or HydroRIVERS positions are kept in the working files of this job (`build/view/hyd-under2km.json`, not in the repository), so they can be added without redoing the network. 1 more OSM stream of 1-2 km fails the test.

| From → to | km | Source | Evidence | Would join |
|---|---|---|---|---|
| Boduppal, Hyderabad → Peerzadiguda, Hyderabad (17.4133 N, 78.5771 E) | 1.9 | OSM | HydroRIVERS 100%; tank chain (Sudda kunta, Nallacheruvu ( Uppal Mini Tank Bund )); OSM river/stream | an unnamed stream (40377) |
| Kishan Bagh, Hyderabad → The Musi at Bahadurpura, Hyderabad (17.3498 N, 78.4447 E) | 1.5 | OSM | HydroRIVERS 100%; valley floor 82%; tank chain (Singos Tank, unnamed tank) | Musi (3220) |
| Ameerpet, Hyderabad → The Kukatpally Nala at Begumpet, Hyderabad (17.4372 N, 78.4474 E) | 1.4 | OSM | HydroRIVERS 100%; valley floor 88%; tank chain (unnamed tank); OSM river/stream | Kukatpally Nala (40039) |
| Ghatkesar, east of Hyderabad → The Ermulli Vagu at Ghatkesar, east of Hyderabad (17.4435 N, 78.7025 E) | 1.4 | OSM | tank chain (Edulabad Lake) | Ermulli Vagu (2478) |
| Alwal, Hyderabad → The Picket Nala at Alwal, Hyderabad (17.5084 N, 78.4985 E) | 1.3 | OSM | tank chain (Old Alwal Temple Pond) | Picket Nala (40041) |
| Near Ghatkesar, east of Hyderabad → The Musi at Ghatkesar, east of Hyderabad (17.4149 N, 78.6874 E) | 1.1 | OSM | valley floor 100% | Musi (3220) |
| Dilsukhnagar, Hyderabad → The Musi at Chaitanyapuri, Hyderabad (17.3687 N, 78.5299 E) | 1.1 | OSM | HydroRIVERS 100%; valley floor 92%; tank chain (unnamed tank); OSM river/stream | Musi (3220) |
| Near Maheshwaram, south of Hyderabad (17.1500 N, 78.4625 E) | 1.9 | HydroRIVERS | HydroRIVERS line (13 km²) | - |
| Near Gandipet, Hyderabad (17.4000 N, 78.2937 E) | 1.8 | HydroRIVERS | HydroRIVERS line (14 km²) | - |
| Near Shamirpet, north-east of Hyderabad (17.5917 N, 78.6146 E) | 1.8 | HydroRIVERS | HydroRIVERS line (14 km²) | - |
| Near Kandukur, south of Hyderabad (17.0833 N, 78.5708 E) | 1.8 | HydroRIVERS | HydroRIVERS line (15 km²) | - |
| Near Ghatkesar, east of Hyderabad (17.4167 N, 78.6583 E) | 1.8 | HydroRIVERS | HydroRIVERS line (26 km²) | - |
| Shabad, south-west of Hyderabad (17.1708 N, 78.1437 E) | 1.6 | HydroRIVERS | HydroRIVERS line (16 km²) | - |
| Near Rajendra Nagar, Hyderabad (17.3042 N, 78.3750 E) | 1.6 | HydroRIVERS | HydroRIVERS line (15 km²) | - |
| Balapur, south of Hyderabad (17.3042 N, 78.5000 E) | 1.6 | HydroRIVERS | HydroRIVERS line (22 km²) | - |
| Near Ibrahimpatnam, south-east of Hyderabad (17.1458 N, 78.6146 E) | 1.6 | HydroRIVERS | HydroRIVERS line (19 km²) | - |
| Near Narsapur, north-west of Hyderabad (17.7250 N, 78.2208 E) | 1.4 | HydroRIVERS | HydroRIVERS line (11 km²) | - |
| Hayathnagar, Hyderabad (17.3208 N, 78.6042 E) | 1.4 | HydroRIVERS | HydroRIVERS line (12 km²) | - |
| Near Bhongir, east of Hyderabad (17.5042 N, 78.8500 E) | 1.4 | HydroRIVERS | HydroRIVERS line (16 km²) | - |
| Near Shankarpally, west of Hyderabad (17.4562 N, 78.0917 E) | 1.3 | HydroRIVERS | HydroRIVERS line (15 km²) | - |
| Near Jinnaram, north-west of Hyderabad (17.6312 N, 78.3750 E) | 1.3 | HydroRIVERS | HydroRIVERS line (24 km²) | - |
| Near Dundigal, north of Hyderabad (17.6375 N, 78.4396 E) | 1.3 | HydroRIVERS | HydroRIVERS line (14 km²) | - |
| Rudraram, north-west of Hyderabad (17.5708 N, 78.1812 E) | 1.3 | HydroRIVERS | HydroRIVERS line (12 km²) | - |
| Near Kandukur, south of Hyderabad (17.1042 N, 78.5479 E) | 1.3 | HydroRIVERS | HydroRIVERS line (14 km²) | - |
| Safilguda, Hyderabad (17.4542 N, 78.5437 E) | 1.3 | HydroRIVERS | HydroRIVERS line (54 km²) | - |
| Isnapur, north-west of Hyderabad (17.5583 N, 78.2146 E) | 1.2 | HydroRIVERS | HydroRIVERS line (14 km²) | - |
| Near Mulugu, north of Hyderabad (17.7646 N, 78.5625 E) | 1.1 | HydroRIVERS | HydroRIVERS line (14 km²) | - |

Below 1 km there are a few dozen more OSM stubs; they were not looked at.

## Where this stopped, and open questions

- **Area.** Everything inside the box (17.05-17.80 N, 78.05-78.90 E) was tested, with no administrative limit: the city, the Outer Ring Road belt, and out to Sangareddy, Narsapur, Mulugu, Bhongir, Pochampally, Ibrahimpatnam, Kandukur, Shadnagar and Chevella. Streams lying mostly outside the box were not looked at (the Haldi's upper tributaries north of Gummadidala, the valleys east of Choutuppal, the Musi's own head towards Vikarabad).
- **The city core is thin.** Inside the Inner Ring Road only the Balkapur Nala, the Ram Nagar-Nallakunta drain and the old city's nala were added. That is the state of OSM, not of the ground: the Banjara, Yousufguda and Begumpet nalas, and the outflows of Durgam Cheruvu, Mir Alam Tank and Saroornagar Lake, are unmapped or mapped for under 2 km (sections 4-6).
- **HydroRIVERS lines are coarse.** 99 of the 114 streams are HydroRIVERS valleys. They show that a stream is there and roughly where; they do not show its bends, and near a confluence the last few hundred metres are a straight line to the river. If OSM's mapping of Hyderabad's nalas improves, they should be replaced by OSM courses.
- **Names.** A GHMC ward-wise nala list or the Kirloskar report's maps would let the unnamed streams be named.
- **The 31 km river through Kothur** (40340), with a 461 km² catchment, joins the Esi above Himayat Sagar and is not in the CWC data. It surely has a name; none was found.
