# Mumbai Metropolitan Region streams

Updated 2026-10-03. The same job as for Bengaluru (`review/bengaluru-streams.md`), for the Mumbai Metropolitan Region, in these steps:

1. The Trombay Creek: the unnamed stream from Ghatkopar was named, run to its southern mouth, and given its northern mouth as a distributary.
2. Thane Creek itself, as a branch of the Ulhas.
3. Thane Creek, west bank (Salsette): 13 streams, 65 km.
4. Thane Creek, east bank (Navi Mumbai) and the Panvel Creek side: 7 streams, 31 km.
5. Mira-Bhayandar, Gorai and Manori Creek: 11 streams, 37 km.
6. The rest of the region: 113 streams, 566 km.

In all 144 streams and 699 km were added, besides Thane Creek (26.4 km), the Trombay Creek's northern mouth (3.3 km) and 5.3 km on the head of the Waldhuni. The area covered is the box the data was fetched for: 18.80-19.55 N, 72.70-73.35 E.

## References used

These decided **what** to look for and what to call it. No line was traced from them: every course is from OpenStreetMap (ODbL), fetched through Overpass on 2026-10-03, or computed from OpenStreetMap shapes as described below.

- Government of Maharashtra / MCGM, *Greater Mumbai Disaster Management Action Plan*, vol. I (2007): the lists of major nallas in the city (15), the eastern suburbs (16) and the western suburbs (63), with lengths but no locations. https://karmayog.org/wp-content/uploads/10392/15917.pdf
- Maharashtra Pollution Control Board, *Environmental status and action plan: Navi Mumbai industrial cluster* (CEPI): names four nallas of the Trans-Thane-Creek industrial belt (Airoli, Nocil, Alok and Juinagar nallas). https://mpcb.gov.in/sites/default/files/pollution-index/industrial-clusture/Action%20Plan%20CEPI-Navimumbai.pdf
- Adluri et al., "Multi-decadal changes of Thane Creek", *Current Science* 124(3), 2023: the creek's extent, its link with the Ulhas at Kasheli. https://www.currentscience.ac.in/Volumes/124/03/0363.pdf
- Swamy and Suryanarayana (NIO), *Indian Journal of Marine Sciences* 13, 1984: tidal flow at Kasheli. Quadros and Athalye, "Thane Creek" (VPM Thane): fresh water in the creek only in the monsoon.
- Times of India, "Cidco diverts Ulwe river from Navi Mumbai intl airport" (2022), given by the owner, and Wikipedia, Navi Mumbai International Airport: the Ulwe River and its diversion into Moha Creek. https://timesofindia.indiatimes.com/city/navi-mumbai/cidco-diverts-ulwe-river-from-navi-mumbai-intl-airport/articleshow/94258072.cms
- Wikipedia: Thane Creek, Vasai Creek, Ulhas River, Eastern Express Highway. A Bombay High Court judgment on the Mulund salt-pan lands, found through a web search, names the Nanepada and Bombay Oxygen nallas there.
- HydroRIVERS v1.0 (HydroSHEDS): drainage lines, used as evidence only. No Mumbai stream was drawn from it: its 450 m grid puts lines through city blocks and down the middle of the creek.
- AWS Terrain Tiles (SRTM-based elevation), for the terrain test. Nothing from them is published.

## The rule, as adapted for Mumbai

The owner's rule is unchanged: natural streams, drains and rivers, even if polluted or lined with concrete; no canals or channels made for irrigation or water supply. An administrative boundary is not a reason to leave a stream out.

The Bengaluru test (downhill, plus HydroRIVERS or valley floor or tank chain) does not carry over as it stands. Mumbai's streams fall off the hills of Sanjay Gandhi National Park, Yeoor, Ghatkopar-Powai, Parsik, Kharghar and Malanggad and then cross a few kilometres of flat reclaimed land and mangrove to a tidal creek, where a valley-floor test means nothing and elevation data show the mangrove canopy. So:

A course is drawn if it is not tagged `waterway=canal`, is not named as a diversion, bypass, pipe, sewer, channel, aqueduct, feeder, outfall or tunnel, **runs downhill on its upland part**, and has at least one of:

1. **HydroRIVERS:** half or more of it lies within 0.5 km of a HydroRIVERS drainage line (as in Bengaluru).
2. **Valley floor:** on its upland part, at 45% or more of points the ground 250 m to either side is higher. The upland part is the stretch above 8 m and outside tidal wetland, and must be at least 0.5 km long for this to count.
3. **Tidal creek:** half or more of it runs in mangrove, salt marsh or tidal flat, or in a creek's water area that opens to the sea, and under 30% of it in salt pans.
4. **Lake on its course:** it runs through, starts at or ends at a lake of 2 ha or more that is not a man-made basin (Vihar Lake, Kakuli Lake).
5. **Mapped as a natural watercourse:** OSM tags nine tenths of it `river`, `stream` or `tidal_channel`, or maps it as a creek's water area, rather than as a `drain` or `ditch`. Added for the flat coastal plains (Vasai-Virar, Bhiwandi, Uran), where 1 and 2 cannot work, and for torrents on open hillsides.
6. **Reference:** a reference names it as a nalla and places it (used once: the Rajendra Nagar nalla, Borivali).

"Runs downhill" is judged on the upland part only: 70% or more of it at or below the lowest point reached so far (3 m tolerance). A course that climbs 12 m or more has left its valley and is started at the top of the last such climb.

Calibration, on rivers already on the map: the Dahisar, Poisar, Oshiwara, Mithi, Chena and Waldhuni score 60-97% on the valley-floor test over their upland parts and 72-100% on HydroRIVERS; the lower courses of the Vakola Nala, Mahul Creek, Irla Nala and Somaiyya Nalla lie wholly on low ground and pass on HydroRIVERS alone (66-81%). The Bhatsa Right Bank Canal scores 11-38% on the valley floor and runs level. The Mogara Nallah, drawn earlier at the owner's word, would pass on no test: it is a named nalla on reclaimed ground, which is what evidence 6 is for.

Left out besides: salt-pan channels (half or more of the course in or along salt pans), sewage-lagoon and holding-pond outfalls, port and dock channels, and, **by eye**, straight planned-city drains on reclaimed land and roadside drains with no valley and no creek. Each is listed below with its reason. The minimum length stays at 2 km (the owner is reconsidering it: the 1-2 km streams are listed in section 8 and kept).

How the network was assembled:

- OSM waterways were joined into one graph, with gaps of up to 80 m (culverts) bridged and a piece that stops within 0.5 km of the network joined at its closest point.
- Each stream is followed **upstream** from where it meets a river already on the map, the OSM coastline, or the water area of a drawn river (an estuary's bank). At a junction the longer branch carries on.
- **Water areas.** Where OSM maps a creek arm, a channel or a lake only as an area, with no waterway line, the course through it is the area's computed centre line (the cheapest path through a 12 m grid of the area in which cells near the edge cost more). Creek arms with no line at all on them are drawn this way from end to end. This is the same idea as the lower reach of Thane Creek.
- **Shore mouths.** A stream that reaches Thane Creek, Vasai Creek (the Ulhas), Manori Creek (the Dahisar) or the Vaitarna estuary ends at its mouth on the shore and is linked to the river by name; no line is drawn across the open water (`shoreKm` in `data/added-rivers.json`).

## The Trombay Creek and Thane Creek

| River | What was done | Why |
|---|---|---|
| Trombay Creek (40028) | The unnamed stream from Ghatkopar is named, and runs on round the Deonar dumping ground and Mankhurd to its southern mouth, just north of the Vashi Bridge. 8.8 km -> 9.5 km. | The owner's correction. OSM's water areas along it carry the name; its stream way 204352219 runs to the southern mouth. |
| Trombay Creek (northern mouth) (40188) | The channel that was drawn as the mouth, now a distributary: it leaves the creek east of the dumping ground and reaches Thane Creek 1.1 km north of the main mouth. 3.3 km. | OSM drain 607578488. Shown the way the map shows other distributaries ("Branched off from"). |
| Thane Creek (40189) | New, as a branch of the Ulhas from Kasheli to Mumbai Harbour between Trombay and Belapur. 26.4 km. | Upper 8.6 km: the OSM way "Thane Creek" (204365993). Lower 17.8 km: OSM has no centre line (the water is sea inside the coastline), so the course is the **computed midline** between the two OSM shorelines: the edges of the creek's water area (relation 8461125) down to 19.124 N and the coastline below. It is the first course on the map not taken directly from an OSM or HydroRIVERS line. It stops short of the Kasadi's line across the harbour. |
| Waldhuni (40033) | Head carried 5.3 km up from Ambernath to the Malanggad foothills, through Kakuli Lake. 12.4 km -> 17.6 km. | OSM names only the lower course; the network found the streams that feed the lake and the lake's outflow. Drawn as the river's own head rather than as an unnamed tributary. |

OSM's "Trombay Creek" water areas also run up the Somaiyya Nalla as far as Tilak Nagar. On the map the creek's head is the Ghatkopar stream, as the owner said, and the Somaiyya Nalla joins it.

## Drawn

**Thane Creek, west bank (Salsette) (13 streams, 65 km):**

| UID | Name | From → to | km | Evidence | Joins |
|---|---|---|---|---|---|
| 40190 | Unnamed | Bhandup West, Mumbai → Thane Creek at Bhandup East, Mumbai | 7.7 | valley floor 58% of 1.9 km upland; tidal creek 61%; 0.8 km on the centre line of water areas | Thane Creek (40189) |
| 40191 | Unnamed | Hills between Bhandup West and Powai, Mumbai → Thane Creek at Vikhroli East, Mumbai | 7.1 | valley floor 75% of 1.2 km upland | Thane Creek (40189) |
| 40192 | Unnamed | Yeoor hills near Upvan Lake, Thane → Thane Creek by the Saket bridge, Thane | 6.1 | HydroRIVERS 83%; valley floor 100% of 4.3 km upland | Thane Creek (40189) |
| 40193 | Unnamed | Yeoor foothills at Manpada, Thane → Thane Creek at Saket, Thane | 5.8 | HydroRIVERS 63%; valley floor 53% of 3.4 km upland | Thane Creek (40189) |
| 40194 | Unnamed | Mulund Check Naka, on the Thane-Mumbai boundary → Thane Creek at Mulund East, north of the Airoli Bridge, Mumbai | 5 | HydroRIVERS 90%; valley floor 82% of 1.7 km upland; tidal creek 72%; 1.4 km on the centre line of water areas | Thane Creek (40189) |
| 40195 | Nane Pada Nalla | Mulund West, Mumbai → Thane Creek at Mulund East, just south of the Airoli Bridge, Mumbai | 4.8 | HydroRIVERS 71%; valley floor 70% of 1 km upland | Thane Creek (40189) |
| 40196 | Unnamed | Hanuman Nagar, Wagle Estate, Thane → Thane Creek, just south of the Saket bridge, Thane | 4.7 | HydroRIVERS 73%; valley floor 61% of 3.6 km upland | Thane Creek (40189) |
| 40197 | Unnamed | Deonar, Mumbai → The Trombay Creek at Mankhurd, Mumbai | 4.4 | HydroRIVERS 54%; lake on its course | Trombay Creek (40028) |
| 40198 | Unnamed | Vikhroli village, Mumbai → Thane Creek at the Godrej mangroves, Vikhroli, Mumbai | 3.8 | tidal creek 75% | Thane Creek (40189) |
| 40199 | Unnamed | Kanjurmarg East, by the Eastern Express Highway, Mumbai → Thane Creek at Kanjurmarg, Mumbai | 3.6 | HydroRIVERS 69% | Thane Creek (40189) |
| 40200 | Unnamed | Mangroves east of Ghatkopar, Mumbai → Thane Creek, between Vikhroli and the Trombay Creek, Mumbai | 2.5 | HydroRIVERS 88%; tidal creek 100%; 2.5 km on the centre line of water areas | Thane Creek (40189) |
| 40201 | Unnamed | Mulund West, near the Goregaon-Mulund Link Road, Mumbai → Mangroves east of the Bhandup pumping station, Mumbai | 6 | HydroRIVERS 80% | unnamed (40190) |
| 40202 | Unnamed | Anushakti Nagar, Mumbai → Lallubhai Compound, Mankhurd, Mumbai | 3.2 | HydroRIVERS 71%; lake on its course | unnamed (40197) |

- 40194: Runs along the Thane-Mumbai municipal boundary; probably the "Boundary Nalla" of the BMC's list of major nallas, which gives no location, so the name is not used.
- 40199: Its upper 1.5 km follows the edge of the Kanjurmarg dumping ground; the lower course is a winding mangrove creek.
- 40201: Passes Nahur and the Mulund salt pans; probably the "Bombay Oxygen Nalla" of BMC records, not named here for want of a reference that places it.

**Thane Creek, east bank (Navi Mumbai) and the Panvel Creek side (7 streams, 31 km):**

| UID | Name | From → to | km | Evidence | Joins |
|---|---|---|---|---|---|
| 40203 | Unnamed | Foot of the Parsik hills at Rabale MIDC, Navi Mumbai → Thane Creek at Ghansoli, Navi Mumbai | 7.7 | HydroRIVERS 75%; valley floor 79% of 1.9 km upland; lake on its course; 1.5 km on the centre line of water areas | Thane Creek (40189) |
| 40204 | Unnamed | Parsik hills above Mahape, Navi Mumbai → Thane Creek between Kopar Khairane and Vashi, Navi Mumbai | 7.2 | HydroRIVERS 100%; valley floor 97% of 3.4 km upland; tidal creek 59% | Thane Creek (40189) |
| 40205 | Unnamed | Foot of the Kharghar hills, Navi Mumbai → The Bava Malang (Taloja River) at Kharghar, Navi Mumbai | 5.1 | HydroRIVERS 64%; valley floor 75% of 2.8 km upland; lake on its course; 1.0 km on the centre line of water areas | Bava Malang (8607) |
| 40206 | Unnamed | Parsik hills above Digha, Navi Mumbai → Thane Creek at Digha, Navi Mumbai | 3.4 | valley floor 70% of 2 km upland; lake on its course | Thane Creek (40189) |
| 40207 | Unnamed | CBD Belapur, Navi Mumbai → Mumbai Harbour at Belapur, where Thane Creek opens into it, Navi Mumbai | 2.8 | HydroRIVERS 98%; tidal creek 72%; lake on its course; 2.1 km on the centre line of water areas | the sea |
| 40208 | Unnamed | Mangroves south of Airoli, Navi Mumbai → Thane Creek, between Airoli and Ghansoli, Navi Mumbai | 2.1 | HydroRIVERS 80%; tidal creek 88%; 2.1 km on the centre line of water areas | Thane Creek (40189) |
| 40209 | Unnamed | Kharghar hills above Owe, Navi Mumbai → Kharghar, Navi Mumbai | 3.1 | HydroRIVERS 58%; valley floor 61% of 3.3 km upland | unnamed (40205) |

- 40203: Between Rabale and Ghansoli it runs along the Thane-Belapur railway, where the stream has been channelled.
- 40207: Its mouth is on the east shore of the mouth of Thane Creek, 5 km from the creek's centre line, so it is recorded as reaching the sea.

**Mira-Bhayandar, Gorai and Manori Creek (11 streams, 37 km):**

| UID | Name | From → to | km | Evidence | Joins |
|---|---|---|---|---|---|
| 40210 | Unnamed | Bhayandar, beside the Western Railway line → The Dahisar's tidal reach (Manori Creek), south-west of Mira Road | 4.9 | HydroRIVERS 65%; 0.3 km on the centre line of water areas | Dahisar (8654) |
| 40211 | Unnamed | Sanjay Gandhi National Park foothills at Kashimira, Mira-Bhayandar → Vasai Creek, west of Ghodbunder Fort, Mira-Bhayandar | 4.3 | HydroRIVERS 100% | Ulhas (8969) |
| 40212 | Unnamed | Mangroves south of Morva, near Uttan → The Dahisar's tidal reach (Manori Creek) near Gorai, Mumbai | 3.9 | HydroRIVERS 78%; tidal creek 99%; 2.0 km on the centre line of water areas | Dahisar (8654) |
| 40213 | Unnamed | Morva village, near Uttan, Mira-Bhayandar → The mouth of Vasai Creek at Rai, west of Bhayandar | 3.5 | HydroRIVERS 80% | the sea |
| 40214 | Unnamed | Morva village, near Uttan, Mira-Bhayandar → The Dahisar's tidal reach (Manori Creek), south of Bhayandar | 3.4 | tidal creek 77%; 0.4 km on the centre line of water areas | Dahisar (8654) |
| 40215 | Unnamed | Dahisar Check Naka, on the Mumbai-Mira Road boundary → The Dahisar's tidal reach (Manori Creek), south-west of Mira Road | 3.2 | HydroRIVERS 95%; tidal creek 98%; 0.9 km on the centre line of water areas | Dahisar (8654) |
| 40216 | Unnamed | Murdha village, Bhayandar West → Vasai Creek at Bhayandar West | 3 | tidal creek 77% | Ulhas (8969) |
| 40217 | Unnamed | Gorai, Mumbai → The Dahisar's tidal reach (Manori Creek) between Gorai and Manori, Mumbai | 2.7 | HydroRIVERS 82%; tidal creek 100%; 2.2 km on the centre line of water areas | Dahisar (8654) |
| 40218 | Unnamed | Mangroves east of Uttan, Mira-Bhayandar → Mangroves north-east of Gorai, Mumbai | 3.2 | tidal creek 100%; 1.6 km on the centre line of water areas | unnamed (40212) |
| 40219 | Unnamed | Murdha village, Bhayandar West → Mangroves north of Manori Creek, south of Bhayandar | 2.5 | HydroRIVERS 63%; tidal creek 98% | unnamed (40214) |
| 40220 | Unnamed | Mangroves north of Gorai, Mumbai → Mangroves north-east of Gorai, Mumbai | 2.2 | tidal creek 100%; 1.1 km on the centre line of water areas | unnamed (40212) |

- 40213: The northern arm of the tidal channel past Morva.
- 40214: OSM maps one continuous tidal channel past Morva between the mouth of Vasai Creek and Manori Creek, which cuts Uttan and Gorai off from Salsette; it is drawn as two arms that part at Morva, this one running south-east.
- 40216: OSM maps one continuous tidal channel through Murdha between Vasai Creek and Manori Creek; it is drawn as two arms that part at its middle, this one running north.
- 40219: The southern arm of the tidal channel through Murdha between Vasai Creek and Manori Creek.

### The rest of the region

**Mumbai: the western suburbs, the Mithi and the harbour side (16 streams, 59 km):**

| UID | Name | From → to | km | Evidence | Joins |
|---|---|---|---|---|---|
| 40243 | Unnamed | Rajendra Nagar, Borivali East, Mumbai → The Dahisar's tidal reach (Manori Creek) at Gorai, Mumbai | 6.1 | reference | Dahisar (8654) |
| 40246 | Unnamed | Malad East, below the Sanjay Gandhi National Park hills, Mumbai → The Poisar's tidal reach (Malad Creek) at Malad West, Mumbai | 5.9 | HydroRIVERS 79%; valley floor 79% of 4.8 km upland | Poisar (9009) |
| 40250 | Unnamed | Sanjay Gandhi National Park hills, north of Vihar Lake, Mumbai → The Mithi at the Vihar Lake dam, Mumbai | 5.4 | lake on its course; OSM river/stream | Mithi (8809) |
| 40256 | Unnamed | Aarey Colony hills, Goregaon, Mumbai → The Oshiwara at Goregaon East, Mumbai | 5.1 | HydroRIVERS 73%; valley floor 63% of 5.2 km upland; OSM river/stream | Oshiwara (40025) |
| 40258 | Unnamed | Jogeshwari East, near the Jogeshwari-Vikhroli Link Road, Mumbai → The Oshiwara at Goregaon West, Mumbai | 4.8 | HydroRIVERS 86%; valley floor 81% of 4.2 km upland | Oshiwara (40025) |
| 40269 | Unnamed | Sanjay Gandhi National Park hills, Mumbai → The Dahisar in the national park, above Borivali, Mumbai | 4 | HydroRIVERS 78%; valley floor 95% of 4.1 km upland; OSM river/stream | Dahisar (8654) |
| 40270 | Unnamed | Chandivali, Powai, Mumbai → The Mithi at Jarimari, near Saki Naka, Mumbai | 3.9 | HydroRIVERS 79%; valley floor 45% of 4 km upland; lake on its course | Mithi (8809) |
| 40278 | Unnamed | Dindoshi, Goregaon East, Mumbai → The Poisar's tidal reach (Malad Creek) at Goregaon West, Mumbai | 3.1 | HydroRIVERS 100%; valley floor 53% of 1.5 km upland; OSM river/stream | Poisar (9009) |
| 40292 | Unnamed | Kondivita, Andheri East, Mumbai → The Mithi at Marol, Mumbai | 2.7 | HydroRIVERS 90%; valley floor 68% of 2.8 km upland | Mithi (8809) |
| 40293 | Unnamed | Vashi Naka, below the Trombay hills, Mumbai → Mumbai Harbour at Mahul, Mumbai | 2.7 | HydroRIVERS 81%; tidal creek 64% | the sea |
| 40295 | Unnamed | Anik, Chembur, Mumbai → The Mahul Creek at Wadala, Mumbai | 2.6 | HydroRIVERS 55%; lake on its course | Mahul Creek (40027) |
| 40296 | Unnamed | Santacruz West, Mumbai → The Irla Nala at Vile Parle West, Mumbai | 2.6 | HydroRIVERS 77% | Irla Nala (40034) |
| 40297 | Unnamed | Kurla East, Mumbai → The Mahul Creek at Kurla East, Mumbai | 2.5 | HydroRIVERS 68% | Mahul Creek (40027) |
| 40311 | Unnamed | Santacruz West, Mumbai → The Arabian Sea at Khar Danda, Mumbai | 2 | tidal creek 71% | the sea |
| 40329 | Unnamed | Hills east of Vihar Lake, towards Bhandup, Mumbai → Vihar Lake, Mumbai | 2.2 | lake on its course; OSM river/stream; 1.2 km on the centre line of water areas | unnamed (40250) |
| 40334 | Unnamed | Sanjay Gandhi National Park hills above Mulund, Mumbai → The north-eastern arm of Vihar Lake, Mumbai | 3.2 | HydroRIVERS 69%; valley floor 73% of 3.3 km upland; OSM river/stream | unnamed (40250) |

- 40250: The line crosses Vihar Lake, which the stream feeds.
- 40258: OSM names part of it "Oshiwara River" as well: the river's southern branch.
- 40278: Probably the Walbhat, which the BMC lists as a river; OSM leaves it unnamed, so no name is given.
- 40334: Joins the stream that feeds Vihar Lake from the north. On the earlier passes its mapped course ran on over the ridge towards Mulund and failed the downhill check; it now starts at the ridge.

**Thane, Ghodbunder Road and Bhiwandi (to the Ulhas) (10 streams, 39 km):**

| UID | Name | From → to | km | Evidence | Joins |
|---|---|---|---|---|---|
| 40237 | Unnamed | Val, south-west of Bhiwandi → The Ulhas at Kasheli, opposite Kolshet, Thane | 7.9 | HydroRIVERS 84%; OSM river/stream | Ulhas (8969) |
| 40244 | Unnamed | Yeoor foothills above Ghodbunder Road, Thane → The Ulhas at Waghbil, Thane | 5.9 | HydroRIVERS 98%; valley floor 86% of 2.9 km upland | Ulhas (8969) |
| 40264 | Unnamed | Yeoor hills, Sanjay Gandhi National Park, Thane → The Chena in the Yeoor hills, Thane | 4.4 | HydroRIVERS 80%; valley floor 93% of 4.5 km upland; OSM river/stream | Chena (40032) |
| 40268 | Unnamed | Dive Anjur, across the Ulhas from Thane → The Ulhas at Alimgarh, opposite Mumbra | 4.1 | HydroRIVERS 89%; OSM river/stream | Ulhas (8969) |
| 40286 | Unnamed | Mogharpada, Ghodbunder Road, Thane → The Ulhas near Gaimukh, Thane | 2.9 | OSM river/stream | Ulhas (8969) |
| 40290 | Unnamed | Narpoli, Bhiwandi → The Kamvadi at Bhiwandi | 2.7 | HydroRIVERS 100%; valley floor 77% of 1.3 km upland | Kamvadi (8749) |
| 40294 | Unnamed | Manpada, Thane → The Ulhas at Kolshet, Thane | 2.6 | valley floor 100% of 1.3 km upland; OSM river/stream | Ulhas (8969) |
| 40300 | Unnamed | Near Kasarvadavali, Thane → The Kamvadi near Kasarvadavali, Thane | 2.4 | HydroRIVERS 73%; tidal creek 66%; OSM river/stream; 2.5 km on the centre line of water areas | Kamvadi (8749) |
| 40304 | Unnamed | Mangroves at Gaimukh, Thane → The Ulhas at Gaimukh, Thane | 2.3 | HydroRIVERS 57%; tidal creek 98%; OSM river/stream | Ulhas (8969) |
| 40321 | Unnamed | Mankoli, south of Bhiwandi → Dive Anjur, south-west of Bhiwandi | 3.5 | OSM river/stream | unnamed (40237) |

**Vasai-Virar, Kaman and the Tansa side (15 streams, 88 km):**

| UID | Name | From → to | km | Evidence | Joins |
|---|---|---|---|---|---|
| 40221 | Unnamed | Tungareshwar hills, near Vasai → The Ulhas (Vasai Creek) near Naigaon | 20.2 | HydroRIVERS 91%; valley floor 92% of 9.1 km upland; OSM river/stream | Ulhas (8969) |
| 40234 | Unnamed | Near Ganeshpuri, Maharashtra → The Tansa near Ganeshpuri, Maharashtra | 8.3 | HydroRIVERS 100%; valley floor 82% of 3.8 km upland; OSM river/stream | Tansa (8917) |
| 40238 | Unnamed | Shirsad, east of Virar → The Tungar Nala at Waliv, Vasai East | 7.9 | HydroRIVERS 100%; valley floor 60% of 8 km upland; lake on its course; OSM river/stream | Tungar Nala (8928) |
| 40245 | Unnamed | Agashi, near Virar → The Vaitarna estuary north of Agashi | 5.9 | OSM river/stream | Vaitarna (8965) |
| 40249 | Unnamed | Agashi, near Virar → The Arabian Sea at Bhuigaon, north of Vasai | 5.4 | HydroRIVERS 100%; OSM river/stream | the sea |
| 40252 | Unnamed | Vajreshwari, Maharashtra → The Tansa at Ganeshpuri, Maharashtra | 5.2 | HydroRIVERS 100%; valley floor 84% of 4.9 km upland; lake on its course; OSM river/stream | Tansa (8917) |
| 40272 | Unnamed | Bhuigaon, north of Vasai → The Arabian Sea north of Vasai Fort | 3.7 | HydroRIVERS 65%; tidal creek 76%; OSM river/stream | the sea |
| 40273 | Unnamed | Nalasopara, Vasai-Virar → The Tungar Nala at Vasai Road | 3.7 | OSM river/stream | Tungar Nala (8928) |
| 40275 | Unnamed | Kharbav, west of Bhiwandi → The Varna near Kharbav, west of Bhiwandi | 3.3 | HydroRIVERS 97%; valley floor 100% of 3.4 km upland; OSM river/stream | Varna (9061) |
| 40277 | Unnamed | Virar, Maharashtra → The Vaitarna near Virar, Maharashtra | 3.2 | lake on its course; 2.2 km on the centre line of water areas | Vaitarna (8965) |
| 40281 | Unnamed | Vaitarna station, north of Virar → The Vaitarna at Vaitarna station, Maharashtra | 3 | OSM river/stream | Vaitarna (8965) |
| 40282 | Unnamed | Vaitarna station, north of Virar → The Vaitarna at Vaitarna station, Maharashtra | 3 | HydroRIVERS 88%; OSM river/stream | Vaitarna (8965) |
| 40289 | Unnamed | Near Vajreshwari, Maharashtra → The Tansa near Vajreshwari, Maharashtra | 2.8 | HydroRIVERS 100%; valley floor 72% of 2.9 km upland; OSM river/stream | Tansa (8917) |
| 40299 | Unnamed | Near Vaitarna station, Maharashtra → The Vaitarna at Vaitarna station, Maharashtra | 2.4 | HydroRIVERS 76%; lake on its course; OSM river/stream; 2.4 km on the centre line of water areas | Vaitarna (8965) |
| 40312 | Unnamed | Tungareshwar hills, near Vasai → Kaman, near Vasai | 10.4 | HydroRIVERS 89%; valley floor 84% of 9.1 km upland; OSM river/stream | unnamed (40221) |

- 40221: The river through Kaman; unnamed in OSM.

**Kalyan-Dombivli, Ulhasnagar, Ambernath and Badlapur (19 streams, 90 km):**

| UID | Name | From → to | km | Evidence | Joins |
|---|---|---|---|---|---|
| 40227 | Unnamed | Malanggad hills, near Badlapur → The Ulhas at Badlapur, Maharashtra | 11.3 | HydroRIVERS 87%; valley floor 83% of 11.5 km upland; lake on its course; OSM river/stream | Ulhas (8969) |
| 40230 | Unnamed | Near Vangani, Maharashtra → The Ulhas near Badlapur, Maharashtra | 8.9 | HydroRIVERS 100%; valley floor 91% of 9.1 km upland; OSM river/stream | Ulhas (8969) |
| 40235 | Unnamed | Malanggad hills, near Badlapur → The Ulhas at Badlapur, Maharashtra | 8.2 | HydroRIVERS 79%; valley floor 81% of 8.4 km upland; OSM river/stream | Ulhas (8969) |
| 40239 | Unnamed | Near Padgha, Maharashtra → The Bhatsai at Titwala, Maharashtra | 7 | HydroRIVERS 100%; valley floor 92% of 4.8 km upland; OSM river/stream | Bhatsai (8620) |
| 40253 | Unnamed | Malanggad hills, south of Ambernath → The Desai Khadi (north branch), south of Ambernath | 5.2 | HydroRIVERS 79%; valley floor 91% of 5.4 km upland; OSM river/stream | Desai Khadi (north branch) (40029) |
| 40255 | Unnamed | Fields south-east of Bhiwandi → The Ulhas opposite Kalyan | 5.1 | HydroRIVERS 79%; valley floor 88% of 2.5 km upland; OSM river/stream | Ulhas (8969) |
| 40257 | Unnamed | Dombivli East → The Ulhas at Kopar, Dombivli West | 4.8 | HydroRIVERS 100%; valley floor 80% of 0.5 km upland; lake on its course; OSM river/stream | Ulhas (8969) |
| 40259 | Unnamed | Ambernath → The Waldhuni at Ulhasnagar | 4.8 | HydroRIVERS 100%; valley floor 82% of 4.9 km upland; 0.9 km on the centre line of water areas | Waldhuni (40033) |
| 40261 | Unnamed | Kalyan East → The Waldhuni at Vitthalwadi, Ulhasnagar | 4.6 | HydroRIVERS 88%; valley floor 58% of 4.5 km upland; OSM river/stream; 0.2 km on the centre line of water areas | Waldhuni (40033) |
| 40271 | Unnamed | Ambernath MIDC → The Waldhuni at Ulhasnagar | 3.7 | HydroRIVERS 98%; valley floor 100% of 3.9 km upland | Waldhuni (40033) |
| 40280 | Unnamed | Shil, near Mumbra, Thane → The Desai Khadi near Diva, Thane | 3 | HydroRIVERS 100%; tidal creek 68%; 0.4 km on the centre line of water areas | Desai Khadi (40031) |
| 40283 | Unnamed | MIDC area, Dombivli East → The Ulhas at Thakurli, between Dombivli and Kalyan | 2.9 | valley floor 93% of 1.4 km upland | Ulhas (8969) |
| 40285 | Unnamed | Shil Phata, Thane → The Desai Khadi at Nilaje, south of Dombivli | 2.9 | HydroRIVERS 100%; OSM river/stream | Desai Khadi (40031) |
| 40298 | Unnamed | Padle, near Diva, Thane → The Desai Khadi near Diva, Thane | 2.4 | HydroRIVERS 68%; tidal creek 86%; OSM river/stream; 1.9 km on the centre line of water areas | Desai Khadi (40031) |
| 40301 | Unnamed | Vitthalwadi, Ulhasnagar → The Waldhuni at Shahad, Kalyan | 2.4 | HydroRIVERS 50%; valley floor 83% of 1.8 km upland | Waldhuni (40033) |
| 40306 | Unnamed | Malanggad hills, near Taloja → The Bava Malang near Taloja, Maharashtra | 2.2 | OSM river/stream | Bava Malang (8607) |
| 40316 | Unnamed | Malanggad hills, near Badlapur → Near Badlapur, Maharashtra | 5.7 | HydroRIVERS 69%; valley floor 60% of 5.8 km upland; OSM river/stream | unnamed (40230) |
| 40328 | Unnamed | Near Shil Phata, Thane → Nilaje, south of Dombivli | 2.2 | HydroRIVERS 100%; OSM river/stream | unnamed (40285) |
| 40333 | Unnamed | Malanggad hills, near Badlapur → Near Badlapur, Maharashtra | 2.5 | valley floor 100% of 2.7 km upland; OSM river/stream | unnamed (40316) |

**Panvel, Taloja and Uran (26 streams, 155 km):**

| UID | Name | From → to | km | Evidence | Joins |
|---|---|---|---|---|---|
| 40222 | Unnamed | Hills above the Ransai reservoir, east of Uran → Karanja Creek, south-east of Uran | 15.9 | HydroRIVERS 79%; valley floor 74% of 4.3 km upland; tidal creek 56%; lake on its course; OSM river/stream | the sea |
| 40224 | Ulwe | Hills south of Panvel, Maharashtra → Moha Creek, south of Targhar station, Navi Mumbai | 13.2 | HydroRIVERS 91%; valley floor 53% of 5.7 km upland; OSM river/stream | the sea |
| 40225 | Unnamed | Prabalgad foothills, east of Panvel → The Panel (Panvel Creek's river) at Panvel | 13.2 | HydroRIVERS 80%; lake on its course; OSM river/stream | Panel (8846) |
| 40226 | Unnamed | Prabalgad hills, near Matheran → The Patalganga at Rasayani, Maharashtra | 12.4 | HydroRIVERS 84%; valley floor 71% of 12.6 km upland; OSM river/stream | Patalganga (8856) |
| 40229 | Nhava Creek | Jasai, near Uran → Mumbai Harbour at Nhava, near Uran | 9.3 | tidal creek 99%; 7.4 km on the centre line of water areas | the sea |
| 40240 | Unnamed | Apta, Maharashtra → The Patalganga near Apta, Maharashtra | 6.9 | HydroRIVERS 100%; valley floor 79% of 2.8 km upland; OSM river/stream | Patalganga (8856) |
| 40241 | Unnamed | Near Chowk, Maharashtra → The Patalganga at Rasayani, Maharashtra | 6.7 | HydroRIVERS 100%; valley floor 68% of 6.9 km upland; OSM river/stream | Patalganga (8856) |
| 40248 | Unnamed | Fields south-east of Uran → The Patalganga estuary, south-east of Uran | 5.4 | HydroRIVERS 100%; OSM river/stream | Patalganga (8856) |
| 40260 | Unnamed | Near Matheran, Maharashtra → The Gadhe near New Panvel, Maharashtra | 4.7 | HydroRIVERS 80%; valley floor 81% of 4.8 km upland; lake on its course; OSM river/stream; 0.2 km on the centre line of water areas | Gadhe (9064) |
| 40263 | Unnamed | Fields east of Uran → Karanja Creek, south-east of Uran | 4.4 | HydroRIVERS 50%; tidal creek 99%; OSM river/stream; 4.4 km on the centre line of water areas | the sea |
| 40266 | Unnamed | Near New Panvel, Maharashtra → The Gadhe near New Panvel, Maharashtra | 4.3 | HydroRIVERS 100%; valley floor 84% of 4.5 km upland; OSM river/stream | Gadhe (9064) |
| 40274 | Unnamed | Malanggad hills, near Badlapur → The Kasadi near Taloja, Maharashtra | 3.4 | HydroRIVERS 51%; valley floor 83% of 3.6 km upland; OSM river/stream | Kasadi (8764) |
| 40276 | Unnamed | Uran → Karanja Creek at Karanja, near Uran | 3.2 | HydroRIVERS 54%; tidal creek 80% | the sea |
| 40291 | Unnamed | Fields south-east of Uran → The Patalganga estuary, south-east of Uran | 2.7 | HydroRIVERS 77%; OSM river/stream | Patalganga (8856) |
| 40302 | Unnamed | Karanja, near Uran → Karanja Creek at Karanja, near Uran | 2.4 | tidal creek 59% | the sea |
| 40303 | Unnamed | Uran → Mumbai Harbour north of Uran | 2.3 | HydroRIVERS 82%; tidal creek 64%; OSM river/stream; 1.4 km on the centre line of water areas | the sea |
| 40308 | Unnamed | Near Rasayani, Maharashtra → The Patalganga near Apta, Maharashtra | 2.1 | HydroRIVERS 100%; valley floor 92% of 1.3 km upland | Patalganga (8856) |
| 40313 | Unnamed | Kalambusare, east of Uran → Mangroves south-east of Uran | 8.6 | HydroRIVERS 85%; tidal creek 73%; lake on its course; OSM river/stream | unnamed (40222) |
| 40314 | Unnamed | Near Panvel, Maharashtra → Panvel, Maharashtra | 6.2 | HydroRIVERS 89%; valley floor 62% of 4.5 km upland; OSM river/stream | unnamed (40225) |
| 40315 | Unnamed | Near New Panvel, Maharashtra → Panvel, Maharashtra | 5.8 | HydroRIVERS 100%; OSM river/stream | unnamed (40225) |
| 40318 | Unnamed | Jasai, near Uran → Dighode, east of Uran | 5.2 | HydroRIVERS 57%; lake on its course | unnamed (40222) |
| 40320 | Unnamed | Near New Panvel, Maharashtra → Near New Panvel, Maharashtra | 3.6 | HydroRIVERS 64%; valley floor 92% of 3.7 km upland; OSM river/stream | unnamed (40225) |
| 40326 | Unnamed | Near Rasayani, Maharashtra → Near New Panvel, Maharashtra | 2.7 | HydroRIVERS 63%; valley floor 72% of 2.9 km upland; lake on its course; OSM river/stream | unnamed (40225) |
| 40330 | Unnamed | Near Rasayani, Maharashtra → Rasayani, Maharashtra | 2.1 | valley floor 70% of 2.3 km upland; OSM river/stream | unnamed (40226) |
| 40331 | Unnamed | Near Rasayani, Maharashtra → Panvel, Maharashtra | 5 | HydroRIVERS 99%; OSM river/stream | unnamed (40314) |
| 40332 | Unnamed | Koproli, east of Uran → Kalambusare, east of Uran | 2.8 | HydroRIVERS 69%; OSM river/stream | unnamed (40313) |

- 40222: Runs through the Ransai reservoir.
- 40224: The Ulwe River (Times of India, 2022; Wikipedia, Navi Mumbai International Airport). It used to run north across what is now the airport to the Panvel Creek side; CIDCO cut a channel about 3 km long along the airport's southern edge and turned it west into Moha Creek. The channel is man-made, but it is the river's present course, so it is drawn (OSM way 804146263), as the Mithi is at Mumbai's airport.
- 40229: OSM names the creek's water area "Nhava Creek".

**The north-east: Padgha, Vasind and Shahapur (7 streams, 43 km):**

| UID | Name | From → to | km | Evidence | Joins |
|---|---|---|---|---|---|
| 40228 | Unnamed | Near Padgha, Maharashtra → The Bhatsai near Padgha, Maharashtra | 10.7 | HydroRIVERS 92%; valley floor 80% of 10.7 km upland; OSM river/stream | Bhatsai (8620) |
| 40231 | Unnamed | Near Vasind, Maharashtra → The Kumbheri at Padgha, Maharashtra | 8.7 | HydroRIVERS 100%; valley floor 74% of 8.8 km upland; OSM river/stream | Kumbheri (8792) |
| 40242 | Unnamed | Mahuli hills, near Atgaon → The Bharangi at Shahapur, Maharashtra | 6.5 | HydroRIVERS 55%; valley floor 94% of 6.6 km upland; OSM river/stream | Bharangi (8619) |
| 40247 | Unnamed | Near Titwala, Maharashtra → The Kalu near Vasind, Maharashtra | 5.5 | HydroRIVERS 99%; valley floor 100% of 5.7 km upland; OSM river/stream | Kalu (8966) |
| 40265 | Unnamed | Vasind, Maharashtra → The Bhatsai at Vasind, Maharashtra | 4.3 | HydroRIVERS 92%; valley floor 91% of 4.5 km upland; lake on its course; OSM river/stream | Bhatsai (8620) |
| 40267 | Unnamed | Near Vasind, Maharashtra → The Kumbheri near Vasind, Maharashtra | 4.1 | HydroRIVERS 100%; valley floor 88% of 4.3 km upland; OSM river/stream | Kumbheri (8792) |
| 40287 | Unnamed | Near Vasind, Maharashtra → The Bhatsai at Vasind, Maharashtra | 2.9 | HydroRIVERS 100%; valley floor 90% of 3 km upland; OSM river/stream | Bhatsai (8620) |

**The east and south-east: Vangani, Neral, Matheran, Karjat, Khalapur and Rasayani (20 streams, 94 km):**

| UID | Name | From → to | km | Evidence | Joins |
|---|---|---|---|---|---|
| 40223 | Unnamed | Matheran hills, near Karjat → The Dhavri at Chowk, Maharashtra | 13.3 | valley floor 91% of 13.5 km upland; lake on its course; OSM river/stream | Dhavri (8995) |
| 40232 | Unnamed | Matheran hills, near Neral → The Ulhas at Vangani, Maharashtra | 8.5 | HydroRIVERS 98%; valley floor 100% of 8.7 km upland; OSM river/stream | Ulhas (8969) |
| 40233 | Unnamed | Matheran hills, Maharashtra → The Dhavri near Matheran, Maharashtra | 8.5 | HydroRIVERS 75%; valley floor 99% of 8.6 km upland; OSM river/stream | Dhavri (8995) |
| 40236 | Unnamed | Matheran hills, Maharashtra → The Ulhas near Neral, Maharashtra | 8 | HydroRIVERS 76%; valley floor 78% of 8.1 km upland; OSM river/stream | Ulhas (8969) |
| 40251 | Unnamed | Matheran hills, near Neral → The Ulhas at Neral, Maharashtra | 5.4 | HydroRIVERS 92%; valley floor 80% of 5.5 km upland; lake on its course; OSM river/stream | Ulhas (8969) |
| 40254 | Unnamed | Near Vangani, Maharashtra → The Ulhas at Vangani, Maharashtra | 5.2 | HydroRIVERS 79%; valley floor 92% of 5.3 km upland; OSM river/stream | Ulhas (8969) |
| 40262 | Unnamed | Matheran hills, near Karjat → The Ulhas at Karjat, Maharashtra | 4.5 | HydroRIVERS 89%; valley floor 72% of 4.6 km upland; OSM river/stream | Ulhas (8969) |
| 40279 | Unnamed | Matheran hills, Maharashtra → The Gadhe near Matheran, Maharashtra | 3.1 | HydroRIVERS 70%; valley floor 66% of 3.2 km upland; OSM river/stream | Gadhe (9064) |
| 40284 | Unnamed | Near Vangani, Maharashtra → The Barvi near Badlapur, Maharashtra | 2.9 | HydroRIVERS 91%; valley floor 93% of 3 km upland; OSM river/stream | Barvi (8606) |
| 40288 | Unnamed | Matheran hills, Maharashtra → The Dhavri at Matheran, Maharashtra | 2.8 | valley floor 77% of 3 km upland; lake on its course; OSM river/stream | Dhavri (8995) |
| 40309 | Unnamed | Neral, Maharashtra → The Ulhas at Neral, Maharashtra | 2.1 | HydroRIVERS 100%; valley floor 86% of 2.2 km upland; lake on its course; OSM river/stream; 2.1 km on the centre line of water areas | Ulhas (8969) |
| 40310 | Unnamed | Neral, Maharashtra → The Ulhas at Neral, Maharashtra | 2.1 | HydroRIVERS 88%; valley floor 64% of 2.2 km upland; OSM river/stream | Ulhas (8969) |
| 40317 | Unnamed | Near Khalapur, Maharashtra → Chowk, Maharashtra | 5.4 | HydroRIVERS 100%; valley floor 98% of 5.5 km upland; OSM river/stream | unnamed (40223) |
| 40319 | Unnamed | Matheran hills, near Neral → Neral, Maharashtra | 3.8 | HydroRIVERS 95%; valley floor 54% of 3.9 km upland; lake on its course; OSM river/stream | unnamed (40251) |
| 40322 | Unnamed | Near Karjat, Maharashtra → Near Karjat, Maharashtra | 3.4 | HydroRIVERS 100%; valley floor 97% of 3.5 km upland; lake on its course; OSM river/stream | unnamed (40223) |
| 40323 | Unnamed | Prabalgad hills, near Matheran → Near Rasayani, Maharashtra | 3.3 | HydroRIVERS 52%; valley floor 76% of 3.4 km upland; OSM river/stream | unnamed (40226) |
| 40324 | Unnamed | Matheran hills, near Neral → Neral, Maharashtra | 3 | HydroRIVERS 79%; valley floor 100% of 3.1 km upland; lake on its course; OSM river/stream | unnamed (40251) |
| 40325 | Unnamed | Near Vangani, Maharashtra → Vangani, Maharashtra | 2.8 | HydroRIVERS 91%; valley floor 87% of 3 km upland; OSM river/stream | unnamed (40254) |
| 40327 | Unnamed | Matheran hills, Maharashtra → Matheran, Maharashtra | 2.4 | valley floor 92% of 2.5 km upland; OSM river/stream | unnamed (40233) |
| 40335 | Unnamed | Matheran hills, near Neral → Near Neral, Maharashtra | 3 | valley floor 77% of 3.1 km upland; OSM river/stream | unnamed (40319) |

- 40233: OSM names this stream "Dhavari River"; the map's Dhavri is CWC's line, to the west, so no name is given here.

Names: "Nane Pada Nalla" (Mulund) and "Nhava Creek" (Uran) are OSM's; "Ulwe" is the owner's, from a Times of India report of the river's diversion at the Navi Mumbai airport. Every other stream is unnamed, because no reference both names a nalla and says where it runs.

## Not drawn

### 1. Man-made channels

| Channel | km | Near | Reason |
|---|---|---|---|
| Bhatsa Right Bank Canal (3 OSM ways) | 36.3 | Shahapur | Tagged `waterway=canal` in OSM. |
| (unnamed) near Ulwe (9 OSM ways) | 12.6 | Ulwe | Tagged `waterway=canal` in OSM. |
| (unnamed) near Vaitarna station (6 OSM ways) | 8.6 | Vaitarna station | Tagged `waterway=canal` in OSM. |
| (unnamed) near Juinagar (10 OSM ways) | 6.3 | Juinagar | Tagged `waterway=canal` in OSM. |
| (unnamed) near Kharghar (14 OSM ways) | 4.9 | Kharghar | Tagged `waterway=canal` in OSM. |
| (unnamed) near Vashi (12 OSM ways) | 1.8 | Vashi | Tagged `waterway=canal` in OSM. |
| (unnamed) near Panvel | 1.5 | Panvel | Tagged `waterway=canal` in OSM. |
| (unnamed) near Agashi (4 OSM ways) | 1.4 | Agashi | Tagged `waterway=canal` in OSM. |
| Central Nullah | 1.2 | Belapur | Tagged `waterway=canal` in OSM. |
| (unnamed) (OSM area w1390772773) | 2.1 | Belapur | Water area tagged as a canal in OSM. |

OSM canal ways under 1 km in total are not listed (11 of them, 4.9 km).

### 2. Left out by eye

These pass the test on paper (mostly on HydroRIVERS, which is a weak test on flat reclaimed land) but look man-made on the map. **They are judgement calls; say if any should be drawn.**

| Stream | km | Would join | Reason |
|---|---|---|---|
| Unnamed, Near Jasai → Uran (18.897 N, 72.987 E) | 6.5 | the sea | A channel cut in straight lines beside the JNPT port railway and road: a port channel (by eye), though OSM tags it as a tidal channel. |
| Unnamed, Near Jasai → Jasai (18.902 N, 72.985 E) | 5.2 | Nhava Creek (40229) | Drains of the JNPT port estate, in straight lines and right angles around the port township: port channels, not a stream (by eye). |
| Unnamed, Kalamboli → Kalamboli (19.022 N, 73.116 E) | 4.4 | Panel (8846) | Runs in straight lines and right angles along Kalamboli's sector roads: a planned-city drain, no valley and no creek (by eye). |
| Unnamed, Dadar, Mumbai → Bandra (19.019 N, 72.844 E) | 4.0 | Mithi (8809) | A dead-straight drain beside the Western Railway line from Dadar to Mahim: no valley and no creek (by eye). |
| Unnamed, Karanja, near Uran → Karanja (18.861 N, 72.979 E) | 4.0 | unnamed (40222) | Runs round the edge of a reclaimed block south of Uran in straight lines: a boundary channel (by eye), though OSM tags it as a tidal channel. |
| Unnamed, Kharghar, Navi Mumbai → Taloja (19.073 N, 73.070 E) | 3.7 | Bava Malang (8607) | Follows the Taloja Jail Road and a sector road in a straight line along the edge of Kharghar: a planned-city channel (by eye). |
| Unnamed, Turbhe, Navi Mumbai → Vashi (19.074 N, 73.012 E) | 3.1 | unnamed (40204) | A straight drain along a sector road in Vashi, on reclaimed land: a planned-city storm drain to the holding pond, with no valley and no creek (by eye). |
| Unnamed, Vikhroli, Mumbai → Ghatkopar (19.093 N, 72.933 E) | 2.4 | Trombay Creek (40028) | A straight cut across the mangroves north of the Deonar dumping ground, beside the Ghatkopar sewage lagoons: no valley and no creek arm (by eye). |
| Unnamed, Vashi, Navi Mumbai → Sanpada (19.071 N, 73.003 E) | 2.3 | Thane Creek (40189) | A straight channel between Vashi and Sanpada, on reclaimed land: a planned-city storm channel with no stream mapped above it (by eye). |

OSM ways taken out of the network by hand, for the same kind of reason:

- Outfall drain of the Bhandup sewage lagoons: a man-made channel between the lagoons (OSM way 431485399).
- Roadside drain along Road Number 1 and Ganesh Mandir Marg, Vikhroli: follows the roads away from the creek, no valley (OSM ways 436606794, 436606799, 1516246994, 1516246995, 235940608).
- Roadside drain along Ghodbunder Road, Kashimira: a straight line beside the road that stops short of the creek (OSM way 987784387).
- Head cut: Vikhroli: the OSM drain above this point doubles back on itself across the highway (19.1015 N, 72.9327 E).
- Head cut: Kharghar hills: above this point OSM draws the descent in straight lines and right angles (19.0513 N, 73.0524 E).

### 3. Fail the natural test

| Stream | km | Would join | Reason |
|---|---|---|---|
| Unnamed, Padgha → Padgha (19.385 N, 73.170 E) | 4.6 | unnamed (40228) | HydroRIVERS 17%, valley floor 25% over 4.8 km of upland, tidal 0%, no lake, mapped in OSM as a drain: most likely a roadside or layout drain. |
| Unnamed, Mahalaxmi, Mumbai → Worli (18.983 N, 72.821 E) | 2.3 | the sea | HydroRIVERS 41%, valley floor 0% over 0 km of upland, tidal 45%, no lake, mapped in OSM as a drain: most likely a roadside or layout drain. |
| Unnamed, Kalwa, Thane → Digha (19.190 N, 72.995 E) | 2.2 | Thane Creek (40189) | HydroRIVERS 34%, valley floor 0% over 0 km of upland, tidal 15%, no lake, mapped in OSM as a drain: most likely a roadside or layout drain. |
| Unnamed, Panvel → Panvel (19.002 N, 73.109 E) | 2.0 | Panel (8846) | HydroRIVERS 5%, valley floor 0% over 0 km of upland, tidal 0%, no lake, mapped in OSM as a drain: most likely a roadside or layout drain. |

### 4. Do not run downhill, or join a stream that is not drawn

| Stream | km | Would join | Reason |
|---|---|---|---|
| Unnamed, Ulwe, Navi Mumbai → Ulwe (18.990 N, 73.046 E) | 2.2 | Ulwe (40224) | Does not run downhill (6 m to 1 m, downhill for 0% of its upland part). |

### 5. Pass the test but cannot be joined to the map

| Stream | km | Reason |
|---|---|---|
| Unnamed, north of Taloja MIDC (19.099 N, 73.139 E) | 2.9 | joins the Taloja River north of Taloja MIDC, where the map's line for that river (CWC's "Bava Malang") lies 1.8 km from the river's real course: it could only be joined by a 1.8 km straight stub. |
| Unnamed, Near Khalapur (18.741 N, 73.259 E) | 4.7 | Mostly outside the area the data covers. |
| Unnamed, Near Atgaon (19.585 N, 73.380 E) | 2.9 | Mostly outside the area the data covers. |
| Unnamed, Aarey Colony, Goregaon, Mumbai (19.141 N, 72.894 E) | 2.2 | Starts within 150 m of the Mithi just below the Vihar Lake dam and runs beside it to Marol: the pipeline's confluence check cuts it at its first point. |
| Unnamed, Hills near Vangani (19.066 N, 73.241 E) | 3.8 | Its mouth is 1.5 km from the map's line for the Gadhe (CWC), which lies off the river's real course there. |
| Unnamed, Near Vangani (19.055 N, 73.222 E) | 2.2 | Its mouth is 1.1 km from the map's line for the Gadhe (CWC), which lies off the river's real course there. |
| Unnamed, Matheran hills, near Neral (19.024 N, 73.278 E) | 3.1 | Its mouth is 1.4 km from the map's line for the Gadhe (CWC), which lies off the river's real course there; OSM names it "Gadhe Nadi". |
| Unnamed, Khopoli (18.782 N, 73.356 E) | 6.8 | Its mouth is 1.5 km from the map's line for the Patalganga (CWC), which lies off the river's real course there. |
| Unnamed, Near Khopoli (18.830 N, 73.350 E) | 7.2 | Its mouth is 1.5 km from the map's line for the Patalganga (CWC), which lies off the river's real course there; OSM names this headstream "Patalganga". |
| Unnamed, Near Neral (19.017 N, 73.560 E) | 3.0 | Mostly outside the area the data covers. |
| Unnamed, Near Karjat (18.936 N, 73.451 E) | 2.3 | Mostly outside the area the data covers. |
| Unnamed, Near Badlapur (19.158 N, 73.192 E) | 2.1 | A 1.3 km stream into Kakuli Lake: under 2 km once the lake crossing, now part of the Waldhuni, is left out. |

The two tributaries of the Gadhe headstream above (2.2 km each, on Matheran's west face) go with it.

### 6. OSM has no channel linking them to a drawn river or the shore

Pieces of 2 km or more that end more than 0.5 km from the network. Drawing them would mean inventing the missing stretch. They may well be natural.

| Lowest point near | km | Gap to the network | Note |
|---|---|---|---|
| Virar (19.447 N, 72.798 E) | 23 | 2.66 km | The drains of Virar and Nalasopara, mapped as one connected set with no outlet to a creek. |
| Kalamboli (19.011 N, 73.103 E) | 4.8 | 1.05 km |  |
| Turbhe (19.064 N, 73.028 E) | 2.7 | 1.9 km | Turbhe MIDC, below the Parsik hills: OSM stops at the Thane-Belapur Road. |
| Mulund (19.185 N, 72.938 E) | 2.3 | 0.66 km |  |

Navi Mumbai's southern nodes are the main gap. OSM has no connected waterway for the nallas of Turbhe, Sanpada, Juinagar, Nerul and Belapur: only short pieces (Juinagar 1.4 km, Turbhe MIDC 2.7 km) and straight channels. HydroRIVERS has lines there, but on a 450 m grid that cuts across the city's sectors, so they were not used.

### 7. Names in the references that could not be placed

The references name nallas without saying where they run, and OSM leaves almost every Mumbai nalla unnamed, so these names are not on the map. Probable matches are noted in `data/added-rivers.json`:

- BMC, eastern suburbs: Boundary Nalla (4.1 km; probably 40194, along the Thane-Mumbai boundary), Usha Nagar Nalla (3.3 km, Bhandup), Bombay Oxygen Nalla (probably 40201, through Nahur), Laxmibaug and Vallabhbaug nallas (Ghatkopar East; the first is probably the upper Trombay Creek), Subhash Nagar Nalla (Chembur), Mohan Nagar, Temhepada, Damodar Park and Barve Nagar nallas.
- BMC, western suburbs: 63 nallas, among them the Walbhat River (11.8 km; probably 40282 with the Oshiwara's southern branch 40260), the Rajendra Nagar, Chandavarkar, Mhatre, Kamla Nehru Road, Piramal Nagar and Krishna Nagar nallas.
- MPCB, Navi Mumbai: Airoli Nalla (probably the 1.9 km stream in section 8), Nocil Nalla (probably 40203, Rabale-Ghansoli), Alok Nalla, Juinagar Nalla (OSM has 1.4 km of it, unconnected).

### 8. Under 2 km

The 2 km minimum was kept. Of the streams of 1-2 km, **74 are complete**: they pass the natural test and reach a drawn river, a creek or the sea. Their courses, test results, OSM way ids and proposed origin and end texts are kept (in the working files of this job, `build/view/mmr-under2km.json`, not in the repository), so they can be added without redoing the network. A further 26 streams of 1-2 km reach the network but fail the test or join a stream that is not drawn, and 5 pieces of 1-2 km are unconnected fragments.

| Area | Complete streams | km | Fail the test | Unconnected fragments |
|---|---|---|---|---|
| Thane Creek, west bank | 6 | 8.7 | 1 | 1 |
| Thane Creek, east bank | 12 | 17.6 | 2 | 1 |
| Mira-Bhayandar, Gorai and Manori Creek | 3 | 3.9 | 2 | 0 |
| Mumbai: the western suburbs, the Mithi and the harbour side | 15 | 21.0 | 8 | 0 |
| Thane, Ghodbunder Road and Bhiwandi (to the Ulhas) | 3 | 3.9 | 0 | 1 |
| Vasai-Virar, Kaman and the Tansa side | 5 | 6.6 | 1 | 0 |
| Kalyan-Dombivli, Ulhasnagar, Ambernath and Badlapur | 9 | 12.4 | 2 | 0 |
| Panvel, Taloja and Uran | 8 | 10.8 | 9 | 1 |
| The north-east: Padgha, Vasind and Shahapur | 5 | 7.3 | 0 | 1 |
| The east and south-east: Vangani, Neral, Matheran, Karjat, Khalapur and Rasayani | 8 | 11.6 | 1 | 0 |
| **Total** | **74** | **103.8** | **26** | **5** |

The complete ones:

| Area | From → to | km | Evidence | Would join |
|---|---|---|---|---|
| Thane Creek, west bank | Yeoor hills, Sanjay Gandhi National Park, near Thane → Near Ghodbunder Road, Thane (19.218 N, 72.940 E) | 1.8 | HydroRIVERS 50%; valley floor 68% of 1.9 km upland; OSM river/stream | unnamed (40264) |
| Thane Creek, west bank | Mulund, Mumbai → Mulund, Mumbai (19.166 N, 72.960 E) [OSM: B Maharaj Singh Marg] | 1.8 | tidal creek 54% | unnamed (40194) |
| Thane Creek, west bank | Mulund, Mumbai → Mulund, Mumbai (19.183 N, 72.965 E) | 1.3 | HydroRIVERS 100% | unnamed (40194) |
| Thane Creek, west bank | Bhandup, Mumbai → Bhandup, Mumbai (19.153 N, 72.941 E) | 1.3 | HydroRIVERS 100% | unnamed (40190) |
| Thane Creek, west bank | Govandi, Mumbai → Mankhurd, Mumbai (19.045 N, 72.919 E) | 1.3 | HydroRIVERS 68% | unnamed (40197) |
| Thane Creek, west bank | Trombay, Mumbai → The Thane Creek at Trombay, Mumbai (19.031 N, 72.947 E) | 1.2 | tidal creek 73%; OSM river/stream | Thane Creek (40189) |
| Thane Creek, east bank | Airoli, Navi Mumbai → The Thane Creek at Airoli, Navi Mumbai (19.156 N, 73.000 E) | 1.9 | HydroRIVERS 75%; tidal creek 62% | Thane Creek (40189) |
| Thane Creek, east bank | Kalwa, Thane → The Thane Creek at Kalwa, Thane (19.199 N, 72.995 E) | 1.8 | tidal creek 59% | Thane Creek (40189) |
| Thane Creek, east bank | Kopar Khairane, Navi Mumbai → Kopar Khairane, Navi Mumbai (19.099 N, 73.011 E) | 1.7 | HydroRIVERS 100% | unnamed (40204) |
| Thane Creek, east bank | Mahape, Navi Mumbai → Turbhe, Navi Mumbai (19.098 N, 73.031 E) | 1.7 | HydroRIVERS 100%; valley floor 56% of 1.8 km upland | unnamed (40204) |
| Thane Creek, east bank | Digha, Navi Mumbai → Digha, Navi Mumbai (19.179 N, 73.003 E) | 1.5 | HydroRIVERS 78% | unnamed (40206) |
| Thane Creek, east bank | Vashi, Navi Mumbai → The Thane Creek at Vashi, Navi Mumbai (19.063 N, 72.992 E) | 1.5 | tidal creek 100%; OSM river/stream | Thane Creek (40189) |
| Thane Creek, east bank | Kopar Khairane, Navi Mumbai → The Thane Creek at Kopar Khairane, Navi Mumbai (19.104 N, 72.993 E) | 1.5 | HydroRIVERS 100%; tidal creek 100%; OSM river/stream | Thane Creek (40189) |
| Thane Creek, east bank | Kalwa, Thane → The Ulhas at Kolshet, Thane (19.212 N, 73.010 E) | 1.4 | HydroRIVERS 90%; OSM river/stream | Ulhas (8969) |
| Thane Creek, east bank | Near Diva, Thane → Near Diva, Thane (19.226 N, 73.035 E) | 1.3 | HydroRIVERS 100%; OSM river/stream | unnamed (40268) |
| Thane Creek, east bank | Kolshet, Thane → Kolshet, Thane (19.218 N, 72.995 E) | 1.1 | HydroRIVERS 52% | unnamed (40193) |
| Thane Creek, east bank | Digha, Navi Mumbai → The Thane Creek at Digha, Navi Mumbai (19.171 N, 72.991 E) | 1.1 | HydroRIVERS 73%; tidal creek 96%; OSM river/stream | Thane Creek (40189) |
| Thane Creek, east bank | Digha, Navi Mumbai → The Thane Creek at Digha, Navi Mumbai (19.182 N, 72.994 E) | 1.1 | HydroRIVERS 63%; tidal creek 52% | Thane Creek (40189) |
| Mira-Bhayandar, Gorai and Manori Creek | Near Kashimira, Mira-Bhayandar → The Chena near Ghodbunder Road, Thane (19.244 N, 72.916 E) | 1.4 | HydroRIVERS 100%; valley floor 88% of 1.6 km upland; OSM river/stream | Chena (40032) |
| Mira-Bhayandar, Gorai and Manori Creek | Mira Road, Maharashtra → Mira Road, Maharashtra (19.277 N, 72.866 E) | 1.3 | HydroRIVERS 70%; tidal creek 78% | unnamed (40215) |
| Mira-Bhayandar, Gorai and Manori Creek | Near Bhayandar, Maharashtra → Dahisar, Mumbai (19.276 N, 72.834 E) | 1.1 | OSM river/stream | unnamed (40214) |
| Mumbai: the western suburbs, the Mithi and the harbour side | Chembur, Mumbai → The Somaiyya Nalla at Govandi, Mumbai (19.051 N, 72.904 E) | 2.0 | HydroRIVERS 84%; valley floor 71% of 0.7 km upland; lake on its course | Somaiyya Nalla (40037) |
| Mumbai: the western suburbs, the Mithi and the harbour side | Mahul, Mumbai → The Mahul Creek at Mahul, Mumbai (19.021 N, 72.896 E) | 1.7 | HydroRIVERS 80%; tidal creek 56% | Mahul Creek (40027) |
| Mumbai: the western suburbs, the Mithi and the harbour side | Andheri, Mumbai → The Mogara Nallah at Jogeshwari, Mumbai (19.126 N, 72.842 E) [OSM: Malad Creek] | 1.7 | HydroRIVERS 100%; valley floor 54% of 1.3 km upland; OSM river/stream | Mogara Nallah (40035) |
| Mumbai: the western suburbs, the Mithi and the harbour side | Bandra, Mumbai → The Mithi at Bandra, Mumbai (19.064 N, 72.842 E) | 1.6 | HydroRIVERS 100% | Mithi (8809) |
| Mumbai: the western suburbs, the Mithi and the harbour side | Yeoor hills, Sanjay Gandhi National Park, near Mulund, Mumbai → The Dahisar near Mulund, Mumbai (19.210 N, 72.923 E) | 1.6 | OSM river/stream | Dahisar (8654) |
| Mumbai: the western suburbs, the Mithi and the harbour side | Yeoor hills, Sanjay Gandhi National Park, near Mulund, Mumbai → The Dahisar near Mulund, Mumbai (19.204 N, 72.934 E) | 1.5 | valley floor 59% of 1.7 km upland; OSM river/stream | Dahisar (8654) |
| Mumbai: the western suburbs, the Mithi and the harbour side | Dharavi, Mumbai → The Mahul Creek at Wadala, Mumbai (19.036 N, 72.870 E) | 1.4 | HydroRIVERS 64% | Mahul Creek (40027) |
| Mumbai: the western suburbs, the Mithi and the harbour side | Sanjay Gandhi National Park hills, near Aarey Colony, Goregaon, Mumbai → Near Bhandup, Mumbai (19.182 N, 72.907 E) | 1.4 | OSM river/stream | unnamed (40334) |
| Mumbai: the western suburbs, the Mithi and the harbour side | Dharavi, Mumbai → The Mahul Creek at Chembur, Mumbai (19.041 N, 72.868 E) | 1.3 | HydroRIVERS 56%; OSM river/stream | Mahul Creek (40027) |
| Mumbai: the western suburbs, the Mithi and the harbour side | Malad, Mumbai → The Poisar at Malad, Mumbai (19.182 N, 72.818 E) | 1.2 | HydroRIVERS 50%; tidal creek 69% | Poisar (9009) |
| Mumbai: the western suburbs, the Mithi and the harbour side | Goregaon, Mumbai → The Poisar at Goregaon, Mumbai (19.160 N, 72.842 E) | 1.2 | HydroRIVERS 56% | Poisar (9009) |
| Mumbai: the western suburbs, the Mithi and the harbour side | Marol, Andheri East, Mumbai → Saki Naka, Mumbai (19.111 N, 72.876 E) | 1.1 | HydroRIVERS 75%; valley floor 62% of 1.3 km upland | unnamed (40292) |
| Mumbai: the western suburbs, the Mithi and the harbour side | Gorai, Mumbai → Gorai, Mumbai (19.229 N, 72.800 E) | 1.1 | HydroRIVERS 100%; tidal creek 96%; OSM river/stream | unnamed (40217) |
| Mumbai: the western suburbs, the Mithi and the harbour side | Wadala, Mumbai → The Mahul Creek at Wadala, Mumbai (19.030 N, 72.875 E) | 1.1 | HydroRIVERS 100%; tidal creek 61% | Mahul Creek (40027) |
| Mumbai: the western suburbs, the Mithi and the harbour side | Near Goregaon, Mumbai → The Poisar near Goregaon, Mumbai (19.151 N, 72.816 E) | 1.0 | HydroRIVERS 92%; tidal creek 100%; OSM river/stream | Poisar (9009) |
| Thane, Ghodbunder Road and Bhiwandi (to the Ulhas) | Kasarvadavali, Thane → Kasarvadavali, Thane (19.280 N, 72.981 E) | 1.4 | HydroRIVERS 100%; OSM river/stream | unnamed (40244) |
| Thane, Ghodbunder Road and Bhiwandi (to the Ulhas) | Kasarvadavali, Thane → The Ulhas at Kasarvadavali, Thane (19.280 N, 72.981 E) | 1.4 | HydroRIVERS 100%; OSM river/stream | Ulhas (8969) |
| Thane, Ghodbunder Road and Bhiwandi (to the Ulhas) | Ghodbunder Road, Thane → Near Ghodbunder Road, Thane (19.237 N, 72.940 E) | 1.2 | OSM river/stream | unnamed (40264) |
| Vasai-Virar, Kaman and the Tansa side | Near Vaitarna station, Maharashtra → The Sikni near Vaitarna station, Maharashtra (19.555 N, 72.928 E) | 1.7 | HydroRIVERS 54%; valley floor 53% of 1.9 km upland; OSM river/stream | Sikni (8901) |
| Vasai-Virar, Kaman and the Tansa side | Kaman, near Vasai → Kaman, near Vasai (19.360 N, 72.890 E) | 1.5 | HydroRIVERS 100%; OSM river/stream | unnamed (40221) |
| Vasai-Virar, Kaman and the Tansa side | Near Vasai Road, Maharashtra → The Tungar Nala at Vasai Road, Maharashtra (19.417 N, 72.849 E) | 1.2 | HydroRIVERS 100%; valley floor 67% of 0.9 km upland; OSM river/stream | Tungar Nala (8928) |
| Vasai-Virar, Kaman and the Tansa side | Vasai Road, Maharashtra → The Tungar Nala at Vasai Road, Maharashtra (19.391 N, 72.863 E) | 1.2 | HydroRIVERS 100%; OSM river/stream | Tungar Nala (8928) |
| Vasai-Virar, Kaman and the Tansa side | Vaitarna station, north of Virar → The Vaitarna at Vaitarna station, Maharashtra (19.534 N, 72.848 E) | 1.0 | HydroRIVERS 93%; tidal creek 95%; OSM river/stream | Vaitarna (8965) |
| Kalyan-Dombivli, Ulhasnagar, Ambernath and Badlapur | Malanggad hills, near Badlapur → Near Badlapur, Maharashtra (19.124 N, 73.183 E) | 1.8 | HydroRIVERS 84%; valley floor 100% of 1.9 km upland; OSM river/stream | unnamed (40253) |
| Kalyan-Dombivli, Ulhasnagar, Ambernath and Badlapur | Kalyan, Maharashtra → The Ulhas at Kalyan, Maharashtra (19.236 N, 73.129 E) | 1.7 | HydroRIVERS 100%; OSM river/stream | Ulhas (8969) |
| Kalyan-Dombivli, Ulhasnagar, Ambernath and Badlapur | Ulhasnagar, Maharashtra → The Ulhas at Ulhasnagar, Maharashtra (19.236 N, 73.171 E) | 1.6 | HydroRIVERS 53% | Ulhas (8969) |
| Kalyan-Dombivli, Ulhasnagar, Ambernath and Badlapur | Malanggad hills, near Badlapur → The Kasadi near Badlapur, Maharashtra (19.119 N, 73.201 E) | 1.4 | valley floor 80% of 1.5 km upland; OSM river/stream | Kasadi (8764) |
| Kalyan-Dombivli, Ulhasnagar, Ambernath and Badlapur | Badlapur, Maharashtra → Badlapur, Maharashtra (19.160 N, 73.229 E) | 1.3 | HydroRIVERS 100%; valley floor 100% of 1.5 km upland; OSM river/stream | unnamed (40227) |
| Kalyan-Dombivli, Ulhasnagar, Ambernath and Badlapur | Malanggad hills, near Badlapur → The Waldhuni near Badlapur, Maharashtra (19.151 N, 73.195 E) | 1.2 | HydroRIVERS 94%; OSM river/stream | Waldhuni (40033) |
| Kalyan-Dombivli, Ulhasnagar, Ambernath and Badlapur | Near Badlapur, Maharashtra → The Waldhuni near Ambernath, Maharashtra (19.158 N, 73.192 E) | 1.2 | HydroRIVERS 100%; valley floor 93% of 1.4 km upland; OSM river/stream | Waldhuni (40033) |
| Kalyan-Dombivli, Ulhasnagar, Ambernath and Badlapur | Dombivli, Maharashtra → The Ulhas at Dombivli, Maharashtra (19.214 N, 73.078 E) | 1.1 | HydroRIVERS 50%; OSM river/stream | Ulhas (8969) |
| Kalyan-Dombivli, Ulhasnagar, Ambernath and Badlapur | Badlapur, Maharashtra → Badlapur, Maharashtra (19.176 N, 73.227 E) | 1.1 | HydroRIVERS 100% | unnamed (40227) |
| Panvel, Taloja and Uran | Near Jasai, Maharashtra → Near Jasai, Maharashtra (18.920 N, 73.032 E) | 2.0 | HydroRIVERS 83%; tidal creek 98%; OSM river/stream | unnamed (40222) |
| Panvel, Taloja and Uran | Near Taloja, Maharashtra → The Kasadi near Taloja, Maharashtra (19.086 N, 73.136 E) [OSM: Taloje Creek] | 1.7 | HydroRIVERS 92%; OSM river/stream | Kasadi (8764) |
| Panvel, Taloja and Uran | Near Taloja, Maharashtra → The Kasadi near Taloja, Maharashtra (19.098 N, 73.177 E) | 1.5 | HydroRIVERS 51%; valley floor 82% of 1.7 km upland; OSM river/stream | Kasadi (8764) |
| Panvel, Taloja and Uran | Near Panvel, Maharashtra → The Ulwe near Ulwe, Navi Mumbai (18.944 N, 73.076 E) | 1.2 | HydroRIVERS 100%; valley floor 100% of 1.1 km upland; OSM river/stream | Ulwe (40224) |
| Panvel, Taloja and Uran | Kharghar, Navi Mumbai → Kharghar, Navi Mumbai (19.040 N, 73.058 E) | 1.2 | OSM river/stream | unnamed (40205) |
| Panvel, Taloja and Uran | Belapur, Navi Mumbai → The Kasadi at Belapur, Navi Mumbai (19.017 N, 73.036 E) | 1.2 | OSM river/stream | Kasadi (8764) |
| Panvel, Taloja and Uran | Near Apta, Maharashtra → Near Apta, Maharashtra (18.823 N, 73.047 E) | 1.1 | OSM river/stream | unnamed (40291) |
| Panvel, Taloja and Uran | Near Apta, Maharashtra → Near Karanja, Maharashtra (18.824 N, 73.047 E) | 1.1 | HydroRIVERS 100%; OSM river/stream | unnamed (40291) |
| The north-east: Padgha, Vasind and Shahapur | Near Vasind, Maharashtra → The Kalu near Vasind, Maharashtra (19.346 N, 73.308 E) | 1.9 | HydroRIVERS 100%; valley floor 90% of 2 km upland; OSM river/stream | Kalu (8966) |
| The north-east: Padgha, Vasind and Shahapur | Near Vasind, Maharashtra → The Sarmal at Vasind, Maharashtra (19.436 N, 73.248 E) | 1.7 | HydroRIVERS 100%; valley floor 83% of 1.8 km upland; OSM river/stream | Sarmal (8884) |
| The north-east: Padgha, Vasind and Shahapur | Mahuli hills, near Atgaon → The Kalam Nala at Atgaon, Maharashtra (19.507 N, 73.284 E) | 1.4 | valley floor 94% of 1.6 km upland; OSM river/stream | Kalam Nala (8739) |
| The north-east: Padgha, Vasind and Shahapur | Mahuli hills, near Atgaon → The Bharangi near Atgaon, Maharashtra (19.472 N, 73.262 E) | 1.3 | HydroRIVERS 100%; valley floor 73% of 1.5 km upland; OSM river/stream | Bharangi (8619) |
| The north-east: Padgha, Vasind and Shahapur | Near Bhiwandi, Maharashtra → Near Bhiwandi, Maharashtra (19.319 N, 73.112 E) | 1.1 | valley floor 100% of 1.2 km upland; OSM river/stream | unnamed (40255) |
| The east and south-east: Vangani, Neral, Matheran, Karjat, Khalapur and Rasayani | Khalapur, Maharashtra → The Patalganga at Khalapur, Maharashtra (18.839 N, 73.281 E) | 1.7 | HydroRIVERS 100%; valley floor 63% of 1.9 km upland; OSM river/stream | Patalganga (8856) |
| The east and south-east: Vangani, Neral, Matheran, Karjat, Khalapur and Rasayani | Matheran hills, near Neral → Near Matheran, Maharashtra (19.048 N, 73.272 E) | 1.6 | valley floor 71% of 1.7 km upland; OSM river/stream | unnamed (40279) |
| The east and south-east: Vangani, Neral, Matheran, Karjat, Khalapur and Rasayani | Karjat, Maharashtra → The Ulhas at Karjat, Maharashtra (18.907 N, 73.342 E) | 1.5 | HydroRIVERS 100%; valley floor 94% of 1.7 km upland; OSM river/stream | Ulhas (8969) |
| The east and south-east: Vangani, Neral, Matheran, Karjat, Khalapur and Rasayani | Prabalgad hills, near Matheran → The Dhavri at Matheran, Maharashtra (18.974 N, 73.232 E) | 1.5 | HydroRIVERS 50%; valley floor 75% of 1.6 km upland; OSM river/stream | Dhavri (8995) |
| The east and south-east: Vangani, Neral, Matheran, Karjat, Khalapur and Rasayani | Malanggad hills, near Badlapur → Near Badlapur, Maharashtra (19.106 N, 73.212 E) | 1.4 | valley floor 60% of 1.5 km upland; OSM river/stream | unnamed (40274) |
| The east and south-east: Vangani, Neral, Matheran, Karjat, Khalapur and Rasayani | Karjat, Maharashtra → The Ulhas at Karjat, Maharashtra (18.881 N, 73.321 E) | 1.3 | HydroRIVERS 100%; valley floor 87% of 1.5 km upland; lake on its course; OSM river/stream | Ulhas (8969) |
| The east and south-east: Vangani, Neral, Matheran, Karjat, Khalapur and Rasayani | Matheran hills, Maharashtra → Matheran, Maharashtra (19.016 N, 73.277 E) | 1.3 | valley floor 93% of 1.4 km upland; OSM river/stream | another stream under 2 km |
| The east and south-east: Vangani, Neral, Matheran, Karjat, Khalapur and Rasayani | Matheran hills, Maharashtra → Matheran, Maharashtra (19.004 N, 73.273 E) | 1.2 | HydroRIVERS 80%; OSM river/stream | another stream under 2 km |

Below 1 km there are several hundred more stubs; they were not looked at.

## Where this stopped, and open questions

- **Area.** Everything inside the box the data was fetched for (18.80-19.55 N, 72.70-73.35 E) was tested, with no administrative limit. That takes in Mumbai, Thane, Navi Mumbai, Mira-Bhayandar, Vasai-Virar, Bhiwandi, Kalyan-Dombivli, Ulhasnagar, Ambernath, Badlapur, Panvel, Uran, and the country out to Vasind, Neral, Matheran and Rasayani. Streams lying mostly outside the box (Khopoli, Karjat's east, Alibag, Pen, Palghar) were not looked at.
- **Navi Mumbai is thin.** Four streams reach Thane Creek from the east bank, against 10 from Salsette. That is the state of OSM there, not of the ground (section 6).
- **By-eye exclusions** (section 2) are judgement: the Vashi and Kalamboli channels in particular carry the water of natural streams in channels built with the city.
- **Tidal channels between two creeks** (Murdha and Morva, in Mira-Bhayandar) are drawn as two arms meeting in the middle, since water leaves them both ways.
- **CWC lines off course.** Six streams could not be joined because the map's line for the river they flow into (the Taloja River as "Bava Malang", the upper Gadhe, the upper Patalganga) lies 1-2 km from the river's real course. Correcting those CWC courses from OSM would let them in.
- **Names.** Section 7: a ward-wise BMC or NMMC nalla map would let the unnamed streams be named.
