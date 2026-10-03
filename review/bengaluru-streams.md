# Bengaluru streams

Updated 2026-10-03. Three passes:

1. The seven main channels of the Koramangala–Challaghatta and Hebbal valleys.
2. The rest of the network inside Bengaluru Urban district, and the Vrishabhavathi's branches.
3. The same test with **no district limit**: every natural stream in the area the data covers (about 60 km square around the city: 12.70–13.26 N, 77.33–77.90 E).

## References used

These decided **what** to draw. No line was traced from them; every course comes from OpenStreetMap, or from HydroRIVERS where OSM has no connected channel.

- Paani.Earth: "Hydrology of Bengaluru Urban District" map; the Vrishabhavathi, Arkavathi and Dakshina Pinakini basin maps; the note on the Vrishabhavathi's origin.
- Lake Development Authority / STUP: "Map Showing Lakes in Bengaluru City (Entire BDA Area)", with primary and secondary storm-water drains.
- WELL Labs lakes-and-streams map (via OpenCity), the valley drainage figure, and the "Important lake series in Bengaluru region" map.

## The rule: natural streams only

A course is drawn if it is not tagged `waterway=canal` in OSM, is not named as a diversion, bypass, sewer or channel, **runs downhill** in elevation data (at least 70% of its length, with a net fall), and has at least one of:

1. **HydroRIVERS:** half or more of it lies within 0.5 km of a HydroRIVERS drainage line.
2. **Valley floor:** at 45% or more of points along it, the ground 250 m to either side is higher (AWS Terrain Tiles, SRTM-based). Calibrated on rivers already drawn (45–96%) against ridge lines and roads (16–23%).
3. **Tank chain:** it runs through, starts at or ends at a lake of 2 ha or more.

A HydroRIVERS drainage line passes by definition: it is a valley traced from elevation data, draining 10 km² or more.

There is **no administrative limit**. A stream is left out only if it fails the test, cannot be drawn (see below), or lies outside the area the data covers.

How the network was assembled:

- OSM waterways were joined into one graph. Gaps of up to 80 m (culverts) are bridged, lakes are crossed from inlet to outlet, and a piece that stops within 0.5 km of the network is joined at its closest point.
- Each stream is followed **upstream** from where it meets a river already on the map, which fixes its direction of flow. At a junction the longer branch carries on.
- A stream that climbs before it falls has crossed a ridge through linked field ditches; it is started at its highest point.
- Where a HydroRIVERS valley has no drawn river along it, the valley itself is drawn from HydroRIVERS, from its head to the river it joins. These lines are coarser than OSM's.
- Minimum length: 2 km.

## The Vrishabhavathi's branches

| River | Change | Why |
|---|---|---|
| Vrishabhavati (7707) | Head moved to the eastern branch, from the Nandi Teertha temple near Sankey Tank; lower end carried on to the Arkavati. 61.1 km → 68.8 km. | CWC drew the Peenya branch as the head. The district gazetteer, IISc, Paani.Earth and OSM all put the source in Malleshwaram / Basavanagudi; only the pollution board says Peenya. Paani gives 69 km. |
| Nagarbhavi Thorai (40051) | New: Peenya → Laggere → Nagarbhavi → the Vrishabhavati near Bangalore University. | This is the stretch CWC drew as the Vrishabhavati's head. OSM and Paani call it the Nagarbhavi. |
| Suvarnamukhi (7599) | Ends at the Vrishabhavati north of Kanakapura. | CWC ran it on to the Arkavati with the Vrishabhavati as its tributary. Paani and common usage have it the other way round. |

**Open question, not changed:** Paani marks the Suvarnamukhi's origin in the Bannerghatta hills. On this map that stream is CWC's "Shantivan Halla" and "Tattaguppe Halla", which join the Suvarnamukhi near Somanahalli. CWC, HydroRIVERS and OSM all carry the name up the longer northern branch through Anjanapura, so it was left as it is.

## Drawn

**First pass and the Nagarbhavi (8):**

| UID | Name | Course |
|---|---|---|
| 40044 | Koramangala Valley (K-100) | Majestic → Shanthinagar → Koramangala → Bellandur Lake |
| 40045 | Challaghatta Valley (C-100) | Vasanth Nagar → Halasuru → Indiranagar → Bellandur Lake |
| 40046 | Unnamed | Bellandur Lake → Varthur Lake → the Dakshina Pinakini |
| 40047 | Hebbal Valley (H-200) | Yeshwanthpur → Hebbal Lake → Nagavara Lake → joins H-300 |
| 40048 | Hebbal Valley (H-300) | Cooke Town → HBR Layout → near Bileshivale |
| 40049 | Unnamed | Near Bileshivale → Yellamallappa Chetty Lake |
| 40050 | Hebbal Valley (BD-423) | Yellamallappa Chetty Lake → the Dakshina Pinakini near Koralur |
| 40051 | Nagarbhavi Thorai | Peenya → Laggere → Nagarbhavi → the Vrishabhavati |

**Vrishabhavathi valley (to the Arkavati) (23 streams, 122 km):**

| UID | Name | From → to | km | Evidence | Joins |
|---|---|---|---|---|---|
| 40052 | Unnamed | Herohalli, Bengaluru → The Vrishabhavati near Kumbalgodu, south-west of Bengaluru | 16.3 | HydroRIVERS 74%; valley floor 78%; tank chain | Vrishabhavati (7707) |
| 40053 | Sonnenahalli | Herohalli, Bengaluru → The Vrishabhavati near Kengeri, Bengaluru | 12.7 | HydroRIVERS 56%; valley floor 85%; tank chain | Vrishabhavati (7707) |
| 40054 | Channasandra | JP Nagar, Bengaluru → The Vrishabhavati near Rajarajeshwari Nagar, Bengaluru | 12 | HydroRIVERS 82%; valley floor 97%; tank chain | Vrishabhavati (7707) |
| 40055 | Kathriguppe | Jayanagar, Bengaluru → The Vrishabhavati near Rajarajeshwari Nagar, Bengaluru | 8.1 | valley floor 80%; tank chain | Vrishabhavati (7707) |
| 40056 | Vrishabhavati Valley (V-207) | Vijayanagar, Bengaluru → The Vrishabhavati near Rajarajeshwari Nagar, Bengaluru | 4.1 | valley floor 84% | Vrishabhavati (7707) |
| 40057 | Vrishabhavati Valley (V-116) | Basaveshwaranagar, Bengaluru → The Vrishabhavati near Vijayanagar, Bengaluru | 3.6 | valley floor 87% | Vrishabhavati (7707) |
| 40058 | Vrishabhavati Valley (V-112) | Mahalakshmi Layout, Bengaluru → The Vrishabhavati near Rajajinagar, Bengaluru | 3.3 | valley floor 74%; tank chain | Vrishabhavati (7707) |
| 40059 | Vrishabhavati Valley (V-120) | Chamarajpet, Bengaluru → The Vrishabhavati near Vijayanagar, Bengaluru | 3.3 | valley floor 100%; tank chain | Vrishabhavati (7707) |
| 40060 | Unnamed | Kengeri, Bengaluru → The Vrishabhavati near Kengeri, Bengaluru | 2.8 | valley floor 48%; tank chain | Vrishabhavati (7707) |
| 40061 | Unnamed | Kumbalgodu, south-west of Bengaluru → The Vrishabhavati near Kumbalgodu, south-west of Bengaluru | 2.5 | HydroRIVERS 100%; valley floor 88%; tank chain | Vrishabhavati (7707) |
| 40062 | Unnamed | Kengeri, Bengaluru → The Vrishabhavati near Kengeri, south-west of Bengaluru | 2.2 | valley floor 87%; tank chain | Vrishabhavati (7707) |
| 40063 | Unnamed | Tavarekere, west of Bengaluru → Kumbalgodu, south-west of Bengaluru | 9.9 | HydroRIVERS 88%; valley floor 83%; tank chain | unnamed (40052) |
| 40064 | Unnamed | Kommaghatta, Bengaluru → Kommaghatta, west of Bengaluru | 5.1 | valley floor 89% | unnamed (40052) |
| 40065 | Vrishabhavati Valley (V-300) | Banashankari, Bengaluru → The Kathriguppe near Rajarajeshwari Nagar, Bengaluru | 3.8 | valley floor 85% | Kathriguppe (40055) |
| 40066 | Unnamed | Herohalli, Bengaluru → The Sonnenahalli near Kengeri, Bengaluru | 3 | valley floor 72%; tank chain | Sonnenahalli (40053) |
| 40067 | Unnamed | Herohalli, west of Bengaluru → Herohalli, Bengaluru | 2.3 | valley floor 83%; tank chain | unnamed (40052) |
| 40068 | Unnamed | Nagarbhavi, Bengaluru → Mallathahalli Lake, Bengaluru | 2.3 | valley floor 88%; tank chain | Sonnenahalli (40053) |
| 40069 | Unnamed | Ramohalli, west of Bengaluru → Kommaghatta, west of Bengaluru | 4.5 | HydroRIVERS 83%; valley floor 96%; tank chain | unnamed (40063) |
| 40070 | Unnamed | Kommaghatta, west of Bengaluru → Kommaghatta, south-west of Bengaluru | 3 | valley floor 91%; tank chain | unnamed (40063) |
| 40071 | Vrishabhavati Valley (V-201) | Laggere, Bengaluru → The Nagarbhavi Thorai near Basaveshwaranagar, Bengaluru | 2.7 | valley floor 93%; tank chain | Nagarbhavi Thorai (40051) |
| 40072 | Vrishabhavati Valley (V-202) | Yeswanthpur, Bengaluru → The Nagarbhavi Thorai near Laggere, Bengaluru | 2.7 | valley floor 96% | Nagarbhavi Thorai (40051) |
| 40073 | Unnamed | Gottigere, Bengaluru → The Suvarnamukhi near Kaggalipura, south of Bengaluru | 9 | HydroRIVERS 56%; valley floor 95%; tank chain | Suvarnamukhi (7599) |
| 40074 | Unnamed | Konanakunte, Bengaluru → The Suvarnamukhi near Anjanapura, Bengaluru | 3.2 | valley floor 74%; tank chain | Suvarnamukhi (7599) |

**Koramangala–Challaghatta valley (to the Dakshina Pinakini) (26 streams, 116 km):**

| UID | Name | From → to | km | Evidence | Joins |
|---|---|---|---|---|---|
| 40075 | Koramangala Valley (K-209) | Jayanagar, Bengaluru → Koramangala Valley (K-100) near HSR Layout, Bengaluru | 11.9 | HydroRIVERS 63%; valley floor 47%; tank chain | Koramangala Valley (K-100) (40044) |
| 40076 | Koramangala Valley (K-103) | Shivajinagar, Bengaluru → Koramangala Valley (K-100) near Koramangala, Bengaluru | 3.4 | valley floor 83%; tank chain | Koramangala Valley (K-100) (40044) |
| 40077 | Unnamed | Bellandur, Bengaluru → Koramangala Valley (K-100) near HSR Layout, Bengaluru | 3.2 | HydroRIVERS 100%; tank chain | Koramangala Valley (K-100) (40044) |
| 40078 | Koramangala Valley (K-110) | Basavanagudi, Bengaluru → Koramangala Valley (K-100) near Shanti Nagar, Bengaluru | 2.7 | valley floor 54% | Koramangala Valley (K-100) (40044) |
| 40079 | Koramangala Valley (K-101) | Koramangala, Bengaluru → Koramangala Valley (K-100) near Koramangala, Bengaluru | 2.1 | valley floor 95% | Koramangala Valley (K-100) (40044) |
| 40080 | Koramangala Valley (K-113) | Koramangala, Bengaluru → Koramangala Valley (K-100) near Koramangala, Bengaluru | 2 | HydroRIVERS 100%; valley floor 55% | Koramangala Valley (K-100) (40044) |
| 40081 | Unnamed | Begur, Bengaluru → Koramangala Valley (K-209) near HSR Layout, Bengaluru | 8.6 | HydroRIVERS 75%; valley floor 77%; tank chain | Koramangala Valley (K-209) (40075) |
| 40082 | Koramangala Valley (K-200) | Jayanagar, Bengaluru → Koramangala Valley (K-209) near BTM Layout, Bengaluru | 4.8 | valley floor 68%; tank chain | Koramangala Valley (K-209) (40075) |
| 40083 | Unnamed | Hulimavu, Bengaluru → Koramangala Valley (K-209) near BTM Layout, Bengaluru | 4.7 | HydroRIVERS 89%; valley floor 88%; tank chain | Koramangala Valley (K-209) (40075) |
| 40084 | Unnamed | Kudlu, Bengaluru → Koramangala Valley (K-209) near HSR Layout, Bengaluru | 3.2 | valley floor 58% | Koramangala Valley (K-209) (40075) |
| 40085 | Challaghatta Valley (C-200) | RT Nagar, Bengaluru → Challaghatta Valley (C-100) near Halasuru (Ulsoor), Bengaluru | 4.9 | valley floor 71% | Challaghatta Valley (C-100) (40045) |
| 40086 | Challaghatta Valley (C-105) | Byrasandra Melina Kere, Bengaluru → Challaghatta Valley (C-100) near Domlur, Bengaluru | 3.6 | valley floor 50% | Challaghatta Valley (C-100) (40045) |
| 40087 | Challaghatta Valley (C-104) | Baiyappanahalli, Bengaluru → Challaghatta Valley (C-100) near Halasuru (Ulsoor), Bengaluru | 2.5 | valley floor 56%; tank chain | Challaghatta Valley (C-100) (40045) |
| 40088 | Challaghatta Valley (C-103) | Domlur, Bengaluru → Challaghatta Valley (C-100) near Domlur, Bengaluru | 2.1 | valley floor 70% | Challaghatta Valley (C-100) (40045) |
| 40089 | Challaghatta Valley (C-204) | Lingarajapuram, Bengaluru → Challaghatta Valley (C-200) near Halasuru (Ulsoor), Bengaluru | 2.1 | valley floor 73% | Challaghatta Valley (C-200) (40085) |
| 40090 | Unnamed | Singasandra, Bengaluru → Bellandur, Bengaluru | 11.3 | HydroRIVERS 59%; valley floor 78%; tank chain | unnamed (40046) |
| 40091 | Unnamed | Baiyappanahalli, Bengaluru → Marathahalli, Bengaluru | 9.1 | HydroRIVERS 68%; valley floor 58%; tank chain | unnamed (40046) |
| 40092 | Unnamed | Dommasandra, south-east of Bengaluru → Panathur, Bengaluru | 7.4 | HydroRIVERS 58%; valley floor 67%; tank chain | unnamed (40046) |
| 40093 | Unnamed | Kundalahalli, Bengaluru → Varthur, east of Bengaluru | 4.3 | valley floor 67%; tank chain | unnamed (40046) |
| 40094 | Unnamed | Kundalahalli, Bengaluru → Panathur, Bengaluru | 4 | valley floor 73% | unnamed (40046) |
| 40095 | Unnamed | Varthur, east of Bengaluru → Varthur, east of Bengaluru | 3.3 | valley floor 51% | unnamed (40046) |
| 40096 | Unnamed | Panathur, Bengaluru → Panathur, Bengaluru | 2.4 | HydroRIVERS 56%; tank chain | unnamed (40046) |
| 40097 | Unnamed | Mahadevapura, Bengaluru → Marathahalli, Bengaluru | 4 | HydroRIVERS 52%; valley floor 60% | unnamed (40091) |
| 40098 | Unnamed | Carmelaram Lake, Bengaluru → Gunjur, east of Bengaluru | 3.2 | HydroRIVERS 91%; valley floor 64% | unnamed (40092) |
| 40099 | Unnamed | C V Raman Nagar, Bengaluru → Marathahalli, Bengaluru | 2.7 | valley floor 90% | unnamed (40091) |
| 40100 | Unnamed | Varthur, east of Bengaluru → Varthur, east of Bengaluru | 2.2 | valley floor 61% | unnamed (40095) |

**Hebbal valley (to the Dakshina Pinakini) (22 streams, 102 km):**

| UID | Name | From → to | km | Evidence | Joins |
|---|---|---|---|---|---|
| 40101 | Unnamed | Chikkajala, north of Bengaluru → Hebbal Valley (H-200) near Nagavara, Bengaluru | 21.2 | HydroRIVERS 75%; valley floor 69%; tank chain | Hebbal Valley (H-200) (40047) |
| 40102 | Unnamed | Vidyaranyapura, Bengaluru → Hebbal Valley (H-200) near Sahakara Nagar, Bengaluru | 5.7 | valley floor 57% | Hebbal Valley (H-200) (40047) |
| 40103 | Unnamed | RT Nagar, Bengaluru → Hebbal Valley (H-200) near Hebbal, Bengaluru | 4.5 | valley floor 70% | Hebbal Valley (H-200) (40047) |
| 40104 | Hebbal Valley (H-201) | Sadashivanagar, Bengaluru → Hebbal Valley (H-200) near Mathikere, Bengaluru | 2.8 | valley floor 83% | Hebbal Valley (H-200) (40047) |
| 40105 | Hebbal Valley (H-205) | Jalahalli, Bengaluru → Hebbal Valley (H-200) near Mathikere, Bengaluru | 2.5 | valley floor 81% | Hebbal Valley (H-200) (40047) |
| 40106 | Unnamed | Hebbal, Bengaluru → Hebbal Valley (H-200) near Hebbal, Bengaluru | 2.3 | valley floor 60% | Hebbal Valley (H-200) (40047) |
| 40107 | Unnamed | Yelahanka, Bengaluru → Yelahanka, Bengaluru | 3.9 | valley floor 49%; tank chain | unnamed (40101) |
| 40108 | Unnamed | Yelahanka, north of Bengaluru → Yelahanka, Bengaluru | 3.4 | valley floor 60%; tank chain | unnamed (40101) |
| 40109 | Unnamed | Jakkur, Bengaluru → Jakkur, Bengaluru | 3 | valley floor 94%; tank chain | unnamed (40101) |
| 40110 | Unnamed | Jalahalli, Bengaluru → Vidyaranyapura, Bengaluru | 2.6 | valley floor 59% | unnamed (40102) |
| 40111 | Hebbal Valley (H-101) | RT Nagar, Bengaluru → Hebbal, Bengaluru | 2.5 | valley floor 100% | unnamed (40103) |
| 40112 | Unnamed | Sahakara Nagar, Bengaluru → Jakkur, Bengaluru | 2.2 | valley floor 79% | unnamed (40101) |
| 40113 | Hebbal Valley (BP-191) | Jakkur, Bengaluru → Hebbal Valley (H-300) near Hennur, Bengaluru | 5.1 | valley floor 79%; tank chain | Hebbal Valley (H-300) (40048) |
| 40114 | Hebbal Valley (H-400) | Banaswadi, Bengaluru → Hebbal Valley (H-300) near Hennur, Bengaluru | 4.6 | valley floor 66% | Hebbal Valley (H-300) (40048) |
| 40115 | Unnamed | Frazer Town, Bengaluru → Hebbal Valley (H-300) near HBR Layout, Bengaluru | 3.6 | valley floor 81% | Hebbal Valley (H-300) (40048) |
| 40116 | Unnamed | Bagalur, north-east of Bengaluru → Horamavu, Bengaluru | 8.5 | HydroRIVERS 70%; valley floor 79%; tank chain | unnamed (40049) |
| 40117 | Unnamed | Ramamurthy Nagar, Bengaluru → Yellamallappa Chetty Lake, east of Bengaluru | 8.3 | valley floor 68%; tank chain | unnamed (40049) |
| 40118 | Unnamed | Ramamurthy Nagar, Bengaluru → Horamavu, Bengaluru | 3.1 | valley floor 58%; tank chain | unnamed (40049) |
| 40119 | Unnamed | Horamavu, Bengaluru → Horamavu, Bengaluru | 2.4 | valley floor 58%; tank chain | unnamed (40049) |
| 40120 | Unnamed | KR Puram, Bengaluru → KR Puram, Bengaluru | 2.3 | valley floor 75% | unnamed (40117) |
| 40121 | Unnamed | Hoodi, Bengaluru → Hebbal Valley (BD-423) near Kadugodi, east of Bengaluru | 5.5 | valley floor 77%; tank chain | Hebbal Valley (BD-423) (40050) |
| 40122 | Hebbal Valley (MD-284) | Hoodi, Bengaluru → Hoodi, Bengaluru | 2.2 | valley floor 71%; tank chain | unnamed (40121) |

**North: straight to the Dakshina Pinakini (5 streams, 44 km):**

| UID | Name | From → to | km | Evidence | Joins |
|---|---|---|---|---|---|
| 40123 | Unnamed | Chikkajala, north of Bengaluru → The Dakshina Pinakini near Budigere, north-east of Bengaluru | 21.1 | HydroRIVERS 79%; valley floor 58%; tank chain | Dakshina Pinakini (4132) |
| 40124 | Unnamed | Chikkajala, north of Bengaluru → Budigere Lake, north-east of Bengaluru | 14.3 | HydroRIVERS 80%; valley floor 78%; tank chain | unnamed (40123) |
| 40125 | Unnamed | Chikkajala, north of Bengaluru → Chikkajala, north of Bengaluru | 3.3 | valley floor 65%; tank chain | unnamed (40123) |
| 40126 | Unnamed | Bagalur, north-east of Bengaluru → Gummanahalli Lake, north-east of Bengaluru | 3.1 | HydroRIVERS 51%; valley floor 85%; tank chain | unnamed (40124) |
| 40127 | Unnamed | Bagalur, north of Bengaluru → Bagaluru Kere, north of Bengaluru | 2.5 | valley floor 46%; tank chain | unnamed (40124) |

**West: straight to the Arkavati (11 streams, 72 km):**

| UID | Name | From → to | km | Evidence | Joins |
|---|---|---|---|---|---|
| 40128 | Unnamed | Peenya, Bengaluru → The Arkavati near Madanayakanahalli, north-west of Bengaluru | 11.6 | HydroRIVERS 63%; valley floor 83%; tank chain | Arkavati (7730) |
| 40129 | Unnamed | Jalahalli, Bengaluru → The Arkavati near Chikkabanavara, north-west of Bengaluru | 10.6 | HydroRIVERS 51%; valley floor 82%; tank chain | Arkavati (7730) |
| 40130 | Unnamed | Laggere, Bengaluru → The Arkavati near Madanayakanahalli, west of Bengaluru | 10.4 | HydroRIVERS 60%; valley floor 77%; tank chain | Arkavati (7730) |
| 40131 | Unnamed | Chikkabanavara, north-west of Bengaluru → The Arkavati near Hesaraghatta, north-west of Bengaluru | 8.1 | valley floor 55%; tank chain | Arkavati (7730) |
| 40132 | Unnamed | Hesaraghatta, north-west of Bengaluru → Hesaraghatta Lake, north-west of Bengaluru | 6.9 | HydroRIVERS 98%; valley floor 45%; tank chain | Arkavati (7730) |
| 40133 | Unnamed | Herohalli, Bengaluru → Herohalli, west of Bengaluru | 5.5 | valley floor 73%; tank chain | unnamed (40130) |
| 40134 | Unnamed | Nagasandra, Bengaluru → Madanayakanahalli, north-west of Bengaluru | 5.1 | valley floor 67% | unnamed (40128) |
| 40135 | Unnamed | Vidyaranyapura, Bengaluru → Chikkabanavara Lake, north-west of Bengaluru | 5 | valley floor 81%; tank chain | unnamed (40129) |
| 40136 | Unnamed | Laggere, Bengaluru → Herohalli, Bengaluru | 3.6 | valley floor 89% | unnamed (40130) |
| 40137 | Unnamed | Mallasandra Lake, Bengaluru → Chikkabanavara, Bengaluru | 2.8 | valley floor 90%; tank chain | unnamed (40129) |
| 40138 | Unnamed | Nagasandra, Bengaluru → Nagasandra, Bengaluru | 2.5 | valley floor 70% | unnamed (40128) |

**South: to the Chinnar (8 streams, 51 km):**

| UID | Name | From → to | km | Evidence | Joins |
|---|---|---|---|---|---|
| 40139 | Unnamed | Electronic City, Bengaluru → The Chinnar near Attibele, south-east of Bengaluru | 17.7 | HydroRIVERS 61%; valley floor 54%; tank chain | Chinnar (3718) |
| 40140 | Unnamed | Bannerghatta, south of Bengaluru → The Chinnar near Jigani, south of Bengaluru | 12.6 | valley floor 62%; tank chain | Chinnar (3718) |
| 40141 | Unnamed | Hebbagodi, south-east of Bengaluru → The Chinnar near Chandapura, south-east of Bengaluru | 7.7 | HydroRIVERS 63%; valley floor 71%; tank chain | Chinnar (3718) |
| 40142 | Unnamed | Gudahatti Lake, south-east of Bengaluru → Bidaraguppe Lake, south-east of Bengaluru | 2.8 | valley floor 67%; tank chain | Chinnar (3718) |
| 40143 | Unnamed | Hennagara, south of Bengaluru → The Chinnar near Jigani, south of Bengaluru | 2.4 | valley floor 84% | Chinnar (3718) |
| 40144 | Unnamed | Kachanayakanahalli Lake, south-east of Bengaluru → The Chinnar near Hennagara, south-east of Bengaluru | 2.2 | valley floor 52%; tank chain | Chinnar (3718) |
| 40145 | Unnamed | Huskur, south-east of Bengaluru → Shingena Agrahara Lake, south-east of Bengaluru | 3.1 | tank chain | unnamed (40139) |
| 40146 | Unnamed | Huskur, south-east of Bengaluru → Huskur, south-east of Bengaluru | 2 | valley floor 68% | unnamed (40139) |

**Third pass, from OSM (4 more, joining the valleys below):**

| UID | Name | From → to | km | Evidence | Joins |
|---|---|---|---|---|---|
| 40184 | Unnamed | Near Bagalur, Tamil Nadu → The Dakshina Pinakini near Bagalur, Tamil Nadu | 4.3 | valley floor 71%; tank chain | Dakshina Pinakini (4132) |
| 40185 | Unnamed | Bidarahalli, north-east of Bengaluru → Bidarahalli, north-east of Bengaluru | 2.8 | valley floor 97% | unnamed (40150) |
| 40186 | Unnamed | Devanahalli, north of Bengaluru → Devanahalli, north of Bengaluru | 2.8 | tank chain | unnamed (40156) |
| 40187 | Unnamed | Ramohalli, west of Bengaluru → Bidadi, south-west of Bengaluru | 4.3 | valley floor 100% | unnamed (40174) |

**From HydroRIVERS, inside the district (6):**

| UID | From → to | Joins |
|---|---|---|
| 40147 | Thalaghattapura, Bengaluru → The Vrishabhavati above Byramangala Reservoir, near Bidadi | Vrishabhavati (7707) |
| 40148 | Alur, north-west of Bengaluru → The Arkavati near Madanayakanahalli, north-west of Bengaluru | Arkavati (7730) |
| 40149 | Near Nelamangala, north-west of Bengaluru → The Arkavati near Dasanapura, north-west of Bengaluru | Arkavati (7730) |
| 40150 | Bidarahalli, north-east of Bengaluru → Above Yellamallappa Chetty Lake, east of Bengaluru | unnamed (40049) |
| 40151 | Sarjapur, south-east of Bengaluru → The Dakshina Pinakini east of Sarjapur | Dakshina Pinakini (4132) |
| 40152 | Anekal, south of Bengaluru → The Chinnar near Attibele, south-east of Bengaluru | Chinnar (3718) |

**From HydroRIVERS, third pass (31 valleys, 228 km):**

All unnamed. Most lie beyond the district: towards Devanahalli, Hoskote, Nelamangala, Bidadi, Anekal and Hosur.

| UID | From → to | km | Catchment | Falls | Joins |
|---|---|---|---|---|---|
| 40153 | Near Hesaraghatta, north-west of Bengaluru → Near Hesaraghatta, north-west of Bengaluru | 12.3 | 193 km² | 32 m | unnamed (40132) |
| 40154 | Near Hoskote, east of Bengaluru → The Dakshina Pinakini near Sarjapur, east of Bengaluru | 28.7 | 169 km² | 53 m | Dakshina Pinakini (4132) |
| 40155 | Near Hoskote, north-east of Bengaluru → The Dakshina Pinakini near Hoskote, north-east of Bengaluru | 20.9 | 158 km² | 30 m | Dakshina Pinakini (4132) |
| 40156 | Near Devanahalli, north of Bengaluru → The Dakshina Pinakini near Budigere, north-east of Bengaluru | 18.3 | 148 km² | 35 m | Dakshina Pinakini (4132) |
| 40157 | Near Tavarekere, west of Bengaluru → The Vrishabhavati near Bidadi, south-west of Bengaluru | 19.6 | 118 km² | 111 m | Vrishabhavati (7707) |
| 40158 | Near Devanahalli, north of Bengaluru → The Arkavati near Rajanukunte, north of Bengaluru | 14.3 | 91 km² | 53 m | Arkavati (7730) |
| 40159 | Near Hoskote, east of Bengaluru → The Dakshina Pinakini near Kadugodi, east of Bengaluru | 12.6 | 80 km² | 37 m | Dakshina Pinakini (4132) |
| 40160 | Near Nelamangala, north-west of Bengaluru → The Kumudvati near Nelamangala, north-west of Bengaluru | 8.1 | 59 km² | 28 m | Kumudvati (7304) |
| 40161 | Near Devanahalli, north-east of Bengaluru → The Dakshina Pinakini near Devanahalli, north-east of Bengaluru | 5.4 | 52 km² | 14 m | Dakshina Pinakini (4132) |
| 40162 | Near Budigere, north-east of Bengaluru → The Dakshina Pinakini near Budigere, north-east of Bengaluru | 8.5 | 46 km² | 23 m | Dakshina Pinakini (4132) |
| 40163 | Near Hesaraghatta, north-west of Bengaluru → Near Hesaraghatta, north-west of Bengaluru | 5.5 | 43 km² | 19 m | unnamed (40153) |
| 40164 | Near Budigere, north-east of Bengaluru → The Dakshina Pinakini near Devanahalli, north-east of Bengaluru | 6.2 | 33 km² | 14 m | Dakshina Pinakini (4132) |
| 40165 | Devanahalli, north of Bengaluru → Devanahalli, north of Bengaluru | 4.9 | 32 km² | 15 m | unnamed (40156) |
| 40166 | Near Doddajala, north of Bengaluru → Near Devanahalli, north-east of Bengaluru | 7.9 | 31 km² | 26 m | unnamed (40156) |
| 40167 | Near Attibele, south-east of Bengaluru → The Chinnar near Attibele, south-east of Bengaluru | 5.2 | 30 km² | 30 m | Chinnar (3718) |
| 40168 | Near Nelamangala, west of Bengaluru → The Arkavati near Tavarekere, west of Bengaluru | 6.4 | 26 km² | 40 m | Arkavati (7730) |
| 40169 | Near Bidadi, south-west of Bengaluru → The Arkavati near Bidadi, south-west of Bengaluru | 4.2 | 26 km² | 30 m | Arkavati (7730) |
| 40170 | Near Kadugodi, east of Bengaluru → The Dakshina Pinakini near Varthur, east of Bengaluru | 2.7 | 25 km² | 12 m | Dakshina Pinakini (4132) |
| 40171 | Near Attibele, south-east of Bengaluru → The Dakshina Pinakini near Attibele, south-east of Bengaluru | 2.9 | 23 km² | 21 m | Dakshina Pinakini (4132) |
| 40172 | Anekal, south-east of Bengaluru → Near Chandapura, south-east of Bengaluru | 2.1 | 22 km² | 11 m | unnamed (40152) |
| 40173 | Near Hoskote, east of Bengaluru → Near Hoskote, east of Bengaluru | 3.6 | 20 km² | 16 m | unnamed (40159) |
| 40174 | Near Bidadi, south-west of Bengaluru → Bidadi, south-west of Bengaluru | 4.3 | 19 km² | 21 m | unnamed (40157) |
| 40175 | Near Tavarekere, west of Bengaluru → The Arkavati near Tavarekere, west of Bengaluru | 2.7 | 19 km² | 20 m | Arkavati (7730) |
| 40176 | Near Devanahalli, north-east of Bengaluru → The Dakshina Pinakini near Devanahalli, north-east of Bengaluru | 2.7 | 18 km² | 6 m | Dakshina Pinakini (4132) |
| 40177 | Near Hoskote, north-east of Bengaluru → Near Hoskote, north-east of Bengaluru | 3.1 | 18 km² | 15 m | unnamed (40155) |
| 40178 | Near Bidadi, south-west of Bengaluru → The Suvarnamukhi near Bidadi, south-west of Bengaluru | 3.6 | 17 km² | 18 m | Suvarnamukhi (7599) |
| 40179 | Near Hoskote, north-east of Bengaluru → Near Hoskote, north-east of Bengaluru | 2.5 | 17 km² | 5 m | unnamed (40155) |
| 40180 | Near Nelamangala, north-west of Bengaluru → The Kumudvati near Nelamangala, north-west of Bengaluru | 2.2 | 16 km² | 9 m | Kumudvati (7304) |
| 40181 | Near Devanahalli, north-east of Bengaluru → Near Devanahalli, north-east of Bengaluru | 2.2 | 16 km² | 8 m | unnamed (40161) |
| 40182 | Near Hoskote, north-east of Bengaluru → Near Hoskote, north-east of Bengaluru | 2.1 | 14 km² | 7 m | unnamed (40155) |
| 40183 | Bidadi, south-west of Bengaluru → Near Bidadi, south-west of Bengaluru | 2.1 | 13 km² | 13 m | unnamed (40157) |

Totals after the first pass: 99 streams from OSM (521 km) and 37 valleys from HydroRIVERS.

Names: "Kathriguppe", "Sonnenahalli" and "Channasandra" are the tributary names on the Paani Vrishabhavathi map. BBMP-coded drains are named by valley and code. Everything else is unnamed.

## Not drawn

### 1. Man-made channels

| Channel | Length | Near | Reason |
|---|---|---|---|
| Diversion Drain (OSM way 1182962306) | 1.1 km | Yelahanka | Named as a man-made channel. |
| (unnamed) (OSM way 253429168) | 2.0 km | Bidadi | Tagged `waterway=canal` in OSM. |
| (unnamed) (OSM way 1265780841) | 0.9 km | Bidadi | Tagged `waterway=canal` in OSM. |
| (unnamed) (OSM way 1286173284) | 6.9 km | Basthi | Tagged `waterway=canal` in OSM. |

### 2. Fail the natural test

| Stream | km | Would join | Reason |
|---|---|---|---|
| Unnamed, EPIP Zone → Balagere (12.972 N, 77.715 E) | 3.8 | unnamed (40046) | HydroRIVERS 14%, valley floor 31%, no lake of 2 ha: most likely a roadside or layout drain. |
| K-109, Gandhinagar → Shanti Nagar (12.974 N, 77.589 E) | 2.6 | Koramangala Valley (K-100) (40044) | HydroRIVERS 0%, valley floor 33%, no lake of 2 ha: most likely a roadside or layout drain. |
| Unnamed, Whitefield → Whitefield (12.975 N, 77.755 E) | 2.3 | unnamed (40046) | HydroRIVERS 25%, valley floor 36%, no lake of 2 ha: most likely a roadside or layout drain. |
| Unnamed, Kadugodi → Kadugodi (12.989 N, 77.757 E) | 2.3 | Dakshina Pinakini (4132) | HydroRIVERS 9%, valley floor 40%, no lake of 2 ha: most likely a roadside or layout drain. |
| Unnamed, Devanahalli → Devanahalli (13.214 N, 77.808 E) | 2.2 | Dakshina Pinakini (4132) | HydroRIVERS 20%, valley floor 43%, no lake of 2 ha: most likely a roadside or layout drain. |
| Unnamed, Devanahalli → Devanahalli (13.215 N, 77.808 E) | 2.1 | unnamed (40164) | HydroRIVERS 7%, valley floor 9%, no lake of 2 ha: most likely a roadside or layout drain. |
| Unnamed, Sahakaranagara → Sahakaranagara (13.071 N, 77.579 E) | 2.1 | unnamed (40102) | HydroRIVERS 26%, valley floor 18%, no lake of 2 ha: most likely a roadside or layout drain. |

### 3. Do not run downhill to the drawn river

| Stream | km | Would join | Reason |
|---|---|---|---|
| Unnamed, Vidyaranyapura → Chikka Banavara (13.105 N, 77.544 E) | 2.5 | a stream not drawn | Joins its parent beyond a ridge, on a stretch that drains the other way. |

### 4. OSM has no channel linking them to a drawn river

Pieces of 2 km or more that end more than 0.5 km from the network. Drawing them would mean inventing the missing stretch. They may well be natural.

| Lowest point near | Length | Gap to the network | Note |
|---|---|---|---|
| CQAL Layout (13.110 N, 77.570 E) | 11.2 km | 1.10 km |  |
| Chikkabellanduru (12.909 N, 77.719 E) | 4.5 km | 1.09 km |  |
| Veerasagara (13.102 N, 77.557 E) | 3.8 km | 1.50 km |  |
| Ketohalli (12.747 N, 77.320 E) | 3.3 km | 2.93 km |  |
| Kagganur (12.837 N, 77.838 E) | 3.2 km | 2.00 km |  |
| Ramappa Layout (12.898 N, 77.582 E) | 2.9 km | 1.41 km |  |
| Nagegowdanapalya (12.867 N, 77.508 E) | 2.8 km | 2.03 km |  |
| Anneshvara (13.205 N, 77.711 E) | 2.8 km | 0.89 km |  |
| Hulimangala (12.819 N, 77.634 E) | 2.7 km | 2.04 km |  |
| Giddenahalli (12.986 N, 77.417 E) | 2.4 km | 0.62 km |  |
| Bendiganahalli (13.074 N, 77.755 E) | 2.2 km | 1.24 km | BBMP drains BD411, BD412. |
| Beguru (13.186 N, 77.683 E) | 2.2 km | 1.10 km |  |

The same run left 205 such pieces in all; the rest are under 2 km.

### 5. HydroRIVERS valleys not drawn

| Valley | km | Catchment | Reason |
|---|---|---|---|
| From near Nelamangala (13.23 N, 77.34 E) | 6.5 | 33 km² | It joins a much larger valley (448 km²) that runs to the Kumudvati wholly outside the data area, and that valley was not looked at. |

Valleys that lie mostly beyond the data area (more than half of the course outside 12.70–13.26 N, 77.33–77.90 E) were not looked at.

### 6. Under 2 km

105 side streams of 1–2 km, and several hundred shorter stubs, are below the 2 km minimum. The 1–2 km ones, by the river they drain to:

| Drains to | Count | Streams (km) |
|---|---|---|
| unnamed (40123) | 10 | Hunasamaranahalli 1.6; Devanahalli 1.5; Devanahalli 1.4; Hunasamaranahalli 1.4; Devanahalli 1.3; Hunasamaranahalli 1.3; Devanahalli 1.2; Devanahalli 1.1; Hunasamaranahalli 1.1; Hunasamaranahalli 1.1 |
| unnamed (40052) | 5 | Sulikere 1.8; Herohalli 1.3; Sulikere 1.2; Sulikere 1.1; Sulikere 1.1 |
| Arkavati (7730) | 4 | Hunasamaranahalli 1.8; Bidadi 1.6; Chikka Banavara 1.2; Sulikere 1.1 |
| Dakshina Pinakini (4132) | 4 | Varthur 1.9; Sarjapura 1.6; Hoskote 1.4; Devanahalli 1.1 |
| Chinnar (3718) | 4 | Sarjapura 1.7; Attibele 1.4; Attibele 1.4; Chandapura 1.3 |
| unnamed (40117) | 4 | Ramamurthy Nagar 1.4; TC Palya 1.2; TC Palya 1.1; TC Palya 1.0 |
| Hebbal Valley (H-200) (40047) | 4 | H-203 Mathikere 1.8; BP-184 Nagavara 1.1; Yeswanthpur 1.1; Sahakaranagara 1.0 |
| Nagarbhavi Thorai (40051) | 3 | Vijaya Nagar 1.3; Nagarabhavi 1.2; Laggere 1.1 |
| Hebbal Valley (H-300) (40048) | 3 | H-304 Lingarajapuram 1.9; Hennur 1.8; Horamavu 1.2 |
| unnamed (40049) | 3 | TC Palya 1.8; TC Palya 1.3; TC Palya 1.2 |
| Hebbal Valley (BD-423) (40050) | 3 | MD-292B Kadugodi 1.8; MD-288 Kadugodi 1.6; Kadugodi 1.3 |
| Koramangala Valley (K-100) (40044) | 3 | K-108 Basavanagudi 1.7; K-104 Shanti Nagar 1.7; K-114 Richmond Town 1.1 |
| Sonnenahalli (40053) | 3 | Jnana Bharathi 1.2; Nagarabhavi 1.2; Herohalli 1.0 |
| unnamed (40101) | 3 | Yelahanka 1.6; Jakkur 1.3; BP-142A Yelahanka 1.2 |
| unnamed (40046) | 2 | Varthur 1.4; Panathur 1.3 |
| Vrishabhavati Valley (V-202) (40072) | 2 | V-203 Basaveshwaranagar 1.6; V-205 Peenya 1.5 |
| Channasandra (40054) | 2 | Uttarahalli 1.6; Uttarahalli 1.2 |
| Challaghatta Valley (C-100) (40045) | 2 | C-106 Halasuru 1.7; Indiranagar 1.3 |
| unnamed (40165) | 2 | Devanahalli 1.6; Devanahalli 1.3 |
| Vrishabhavati (7707) | 2 | Sadashivanagar 1.4; Rajarajeshwari Nagar 1.3 |
| unnamed (40116) | 2 | BD-416 Hunasamaranahalli 1.9; Horamavu 1.2 |
| unnamed (40130) | 2 | Nagasandra 1.3; Madhavara 1.1 |
| unnamed (40097) | 2 | Mahadevapura 1.2; Marathahalli 1.0 |
| unnamed (40073) | 2 | Gottigere 1.2; Anjanapura 1.0 |
| unnamed (40081) | 2 | Beguru 1.2; Beguru 1.1 |
| unnamed (40176) | 2 | Devanahalli 1.7; Devanahalli 1.2 |
| Vrishabhavati Valley (V-112) (40058) | 1 | V-113 Malleswaram 1.0 |
| Kathriguppe (40055) | 1 | V-305 Banashankari 1.5 |
| Vrishabhavati Valley (V-201) (40071) | 1 | Laggere 1.6 |
| unnamed (40092) | 1 | Varthur 1.0 |
| unnamed (40095) | 1 | Varthur 1.0 |
| unnamed (40140) | 1 | Gottigere 1.3 |
| unnamed (40128) | 1 | Peenya 1.2 |
| unnamed (40102) | 1 | Vidyaranyapura 1.2 |
| unnamed (40120) | 1 | KR Puram 1.2 |
| unnamed (40124) | 1 | Hunasamaranahalli 1.2 |
| Hebbal Valley (BP-191) (40113) | 1 | BP-194 Hennur 1.3 |
| unnamed (40091) | 1 | Baiyyappanahalli 1.4 |
| unnamed (40158) | 1 | Hunasamaranahalli 1.6 |
| unnamed (40093) | 1 | Whitefield 1.9 |
| unnamed (40138) | 1 | Nagasandra 1.5 |
| unnamed (40139) | 1 | Huskur 1.0 |
| Vrishabhavati Valley (V-116) (40057) | 1 | V-116A Rajajinagar 1.1 |
| unnamed (40109) | 1 | Jakkur 1.1 |
| Jakkana Halla (7137) | 1 | Jigani 1.8 |
| unnamed (40066) | 1 | Herohalli 1.0 |
| unnamed (40096) | 1 | Balagere 1.4 |
| unnamed (40166) | 1 | Devanahalli 1.6 |
| unnamed (40135) | 1 | Chikka Banavara 1.2 |
| unnamed (40107) | 1 | Jakkur 1.2 |
| Suvarnamukhi (7599) | 1 | Anjanapura 1.1 |

### 7. From the first pass

| Candidate | Reason |
|---|---|
| Diversion Drain | Man-made diversion channel (also in section 1). |
| BD-422 | Runs along 40049, which is already drawn. |

The drains the first pass rejected on the HydroRIVERS test alone (K-200, C-200, H-400, H-101, V-304, V-300, V-207, V-116, V-120, K-103, V-112, C-105, BP-191, K-209, MD-382) pass the valley-floor test and are now drawn.
