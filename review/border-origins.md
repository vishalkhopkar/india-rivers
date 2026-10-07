# Border origins to review

These rivers came out of the border-origin audit (2026-10-02). They were not changed because the evidence was not strong enough. Each entry shows what the map says now and what the audit suspects. To apply a correction, add an entry to `data/river-overrides.json`: `origin`, `via`, `entersAt` and `entersAtNear` mark a river as coming from abroad, and `"abroad": false` removes a wrong flag. Then rebuild from `npm run data:places`.

The audit compared each river with the HydroRIVERS network upstream of its start, then checked the larger rivers against Wikipedia and the Bangladesh–India transboundary river list.

Fixed already (for reference):
- Tsari Chu, Jaldhaka, Manas, Burisuti, Bari Gandak and Tangtsa were corrected by hand.
- The Sharda keeps its Kalapani source.
- The Mechi rises in the Mahabharat Range of Nepal and enters India near Mirik (owner's correction, 2026-10-06).
- Hardi, Sihula Dhar, Bharahar and 20 other Nepal terai streams are now marked as rising in Nepal, because the data's own start point lies inside Nepal.
- The uid clash that showed Kankai Nadi rising near Dehradun is fixed.

## Probably from abroad, shown as rising in India

| uid | River | Shown now | Suspected | Evidence | Confidence |
|---|---|---|---|---|---|
| 30289 | Kamla | Origin Jainagar, Bihar | A channel of the Kamla from Nepal, leaving the Kamla Banal (30293) | Starts 0.6 km from the Kamla Banal, beside a reach draining 2,320 km² of Nepal | medium-high |
| 29714 | Soni | Origin Jainagar, Bihar | Rises in the Siwaliks of Dhanusha, Nepal | Channel follows the line within 0.7 km; 282 km² and 37 km of course in Nepal | medium-high |
| 26557 | Manusmara | 16 km E of Bairagnia, Bihar | Rises in the Siwaliks of Sarlahi, Nepal | 76 km² catchment, all in Nepal; 16 km of course there | medium-high |
| 102 | Chumurchi | 30 km W of Jaigaon, West Bengal | Comes from Bhutan | 101 of 109 km² of catchment in Bhutan, 14 km upstream | medium-high |
| 26953 | Nana Khari | Gangarampur, West Bengal | Comes from Bangladesh | 167 of 182 km² of catchment in Bangladesh, 34 km upstream | medium-high |
| 23569 | Gachha Khal (head of the Ichamati) | Bagula, West Bengal | Branches off the Mathabhanga at Majdia; the Mathabhanga flows in from Bangladesh and is missing from the data | Both rivers start at the Majdia split (Wikipedia: Ichamati) | medium |
| 22926 | Chumi (Churni) | Bagula, West Bengal | Same as above | Same as above | medium |
| 29943 | Dundra N | 20 km NE of Nanpara, Uttar Pradesh | Rises in Nepal | The data's start point is in Nepal but within 2 km of the border, too close for the automatic rule | medium |
| 29604 | Bhakla | 20 km NE of Nanpara, Uttar Pradesh | Rises in Nepal | Same as above | medium |
| 29649 | Bajahi | 25 km N of Palia Kalan, Uttar Pradesh | Rises in Nepal | Same as above | medium |
| 30359 | Gad | Raxaul, Bihar | Rises in Nepal | Channel within about 1.5 km of the line; 50–185 km² of catchment and 19–40 km of course in Nepal | medium |
| 23269 | Dhauri | Jainagar, Bihar | Rises in Nepal | Same as above | medium |
| 22693 | Chaundhar | 30 km N of Puranpur, Uttar Pradesh | Rises in Nepal | Same as above | medium |

## Probably rising in India, shown as entering from abroad

| uid | River | Shown now | Suspected | Evidence |
|---|---|---|---|---|
| 12 | Ange | Rises in Tibet | Rises in India at the Line of Actual Control | Dibang Valley and Anjaw streams with 5–24 km of trace beyond Natural Earth's line. The Emra traces the same way yet rises in India per Wikipedia, so the line probably runs south of the watershed here |
| 83 | Chiane | Rises in Tibet | Same | Same |
| 191 | Duten | Rises in Tibet | Same | Same |
| 289 | Ithun | Rises in Tibet | Same | Same |
| 788 | Tidding | Rises in Tibet | Same | Same |
| 759 | Tamlom | Rises in Tibet | Same, least clear | Same |
| 596 | Pindlgo Ishi | Rises in Tibet | Same, least clear | Same |
| 23209 | Dhanjaya | Rises in Nepal | Probably India; matched to the Balan or a neighbouring channel | Its own reach drains 11–16 km² with nothing abroad, yet it is credited with 44 km in Nepal |
| 22720 | Chhagrlhwa | Rises in Nepal | Same | Same, 36 km |
| 23745 | Garakka | Rises in Nepal | Probably India | A 5 km nala about 1 km from the Bhada, matched to the Bhada's 3,529 km² reach |
| 27694 | Puraina Nala | Rises in Nepal | Same | Same |
| 28655 | Suiya Nala | Rises in Nepal | Same | Same |
| 29459 | Dauk | Rises in Bangladesh | Rises in India, flows through Bangladesh, re-enters | The transboundary list gives India → Bangladesh → India |

## Uncertain either way

| uid | River | Shown now | Question |
|---|---|---|---|
| 29054 / 28849 | Tulai / Tangan (Tangon) | Rise in India | The water reaching India here comes from Bangladesh, but sources disagree on where it rises. Tangan is also drawn mouth-first and wrongly marked as a Mahananda branch |
| 901 | Dhansiri | 16 km N of Udalguri, Assam | Formed by the Bhairabkunda (Arunachal) and the Khaluba, the larger arm, which comes from Bhutan. Could be shown as "Formed by" |
| 22345 | Bihul | 25 km N of Nirmali, Bihar | Possibly from Nepal; weak evidence |
| 1002 | Langnyu | Naga Hills, 30 km E of Tuensang | Rises in Nagaland and dips about 12 km into Myanmar. Could show "Flows through Myanmar" |
| 16190 | Dharo Puran | 65 km N of Dayapar, Gujarat | An old Indus channel in the Rann |

## Lines that start just inside another country (outside Nepal)

The automatic "start lies abroad" rule only trusts the Nepal terai, so these were left as they are. Elsewhere Natural Earth's border is not reliable enough.

| uid | River | Start lies in | Note |
|---|---|---|---|
| 129 | Deochunga (2 km) | Bhutan | Near Daifam |
| 654 | Sarang Hka (4 km) | Myanmar | |
| 1045 | Likim Ro (32 km) | Myanmar | East of Kiphire, Nagaland |
| 17017, 17967, 18166, 18475 | Cheulen C, Mora Ek Chari, Patha Chara, Sardeng C | Bangladesh | Small streams in south Tripura |
| 25790 | Kio Gad (30 km) | China | Barahoti area, which India administers: almost certainly India |
| 26245, 26257 | Lilinti Gad, Lipu Gad | China | At Lipulekh Pass: almost certainly India |

## Missed continuations and branches

Topology issues the audit noticed; they affect the "Continues from" and "Branched off from" rows.
- 29240 Gandak continues 29233 Bari Gandak; both are now curated with the same source.
- 30289 Kamla is a branch of 30293 Kamla Banal.
- 41 Beng is the lower Nanai, and 67 Chaulkhowa the lower Pagladiya; each traces to the same source as its parent.
- 951 Burisuti is a channel of the Manas.
- 23569 Gachha Khal and 22926 Churni branch off the Mathabhanga, which is missing from the data.
