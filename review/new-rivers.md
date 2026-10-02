# New rivers to review

These come from comparing HydroRIVERS with the CWC data (2026-10-02). Rivers that passed every check and have a well-attested name were added: see `data/added-rivers.json`, 24 rivers including the Bhogawati and the Oshiwara. Everything below was held back, with the reason.

**To add one:** copy it into `data/added-rivers.json` with a new uid (40026 upwards). Use `hydroSource` and `hydroOutlet` from the "HydroRIVERS reaches" column, `joins` (the CWC uid of the river it joins) and `joinsName`. Then run `npm run data:added`. The script refuses any river that runs along or crosses a CWC river, has a similar name nearby, or never reaches the river it joins, so a clean run means no conflict. Rebuild with `npm run data:tier` through `npm run data:tiles`.

HydroRIVERS lines are traced from elevation data on a 450 m grid. Added rivers are smoothed, but they are coarser than the CWC lines.

## 1. Conflicts with existing CWC rivers

The automatic checks found a possible clash. Most are either a CWC river with a similar name nearby, which may be the same river already drawn, or a course that ends several km short of the river it should join, which may mean it joins another missing stream first.

| River (probable name) | State | km | Joins | HydroRIVERS reaches | Conflict | Notes |
|---|---|---|---|---|---|---|
| Mynriang | Assam | 71.8 | Kopili | 40936967 → 40928391 | runs along Amring (uid 9) for 8.1 km; 11% of it is on CWC lines; crosses Amring (uid 9); similar name nearby: Myntriang (uid 489) | OSM names the whole course 'Mynriang River'. CWC only has the last 13 km as 'Amring' (joins Kopili); CWC's 'Myntriang' (26 km) is a different line further north. Very wet catchment (mean flow ~70 m3/s). |
| Bagh | Madhya Pradesh | 41.6 | Bagh | 41148681 → 41149121 | similar name nearby: Bagh (uid 4323), Baghdwar (uid 9864) | OSM: Bagh, surya |
| Nambul | Manipur | 42.9 | Imphal/Manipur | 40981214 → 40993829 | ends 2.1 km from Imphal/Manipur, which it is said to join | OSM: Nambul River, Merakhong River, Luwanglei, Tagiu stream |
| Padma Nadi | Assam | 42.6 | Ranga | 40835015 → 40849623 | ends 6.0 km from Ranga, which it is said to join | OSM: Padma Nadi |
| Simang | Arunachal Pradesh | 39.3 | Dihang/Siang River | 40754352 → 40769301 | similar name nearby: Dihang/Siang River (uid 864), Sipang (uid 714), Sirang (uid 720) | OSM: Simang, Yobung Korong, Kabung, Subbung |
| Diyung | Assam | 38.3 | Dalaima | 40962269 → 40952568 | similar name nearby: Diyung (uid 175) | OSM: Diyung River, Barasang Nadi, Bara Daman Nadi, Dolong Nadi |
| Kaundinya | Andhra Pradesh | 38.3 | Kaundinya/Kanya | 41345456 → 41345156 | similar name nearby: Kaundinya/Kanya (uid 3806) | OSM labels this course Kaundinya. CWC 'Kaundinya/Kanya' (123 km) exists but its line follows a different headwater branch about 8 km away, so this branch (east of Mulbagal towards Palamaner) is not drawn. |
| Pacha | Arunachal Pradesh | 36.7 | Kameng | 40824912 → 40830930 | similar name nearby: Pachi (added 50021) | OSM: Pacha River |
| Pachi | Arunachal Pradesh | 36.5 | Kameng | 40819294 → 40823983 | similar name nearby: Pacha (added 50019) | OSM: Pachi River |
| Doyang | Nagaland | 32.3 | Doyang | 40942802 → 40926917 | similar name nearby: Doyang (uid 183) | OSM: Doyang, Doyang |
| Harha Nadi | Bihar | 34.0 | Bari Gandak Or Narayni | 40841210 → 40853730 | ends 2.5 km from Bari Gandak Or Narayni, which it is said to join; similar name nearby: Harha (uid 29414), Harha (uid 29416) | OSM: Harha Nadi, Bhagra Nadi, Tribeni canal, Doun canal |
| Khadi Nadi | Madhya Pradesh | 31.7 | Parbati | 40947833 → 40935054 | similar name nearby: Khari (uid 25606) | OSM: Khadi Nadi, Sukni Nadi, Paterla Nala |
| Langlong Nadi | Nagaland | 31.8 | Dhansiri or Dima | 40937923 → 40929790 | similar name nearby: Langting (uid 421) | OSM: Langlong Nadi |
| Prek Chu | Sikkim | 33.9 | Rangp chu | 40815359 → 40827357 | ends 5.2 km from Rangp chu, which it is said to join | OSM: Prek Chu, Rathong Chu |
| Talma | West Bengal | 55.1 | Karatoya | 40877572 → 40895743 | ends 8.6 km from Karatoya, which it is said to join | OSM: Talma River |
| Waleng Bung | Arunachal Pradesh | 31.3 | Kameng | 40794030 → 40803820 | ends 3.9 km from Kameng, which it is said to join | OSM: Waleng Bung, Kwapbo Bung, Hauwa Bung, Kameng River |
| Lilang Nadi | Meghalaya | 28.5 | Kopili | 40956122 → 40945021 | similar name nearby: Dilang Nala (uid 156) | OSM: Lilang Nadi, Rashu Nadi, Um Tarang |
| Naranipuzha | Kerala | 32.1 | Bharathapuzha/Ponnani | 41383557 → 41382744 | crosses Pottanur Todu (uid 9599) | OSM: Naranipuzha |
| Um Tarang | Meghalaya | 29.7 | Kopili | 40948410 → 40946238 | ends 4.4 km from Kopili, which it is said to join; similar name nearby: Um Trang (uid 815), Um Latang (uid 18981), Umayang (uid 19034) | OSM: Um Tarang, Rashu Nadi |
| Ashun Pani | Arunachal Pradesh | 24.9 | Dibang | 40772379 → 40769886 | similar name nearby: Asan Pani (uid 18) | OSM: Ashun Pani |
| Holongi | Assam | 29.7 | Brahmaputra River | 40853793 → 40863536 | ends 5.9 km from Brahmaputra River, which it is said to join | OSM: Holongi River, Kokila River |
| Jiya Nadi | Arunachal Pradesh | 30.1 | Kundil | 40783191 → 40792239 | ends 6.7 km from Kundil, which it is said to join | OSM: Jiya Nadi |
| Diphu | Assam | 31.9 | Jamuna | 40929293 → 40915434 | runs along Diphu (uid 165) for 5.8 km; 18% of it is on CWC lines; crosses Diphu (uid 165); similar name nearby: Diphupani/Chathe (uid 547), Diphu (uid 165) | OSM: Diphu River |
| Lali | Assam | 24.1 | Dihang/Siang River | 40798489 → 40806598 | ends 1.7 km from Dihang/Siang River, which it is said to join | OSM: Lali, 西棱河 |
| Tsulu | Arunachal Pradesh | 27.7 | Tangon | 40730205 → 40738028 | ends 5.8 km from Tangon, which it is said to join | OSM: Tsulu, Tangon |
| Yobung Korong | Arunachal Pradesh | 37.9 | Sirit | 40766445 → 40762945 | ends 16.2 km from Sirit, which it is said to join | OSM: Yobung Korong, Simang |
| Tangon | Arunachal Pradesh | 28.9 | Tangon | 40747306 → 40740865 | similar name nearby: Tangon (uid 761) | OSM: Tangon River |
| Tengapani | Arunachal Pradesh | 23.2 | Tenga Pani | 40812985 → 40804168 | similar name nearby: Tenga Pani (uid 772) | OSM: Tengapani, Tengapani River |
| Kosasthalaiyar | Tamil Nadu | 23.0 | Kallar | 41349093 → 41348796 | similar name nearby: Korttalaiyar/Kushasthalaiar (uid 3829) | OSM: Kosasthalaiyar River |
| Yursing Nala | Arunachal Pradesh | 31.3 | Siyom | 40739961 → 40740608 | ends 10.7 km from Siyom, which it is said to join | OSM: Yursing Nala, Lingsing Nala, 希丁河, Lingsing Nala |
| Pinglai | Maharashtra | 23.0 | Wardha River | 41160088 → 41161190 | ends 2.9 km from Wardha River, which it is said to join | OSM: Pinglai, Surya Ganga |
| Burtsa Nala | Ladakh | 53.9 | Shyok River | 40507870 → 40514361 | runs along Jiwan (uid 12962) for 2.9 km; 5% of it is on CWC lines; crosses Jiwan (uid 12962) | OSM: Burtsa Nala, Burtsa Nala, Depsang Nala, Raki Nala |
| Samar Lungpa | Ladakh | 67.5 | Shyok River | 40493949 → 40499535 | ends 28.0 km from Shyok River, which it is said to join; similar name nearby: Sanr Lungpa (uid 14652) | OSM: Samar Lungpa, Lungnak Lungpa, Chip Chap River |
| Bingliangou | Ladakh | 62.3 | Shyok River | 40505425 → 40501699 | ends 35.0 km from Shyok River, which it is said to join | OSM: Bingliangou, Track Junction Nullah, Chip Chap River |
| Depsang Nala | Ladakh | 35.6 | Jiwan | 40505201 → 40509172 | ends 12.2 km from Jiwan, which it is said to join | OSM: Depsang Nala, Burtsa Nala |

## 2. No conflict, but the name is not certain

These passed every check. The name comes from partial OpenStreetMap coverage or from inference, and the confidence is medium or low.

| River (probable name) | State | km | Joins | HydroRIVERS reaches | Why held back | OSM names along it |
|---|---|---|---|---|---|---|
| Harni | Maharashtra | 47.4 | Bori | 41245366 → 41252717 | Name confidence: medium. manual (geographic knowledge / web) | Harni |
| Lanka Jan | Assam | 47.9 | Kopili | 40921194 → 40918326 | Name confidence: medium. OSM waterway name along 31% of the uncovered course | Lanka Jan |
| Kanand N | Maharashtra | 41.0 | Nira | 41236803 → 41238706 | Name confidence: medium. OSM waterway name along 52% of the uncovered course | Kanand N, Welvandi Nala |
| Kasa | Maharashtra | 38.7 | Bhima River | 41254223 → 41249588 | Name confidence: medium. OSM waterway name along 48% of the uncovered course | Kasa |
| Amki | Assam | 37.3 | Amring | 40928838 → 40927918 | Name confidence: medium. OSM waterway name along 32% of the uncovered course | Amki River |
| Poke Chu | Sikkim | 35.1 | Zemu Chhu | 40809797 → 40804353 | Name confidence: medium. OSM waterway name along 38% of the uncovered course | Poke Chu |
| Selu | Arunachal Pradesh | 35.6 | Kamla | 40774816 → 40790667 | Name confidence: medium. OSM waterway name along 100% of the uncovered course | Selu River |
| Tosh Nallah | Himachal Pradesh | 32.3 | Parbati | 40606786 → 40611399 | Name confidence: medium. OSM waterway name along 67% of the uncovered course | Tosh Nallah, Tichu Nal, Phenkal Nala, Khadal Nala |
| Thongjaorok | Manipur | 34.2 | Khuga | 40993582 → 41004353 | Name confidence: medium. OSM waterway name along 36% of the uncovered course | Thongjaorok, Thingjaorok, Lower Nambol River, Yangoi River |
| Elon | Arunachal Pradesh | 32.7 | Matun | 40732932 → 40735765 | Name confidence: medium. OSM waterway name along 62% of the uncovered course | Elon, Elon River, Malu Pani |
| Ramman | Sikkim | 34.5 | Rangit | 40840983 → 40847237 | Name confidence: medium. OSM waterway name along 44% of the uncovered course | Ramman, Sirikhola River |
| Tipang Nadi | Assam | 29.9 | Tirap | 40844048 → 40833429 | Name confidence: low. OSM waterway name along 77% of the uncovered course | Tipang Nadi |
| Angong | Arunachal Pradesh | 28.4 | Dihang/Siang River | 40752671 → 40740396 | Name confidence: low. OSM waterway name along 95% of the uncovered course | Angong River |
| Ramrekha | Uttar Pradesh | 25.2 | Manwar | 40868481 → 40870440 | Name confidence: low. OSM waterway name along 65% of the uncovered course | Ramrekha River |
| Talwar | Maharashtra | 23.3 | Sina | 41223018 → 41225335 | Name confidence: medium. OSM waterway name along 50% of the uncovered course | Talwar |
| Chubi | Nagaland | 22.8 | Doyang | 40899087 → 40907289 | Name confidence: medium. OSM waterway name along 62% of the uncovered course | Chubi, Chubi |
| Mening | Nagaland | 22.1 | Jhanzi | 40891427 → 40882069 | Name confidence: low. OSM waterway name along 81% of the uncovered course | Mening |
| Kandajari | Chhattisgarh | 21.3 | Jonk | 41162970 → 41165437 | Name confidence: medium. OSM waterway name along 44% of the uncovered course | Kandajari, Kandajori Nadi |
| Tulum Puti Tokpo | Ladakh | 29.1 | Nubra/ Yarma Tsangpo | 40509905 → 40517204 | Name confidence: medium. OSM waterway name along 69% of the uncovered course | Tulum Puti Tokpo, Tulumputi, Taghman, Thangman Lungpa |

## 3. Other doubts

| River | State | km | Joins | HydroRIVERS reaches | Doubt |
|---|---|---|---|---|---|
| Makhri | Arunachal Pradesh | 42.2 | Tangon | 40727088 → 40740420 | My course comes out at 42 km, against the agent's 23 km: the reach chain probably runs on down a different river. Check where the Makhri really ends. |
| Jeong Nala | Ladakh | 60.5 | Jiwan | 40510853 → 40513541 | Passes every check, but it ends exactly at the head of the CWC "Jiwan", so the two may be one river under two names. There are also no towns nearby, so its descriptions fall back to plain "Ladakh". Decide whether Jeong Nala is the Jiwan's headstream before adding it. |
| Kosasthalaiyar | Tamil Nadu | 23.0 | Kallar | 41349093 → 41348796 | CWC already has this river as "Korttalaiyar/Kushasthalaiar" (uid 3829), starting where the Kallar ends. The OSM-named course is probably a branch of the same system. |
| Chautang (Drishadvati) | Haryana / Rajasthan | ~620 | Ghaggar | 40686058 → … | A real river CWC lacks, from Ladwa past Jind and Hisar towards Suratgarh. Mostly dry or canalised, and HydroRIVERS routes it across the flat plain and on through Pakistan to the Rann, so its line is unreliable. It needs a hand-drawn or OSM course. |

## 4. Not checked: disputed areas, the arid north-west, and non-Latin names

Disputed-area rivers are held back by policy. Arid-zone HydroRIVERS courses are often invented flow paths across dunes. Non-Latin names need a recognised English or local name first.

| Probable name | Region | State | km | Catchment km² | Joins | HydroRIVERS reaches | Name confidence | Notes |
|---|---|---|---|---|---|---|---|---|
| Chautang (Drishadvati) palaeochannel, continued by HydroRIVERS as Ghaggar-Hakra-Nara | arid-NW | Rajasthan | 619.6 | 319156.2 |  | 40686058 → 41030263 | medium | From near Ladwa (Kurukshetra) past Jind, Hisar, Bhadra and Nohar to the Ghaggar line near Suratgarh. That matches the Chautang, a mostly dry or canalised seasonal stream that CWC lacks: CWC has nothing within 30 km of Hisar. Past Suratgarh, HydroRIVERS sends it through Pakistan (Hakra/Nara) and back into the Rann of Kutch, carrying modelled Indus overflow - that part is synthetic. |
| possibly Kantli headwaters plus a synthetic desert extension | arid-NW | Rajasthan | 258.3 | 4964.4 | Ghagghar | 40810630 → 40722919 | low | Starts near Sikar and runs to near Nohar. The real Kantli dies out in the dunes around Jhunjhunu; HydroRIVERS continues it as a DEM flow path. |
| Sameliya Nadi | arid-NW | Rajasthan | 78.4 | 1415.4 | Khari | 40937828 → 40928782 | high |  |
| Khari Nadi | arid-NW | Rajasthan | 63.2 | 660.3 | Khari | 40945900 → 40929234 | low |  |
| Jagran | disputed-PoK | Jammu and Kashmir | 39.2 | 423.3 | Kishanganga | 40521820 → 40528763 | high |  |
| Shonthar Nala | disputed-PoK | Jammu and Kashmir | 38.5 | 629.4 | Kishanganga | 40511813 → 40519588 | high |  |
| Bundar Nala | disputed-PoK | Jammu and Kashmir | 22.2 | 150.5 | Kishanganga | 40512551 → 40516559 | high |  |
| Gyong | disputed-Saltoro | Ladakh | 59.6 | 988.9 | Shyok River | 40510522 → 40508167 | medium |  |
| Dansam | disputed-Saltoro | Ladakh | 20.3 | 152.1 | Shyok River | 40511664 → 40507536 | medium |  |
| Shengli He | disputed-AksaiChin | Ladakh | 63.8 | 737.3 |  | 40506299 → 40503111 | high |  |
| Kugrang River | disputed-AksaiChin | Ladakh | 49.7 | 579.5 | Chang Cheamo | 40529030 → 40535036 | high |  |
| Changlung | disputed-AksaiChin | Ladakh | 48.7 | 1241 | Chang Cheamo | 40528913 → 40536693 | high |  |
| Huangyanggou | disputed-AksaiChin | Ladakh | 45.7 | 382 |  | 40525684 → 40519938 | medium |  |
| 清水沟 | disputed-AksaiChin | Ladakh | 42.8 | 405.2 | Galwan R | 40515123 → 40522269 | high |  |
| 风口沟 | disputed-AksaiChin | Ladakh | 32.8 | 301.6 |  | 40508867 → 40510040 | high |  |
| Chorten Lungpa | disputed-AksaiChin | Ladakh | 26.7 | 126.3 |  | 40492568 → 40492568 | high |  |
| Chip Chap River | disputed-AksaiChin | Ladakh | 25.6 | 184.5 | Jiwan | 40501367 → 40501700 | high |  |
| Jiulongchong | disputed-AksaiChin | Ladakh | 24 | 156.7 | Galwan R | 40527093 → 40524371 | high |  |
| 黑河 | disputed-AksaiChin | Ladakh | 21.2 | 220.7 | Galwan R | 40517359 → 40518824 | high |  |
| Gayã River | main | Arunachal Pradesh | 34.9 | 287.8 | Bishum Chu/ Biehom | 40827110 → 40836140 | high |  |
| 惹米河 | main | Arunachal Pradesh | 22.9 | 121.5 | Siyum | 40779088 → 40787987 | high |  |

## 5. Largest unnamed gaps (humid zone)

These are real courses CWC lacks, but no name could be found. They are ranked by catchment. Four of the largest are probably not separate rivers but HydroRIVERS routing the same water differently in flat plains; see the notes.

| HydroRIVERS reaches | State | km | Catchment km² | Joins | Near | Notes |
|---|---|---|---|---|---|---|
| 40851474 → 40870527 | Assam | 73.7 | 970.9 | Brahmaputra River | source: Naharlagun 9km; mouth: Bokākhāt 12km; nearest 50k+ town to midpoint: Itanagar 21km | Guess: may be the Dikrong system. CWC has 'Dikrang' (68 km), drawn about 7 km away. OSM has 'Kokila' and 'Holongi' along parts of it. In the flat Brahmaputra floodplain HydroRIVERS routing is unreliable. |
| 41119720 → 41133196 | Mizoram | 23.1 | 876.4 | Koladyne/Tuipui | source: Tuichawngtlang 23km; mouth: Bondukbangsora 30km; nearest 50k+ town to midpoint: Bāndarban 71km |  |
| 41331088 → 41327877 | Karnataka | 54.3 | 823.4 | Hagari Or Vedavati | source: Pāvugada 20km; mouth: Challakere 24km; nearest 50k+ town to midpoint: Sīra 36km |  |
| 40998755 → 40961713 | Bihar | 91.9 | 814.9 | Dardha | source: Sherghāti 8km; mouth: Jahānābād 1km; nearest 50k+ town to midpoint: Gaya 11km | Runs 3-7 km from CWC Morhar, Phalgu and Dardha the whole way from near Sherghati past Gaya to Jahanabad. Probably HydroRIVERS mis-routing in the flat Gaya plain, not a separate river. |
| 41245742 → 41253887 | Maharashtra | 53.9 | 741.2 | Sina | source: Tuljāpur 9km; mouth: Sholapur 14km; nearest 50k+ town to midpoint: Sholapur 10km |  |
| 40928125 → 40911890 | Assam | 58 | 705.9 | Brahmaputra River | source: Tura 28km; mouth: Dhubri 7km; nearest 50k+ town to midpoint: Dhubri 25km |  |
| 41374704 → 41377875 | Tamil Nadu | 50.9 | 698.4 | Tirumanimuttar | source: Puduppatti 1km; mouth: Paramati 7km; nearest 50k+ town to midpoint: Rasipuram 12km |  |
| 41301296 → 41303182 | Karnataka | 47 | 688.4 | Marali Halla | source: Kushtagi 24km; mouth: Kampli 4km; nearest 50k+ town to midpoint: Gangavati 12km |  |
| 41345525 → 41339202 | Karnataka | 54.7 | 659.4 | Veda | source: Arsikere 16km; mouth: Kadūr 13km; nearest 50k+ town to midpoint: Arsikere 13km |  |
| 41230756 → 41237407 | Maharashtra | 51.2 | 614.7 | Chandni | source: Bhoom 10km; mouth: Paranda 5km; nearest 50k+ town to midpoint: Barshi 19km |  |
| 40926375 → 40908536 | Meghalaya | 61.9 | 600.2 | Urpad | source: Nidanpur Pt-II 28km; mouth: Kharijapikon 7km; nearest 50k+ town to midpoint: Goālpāra 29km |  |
| 41315074 → 41318654 | Andhra Pradesh | 53.4 | 553.2 | Pennar River | source: Gopavaram 30km; mouth: Kāmalāpuram 7km; nearest 50k+ town to midpoint: Proddatūr 21km |  |
| 41329180 → 41325237 | Karnataka | 39.8 | 552.8 | Hagari Or Vedavati | source: Pāvugada 21km; mouth: Challakere 25km; nearest 50k+ town to midpoint: Challakere 39km |  |
| 41335166 → 41329780 | Karnataka | 54.6 | 548.2 | Pennar River | source: Madhugiri 11km; mouth: Pāvugada 16km; nearest 50k+ town to midpoint: Hindupur 22km |  |
| 40819820 → 40845325 | Assam | 67.4 | 537.7 | Subansiri | source: Dhemāji 26km; mouth: North Lakhimpur 13km; nearest 50k+ town to midpoint: North Lakhimpur 21km |  |
| 40756560 → 40780126 | Uttar Pradesh | 78.2 | 533.3 | Kali River | source: Saidpur 5km; mouth: Pahāsu 9km; nearest 50k+ town to midpoint: Jahāngīrābād 8km | Parallels CWC 'Nim Drain' / 'Nim Drainage Cut' about 6 km to the west, from near Hapur to the Kali Nadi. Could be the old Nim Nadi course or a routing artefact; there is no OSM name. |
| 41298811 → 41293843 | Andhra Pradesh | 36.6 | 530.3 | Tungabhadra River | source: Adoni 6km; mouth: Kosigi 17km; nearest 50k+ town to midpoint: Emmiganūr 17km |  |
| 40950482 → 40950946 | Uttar Pradesh | 47.9 | 524 | Varuna | source: Handiā 7km; mouth: Bhadohi 5km; nearest 50k+ town to midpoint: Gyānpur 7km |  |
| 41349532 → 41352093 | Karnataka | 26.3 | 493.9 | Hemavathi | source: Channarāyapatna 13km; mouth: Channarāyapatna 10km; nearest 50k+ town to midpoint: Hassan 36km |  |
| 40933588 → 40926155 | Meghalaya | 42.2 | 485.9 | Khri | source: Mairang 10km; mouth: Sanpara 28km; nearest 50k+ town to midpoint: Mawlai-Mawïong 37km |  |
| 41225443 → 41233424 | Maharashtra | 48.3 | 481.3 | Sina | source: Jāmkhed 22km; mouth: Karmāla 16km; nearest 50k+ town to midpoint: Barshi 43km |  |
| 41252844 → 41259537 | Maharashtra | 40.2 | 476.1 | Bhima River | source: Sholapur 17km; mouth: Indi 23km; nearest 50k+ town to midpoint: Sholapur 25km |  |
| 40841777 → 40853799 | Assam | 36.9 | 475.3 | Subansiri | source: Naharlagun 19km; mouth: Bihpuriāgaon 13km; nearest 50k+ town to midpoint: North Lakhimpur 21km |  |
| 40870273 → 40858186 | Assam | 40.9 | 470.3 | Dikhow | source: Naginimora 10km; mouth: Sibsāgar 12km; nearest 50k+ town to midpoint: Sibsāgar 15km |  |
| 40862524 → 40877610 | Assam | 49.1 | 466.9 | Brahmaputra River | source: Biswanath Chariali 25km; mouth: Gutlong Gaon 16km; nearest 50k+ town to midpoint: Tezpur 27km |  |

The full list of 694 courses, with all fields, came from the scratch analysis (`candidates.json`). Ask Claude to regenerate it if needed.
