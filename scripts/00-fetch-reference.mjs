// Downloads the third-party reference data used to describe river endpoints in words.
// Skips anything already present, so re-running is cheap.
//
//   GeoNames cities500  - every populated place with population >= 500 (CC-BY 4.0)
//   GeoNames admin1     - state/province names for those places
//   Natural Earth       - named physical regions (mountain ranges, plateaus), public domain

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { unzipSync } from "fflate";

const DIR = "data/raw";
mkdirSync(DIR, { recursive: true });

const SOURCES = [
  {
    url: "https://download.geonames.org/export/dump/cities500.zip",
    marker: "cities500.txt",
    unzip: /cities500\.txt$/,
  },
  {
    url: "https://download.geonames.org/export/dump/admin1CodesASCII.txt",
    marker: "admin1CodesASCII.txt",
  },
  {
    url: "https://naciscdn.org/naturalearth/10m/physical/ne_10m_geography_regions_polys.zip",
    marker: "ne_10m_geography_regions_polys.shp",
    unzip: /\.(shp|dbf|shx|prj|cpg)$/,
  },
  // Country borders as India draws them, matching the source dataset's own framing.
  {
    url: "https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_0_countries_ind.zip",
    marker: "ne_10m_admin_0_countries_ind.shp",
    unzip: /\.(shp|dbf|shx|prj|cpg)$/,
  },
  // HydroSHEDS river network for Asia (CC-BY 4.0), used to trace rivers that enter
  // India back upstream across the border to their real source.
  {
    url: "https://data.hydrosheds.org/file/HydroRIVERS/HydroRIVERS_v10_as_shp.zip",
    marker: "HydroRIVERS_v10_as.shp",
    unzip: /HydroRIVERS_v10_as\.(shp|dbf|shx|prj)$/,
  },
];

for (const s of SOURCES) {
  const name = s.url.split("/").pop();
  if (existsSync(`${DIR}/${s.marker}`)) {
    console.log(`have   ${s.marker}`);
    continue;
  }

  process.stdout.write(`fetch  ${name} ... `);
  const res = await fetch(s.url);
  if (!res.ok) throw new Error(`${s.url} -> HTTP ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  console.log(`${(buf.length / 1048576).toFixed(1)} MB`);

  if (!s.unzip) {
    writeFileSync(`${DIR}/${name}`, buf);
    continue;
  }
  const files = unzipSync(buf, { filter: (f) => s.unzip.test(f.name) });
  for (const [path, data] of Object.entries(files)) {
    const out = `${DIR}/${path.split("/").pop()}`;
    writeFileSync(out, data);
    console.log(`         -> ${out}`);
  }
}
