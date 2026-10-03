# Bengaluru streams

Added 2026-10-03 from OpenStreetMap, where Bengaluru's storm-water drains carry BBMP codes by valley: **K** Koramangala, **C** Challaghatta, **H** Hebbal, **V** Vrishabhavathi, and BD / BP / MD for the outer zones.

**The rule:** draw only natural streams, even if polluted or concrete-lined, and leave out anything built for irrigation, water supply or diversion. To count as natural, a course must:

1. not be tagged `waterway=canal` in OSM;
2. run mostly within 0.5 km of a HydroRIVERS drainage line (traced from elevation data, independently of the city), or be described in sources as a valley's main channel;
3. not be a diversion, supply or bypass channel.

The "natural" column below is the share of the course within 0.5 km of a HydroRIVERS line. HydroRIVERS skips headwaters draining less than about 10 km², so channels near their sources score lower.

## Drawn

| UID | Name | Course | Natural | Joins |
|---|---|---|---|---|
| 40044 | Koramangala Valley (K-100) | Majestic → Shanthinagar → Koramangala → Bellandur Lake | 71% | 40046 (continues) |
| 40045 | Challaghatta Valley (C-100) | Vasanth Nagar → Halasuru → Indiranagar → Bellandur Lake | 56% | 40046 |
| 40046 | Unnamed | Bellandur Lake → Varthur Lake → the Dakshina Pinakini near Channasandra | 94% | Dakshina Pinakini |
| 40047 | Hebbal Valley (H-200) | Yeshwanthpur → Hebbal Lake → Nagavara Lake → joins H-300 | 70% | 40048 |
| 40048 | Hebbal Valley (H-300) | Cooke Town → HBR Layout → near Bileshivale | 59% | 40049 (continues) |
| 40049 | Unnamed | Near Bileshivale → through Yellamallappa Chetty Lake (Medahalli) to its outlet | 99% | 40050 (continues) |
| 40050 | Hebbal Valley (BD-423) | Yellamallappa Chetty Lake → the Dakshina Pinakini near Koralur | 98% | Dakshina Pinakini |

Lines are drawn across Bellandur, Varthur and Yellamallappa Chetty lakes to their outlets.

## Not drawn

| Candidate | Reason |
|---|---|
| Nagarbhavi Thorai (10 km) | Already on the map: CWC's Vrishabhavati runs along all of it. |
| Diversion Drain | Man-made diversion channel. |
| K200, C200, H400, H101, V304, V300, V207, V116, V120, K103, V112, C105, BP191 (3–8 km each) | Fail the natural test (0–37% on a HydroRIVERS valley); mostly street drains. |
| K209 (8.4 km, 54%) | Passes the test but ends about 1.9 km from K-100, probably in Madiwala or Agara lake. Needs that lake chain drawn first. |
| BP142, MD382, "Rajakaluve" (3–8 km, 100%) | Natural, but don't reach a drawn river (0.8–8.8 km short). Candidates for a later pass through their lakes. |
| BD422 | Runs along 40049, which is already drawn. |
