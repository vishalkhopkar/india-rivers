# Sundarbans (West Bengal): rivers checked against OpenStreetMap

Area: 21.5-22.7 N, 88.0-89.2 E, the Indian side. The map had 199 CWC rivers here (2,672 km). Every OSM `waterway=river`, `tidal_channel` and `stream` (446 ways; Overpass, data of 2026-10-05) was compared with them: an OSM stretch counts as drawn where it lies within 3.2 m of a river on the map. Canals (1,487 ways) were left out.

No line is traced from anything but OpenStreetMap (ODbL). OSM names very few Sundarbans channels, so most additions are unnamed.

## Corrected

| What | Before | Now |
|---|---|---|
| The Matla | Two rivers: "Malta" (29679, 41 km, past Canning) joining "Matla" (26630, 72 km) | One river, Matla (26630), 115 km. CWC's "Malta" is its head (`headFrom` in `data/course-overrides.json`) and is hidden as a river of its own. The Bidyadhari (22335) and the Kuria (26046) now join the Matla. |
| Spellings | Thankuran, Saptmukhi, Bidydhari Or Hatgacha Khal, Bidyadhari( Batagachi Gang), Curjon Creek, Haribhanga, Muri Ganga Or Bartala, Piali, Gauri Kha | Thakuran, Saptamukhi, Bidyadhari or Hatgacha Khal, Bidyadhari (Batagachi Gang), Curzon Creek, Hariabhanga, Muri Ganga or Baratala, Piyali, Gauri Khal |
| The Padma (29309, outside this area) | "Ganga or Padma", branched off from the Ganga | "Padma", continues from the Ganga; the Ganga continues to it |

## Drawn (17 rivers, 194 km)

| uid | Name | km | OSM way | Course | Joins |
|---|---|---|---|---|---|
| 40452 | Unnamed | 34.8 | 102147643 | Leaves the Ichamati near Taki and Hasnabad, south past the east side of Sandeshkhali | Bara Kalagachi Gang (30033) |
| 40453 | Dansa | 20.4 | 102147642 | Leaves 40452 south of Taki, south-west to Nyazat | Chhota Kalagachi Gang (22786) |
| 40454 | Unnamed | 43.0 | 1494539169 | Leaves the Hariabhanga in the forest, between the Gosaba and Hariabhanga estuaries | Bay of Bengal |
| 40455 | Unnamed | 13.2 | 759147886 | Creek west of the Bidyadhari | Bidyadhari or Hatgacha Khal (22337) |
| 40456 | Unnamed | 5.2 | 759147883 | Joins 40455 from the north | 40455 |
| 40457 | Unnamed | 4.5 | 759147878 | Joins 40455 from the south | 40455 |
| 40458 | Unnamed | 3.6 | 759147881 | Joins 40455 from the south-west | 40455 |
| 40459 | Unnamed | 12.0 | 397632801 | Side channel west of the Matla below Canning | Matla (26630) |
| 40460 | Unnamed | 10.0 | 836662385 | Creek from the north-west | Bidya (29582) |
| 40461 | Unnamed | 15.8 | 611319307 | Leaves the Sundarika Khal between Namkhana and Bakkhali | Bay of Bengal |
| 40462 | Unnamed | 7.3 | 815090525 | Creek south of Kulpi | Hooghly (29296) |
| 40463 | Unnamed | 5.0 | 859823410 | Creek near Kakdwip | Kalnagini K (25020) |
| 40464 | Unnamed | 5.5 | 1441696417 | Creek west of Kakdwip, by the Muriganga | Kailapara Khal (24914) |
| 40465 | Unnamed | 3.6 | 815695835 | Creek | Pathan Khali (27445) |
| 40466 | Unnamed | 3.6 | 758770811 | Creek near Hingalganj | Charisa K (22669) |
| 40467 | Unnamed | 3.6 | 1338565743 | Creek from the east | Kapura Gang (25172) |
| 40468 | Unnamed | 3.2 | 1338565744 | Creek from the east, north of 40467 | Kapura Gang (25172) |

40452 is the channel east of Sandeshkhali. No reference found names it (the district lists the Dansa, Bara Kalagachi, "Benti" and "Gaourchrar" among its rivers without placing them), so it is unnamed.

## Not drawn

### Already on the map: OSM's centre line of a wide estuary runs more than 400 m from CWC's

| OSM | km not within 400 m | The map's river |
|---|---|---|
| Matla (397632683) | 49 | Matla (26630) |
| Haribhanga (126774196, 126774195) | 48 | Hariabhanga (24333), Jhila (24731), Raimangal (29503) |
| Hooghly (19 ways) and unnamed 755645641 (41 km, the western channel past Haldia) | 52 + 41 | Hooghly (29296) |
| Raimangal (397702430) and unnamed 682309724 (22 km, on the border) | 9 + 22 | Raimangal (29503) |

### Partly a river already drawn

| OSM way | km | Why |
|---|---|---|
| 384068709 | 12.3 | 5.5 km of it is the Kalnagini K (25020). The other 6.4 km carries the creek on west; drawing it means correcting the CWC course. |
| 759147873 | 10.6 | 4.2 km of it is the Dhuli Or Dhatia Or Dharir Khal (23336). The other 6 km is that creek's upper course. |
| 815090524 | 32.0 | Runs along the Jinger Khal, Balikhali Khal and Ghugdunga Gang for 23 km; 4.7 km not drawn, in short pieces. |

### Does not reach a river on the map

| OSM way | km | Nearest river |
|---|---|---|
| 398320438 | 5.5 | Piyali, 3.8 km away |
| 1534885376 | 4.4 | Gomar, 1.5 km |
| 1534824658 | 4.0 | Kamari Khal, 1.3 km |
| 1536469314, 859823412 (the same creek mapped twice) | 3.0 | 0.8 km from 40463 |
| 809915920 | 2.6 | Bidya, 1.3 km |

### Under 3 km

818560327 (2.7 km, to the Bidya), 815090522 (2.8 km, to the Satpukur) and shorter OSM ways.

### Outside the Sundarbans, noted only

- Adi Ganga (OSM, 16 km through south Kolkata, 13 km not drawn): the Hooghly's old course, canalised as Tolly's Nullah.
- Saraswati River (OSM, 23 km near Howrah): 12 km of it is the map's "Kana" (29465).
- Unnamed 149124229 (35 km, from near Baruipur to Diamond Harbour): looks like a drainage channel; not checked.

## Open questions

- **Two CWC "rivers" are map labels, not rivers:** "Low Water Line" (26313, 4 km) and "Law Water Line" (26212, 3 km). They could be hidden with `"hidden": true`; left as they are.
- **Names OSM gives differently:** the map's "Kalindi" (25006) is OSM's Ichamati for 44 km, and the map's "Jhila" (24731) is OSM's Haribhanga for 29 km. CWC's names were kept.
- **Other odd CWC names, not changed for want of a reference:** "Guasuba" (24165, the lower Gosaba), "Hatalia Donia Khal" (24360, probably the Hatania Doania), "Saznakhali Khal" (28273, probably Sajnekhali), "Ohugumuoanoa Khal" (27184), "Kata K" (25321, probably Katakhali).
